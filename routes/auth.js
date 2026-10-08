// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = 'peetonong_secret_key_2026'; // ตั้งค่า Secret Key สำหรับ JWT
const ALLOWED_DOMAIN = '@rmutsvmail.com';       // กำหนด Domain อีเมลที่อนุญาต

// --- 1. ระบบสมัครสมาชิก (Register) ---
router.post('/register', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // ตรวจสอบความครบถ้วนของข้อมูล
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // [HIGHLIGHT] ตรวจสอบว่าใช้อีเมลของสถาบันหรือไม่
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      return res.status(400).json({ 
        error: `ระบบอนุญาตเฉพาะอีเมลสถาบัน (${ALLOWED_DOMAIN}) เท่านั้น` 
      });
    }

    // ตรวจสอบว่าอีเมลนี้เคยลงทะเบียนหรือยัง
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
    }

    // เข้ารหัสรหัสผ่าน (Password Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // บันทึกลง MySQL
    const sql = 'INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [fullname, cleanEmail, hashedPassword]);

    res.status(201).json({ 
      success: true, 
      message: 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที' 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
  }
});

// --- 2. ระบบเข้าสู่ระบบ (Login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // ค้นหาผู้ใช้จากอีเมล
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user.id, fullname: user.fullname, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' } // Token มีอายุ 1 วัน
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

module.exports = router;
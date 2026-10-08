// routes/wanted.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ตั้งค่าโฟลเดอร์เก็บไฟล์อัปโหลด
const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'wanted-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// กรองประเภทไฟล์ ให้รับเฉพาะรูปภาพ
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5MB
});

// --- 1. ดึงรายการตามหา Hardware ทั้งหมด ---
router.get('/', async (req, res) => {
  try {
    const sql = `
      SELECT w.*, u.fullname, u.email 
      FROM wanted_items w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `;
    const [rows] = await db.query(sql);

    const items = rows.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.image_url ? `/uploads/${item.image_url}` : null,
      status: item.status,
      createdAt: item.created_at,
      requester: {
        id: item.user_id,
        fullname: item.fullname,
        email: item.email
      }
    }));

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์ตามหา' });
  }
});

// --- 2. โพสต์ตามหา Hardware (รองรับการแนบรูปภาพ) ---
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;
    const filename = req.file ? req.file.filename : null;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'กรุณาระบุชื่ออุปกรณ์ที่ต้องการ' });
    }

    const sql = `
      INSERT INTO wanted_items (title, description, image_url, user_id) 
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [title.trim(), description || '', filename, userId]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'ไม่สามารถสร้างโพสต์ตามหาได้' });
  }
});

// --- 3. ลบโพสต์ตามหา (เฉพาะเจ้าของโพสต์) ---
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    const [items] = await db.query('SELECT image_url, user_id FROM wanted_items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    if (items[0].user_id !== userId) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });

    // ลบไฟล์รูปภาพออกจาก Server (ถ้ามี)
    if (items[0].image_url) {
      const filePath = path.join(uploadDir, items[0].image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query('DELETE FROM wanted_items WHERE id = ?', [itemId]);
    res.json({ success: true, message: 'ลบโพสต์ตามหาเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบโพสต์' });
  }
});

module.exports = router;
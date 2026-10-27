// routes/user.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// --- 1. ดึงข้อมูลโปรไฟล์ และ รายการโพสต์ของตนเอง ---
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูลผู้ใช้
    const [users] = await db.query(
      'SELECT id, fullname, email, last_name_change, created_at FROM users WHERE id = ?', 
      [userId]
    );
    if (users.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });

    // ดึงรายการ Hardware ที่ผู้ใช้นี้เป็นคนโพสต์
    const [items] = await db.query(
      'SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC', 
      [userId]
    );

    res.json({
      user: users[0],
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        type: item.type,
        price: item.price,
        courseTag: item.course_tag,
        condition: item.condition_detail,
        description: item.description,
        status: item.status,
        createdAt: item.created_at
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
  }
});

// --- 2. แก้ไขชื่อ-นามสกุล (เงื่อนไข 1 เดือน / 30 วันครั้ง) ---
router.put('/profile/name', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname } = req.body;

    if (!fullname || fullname.trim() === '') {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ-นามสกุลที่ต้องการเปลี่ยน' });
    }

    // ตรวจสอบวันที่เปลี่ยนชื่อล่าสุด
    const [users] = await db.query('SELECT last_name_change FROM users WHERE id = ?', [userId]);
    const lastNameChange = users[0]?.last_name_change;

    if (lastNameChange) {
      const lastDate = new Date(lastNameChange);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        const remainingDays = 30 - diffDays;
        return res.status(400).json({ 
          error: `คุณเพิ่งเปลี่ยนชื่อไป สามารถเปลี่ยนชื่อได้อีกครั้งในอีก ${remainingDays} วัน` 
        });
      }
    }

    // อัปเดตชื่อ และบันทึกเวลาปัจจุบันลงใน last_name_change
    await db.query(
      'UPDATE users SET fullname = ?, last_name_change = NOW() WHERE id = ?', 
      [fullname.trim(), userId]
    );

    res.json({ success: true, message: 'เปลี่ยนชื่อเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อ' });
  }
});

// --- 3. แก้ไขข้อมูลโพสต์ Hardware ของตัวเอง ---
router.put('/items/:id', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;
    const { title, category, type, price, courseTag, condition, description } = req.body;

    // ตรวจสอบว่าเป็นเจ้าของโพสต์หรือไม่
    const [items] = await db.query('SELECT user_id FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    if (items[0].user_id !== userId) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์แก้ไขโพสต์นี้' });

    const sql = `
      UPDATE items 
      SET title = ?, category = ?, type = ?, price = ?, course_tag = ?, condition_detail = ?, description = ?
      WHERE id = ? AND user_id = ?
    `;

    await db.query(sql, [
      title, category, type, price || 0, courseTag, condition, description || '', itemId, userId
    ]);

    res.json({ success: true, message: 'แก้ไขโพสต์สำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขโพสต์' });
  }
});

// --- 4. ลบโพสต์ Hardware ของตัวเอง ---
router.delete('/items/:id', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // ตรวจสอบความเป็นเจ้าของก่อนลบ
    const [items] = await db.query('SELECT user_id FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    if (items[0].user_id !== userId) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });

    await db.query('DELETE FROM items WHERE id = ? AND user_id = ?', [itemId, userId]);

    res.json({ success: true, message: 'ลบโพสต์เรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบโพสต์' });
  }
});

module.exports = router;
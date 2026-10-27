const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// --- 1. POST /api/items : บันทึกประกาศส่งต่ออุปกรณ์ใหม่ ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user ? (req.user.id || req.user.userId || req.user.user_id) : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'ไม่พบข้อมูลผู้ใช้ใน Token' });
    }

    const { 
      title, 
      category, 
      type, 
      price,
      courseTag, course_tag, 
      condition, condition_detail, 
      description, 
      giverName, giver_name, giver,
      contactInfo, contact_info 
    } = req.body;

    const finalCourseTag = courseTag || course_tag || '';
    const finalCondition = condition || condition_detail || '';
    const finalGiverName = giverName || giver_name || (giver ? giver.name : '');
    // ดึงข้อมูลติดต่อ (หากไม่มี ให้ใช้ giverName แทน)
    const finalContactInfo = contactInfo || contact_info || (giver ? giver.contactInfo : finalGiverName) || '';
    const finalPrice = price || 0;

    if (!title || !category || !type) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
    }

    // เพิ่มคอลัมน์ contact_info ลงใน SQL Query
    const sql = `
      INSERT INTO items 
      (user_id, title, category, type, price, course_tag, condition_detail, description, giver_name, contact_info, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', NOW())
    `;

    const [result] = await db.query(sql, [
      userId,
      title,
      category,
      type,
      finalPrice,
      finalCourseTag,
      finalCondition,
      description || '',
      finalGiverName,
      finalContactInfo // ส่งค่า contact_info เข้าไปเพื่อแก้ปัญหา NOT NULL
    ]);

    res.status(201).json({
      success: true,
      message: 'ลงประกาศสำเร็จ',
      itemId: result.insertId
    });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (err.sqlMessage || err.message) 
    });
  }
});

// --- 3. GET /api/items/:id : ดึงข้อมูลอุปกรณ์รายชิ้น ---
router.get('/:id', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (items.length === 0) {
      return res.status(404).json({ success: false, error: 'ไม่พบรายการอุปกรณ์นี้' });
    }
    res.json({ success: true, item: items[0] });
  } catch (err) {
    console.error('Fetch single item error:', err);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

module.exports = router;
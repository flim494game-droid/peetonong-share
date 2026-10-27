const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// --- 1. POST /api/items : บันทึกประกาศส่งต่ออุปกรณ์ใหม่ ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      category, 
      type, 
      price,
      courseTag, 
      course_tag, 
      condition, 
      condition_detail, 
      description, 
      giverName, 
      giver_name,
      giver 
    } = req.body;

    // รองรับโครงสร้างตัวแปรทั้ง CamelCase และ snake_case
    const finalCourseTag = courseTag || course_tag || '';
    const finalCondition = condition || condition_detail || '';
    const finalGiverName = giverName || giver_name || (giver ? giver.name : '');
    const finalPrice = price || 0;

    if (!title || !category || !type) {
      return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
    }

    const sql = `
      INSERT INTO items 
      (user_id, title, category, type, price, course_tag, condition_detail, description, giver_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', NOW())
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
      finalGiverName
    ]);

    res.status(201).json({
      success: true,
      message: 'ลงประกาศสำเร็จ',
      itemId: result.insertId
    });
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล' });
  }
});

// --- 2. GET /api/items : ดึงรายการอุปกรณ์ทั้งหมด (สำหรับแสดงหน้าหลัก) ---
router.get('/', async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT items.*, users.fullname as owner_name 
      FROM items 
      LEFT JOIN users ON items.user_id = users.id 
      ORDER BY items.created_at DESC
    `);
    
    res.json({ success: true, items });
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงข้อมูลรายการอุปกรณ์ได้' });
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
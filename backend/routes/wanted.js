const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

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

    const items = rows.map(item => {
      let img = item.image_url;
      // ถ้ามีรูป และไม่ใช่ Base64 / HTTP URL ให้เติม prefix /uploads/
      if (img && !img.startsWith('data:') && !img.startsWith('http') && !img.startsWith('/')) {
        img = `/uploads/${img}`;
      }

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: img,
        status: item.status,
        createdAt: item.created_at,
        requester: {
          id: item.user_id,
          fullname: item.fullname,
          email: item.email
        }
      };
    });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์ตามหา' });
  }
});

// --- 2. โพสต์ตามหา Hardware (รองรับทั้ง Base64 JSON และ File Upload) ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, image, imageUrl } = req.body;
    const userId = req.user.id || req.user.userId;

    // รับค่า Base64 จาก body (image หรือ imageUrl)
    const finalImage = image || imageUrl || null;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'กรุณาระบุชื่ออุปกรณ์ที่ต้องการ' });
    }

    const sql = `
      INSERT INTO wanted_items (title, description, image_url, user_id, status, created_at) 
      VALUES (?, ?, ?, ?, 'Open', NOW())
    `;
    const [result] = await db.query(sql, [title.trim(), description || '', finalImage, userId]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error('Create wanted item error:', err);
    res.status(500).json({ error: err.message || 'ไม่สามารถสร้างโพสต์ตามหาได้' });
  }
});

// --- 3. ลบโพสต์ตามหา ---
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id || req.user.userId;

    const [items] = await db.query('SELECT user_id FROM wanted_items WHERE id = ?', [itemId]);
    if (items.length === 0) return res.status(404).json({ error: 'ไม่พบรายการนี้' });
    if (items[0].user_id !== userId) return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' });

    await db.query('DELETE FROM wanted_items WHERE id = ?', [itemId]);
    res.json({ success: true, message: 'ลบโพสต์ตามหาเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบโพสต์' });
  }
});

module.exports = router;
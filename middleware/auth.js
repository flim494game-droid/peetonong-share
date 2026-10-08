// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'peetonong_secret_key_2026';

module.exports = function (req, res, next) {
  // ดึง Token จาก Header 'Authorization'
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1]; // รูปแบบ "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบก่อน' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // เก็บข้อมูลผู้ใช้ไว้ใน request
    next(); // อนุญาตให้ทำงานต่อ
  } catch (err) {
    res.status(403).json({ error: 'Session หมดอายุหรือ Token ไม่ถูกต้อง กรุณาล็อกอินใหม่' });
  }
};
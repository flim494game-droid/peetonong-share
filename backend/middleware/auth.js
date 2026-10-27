const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // ดึง Token จาก Request Header (Authorization: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // ถ้าไม่มี Token ส่งมา ให้ตอบกลับ HTTP 401
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    // ยืนยันความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next(); // ผ่านการตรวจสอบ ให้ไปทำงานที่ Route Handler ต่อได้
  } catch (err) {
    // ถ้า Token ไม่ถูกต้องหรือหมดอายุ ให้ตอบกลับ HTTP 403
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};
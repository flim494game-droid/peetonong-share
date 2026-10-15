// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); // 1. นำเข้า User Routes
const authMiddleware = require('./middleware/auth');
const wantedRoutes = require('./routes/wanted');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // 2. เรียกใช้งาน User Routes (/api/user/...)
app.use('/api/wanted', wantedRoutes);

// API ดึงรายการทั้งหมด
app.get('/api/items', async (req, res) => {
  try {
    const { search, category, type } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (title LIKE ? OR course_tag LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);

    const formattedItems = rows.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      condition: item.condition_detail,
      type: item.type,
      price: item.price,
      courseTag: item.course_tag,
      description: item.description,
      giver: {
        name: item.giver_name,
        contactInfo: item.contact_info
      },
      status: item.status,
      createdAt: item.created_at
    }));

    res.json(formattedItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// API เพิ่มรายการ Hardware (บันทึก user_id ลง DB)
app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const { title, category, type, price, courseTag, condition, description, giver } = req.body;
    const userId = req.user.id; // ดึง user_id จาก Token

    const sql = `
      INSERT INTO items 
      (title, category, type, price, course_tag, condition_detail, description, giver_name, contact_info, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      title, category, type || 'Free', price || 0,
      courseTag, condition, description || '',
      giver?.name || req.user.fullname,
      giver?.contactInfo || req.user.email,
      userId // [HIGHLIGHT] เก็บ user_id เจ้าของโพสต์
    ]);

    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'ไม่สามารถบันทึกข้อมูลได้' });
  }
});
// ==========================================
// ADMIN API ROUTES (สำหรับจัดการข้อมูล Admin)
// ==========================================

// Middleware ตรวจสอบ Admin Token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token === 'admin-secret-token-key') {
    next();
  } else {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ' });
  }
};

// 1. ดึงรายชื่อสมาชิกทั้งหมด
app.get('/api/admin/users', verifyAdminToken, async (req, res) => {
  try {
    // ปรับเปลี่ยน Query ให้ตรงกับ ORM/Database ของคุณ (เช่น Prisma หรือ SQLite/MySQL)
    // ตัวอย่าง Prisma:
    // const users = await prisma.user.findMany({
    //   select: { id: true, fullname: true, email: true, createdAt: true }
    // });
    
    // ตัวอย่าง Mock Data หรือปรับตาม Database จริง:
    const users = await prisma.user.findMany({
      select: { id: true, fullname: true, email: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลสมาชิกได้' });
  }
});

// 2. Admin สั่งลบรายการส่งต่อ Hardware
app.delete('/api/admin/items/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.item.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'ลบรายการส่งต่อเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถลบรายการได้' });
  }
});

// 3. Admin สั่งลบโพสต์ตามหา
app.delete('/api/admin/wanted/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wantedItem.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'ลบโพสต์ตามหาเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถลบโพสต์ตามหาได้' });
  }
});

// 4. Admin สั่งระงับสิทธิ์ / ลบสมาชิก
app.delete('/api/admin/users/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'ระงับสิทธิ์และลบสมาชิกเรียบร้อยแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ไม่สามารถระงับสิทธิ์สมาชิกได้' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

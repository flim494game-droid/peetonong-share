const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },               // ชื่ออุปกรณ์ เช่น ESP32 Module
  category: { 
    type: String, 
    enum: ['Microcontroller', 'Sensor', 'Actuator', 'Display', 'Power', 'Other'],
    required: true 
  },
  condition: { type: String, required: true },           // สภาพ เช่น "90% ใช้งานได้ปกติ", "ต้องบัดกรีเพิ่ม"
  type: { 
    type: String, 
    enum: ['Free', 'Sell', 'Trade'],                     // แจกฟรี / ขายต่อราคาถูก / แลกเปลี่ยน
    default: 'Free' 
  },
  price: { type: Number, default: 0 },                   // ราคา (ถ้าเป็นประเภท Sell)
  courseTag: { type: String, required: true },           // แท็กชื่อวิชา เช่น "CPE101", "IoT Workshop"
  description: { type: String },                         // รายละเอียดเพิ่มเติม
  giver: {                                               // รุ่นพี่ผู้ส่งต่อ
    name: String,
    studentId: String,
    contactInfo: String
  },
  status: { 
    type: String, 
    enum: ['Available', 'Reserved', 'Completed'], 
    default: 'Available' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);
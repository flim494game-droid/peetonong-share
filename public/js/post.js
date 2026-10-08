// public/js/post.js
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token'); // ดึง Token จาก localStorage

  const payload = {
    title: document.getElementById('title').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value,
    courseTag: document.getElementById('courseTag').value,
    condition: document.getElementById('condition').value,
    description: document.getElementById('description').value,
    giver: {
      name: document.getElementById('giverName').value,
      contactInfo: document.getElementById('giverName').value
    }
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // [HIGHLIGHT] แนบ Token ใน Header
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('ลงประกาศสำเร็จ!');
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'เกิดข้อผิดพลาดในการลงประกาศ');
    }
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    console.error(err);
  }
});
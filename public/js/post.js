document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const contactInput = document.getElementById('contactInfo');

  const payload = {
    title: document.getElementById('title').value,
    category: document.getElementById('category').value,
    type: document.getElementById('type').value,
    courseTag: document.getElementById('courseTag').value,
    condition: document.getElementById('condition').value,
    description: document.getElementById('description').value,
    giver: {
      name: document.getElementById('giverName').value,
      contactInfo: contactInput ? contactInput.value : document.getElementById('giverName').value
    }
  };

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      Swal.fire({
        icon: 'success',
        title: 'ลงประกาศสำเร็จ!',
        text: 'ระบบได้บันทึกรายการอุปกรณ์ของคุณเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'ลงประกาศไม่สำเร็จ',
        text: data.error || 'เกิดข้อผิดพลาดในการลงประกาศ',
        confirmButtonColor: '#4f46e5'
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5'
    });
  }
});
// public/js/wanted.js

// ฟังก์ชันสำหรับจัดการเมื่อไม่ได้ล็อกอินหรือ Session หมดอายุ (401 / 403)
function handleAuthError(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Swal.fire({
      icon: 'warning',
      title: 'กรุณาเข้าสู่ระบบ',
      text: 'Session ของคุณหมดอายุหรือยังไม่ได้เข้าสู่ระบบ',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#4f46e5',
      allowOutsideClick: false,
      customClass: { popup: 'rounded-2xl' }
    }).then(() => {
      window.location.href = 'login.html';
    });
    return true; // เกิด Error จากการ Auth
  }
  return false;
}

// ตัวอย่างการนำไปใช้ในฟังก์ชันสร้างโพสต์ตามหา
document.getElementById('wantedForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const res = await fetch('/api/wanted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    // ตรวจสอบหากเกิด 401 / 403 ให้ส่งไปหน้า Login
    if (handleAuthError(res)) return;

    const data = await res.json();
    if (res.ok && data.success) {
      // ทำงานเมื่อสำเร็จ...
    }
  } catch (err) {
    console.error(err);
  }
});
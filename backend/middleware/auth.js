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
};
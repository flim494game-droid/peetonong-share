// public/js/auth-check.js

// 1. ตรวจสอบ Session เมื่อโหลดหน้าเว็บ
(function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // ถ้าไม่มี Token แล้วไม่ได้อยู่ที่หน้า login.html ให้ส่งกลับไปหน้า Login
  if (!token || !user) {
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
  }
})();

// 2. ฟังก์ชันออกจากระบบ (Logout)
function logout() {
  Swal.fire({
    title: 'ยืนยันการออกจากระบบ?',
    text: 'คุณต้องการออกจากระบบใช่หรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444', // สีแดงสำหรับปุ่มยืนยันออกจากระบบ
    cancelButtonColor: '#6b7280',  // สีเทาสำหรับปุ่มยกเลิก
    confirmButtonText: 'ใช่, ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,          // สลับให้ปุ่มยกเลิกอยู่ซ้าย ปุ่มยืนยันอยู่ขวา
    customClass: {
      popup: 'rounded-2xl'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // ลบข้อมูล Token และ User ใน LocalStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // แสดงแจ้งเตือนสำเร็จสั้นๆ ก่อนเปลี่ยนหน้า
      Swal.fire({
        icon: 'success',
        title: 'ออกจากระบบเรียบร้อย',
        timer: 1200,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-2xl'
        }
      }).then(() => {
        window.location.href = 'login.html';
      });
    }
  });
}

// 3. แสดงชื่อผู้ใช้งานใน Header เมื่อโหลด DOM เสร็จสิ้น
document.addEventListener('DOMContentLoaded', () => {
  const userJson = localStorage.getItem('user');
  const userNav = document.getElementById('userNavInfo');

  if (userJson && userNav) {
    const user = JSON.parse(userJson);
    userNav.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-indigo-100">👤 ${user.fullname}</span>
        <button onclick="logout()" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition">
          ออกจากระบบ
        </button>
      </div>
    `;
  }
});
// public/js/auth-check.js
document.addEventListener('DOMContentLoaded', () => {
  const userJson = localStorage.getItem('user');
  const userNav = document.getElementById('userNavInfo');

  if (userJson && userNav) {
    const user = JSON.parse(userJson);
    userNav.innerHTML = `
      <div class="flex items-center gap-3">
      <a href="profile.html" class="inline-flex items-center gap-2 bg-indigo-700/60 hover:bg-indigo-700/90 text-white font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl border border-indigo-400/30 shadow-inner backdrop-blur-sm transition-all duration-200 hover:border-indigo-300/50 active:scale-95 group">
          <!-- กรอบไอคอนโปรไฟล์ -->
          <span class="w-6 h-6 rounded-lg bg-amber-400 text-indigo-950 text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            👤</span>
          <!-- ชื่อผู้ใช้งาน -->
          <span class="truncate max-w-[120px] sm:max-w-[160px] group-hover:text-amber-300 transition-colors">
            ${user.fullname}</span></a>
        <button onclick="logout()" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition">
          ออกจากระบบ</button>
      </div>
    `;
  }
});
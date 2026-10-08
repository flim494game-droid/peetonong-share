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
  if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
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
        <a href="profile.html" class="text-sm font-medium text-indigo-100 hover:text-white underline">
          👤 ${user.fullname}
        </a>
        <button onclick="logout()" class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition">
          ออกจากระบบ
        </button>
      </div>
    `;
  }
});
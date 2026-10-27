// public/js/admin.js

let adminToken = localStorage.getItem('adminToken');

// ตรวจสอบสิทธิ์ Admin เมื่อเปิดหน้า
function checkAdminAuth() {
  if (!adminToken) {
    showAdminLoginModal();
  } else {
    renderAdminHeader();
    loadAdminData();
  }
}

// Modal เข้าสู่ระบบ Admin
function showAdminLoginModal() {
  Swal.fire({
    title: '<span class="text-xl font-black text-slate-800">🛡️ เข้าสู่ระบบ Admin</span>',
    html: `
      <div class="space-y-3 text-left mt-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Username</label>
          <input type="text" id="adminUsername" placeholder="admin" class="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Password</label>
          <input type="password" id="adminPassword" placeholder="••••••••" class="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 focus:outline-none">
        </div>
      </div>
    `,
    confirmButtonText: 'เข้าสู่ระบบ',
    confirmButtonColor: '#0f172a',
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: { popup: 'rounded-2xl p-6' },
    preConfirm: () => {
      const username = document.getElementById('adminUsername').value;
      const password = document.getElementById('adminPassword').value;

      if (!username || !password) {
        Swal.showValidationMessage('กรุณากรอก Username และ Password');
        return false;
      }

      if (username === 'admin' && password === 'adminpw') {
        return { success: true, token: 'admin-secret-token-key' };
      } else {
        Swal.showValidationMessage('Username หรือ Password ไม่ถูกต้อง!');
        return false;
      }
    }
  }).then((result) => {
    if (result.isConfirmed && result.value.success) {
      localStorage.setItem('adminToken', result.value.token);
      adminToken = result.value.token;
      
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบ Admin สำเร็จ!',
        timer: 1200,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      }).then(() => {
        renderAdminHeader();
        loadAdminData();
      });
    }
  });
}

function renderAdminHeader() {
  const container = document.getElementById('adminNavInfo');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-xs bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl border border-slate-700">
        👤 Administrator
      </span>
      <button onclick="adminLogout()" class="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition">
        ออกจากระบบ
      </button>
    </div>
  `;
}

function adminLogout() {
  Swal.fire({
    title: 'ออกจากระบบ Admin?',
    text: 'คุณต้องการออกจากระบบผู้ดูแลระบบใช่หรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: { popup: 'rounded-2xl' }
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('adminToken');
      location.reload();
    }
  });
}

function switchAdminTab(tab) {
  const itemsView = document.getElementById('adminItemsView');
  const wantedView = document.getElementById('adminWantedView');
  const usersView = document.getElementById('adminUsersView');

  const tabItemsBtn = document.getElementById('tabItemsBtn');
  const tabWantedBtn = document.getElementById('tabWantedBtn');
  const tabUsersBtn = document.getElementById('tabUsersBtn');

  const activeClass = "px-4 py-2.5 rounded-xl bg-white text-indigo-600 shadow-sm border border-slate-200/60 font-bold";
  const inactiveClass = "px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white/50 font-medium";

  itemsView.classList.add('hidden');
  wantedView.classList.add('hidden');
  usersView.classList.add('hidden');

  tabItemsBtn.className = inactiveClass;
  tabWantedBtn.className = inactiveClass;
  tabUsersBtn.className = inactiveClass;

  if (tab === 'items') {
    itemsView.classList.remove('hidden');
    tabItemsBtn.className = activeClass;
  } else if (tab === 'wanted') {
    wantedView.classList.remove('hidden');
    tabWantedBtn.className = activeClass;
  } else if (tab === 'users') {
    usersView.classList.remove('hidden');
    tabUsersBtn.className = activeClass;
  }
}

// โหลดข้อมูลทั้งหมดลง Dashboard
async function loadAdminData() {
  try {
    const [resItems, resWanted, resUsers] = await Promise.all([
      fetch('/api/items'),
      fetch('/api/wanted'),
      fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${adminToken}` } })
    ]);

    const items = resItems.ok ? await resItems.json() : [];
    const wanted = resWanted.ok ? await resWanted.json() : [];
    const users = resUsers.ok ? await resUsers.json() : [];

    // อัปเดตตัวเลข Stats
    document.getElementById('statTotalItems').innerText = Array.isArray(items) ? items.length : 0;
    document.getElementById('statTotalWanted').innerText = Array.isArray(wanted) ? wanted.length : 0;
    document.getElementById('statTotalUsers').innerText = Array.isArray(users) ? users.length : 0;

    renderAdminItems(items);
    renderAdminWanted(wanted);
    renderAdminUsers(users);

  } catch (err) {
    console.error("Error loading admin data:", err);
  }
}

// Render ตาราง Items
function renderAdminItems(items) {
  const tbody = document.getElementById('adminItemsTable');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400">ไม่มีข้อมูลรายการส่งต่อ</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="py-3 px-2 font-bold text-slate-800">${item.title}</td>
      <td class="py-3 px-2 text-slate-600">${item.giver?.fullname || item.giver?.name || 'ไม่ระบุ'}</td>
      <td class="py-3 px-2 font-semibold ${item.type === 'Free' ? 'text-green-600' : 'text-amber-600'}">
        ${item.type === 'Free' ? 'ให้ฟรี' : `฿${item.price}`}
      </td>
      <td class="py-3 px-2 text-slate-500">${item.category}</td>
      <td class="py-3 px-2 text-right">
        <button onclick="adminDeleteItem(${item.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg transition">
          🗑️ ลบ
        </button>
      </td>
    </tr>
  `).join('');
}

// Render ตาราง Wanted
function renderAdminWanted(items) {
  const tbody = document.getElementById('adminWantedTable');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">ไม่มีข้อมูลโพสต์ตามหา</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="py-3 px-2 font-bold text-slate-800">${item.title}</td>
      <td class="py-3 px-2 text-slate-600">${item.requester?.fullname || 'ไม่ระบุ'}</td>
      <td class="py-3 px-2 text-indigo-600">${item.requester?.email || '-'}</td>
      <td class="py-3 px-2 text-right">
        <button onclick="adminDeleteWanted(${item.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg transition">
          🗑️ ลบ
        </button>
      </td>
    </tr>
  `).join('');
}

// Render ตาราง Users
function renderAdminUsers(users) {
  const tbody = document.getElementById('adminUsersTable');
  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">ไม่มีข้อมูลสมาชิกในระบบ</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr class="hover:bg-slate-50/80 transition">
      <td class="py-3 px-2 font-bold text-slate-800">${user.fullname || '-'}</td>
      <td class="py-3 px-2 text-slate-600">${user.email}</td>
      <td class="py-3 px-2 text-slate-400">
        ${user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : '-'}
      </td>
      <td class="py-3 px-2 text-right">
        <button onclick="adminDeleteUser(${user.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-lg transition">
          🚫 ระงับสิทธิ์
        </button>
      </td>
    </tr>
  `).join('');
}

// ลบ Item
function adminDeleteItem(id) {
  Swal.fire({
    title: 'ลบรายการส่งต่อนี้?',
    text: 'การดำเนินการนี้จะไม่สามารถกู้คืนได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบรายการ',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: { popup: 'rounded-2xl' }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
        loadAdminData();
      }
    }
  });
}

// ลบ Wanted
function adminDeleteWanted(id) {
  Swal.fire({
    title: 'ลบโพสต์ตามหานี้?',
    text: 'การดำเนินการนี้จะไม่สามารถกู้คืนได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบโพสต์',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: { popup: 'rounded-2xl' }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await fetch(`/api/admin/wanted/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
        loadAdminData();
      }
    }
  });
}

// ระงับ User
function adminDeleteUser(id) {
  Swal.fire({
    title: 'ระงับสิทธิ์สมาชิกนี้?',
    text: 'บัญชีผู้ใช้นี้จะถูกลบออกจากระบบ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ระงับสิทธิ์',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: { popup: 'rounded-2xl' }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'ระงับสิทธิ์เรียบร้อย', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
        loadAdminData();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', checkAdminAuth);
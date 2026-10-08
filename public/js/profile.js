// public/js/profile.js

const token = localStorage.getItem('token');

// โหลดข้อมูลโปรไฟล์เมื่อเปิดหน้า
async function loadProfile() {
  try {
    const res = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    // แสดงข้อมูลในฟอร์มส่วนตัว
    document.getElementById('profileEmail').value = data.user.email;
    document.getElementById('profileFullname').value = data.user.fullname;

    // เช็กสถานะการเปลี่ยนชื่อ 30 วัน
    if (data.user.last_name_change) {
      const lastDate = new Date(data.user.last_name_change);
      const currentDate = new Date();
      const diffDays = Math.ceil(Math.abs(currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        const remainingDays = 30 - diffDays;
        document.getElementById('nameChangeHint').innerText = `🔒 คุณเปลี่ยนชื่อไปแล้วเมื่อ ${lastDate.toLocaleDateString('th-TH')} (สามารถเปลี่ยนได้อีกครั้งในอีก ${remainingDays} วัน)`;
      }
    }

    // แสดงรายการ Hardware ของฉัน
    renderMyItems(data.items);

  } catch (err) {
    console.error(err);
  }
}

// Render รายการโพสต์ของฉัน
function renderMyItems(items) {
  const container = document.getElementById('myItemsList');

  if (items.length === 0) {
    container.innerHTML = `<p class="text-center py-6 text-gray-400">คุณยังไม่มีรายการโพสต์ส่งต่อ Hardware</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-200">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold px-2 py-0.5 rounded ${item.type === 'Free' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
            ${item.type === 'Free' ? 'ให้ฟรี' : `฿${item.price}`}
          </span>
          <h4 class="font-bold text-gray-800">${item.title}</h4>
        </div>
        <p class="text-xs text-indigo-600 font-medium">🏷️ ${item.courseTag} | 📦 ${item.category}</p>
        <p class="text-xs text-gray-500">สภาพ: ${item.condition}</p>
      </div>

      <div class="flex gap-2 w-full md:w-auto justify-end">
        <button onclick='openEditModal(${JSON.stringify(item)})' class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg">
          ✏️ แก้ไข
        </button>
        <button onclick="deleteItem(${item.id})" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-2 rounded-lg">
          🗑️ ลบ
        </button>
      </div>
    </div>
  `).join('');
}

// ยื่นเปลี่ยนชื่อ
document.getElementById('updateNameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fullname = document.getElementById('profileFullname').value;

  const res = await fetch('/api/user/profile/name', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ fullname })
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    // อัปเดตข้อมูลผู้ใช้ใน localStorage
    const localUser = JSON.parse(localStorage.getItem('user'));
    localUser.fullname = fullname;
    localStorage.setItem('user', JSON.stringify(localUser));
    location.reload();
  } else {
    alert(data.error);
  }
});

// เปิด Modal แก้ไขโพสต์
function openEditModal(item) {
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editTitle').value = item.title;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editType').value = item.type;
  document.getElementById('editCourseTag').value = item.courseTag;
  document.getElementById('editCondition').value = item.condition;
  document.getElementById('editDescription').value = item.description || '';
  document.getElementById('editModal').showModal();
}

// ยืนยันแก้ไขโพสต์
document.getElementById('editPostForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editItemId').value;

  const payload = {
    title: document.getElementById('editTitle').value,
    category: document.getElementById('editCategory').value,
    type: document.getElementById('editType').value,
    courseTag: document.getElementById('editCourseTag').value,
    condition: document.getElementById('editCondition').value,
    description: document.getElementById('editDescription').value
  };

  const res = await fetch(`/api/user/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    alert('แก้ไขโพสต์เรียบร้อย');
    document.getElementById('editModal').close();
    loadProfile();
  } else {
    alert(data.error);
  }
});

// ลบโพสต์
async function deleteItem(id) {
  if (!confirm('คุณแน่ใจหรือว่าต้องการลบโพสต์นี้?')) return;

  const res = await fetch(`/api/user/items/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message);
    loadProfile();
  } else {
    alert(data.error);
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
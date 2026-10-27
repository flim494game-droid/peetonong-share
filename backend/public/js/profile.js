// public/js/profile.js

const token = localStorage.getItem('token');
let userItemsCache = []; // เก็บข้อมูลรายการอุปกรณ์ไว้ชั่วคราว เพื่อความปลอดภัยเวลาเรียกแก้ไข

// โหลดข้อมูลโปรไฟล์เมื่อเปิดหน้า
async function loadProfile() {
  try {
    const res = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: data.error || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    // แสดงข้อมูลในฟอร์มส่วนตัว
    document.getElementById('profileEmail').value = data.user.email || '';
    document.getElementById('profileFullname').value = data.user.fullname || '';

    // เช็กสถานะการเปลี่ยนชื่อ 30 วัน
    if (data.user.last_name_change) {
      const lastDate = new Date(data.user.last_name_change);
      const currentDate = new Date();
      const diffDays = Math.ceil(Math.abs(currentDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        const remainingDays = 30 - diffDays;
        const hintEl = document.getElementById('nameChangeHint');
        if (hintEl) {
          hintEl.innerText = `🔒 คุณเปลี่ยนชื่อไปแล้วเมื่อ ${lastDate.toLocaleDateString('th-TH')} (สามารถเปลี่ยนได้อีกครั้งในอีก ${remainingDays} วัน)`;
        }
      }
    }

    // แสดงรายการ Hardware ของฉัน
    renderMyItems(data.items || []);

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'การเชื่อมต่อผิดพลาด',
      text: 'ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'rounded-2xl' }
    });
  }
}

// Render รายการโพสต์ของฉัน
function renderMyItems(items) {
  userItemsCache = items; // บันทึกลง cache
  const container = document.getElementById('myItemsList');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<p class="text-center py-6 text-gray-400">คุณยังไม่มีรายการโพสต์ส่งต่อ Hardware</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-200 transition">
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
        <button onclick="handleEditModal(${item.id})" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg transition-colors">
          ✏️ แก้ไข
        </button>
        <button onclick="deleteItem(${item.id})" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-2 rounded-lg transition-colors">
          🗑️ ลบ
        </button>
      </div>
    </div>
  `).join('');
}

// ยื่นเปลี่ยนชื่อ (พร้อมระบบป้องกันกดซ้ำ)
document.getElementById('updateNameForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    submitBtn.dataset.originalText = submitBtn.innerText;
    submitBtn.innerText = 'กำลังบันทึก...';
  }

  const fullname = document.getElementById('profileFullname').value;

  try {
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
      // อัปเดตข้อมูลผู้ใช้ใน localStorage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.fullname = fullname;
      localStorage.setItem('user', JSON.stringify(localUser));

      Swal.fire({
        icon: 'success',
        title: 'อัปเดตชื่อสำเร็จ!',
        text: data.message || 'เปลี่ยนชื่อผู้ใช้งานเรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      }).then(() => {
        location.reload();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถเปลี่ยนชื่อได้',
        text: data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อ',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-2xl' }
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'rounded-2xl' }
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerText = submitBtn.dataset.originalText || 'บันทึกการเปลี่ยนแปลง';
    }
  }
});

// ค้นหาและเปิด Modal แก้ไขโพสต์จาก Cache
function handleEditModal(id) {
  const item = userItemsCache.find(i => i.id === id);
  if (item) {
    openEditModal(item);
  }
}

// เปิด Modal แก้ไขโพสต์
function openEditModal(item) {
  document.getElementById('editItemId').value = item.id;
  document.getElementById('editTitle').value = item.title;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editType').value = item.type;
  document.getElementById('editCourseTag').value = item.courseTag;
  document.getElementById('editCondition').value = item.condition;
  document.getElementById('editDescription').value = item.description || '';
  
  const modal = document.getElementById('editModal');
  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
  }
}

// ยืนยันแก้ไขโพสต์ (พร้อมระบบป้องกันกดซ้ำ)
// ยืนยันแก้ไขโพสต์ (แก้ไขการซ้อนทับของ Modal กับ SweetAlert2)
document.getElementById('editPostForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    submitBtn.dataset.originalText = submitBtn.innerText;
    submitBtn.innerText = 'กำลังบันทึก...';
  }

  const id = document.getElementById('editItemId').value;
  const payload = {
    title: document.getElementById('editTitle').value,
    category: document.getElementById('editCategory').value,
    type: document.getElementById('editType').value,
    courseTag: document.getElementById('editCourseTag').value,
    condition: document.getElementById('editCondition').value,
    description: document.getElementById('editDescription').value
  };

  try {
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
      // 1. ปิด Modal ก่อนเรียก SweetAlert2 เพื่อไม่ให้บังซ้อนกัน
      const modal = document.getElementById('editModal');
      if (modal && typeof modal.close === 'function') {
        modal.close();
      }

      // 2. แสดง SweetAlert2 แจ้งเตือนสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'แก้ไขโพสต์เรียบร้อย!',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      }).then(() => {
        loadProfile();
      });

    } else {
      // กรณีเกิดข้อผิดพลาด กำหนด target ให้แสดงใน Modal หรือปิด Modal ก่อนแจ้งเตือน
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถแก้ไขได้',
        text: data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        confirmButtonColor: '#4f46e5',
        target: document.getElementById('editModal') || 'body', // แสดงครอบบน Modal
        customClass: { popup: 'rounded-2xl' }
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5',
      target: document.getElementById('editModal') || 'body',
      customClass: { popup: 'rounded-2xl' }
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      submitBtn.innerText = submitBtn.dataset.originalText || 'บันทึกแก้ไข';
    }
  }
});

// ลบโพสต์
async function deleteItem(id) {
  Swal.fire({
    title: 'ยืนยันการลบรายการ?',
    text: 'เมื่อลบแล้วจะไม่สามารถกู้คืนโพสต์นี้ได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ใช่, ลบโพสต์',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: { popup: 'rounded-2xl' }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/user/items/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'ลบโพสต์เรียบร้อย',
            timer: 1200,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl' }
          });
          loadProfile();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถลบได้',
            text: data.error || 'เกิดข้อผิดพลาดในการลบรายการ',
            confirmButtonColor: '#4f46e5',
            customClass: { popup: 'rounded-2xl' }
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถลบโพสต์ได้ในขณะนี้',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadProfile);
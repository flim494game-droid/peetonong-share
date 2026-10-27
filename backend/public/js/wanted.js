// ฟังก์ชันแปลงไฟล์รูปภาพเป็น Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// --- 1. ดึงรายการโพสต์ตามหาทั้งหมดมาแสดงผล ---
async function fetchWantedItems() {
  const grid = document.getElementById('wantedGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/wanted');
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">ยังไม่มีรายการโพสต์ตามหาอุปกรณ์</div>`;
      return;
    }

    // อ่านข้อมูลผู้ใช้ปัจจุบันเพื่อเช็กสิทธิ์ปุ่มลบ
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    grid.innerHTML = items.map(item => {
      // กำหนดความสูง 192px (h-48) และล๊อกกรอบรูปภาพให้เท่ากันทุกการ์ด
      let imageHtml = '';
      if (item.imageUrl) {
        imageHtml = `
          <div class="w-full h-48 overflow-hidden rounded-t-xl bg-gray-100">
            <img src="${item.imageUrl}" 
                alt="${item.title}" 
                class="w-full h-full object-cover object-center" 
                onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'flex items-center justify-center w-full h-48 bg-indigo-50/50 text-indigo-300 font-semibold text-sm rounded-t-xl\\'>📷 รูปภาพไม่สมบูรณ์</div>';" />
          </div>`;
      } else {
        imageHtml = `
          <div class="flex items-center justify-center w-full h-48 bg-indigo-50/50 text-indigo-300 font-semibold text-sm rounded-t-xl">
            📷 ไม่มีรูปภาพ
          </div>`;
      }

      const requesterName = item.requester?.fullname || 'ไม่ระบุชื่อ';
      const requesterEmail = item.requester?.email || '';
      const isOwner = currentUser && (currentUser.id === item.requester?.id);

      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden hover:shadow-md transition">
          <div>
            ${imageHtml}
            <div class="p-5">
              <h3 class="font-bold text-lg text-gray-800 mb-1">${item.title}</h3>
              <p class="text-sm text-gray-600 line-clamp-3 mb-4">${item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <div>
              <p class="font-semibold text-gray-700">🙋‍♂️ โดย: ${requesterName}</p>
              ${requesterEmail ? `<p class="text-indigo-600">✉️ ${requesterEmail}</p>` : ''}
            </div>
            ${isOwner ? `
              <button onclick="deleteWantedItem(${item.id})" class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded transition">
                ลบ
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error fetching wanted items:", err);
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>`;
  }
}

// --- 2. ฟังก์ชันลบโพสต์ตามหา ---
async function deleteWantedItem(id) {
  const token = localStorage.getItem('token');
  if (!token) return;

  const result = await Swal.fire({
    title: 'ยืนยันการลบโพสต์?',
    text: 'คุณต้องการลบรายการตามหานี้ใช่หรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'ลบโพสต์',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`/api/wanted/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire({ icon: 'success', title: 'ลบโพสต์สำเร็จ', timer: 1200, showConfirmButton: false });
        fetchWantedItems();
      } else {
        Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: data.error });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการลบ' });
    }
  }
}

// --- 3. จัดการ Submit ฟอร์มโพสต์ตามหา ---
document.getElementById('wantedForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบก่อนโพสต์' });
    return;
  }

  const modal = document.getElementById('postWantedModal');
  const title = document.getElementById('wantedTitle').value;
  const description = document.getElementById('wantedDescription').value;
  const fileInput = document.getElementById('wantedImage');

  let imageBase64 = null;
  if (fileInput && fileInput.files[0]) {
    try {
      imageBase64 = await fileToBase64(fileInput.files[0]);
    } catch (err) {
      console.error("Error reading file:", err);
    }
  }

  try {
    const res = await fetch('/api/wanted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        description: description,
        image: imageBase64
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      // ⚠️ จุดสำคัญ: สั่งปิด Modal ก่อน เพื่อเอา Dialog ออกจาก Top Layer ให้ SweetAlert แสดงผลได้
      if (modal) modal.close();
      e.target.reset(); // ล้างค่าในฟอร์ม

      // แสดง SweetAlert2
      await Swal.fire({
        icon: 'success',
        title: 'โพสต์ตามหาสำเร็จ!',
        text: 'ระบบได้บันทึกรายการตามหาอุปกรณ์เรียบร้อยแล้ว',
        timer: 1500,
        showConfirmButton: false
      });

      // ดึงข้อมูลใหม่มาแสดงบนบอร์ดทันทีโดยไม่ต้อง Refresh หน้า
      fetchWantedItems();
    } else {
      Swal.fire({ 
        icon: 'error', 
        title: 'เกิดข้อผิดพลาด', 
        text: data.error || 'ไม่สามารถบันทึกข้อมูลได้',
        confirmButtonColor: '#4f46e5'
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ 
      icon: 'error', 
      title: 'เกิดข้อผิดพลาด', 
      text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
      confirmButtonColor: '#4f46e5'
    });
  }
});

// ดึงข้อมูลเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchWantedItems);
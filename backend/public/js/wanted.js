// public/js/wanted.js

const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

// ฟังก์ชันแปลงไฟล์รูปภาพเป็น Base64 String
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ฟังก์ชันแสดงข้อมูลติดต่อผู้โพสต์ตามหาอุปกรณ์
function contactRequester(email, fullname, title) {
  Swal.fire({
    icon: 'info',
    title: 'ข้อมูลติดต่อช่วยส่งต่อ',
    html: `
      <div class="text-left bg-indigo-50 p-4 rounded-xl space-y-2 text-sm text-gray-700 border border-indigo-100">
        <p><strong>📦 อุปกรณ์ที่ตามหา:</strong> <span class="text-gray-900 font-medium">${title}</span></p>
        <p><strong>🙋‍♂️ ผู้โพสต์:</strong> <span class="text-gray-900 font-medium">${fullname}</span></p>
        <p><strong>✉️ อีเมลติดต่อ:</strong> <a href="mailto:${email}" class="text-indigo-600 font-bold hover:underline">${email}</a></p>
      </div>
    `,
    confirmButtonText: 'รับทราบ',
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'rounded-2xl'
    }
  });
}

// ดึงรายการโพสต์ตามหาทั้งหมด
async function fetchWantedItems() {
  try {
    const res = await fetch('/api/wanted');
    const items = await res.json();
    const grid = document.getElementById('wantedGrid');

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">ยังไม่มีใครโพสต์ตามหาอุปกรณ์ในขณะนี้</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const requesterName = item.requester?.fullname || 'ผู้ใช้งาน';
      const requesterEmail = item.requester?.email || 'ไม่มีอีเมล';

      // Safe Escape String สำหรับ onclick
      const safeTitle = item.title.replace(/'/g, "\\'");
      const safeName = requesterName.replace(/'/g, "\\'");
      const safeEmail = requesterEmail.replace(/'/g, "\\'");

      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div>
            ${item.imageUrl 
              ? `<img src="${item.imageUrl}" alt="${item.title}" class="w-full h-48 object-cover bg-gray-100">`
              : `<div class="w-full h-36 bg-indigo-50 flex items-center justify-center text-indigo-300 font-bold text-lg">📷 ไม่มีรูปภาพ</div>`
            }
            <div class="p-5">
              <h3 class="font-bold text-lg text-gray-800 mb-2">${item.title}</h3>
              <p class="text-sm text-gray-600 mb-4 whitespace-pre-line">${item.description || 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}</p>
            </div>
          </div>

          <div class="p-5 pt-0 border-t border-gray-100 mt-auto flex justify-between items-center text-xs text-gray-500">
            <div>
              <p class="font-semibold text-gray-700">🙋‍♂️ โดย: ${requesterName}</p>
              <p class="text-indigo-600">✉️ ${requesterEmail}</p>
            </div>
            ${item.requester?.id === currentUser.id 
              ? `<button onclick="deleteWanted(${item.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg transition-colors">ลบ</button>`
              : `<button onclick="contactRequester('${safeEmail}', '${safeName}', '${safeTitle}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition-colors">ช่วยส่งต่อ</button>`
            }
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error fetching wanted items:", err);
  }
}

// จัดการ Submit ฟอร์มโพสต์ตามหา
document.getElementById('wantedForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบก่อนโพสต์' });
    return;
  }

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
      Swal.fire({
        icon: 'success',
        title: 'โพสต์ตามหาสำเร็จ!',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        document.getElementById('postWantedModal').close();
        location.reload();
      });
    } else {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: data.error || 'ไม่สามารถบันทึกข้อมูลได้' });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' });
  }
});

// ลบโพสต์ตามหา
async function deleteWanted(id) {
  Swal.fire({
    title: 'ยืนยันการลบโพสต์?',
    text: 'เมื่อลบแล้วจะไม่สามารถกู้คืนโพสต์ตามหานี้ได้',
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
        const res = await fetch(`/api/wanted/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
            if (res.ok && data.success) {
              // 1. สั่งปิด Modal และรีเซ็ตฟอร์มก่อน
              const modal = document.getElementById('postWantedModal');
              if (modal && typeof modal.close === 'function') {
                modal.close();
              }
              document.getElementById('wantedForm').reset();

              // 2. แสดง SweetAlert2 (จะขึ้นมาเด่นๆ ด้านหน้าทันที)
              Swal.fire({
                icon: 'success',
                title: 'โพสต์ตามหาสำเร็จ!',
                text: 'รายการตามหาของคุณถูกโพสต์ขึ้นบอร์ดเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
              }).then(() => {
                fetchWantedItems();
              });
            } else {
          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถลบได้',
            text: data.error || 'เกิดข้อผิดพลาดในการลบโพสต์',
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

document.addEventListener('DOMContentLoaded', fetchWantedItems);
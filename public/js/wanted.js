// public/js/wanted.js

const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

// ดึงรายการโพสต์ตามหาทั้งหมด
async function fetchWantedItems() {
  try {
    const res = await fetch('/api/wanted');
    const items = await res.json();
    const grid = document.getElementById('wantedGrid');

    if (items.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400">ยังไม่มีใครโพสต์ตามหาอุปกรณ์ในขณะนี้</div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
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

        <div class="p-5 pt-0 border-t border-gray-50 mt-auto flex justify-between items-center text-xs text-gray-500">
          <div>
            <p class="font-semibold text-gray-700">🙋‍♂️ โดย: ${item.requester.fullname}</p>
            <p class="text-indigo-600">✉️ ${item.requester.email}</p>
          </div>
          ${item.requester.id === currentUser.id 
            ? `<button onclick="deleteWanted(${item.id})" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg">ลบ</button>`
            : `<button onclick="alert('ติดต่อผู้โพสต์ผ่านอีเมล: ${item.requester.email}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg">ช่วยส่งต่อ</button>`
          }
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}

// ส่งฟอร์มสร้างโพสต์ตามหา (ส่งข้อมูลเป็น FormData เพื่อแนบไฟล์)
document.getElementById('wantedForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('wantedTitle').value);
  formData.append('description', document.getElementById('wantedDescription').value);

  const imageFile = document.getElementById('wantedImage').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const res = await fetch('/api/wanted', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // ไม่ต้องใส่ Content-Type เมื่อใช้ FormData
      },
      body: formData
    });

    const data = await res.json();
    if (res.ok && data.success) {
      alert('โพสต์ตามหาสำเร็จ!');
      document.getElementById('postWantedModal').close();
      document.getElementById('wantedForm').reset();
      fetchWantedItems();
    } else {
      alert(data.error || 'เกิดข้อผิดพลาดในการโพสต์');
    }
  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
  }
});

// ลบโพสต์ตามหา
async function deleteWanted(id) {
  if (!confirm('คุณต้องการลบโพสต์ตามหานี้หรือไม่?')) return;

  try {
    const res = await fetch(`/api/wanted/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      fetchWantedItems();
    } else {
      alert(data.error);
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', fetchWantedItems);
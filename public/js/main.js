// ฟังก์ชันแสดง SweetAlert2 สำหรับข้อมูลติดต่อขอรับอุปกรณ์
function requestItem(giverName, contactInfo, itemTitle) {
  Swal.fire({
    icon: 'info',
    title: 'ข้อมูลติดต่อขอรับอุปกรณ์',
    html: `
      <div class="text-left bg-indigo-50 p-4 rounded-xl space-y-2 text-sm text-gray-700 border border-indigo-100">
        <p><strong>📦 รายการ:</strong> <span class="text-gray-900 font-medium">${itemTitle}</span></p>
        <p><strong>👤 ผู้ส่งต่อ:</strong> <span class="text-gray-900 font-medium">${giverName}</span></p>
        <p><strong>📞 ช่องทางติดต่อ:</strong> <span class="text-indigo-600 font-bold">${contactInfo || 'ไม่ได้ระบุ'}</span></p>
      </div>
    `,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#4f46e5',
    customClass: {
      popup: 'rounded-2xl'
    }
  });
}

async function fetchItems() {
  const searchInput = document.getElementById('searchInput');
  const search = searchInput ? searchInput.value : '';
  const grid = document.getElementById('itemsGrid');
  
  try {
    const res = await fetch(`/api/items?search=${encodeURIComponent(search)}`);
    const items = await res.json();

    if (!items || items.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">ไม่พบรายการอุปกรณ์ที่ค้นหา</div>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const giverName = item.giver?.name || 'ไม่ระบุชื่อ';
      const contactInfo = item.giver?.contactInfo || 'ไม่ระบุช่องทางติดต่อ';

      // จัดการเครื่องหมาย Single Quote ใน String เพื่อไม่ให้เกิด Error ใน onclick
      const safeTitle = item.title.replace(/'/g, "\\'");
      const safeGiverName = giverName.replace(/'/g, "\\'");
      const safeContactInfo = contactInfo.replace(/'/g, "\\'");

      return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold px-2.5 py-1 rounded-full ${item.type === 'Free' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                ${item.type === 'Free' ? '🎁 ให้ฟรี' : `฿${item.price}`}
              </span>
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${item.category}</span>
            </div>
            <h3 class="font-bold text-lg text-gray-800 mb-1">${item.title}</h3>
            <p class="text-xs text-indigo-600 font-semibold mb-3">🏷️ ${item.courseTag}</p>
            <p class="text-sm text-gray-600 mb-2"><strong>สภาพ:</strong> ${item.condition}</p>
            <p class="text-sm text-gray-500 line-clamp-2">${item.description}</p>
          </div>
          <div class="mt-4 pt-3 border-t text-xs text-gray-500 flex justify-between items-center">
            <span>👤 ${giverName}</span>
            <button onclick="requestItem('${safeGiverName}', '${safeContactInfo}', '${safeTitle}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded transition-colors">
              ขอรับอุปกรณ์
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error fetching items:", err);
    if (grid) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>`;
    }
  }
}

// ดึงข้อมูลครั้งแรกเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchItems);
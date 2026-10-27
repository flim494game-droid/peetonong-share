import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AdminService, AdminStats } from '../../services/admin';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  activeTab: 'items' | 'wanted' | 'users' = 'items';
  
  stats: AdminStats = { usersCount: 0, itemsCount: 0, wantedCount: 0 };
  items: any[] = [];
  wantedItems: any[] = [];
  users: any[] = [];
  isLoading = true;

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'ปฏิเสธการเข้าถึง',
        text: 'เฉพาะสิทธิ์ Admin เท่านั้นที่สามารถเข้าหน้านี้ได้',
        timer: 2000,
        showConfirmButton: false
      });
      this.router.navigate(['/wanted']);
      return;
    }
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.isLoading = true;
    this.adminService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.items = data.items;
        this.wantedItems = data.wanted;
        this.users = data.users;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load admin data:', err);
      }
    });
  }

  deleteItem(id: number): void {
    this.confirmDelete('ลบรายการของบริจาคชิ้นนี้?', () => {
      this.adminService.deleteItem(id).subscribe(() => this.loadAdminData());
    });
  }

  deleteWanted(id: number): void {
    this.confirmDelete('ลบโพสต์ตามหาชิ้นนี้?', () => {
      this.adminService.deleteWantedItem(id).subscribe(() => this.loadAdminData());
    });
  }

  deleteUser(id: number): void {
    this.confirmDelete('ลบบัญชีผู้ใช้งานนี้?', () => {
      this.adminService.deleteUser(id).subscribe(() => this.loadAdminData());
    });
  }

  private confirmDelete(title: string, onConfirm: () => void): void {
    Swal.fire({
      title: title,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-2xl' }
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirm();
      }
    });
  }
}
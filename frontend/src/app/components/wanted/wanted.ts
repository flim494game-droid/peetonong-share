import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WantedService, WantedItem } from '../../services/wanted';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-wanted',
  standalone: true,
  imports: [CommonModule, FormsModule], // ลบ RouterLink ออกจากอาร์เรย์นี้
  templateUrl: './wanted.html',
  styleUrl: './wanted.css'
})
export class WantedComponent implements OnInit {
  items: WantedItem[] = [];
  currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  isModalOpen = false;

  // Form State
  title = '';
  description = '';
  selectedFile: File | null = null;
  isSubmitting = false;

  constructor(private wantedService: WantedService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.wantedService.getWantedItems().subscribe({
      next: (data) => this.items = data,
      error: (err) => console.error('Error fetching items:', err)
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.title.trim()) return;

    this.isSubmitting = true;
    let base64Image: string | null = null;

    if (this.selectedFile) {
      base64Image = await this.wantedService.convertFileToBase64(this.selectedFile);
    }

    const payload = {
      title: this.title,
      description: this.description,
      imageUrl: base64Image
    };

    this.wantedService.createWantedItem(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isModalOpen = false;
        this.resetForm();
        Swal.fire({
          icon: 'success',
          title: 'โพสต์ตามหาสำเร็จ!',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
        });
        this.loadItems();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: err.error?.error || 'ไม่สามารถโพสต์ได้',
          customClass: { popup: 'rounded-2xl' }
        });
      }
    });
  }

  deleteItem(id: number): void {
    Swal.fire({
      title: 'ยืนยันการลบโพสต์?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบโพสต์',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-2xl' }
    }).then((result) => {
      if (result.isConfirmed) {
        this.wantedService.deleteWantedItem(id).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false });
            this.loadItems();
          }
        });
      }
    });
  }

  resetForm(): void {
    this.title = '';
    this.description = '';
    this.selectedFile = null;
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// ประกาศ interface สำหรับ export ให้ component นำไปใช้
export interface WantedItem {
  id?: number;
  title: string;
  description: string;
  imageUrl?: string;
  requester?: {
    id: number;
    fullname: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WantedService {
  private apiUrl = 'http://localhost:3000/api/wanted';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ดึงรายการทั้งหมด
  getWantedItems(): Observable<WantedItem[]> {
    return this.http.get<WantedItem[]>(this.apiUrl);
  }

  // สร้างโพสต์ตามหา (รับ Base64 String)
  createWantedItem(item: { title: string; description: string; imageUrl: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, item, { headers: this.getAuthHeaders() });
  }

  // ลบโพสต์ตามหา
  deleteWantedItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // แปลงไฟล์รูปภาพเป็น Base64
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
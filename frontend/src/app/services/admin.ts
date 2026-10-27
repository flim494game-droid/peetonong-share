import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminStats {
  usersCount: number;
  itemsCount: number;
  wantedCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ดึงข้อมูลสำหรับ Admin Dashboard
  getDashboardData(): Observable<{ stats: AdminStats; items: any[]; wanted: any[]; users: any[] }> {
    return this.http.get<{ stats: AdminStats; items: any[]; wanted: any[]; users: any[] }>(
      `${this.baseUrl}/dashboard`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ลบรายการสิ่งของ
  deleteItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/items/${id}`, { headers: this.getAuthHeaders() });
  }

  // ลบโพสต์ตามหา
  deleteWantedItem(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/wanted/${id}`, { headers: this.getAuthHeaders() });
  }

  // ลบผู้ใช้งาน
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, { headers: this.getAuthHeaders() });
  }
}
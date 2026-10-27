import { Injectable, inject } from '@angular/core';
import { Database, ref, object, list } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private db = inject(Database);

  getLiveData(): Observable<any> {
    const liveRef = ref(this.db, 'live_data');
    return object(liveRef);
  }

  getHealthLogs(): Observable<any[]> {
    const logsRef = ref(this.db, 'health_logs');
    return list(logsRef);
  }
}
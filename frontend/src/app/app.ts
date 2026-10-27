import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from './services/health.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private healthService = inject(HealthService);

  liveData: any = {};
  logs: any[] = [];

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Heart Rate (BPM)', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: true },
      { data: [], label: 'SpO2 (%)', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    animation: false
  };

  ngOnInit(): void {
    // อ่านค่า Real-time ล่าสุด
    this.healthService.getLiveData().subscribe(res => {
      if (res && res.snapshot && res.snapshot.val()) {
        this.liveData = res.snapshot.val();
      }
    });

    // อ่านประวัติย้อนหลังอัปเดตลงกราฟและตาราง
    this.healthService.getHealthLogs().subscribe(res => {
      if (res) {
        this.logs = res.map(item => item.snapshot.val());
        const last10 = this.logs.slice(-10);
        this.lineChartData.labels = last10.map((_, index) => `#${index + 1}`);
        this.lineChartData.datasets[0].data = last10.map(l => l.bpm);
        this.lineChartData.datasets[1].data = last10.map(l => l.spo2);
      }
    });
  }
}
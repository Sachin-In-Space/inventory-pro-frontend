import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export interface DashboardStats {
    productStats: {
        totalProducts: number;
        lowStockCount: number;
        outOfStockCount: number;
    };
    orderStats: {
        totalOrders: number;
        totalRevenue: number;
        statusCounts: { _id: string; count: number }[];
    };
}

export interface DailySales {
    _id: string;
    totalOrders: number;
    totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
    private http = inject(HttpClient);

    dashboardStats = signal<DashboardStats | null>(null);
    dailySales = signal<DailySales[]>([]);

    fetchDashboardStats() {
        this.http.get<{ success: boolean; data: DashboardStats }>(`${environment.apiUrl}/stats/dashboard`)
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.dashboardStats.set(res.data);
                    }
                },
                error: (err) => console.error('Failed to fetch dashboard stats', err)
            });
    }

    fetchDailySales(limit: number = 30) {
        this.http.get<{ success: boolean; data: DailySales[] }>(`${environment.apiUrl}/stats/daily-sales?limit=${limit}`)
            .subscribe({
                next: (res) => {
                    if (res.success) {
                        this.dailySales.set(res.data);
                    }
                },
                error: (err) => console.error('Failed to fetch daily sales', err)
            });
    }
}

import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../services/audit.service';
import { OrderService } from '../../services/order.service';
import { StatsService } from '../../services/stats.service';
import { AuditLog, Order } from '../../models/inventory.models';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class ReportsComponent {
  auditService = inject(AuditService);
  orderService = inject(OrderService);
  statsService = inject(StatsService);

  today = new Date();

  constructor() {
    this.statsService.fetchDailySales(30);
  }

  // Use StatsService data for visual charts or tables if needed, 
  // but keeping detailed list logic as is (filtering loaded orders/logs) for now 
  // since the view returns aggregate stats, not detailed lists.
  // We can use the view data for specific "Sales Charts".

  dailyProductUploads = computed(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.auditService.logs().filter(log =>
      log.action === 'Product Added' && log.timestamp >= startOfToday
    );
  });

  dailyOrders = computed(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.orderService.orders().filter(order => order.createdAt >= startOfToday);
  });

  monthlyStats = computed(() => {
    const startOfMonth = new Date(this.today.getFullYear(), this.today.getMonth(), 1);

    const monthlyOrders = this.orderService.orders().filter(order => order.createdAt >= startOfMonth);

    if (monthlyOrders.length === 0) {
      return { repeatBuyers: 0, totalBuyers: 0 };
    }

    const customerOrderCounts = monthlyOrders.reduce((acc, order) => {
      const phone = order.customerPhone;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalBuyers = Object.keys(customerOrderCounts).length;

    const repeatBuyers = Object.values(customerOrderCounts).filter(count => typeof count === 'number' && count > 1).length;

    return { repeatBuyers, totalBuyers };
  });
}

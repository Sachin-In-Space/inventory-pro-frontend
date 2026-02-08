
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order, OrderStatus } from '../models/inventory.models';
import { AuditService } from './audit.service';
import { UserService } from './user.service';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private _orders = signal<Order[]>([]);
  orders = this._orders.asReadonly();
  totalElements = signal(0);

  private http = inject(HttpClient);
  private auditService = inject(AuditService);
  private userService = inject(UserService);

  totalOrders = computed(() => this._orders().length);
  totalRevenue = computed(() =>
    this._orders()
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, order) => sum + order.totalAmount, 0)
  );

  constructor() {
    this.loadOrders();
  }

  loadOrders() {
    this.searchOrders({});
  }

  searchOrders(criteria: { query?: string, filters?: any, pageIndex?: number, pageSize?: number }) {
    this.http.post<{ success: boolean, data: Order[], count: number, total: number, totalElements: number }>(`${environment.apiUrl}/orders/search`, criteria)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._orders.set(response.data);
            this.totalElements.set(response.totalElements);
          }
        },
        error: (err) => console.error('Failed to search orders', err)
      });
  }

  createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'createdBy' | 'status'>) {
    // Calculate total amount (also verified on backend, but good for UI display if needed before response)
    const totalAmount = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrderPayload = {
      ...orderData,
      totalAmount,
      createdBy: this.userService.currentUser().name,
      status: 'ORDER-CREATED'
    };

    this.http.post<{ success: boolean, data: Order }>(`${environment.apiUrl}/orders`, newOrderPayload)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._orders.update(orders => [response.data, ...orders]);
            this.auditService.log(
              'Order Created',
              `Order #${response.data.id} created for ${response.data.customerName}.`,
              undefined,
              undefined,
              response.data.id
            );
          }
        },
        error: (err) => console.error('Failed to create order', err)
      });
  }

  updateOrderStatus(orderId: string, status: OrderStatus) {
    this.http.patch<{ success: boolean, data: Order }>(`${environment.apiUrl}/orders/${orderId}`, { status })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this._orders.update(orders =>
              orders.map(order => order.id === orderId ? response.data : order)
            );
            this.auditService.log('Order Status Updated', `Order #${orderId} status changed to ${status}.`, undefined, undefined, orderId);
          }
        },
        error: (err) => console.error('Failed to update order status', err)
      });
  }

  deleteOrder(orderId: string) {
    if (confirm('Are you sure you want to delete this order?')) {
      this.http.delete<{ success: boolean }>(`${environment.apiUrl}/orders/${orderId}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this._orders.update(orders => orders.filter(o => o.id !== orderId));
              this.auditService.log('Order Deleted', `Order #${orderId} was deleted.`, undefined, undefined, orderId);
            }
          },
          error: (err) => console.error('Failed to delete order', err)
        });
    }
  }
}

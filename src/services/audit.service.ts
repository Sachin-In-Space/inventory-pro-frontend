
import { Injectable, signal, inject } from '@angular/core';
import { AuditLog } from '../models/inventory.models';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private _logs = signal<AuditLog[]>([]);
  logs = this._logs.asReadonly();

  private userService = inject(UserService);

  constructor() {
    this.log('System', 'Inventory Pro application initialized.');
  }

  log(action: string, details: string, productId?: string, productName?: string, orderId?: string) {
    const newLog: AuditLog = {
      id: Date.now(),
      timestamp: new Date(),
      user: this.userService.currentUser().name,
      action,
      details,
      productId,
      productName,
      orderId
    };
    this._logs.update(logs => [newLog, ...logs]);
  }
}

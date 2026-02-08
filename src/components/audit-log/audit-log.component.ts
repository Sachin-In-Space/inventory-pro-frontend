
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DatePipe],
})
export class AuditLogComponent {
  constructor(public auditService: AuditService) { }
}

import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between border-t border-border-light dark:border-border-dark px-4 py-3 sm:px-6">
      <!-- Mobile Pagination -->
      <div class="flex flex-1 justify-between sm:hidden">
        <button 
          (click)="onPageChange(currentPage - 1)" 
          [disabled]="currentPage === 0"
          class="relative inline-flex items-center rounded-lg border border-border-light dark:border-border-dark bg-card dark:bg-base-dark px-4 py-2 text-sm font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Previous
        </button>
        <button 
          (click)="onPageChange(currentPage + 1)" 
          [disabled]="(currentPage + 1) * pageSize >= totalElements"
          class="relative ml-3 inline-flex items-center rounded-lg border border-border-light dark:border-border-dark bg-card dark:bg-base-dark px-4 py-2 text-sm font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed">
          Next
        </button>
      </div>
      
      <!-- Desktop Pagination -->
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-text-muted dark:text-text-muted-dark">
            Showing
            <span class="font-medium text-text-main dark:text-text-dark">{{ startItem }}</span>
            to
            <span class="font-medium text-text-main dark:text-text-dark">{{ endItem }}</span>
            of
            <span class="font-medium text-text-main dark:text-text-dark">{{ totalElements }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex gap-2" aria-label="Pagination">
            <button 
              (click)="onPageChange(currentPage - 1)"
              [disabled]="currentPage === 0"
              class="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-base-200 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span class="sr-only">Previous</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            @for (page of pages; track page) {
               <button 
                (click)="onPageChange(page)"
                [class.bg-primary]="page === currentPage"
                [class.text-white]="page === currentPage"
                [class.border-transparent]="page === currentPage"
                [class.hover:bg-primary-dark]="page === currentPage"
                [class.text-text-main]="page !== currentPage"
                [class.dark:text-text-dark]="page !== currentPage"
                [class.hover:bg-gray-100]="page !== currentPage"
                [class.dark:hover:bg-base-200]="page !== currentPage"
                class="relative inline-flex items-center justify-center w-9 h-9 text-sm font-semibold rounded-lg focus:z-20 focus:outline-offset-0 transition-colors">
                {{ page + 1 }}
              </button>
            }

            <button 
              (click)="onPageChange(currentPage + 1)"
               [disabled]="(currentPage + 1) * pageSize >= totalElements"
              class="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-text-muted dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-base-200 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <span class="sr-only">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 0;
  @Input() pageSize = 10;
  @Input() totalElements = 0;
  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];
  startItem = 0;
  endItem = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateRange();
    this.generatePageNumbers();
  }

  calculateRange() {
    if (this.totalElements === 0) {
      this.startItem = 0;
      this.endItem = 0;
      return;
    }
    this.startItem = this.currentPage * this.pageSize + 1;
    this.endItem = Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  generatePageNumbers() {
    const totalPages = Math.ceil(this.totalElements / this.pageSize);
    // Simple logic: show all pages if <= 7, otherwise simplified window
    // For now, let's keep it simple max 5 pages around current
    this.pages = [];

    // Logic to show a window of pages can be complex, simplifying for now
    // Showing max 5 pages
    let startPage = Math.max(0, this.currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + 4);

    // Adjust start if end is hitting max
    startPage = Math.max(0, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  onPageChange(page: number) {
    if (page >= 0 && page < Math.ceil(this.totalElements / this.pageSize)) {
      this.pageChange.emit(page);
    }
  }
}

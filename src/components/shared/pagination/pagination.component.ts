import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-base-300 px-4 py-3 sm:px-6">
      <div class="flex flex-1 justify-between sm:hidden">
        <button 
          (click)="onPageChange(currentPage - 1)" 
          [disabled]="currentPage === 0"
          class="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-base-200 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-base-100 disabled:opacity-50">
          Previous
        </button>
        <button 
          (click)="onPageChange(currentPage + 1)" 
          [disabled]="(currentPage + 1) * pageSize >= totalElements"
          class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-base-200 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-base-100 disabled:opacity-50">
          Next
        </button>
      </div>
      
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing
            <span class="font-medium">{{ startItem }}</span>
            to
            <span class="font-medium">{{ endItem }}</span>
            of
            <span class="font-medium">{{ totalElements }}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button 
              (click)="onPageChange(currentPage - 1)"
              [disabled]="currentPage === 0"
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-base-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span class="sr-only">Previous</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <!-- Simple Page Numbers Logic (can be expanded) -->
            @for (page of pages; track page) {
               <button 
                (click)="onPageChange(page)"
                [class.bg-primary]="page === currentPage"
                [class.text-white]="page === currentPage"
                [class.text-gray-900]="page !== currentPage"
                [class.dark:text-white]="page !== currentPage && page !== currentPage" 
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-base-100 focus:z-20 focus:outline-offset-0">
                {{ page + 1 }}
              </button>
            }

            <button 
              (click)="onPageChange(currentPage + 1)"
               [disabled]="(currentPage + 1) * pageSize >= totalElements"
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-base-100 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span class="sr-only">Next</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
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

import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative">
      <input 
        [type]="type()" 
        [id]="id()" 
        [formControl]="control()" 
        placeholder=" "
        class="block px-3.5 pb-2.5 pt-5 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-primary focus:outline-none focus:ring-0 focus:border-primary peer"
      />
      <label 
        [for]="id()" 
        class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 peer-focus:text-primary dark:peer-focus:text-primary"
      >
        {{ label() }}
      </label>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent {
  control = input.required<FormControl<any>>();
  label = input.required<string>();
  type = input<string>('text');
  id = computed(() => 'input-' + this.label().toLowerCase().replace(/\s/g, '-'));
}

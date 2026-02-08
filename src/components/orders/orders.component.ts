import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Order, OrderItem, OrderStatus, Product, ProductVariant } from '../../models/inventory.models';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { UserService } from '../../services/user.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { InputComponent } from '../shared/input/input.component';


import { PaginationComponent } from '../shared/pagination/pagination.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputComponent, PaginationComponent],
})
export class OrdersComponent {
  orderService = inject(OrderService);
  productService = inject(ProductService);
  userService = inject(UserService);
  private fb: FormBuilder = inject(FormBuilder);

  showModal = signal(false);
  showFilters = signal(false);
  currentStep = signal(1);
  showCartInStep1 = signal(false);
  viewingOrder = signal<Order | null>(null);
  orderSearchTerm = signal('');

  // Customer suggestions
  showCustomerSuggestions = signal(false);

  // New filter signals
  filterStatus = signal<OrderStatus | 'all'>('all');
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');

  selectedUnits = signal<{ [productId: string]: string }>({});

  showSnackbar = signal(false);
  snackbarMessage = signal('');

  cart = signal<OrderItem[]>([]);

  customerForm = this.fb.group({
    customerName: ['', Validators.required],
    customerAddress: ['', Validators.required],
    customerPhone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
  });

  productSearchCtrl = new FormControl('');
  productSearchTerm = toSignal(this.productSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });
  customerNameSearch = toSignal(this.customerForm.controls.customerName.valueChanges.pipe(startWith('')), { initialValue: '' });

  // Form control getters for cleaner template binding
  get customerNameCtrl() { return this.customerForm.controls.customerName; }
  get customerAddressCtrl() { return this.customerForm.controls.customerAddress; }
  get customerPhoneCtrl() { return this.customerForm.controls.customerPhone; }


  cartTotal = computed(() => this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0));

  cartItemMap = computed(() => {
    const map = new Map<string, OrderItem>();
    for (const item of this.cart()) {
      map.set(`${item.productId}-${item.variantUnit}`, item);
    }
    return map;
  });

  availableProducts = computed(() => {
    const term = (this.productSearchTerm() ?? '').toLowerCase();
    return this.productService.products().filter(p =>
      p.status === 'Active' &&
      p.name.toLowerCase().includes(term)
    );
  });

  suggestedCustomers = computed(() => {
    const term = (this.customerNameSearch() ?? '').toLowerCase();
    if (term.length < 2) {
      return [];
    }
    const uniqueCustomers = new Map<string, Order>();
    // Search through orders to find customers
    this.orderService.orders()
      .filter(o =>
        o.customerName.toLowerCase().includes(term) ||
        o.customerPhone.includes(term)
      )
      // Use a map to ensure each customer appears only once
      .forEach(o => {
        if (!uniqueCustomers.has(o.customerPhone)) {
          uniqueCustomers.set(o.customerPhone, o);
        }
      });
    return Array.from(uniqueCustomers.values()).slice(0, 5); // Limit to 5 suggestions
  });

  // Pagination signals
  pageIndex = signal(0);
  pageSize = signal(10); // Default to 10 items per page

  isAnyFilterActive = computed(() => {
    return this.orderSearchTerm() !== '' ||
      this.filterStatus() !== 'all' ||
      this.filterDateFrom() !== '' ||
      this.filterDateTo() !== '';
  });

  // Effect to trigger search when filters change
  constructor() {
    effect(() => {
      const query = this.orderSearchTerm();
      const status = this.filterStatus();
      const dateFrom = this.filterDateFrom();
      const dateTo = this.filterDateTo();
      const pageIndex = this.pageIndex();
      const pageSize = this.pageSize();

      const filters: any = {};

      if (status !== 'all') {
        filters.status = status;
      }

      if (dateFrom && dateFrom === dateTo) {
        filters.date = dateFrom;
      } else {
        if (dateFrom) filters.startDate = dateFrom;
        if (dateTo) filters.endDate = dateTo;
      }

      // Add user phone filter if needed for non-admins?
      // For now, keep it simple as per request.

      // Debounce search
      const timeoutId = setTimeout(() => {
        this.orderService.searchOrders({
          query,
          filters,
          pageIndex,
          pageSize
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    });

    effect(() => {
      const prods = this.availableProducts();
      const currentSelection = this.selectedUnits();
      const newSelection: { [productId: string]: string } = {};

      prods.forEach(p => {
        if (p.variants.length > 0) {
          const currentUnit = currentSelection[p.id];
          const currentVariant = p.variants.find(v => v.unit === currentUnit);

          if (currentVariant && this.getAvailableStock(p, currentVariant) > 0) {
            newSelection[p.id] = currentVariant.unit;
          } else {
            const firstAvailableVariant = p.variants.find(v => this.getAvailableStock(p, v) > 0);
            if (firstAvailableVariant) {
              newSelection[p.id] = firstAvailableVariant.unit;
            } else {
              newSelection[p.id] = p.variants[0].unit;
            }
          }
        }
      });

      if (JSON.stringify(newSelection) !== JSON.stringify(this.selectedUnits())) {
        this.selectedUnits.set(newSelection);
      }
    }, { allowSignalWrites: true });
  }

  private getEquivalentInGrams(unit: string): number {
    const u = unit.toLowerCase().trim();
    if (u === '1kg' || u === '1 kg') return 1000;
    if (u === '500gm' || u === '500 gm' || u === '500g') return 500;
    if (u === '250gm' || u === '250 gm' || u === '250g') return 250;
    if (u === '1 litre' || u === '1 l') return 1000;
    if (u === '500ml' || u === '500 ml') return 500;

    // fallback parsing logic
    const match = u.match(/^(\d+)\s*(kg|g|gm|l|ml)$/);
    if (match) {
      const val = parseInt(match[1]);
      const type = match[2];
      if (type === 'kg' || type === 'l') return val * 1000;
      return val;
    }
    return 0;
  }

  getAvailableStock(p: Product, v: ProductVariant | undefined): number {
    if (!v) return 0;
    const grams = this.getEquivalentInGrams(v.unit);
    if (grams <= 0) return 0;
    return Math.floor(p.totalStockGrams / grams);
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  onSearchTermChange(event: Event) {
    this.orderSearchTerm.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  onStatusChange(event: Event) {
    this.filterStatus.set((event.target as HTMLSelectElement).value as OrderStatus | 'all');
    this.pageIndex.set(0);
  }

  onPageChange(page: number) {
    this.pageIndex.set(page);
  }

  clearFilters() {
    this.orderSearchTerm.set('');
    this.filterStatus.set('all');
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
  }

  openModal() {
    this.cart.set([]);
    this.customerForm.reset();
    this.productSearchCtrl.setValue('');
    this.currentStep.set(1);
    this.showCartInStep1.set(false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  nextStep() {
    this.currentStep.update(s => s + 1);
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
  }

  toggleCartVisibility() {
    this.showCartInStep1.update(v => !v);
  }

  selectUnit(productId: number, unit: string) {
    this.selectedUnits.update(units => ({ ...units, [productId]: unit }));
  }

  getSelectedVariantByUnit(product: Product): ProductVariant | undefined {
    const selectedUnit = this.selectedUnits()[product.id];
    if (!selectedUnit) return product.variants.length > 0 ? product.variants[0] : undefined;
    return product.variants.find(v => v.unit === selectedUnit);
  }

  addToCart(product: Product) {
    const selectedVariant = this.getSelectedVariantByUnit(product);
    if (!selectedVariant || this.getAvailableStock(product, selectedVariant) <= 0) return;

    const existingItem = this.cart().find(item => item.productId === product.id && item.variantUnit === selectedVariant.unit);

    if (existingItem) {
      if (existingItem.quantity < this.getAvailableStock(product, selectedVariant)) {
        this.cart.update(items => items.map(item =>
          (item.productId === product.id && item.variantUnit === selectedVariant.unit)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        this.snackbarMessage.set(`Stock limit reached for ${product.name}`);
        this.showSnackbar.set(true);
        setTimeout(() => this.showSnackbar.set(false), 3000);
      }
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: selectedVariant.sellingPrice,
        variantUnit: selectedVariant.unit,
        imageUrl: product.imageUrl
      };
      this.cart.update(items => [...items, newItem]);
    }
  }

  decrementCartItem(product: Product) {
    const selectedVariant = this.getSelectedVariantByUnit(product);
    if (!selectedVariant) return;

    const cartItem = this.cartItemMap().get(`${product.id}-${selectedVariant.unit}`);
    if (cartItem) {
      this.decrementQuantity(cartItem);
    }
  }

  removeFromCart(productId: string, variantUnit: string) {
    this.cart.update(items => items.filter(item => !(item.productId === productId && item.variantUnit === variantUnit)));
  }

  incrementQuantity(item: OrderItem) {
    const product = this.productService.products().find(p => p.id === item.productId);
    if (!product) return;
    const variant = product.variants.find(v => v.unit === item.variantUnit);
    if (!variant) return;

    const stockLimit = this.getAvailableStock(product, variant);

    if (item.quantity < stockLimit) {
      this.cart.update(items => items.map(i =>
        (i.productId === item.productId && i.variantUnit === item.variantUnit)
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      this.snackbarMessage.set(`Stock limit of ${stockLimit} reached for ${item.productName}.`);
      this.showSnackbar.set(true);
      setTimeout(() => this.showSnackbar.set(false), 3000);
    }
  }

  decrementQuantity(item: OrderItem) {
    this.cart.update(items => {
      const currentItem = items.find(i => i.productId === item.productId && i.variantUnit === item.variantUnit);
      if (currentItem && currentItem.quantity > 1) {
        return items.map(i =>
          (i.productId === item.productId && i.variantUnit === item.variantUnit)
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      } else {
        return items.filter(i => !(i.productId === item.productId && i.variantUnit === item.variantUnit));
      }
    });
  }

  createOrder() {
    if (this.customerForm.invalid || this.cart().length === 0) {
      alert('Please fill in all customer details and add at least one item to the cart.');
      return;
    }

    this.orderService.createOrder({
      ...this.customerForm.value as { customerName: string; customerAddress: string; customerPhone: string; },
      items: this.cart()
    });

    this.closeModal();
    this.snackbarMessage.set(`Order placed successfully!`);
    this.showSnackbar.set(true);
    setTimeout(() => this.showSnackbar.set(false), 3000);
  }

  selectCustomer(customer: Order) {
    this.customerForm.patchValue({
      customerName: customer.customerName,
      customerAddress: customer.customerAddress,
      customerPhone: customer.customerPhone
    });
    this.showCustomerSuggestions.set(false);
  }

  hideSuggestions() {
    // Use a small delay to allow click events on suggestions to register
    setTimeout(() => this.showCustomerSuggestions.set(false), 200);
  }

  updateStatus(order: Order, newStatus: OrderStatus) {
    if (this.userService.hasPermission('updateOrderStatus')) {
      this.orderService.updateOrderStatus(order.id, newStatus);
    }
  }

  deleteOrder(order: Order) {
    if (this.userService.hasPermission('manageOrders') && confirm(`Are you sure you want to delete Order #${order.id}? This will restore stock.`)) {
      this.orderService.deleteOrder(order.id);
    }
  }

  getStatusColor(status: OrderStatus) {
    switch (status) {
      case 'ORDER-CREATED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'IN-DELIVERY': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
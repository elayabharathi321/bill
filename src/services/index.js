// Service layer exports.
// UI components should import services from here (or directly from a service
// module) so API endpoints stay isolated and swappable for Spring Boot later.
export * as api from './api';
export * as authService from './authService';
export * as productService from './productService';
export * as categoryService from './categoryService';
export * as inventoryService from './inventoryService';
export * as customerService from './customerService';
export * as supplierService from './supplierService';
export * as purchaseService from './purchaseService';
export * as invoiceService from './invoiceService';
export * as paymentService from './paymentService';
export * as returnService from './returnService';
export * as reportService from './reportService';
export * as userService from './userService';
export * as notificationService from './notificationService';
export * as auditLogService from './auditLogService';
export * as settingsService from './settingsService';
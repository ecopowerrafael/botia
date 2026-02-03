// Shared enums exported from Prisma schema
// These are duplicated here for TypeScript compilation since Prisma client may not export them

export enum AudioStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum VendorMode {
  SELLER = 'SELLER',
  SERVICE = 'SERVICE',
  SUPPORT = 'SUPPORT',
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  VIEWER = 'VIEWER',
  VENDOR = 'VENDOR',
  ATTENDANT = 'ATTENDANT',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  PENDING_ONBOARDING = 'PENDING_ONBOARDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

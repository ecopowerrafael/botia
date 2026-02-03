export declare enum AudioStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum OrderStatus {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum VendorMode {
    SELLER = "SELLER",
    SERVICE = "SERVICE",
    SUPPORT = "SUPPORT"
}
export declare enum UserRole {
    SUPERADMIN = "SUPERADMIN",
    ADMIN = "ADMIN",
    AGENT = "AGENT",
    VIEWER = "VIEWER",
    VENDOR = "VENDOR",
    ATTENDANT = "ATTENDANT",
    CUSTOMER = "CUSTOMER"
}
export declare enum UserStatus {
    PENDING_ONBOARDING = "PENDING_ONBOARDING",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED"
}

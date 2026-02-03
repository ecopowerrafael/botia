"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.UserRole = exports.VendorMode = exports.PaymentStatus = exports.OrderStatus = exports.AudioStatus = void 0;
var AudioStatus;
(function (AudioStatus) {
    AudioStatus["PENDING"] = "PENDING";
    AudioStatus["PROCESSING"] = "PROCESSING";
    AudioStatus["COMPLETED"] = "COMPLETED";
    AudioStatus["FAILED"] = "FAILED";
})(AudioStatus || (exports.AudioStatus = AudioStatus = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["DRAFT"] = "DRAFT";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["COMPLETED"] = "COMPLETED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var VendorMode;
(function (VendorMode) {
    VendorMode["SELLER"] = "SELLER";
    VendorMode["SERVICE"] = "SERVICE";
    VendorMode["SUPPORT"] = "SUPPORT";
})(VendorMode || (exports.VendorMode = VendorMode = {}));
var UserRole;
(function (UserRole) {
    UserRole["SUPERADMIN"] = "SUPERADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["AGENT"] = "AGENT";
    UserRole["VIEWER"] = "VIEWER";
    UserRole["VENDOR"] = "VENDOR";
    UserRole["ATTENDANT"] = "ATTENDANT";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING_ONBOARDING"] = "PENDING_ONBOARDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
//# sourceMappingURL=enums.js.map
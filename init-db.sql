-- Phase 1 Tables Creation

-- UserStatus enum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_ONBOARDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- UserRole enum expansion
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'AGENT', 'VIEWER', 'VENDOR', 'ATTENDANT', 'CUSTOMER');

-- VendorMode enum
CREATE TYPE "VendorMode" AS ENUM ('SELLER', 'SERVICE', 'SUPPORT');

-- OrderStatus enum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');

-- AudioStatus enum
CREATE TYPE "AudioStatus" AS ENUM ('RECEIVED', 'CONVERTING', 'TRANSCRIBED', 'TRANSCRIPTION_FAILED', 'PROCESSING_ERROR', 'PROCESSED');

-- UserPreferences table
CREATE TABLE "UserPreferences" (
    "userId" TEXT NOT NULL,
    "operationMode" "VendorMode" NOT NULL DEFAULT 'SELLER',
    "audioEnabled" BOOLEAN NOT NULL DEFAULT true,
    "audioLanguage" VARCHAR(5) NOT NULL DEFAULT 'pt-BR',
    "audioSpeed" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "language" VARCHAR(5) NOT NULL DEFAULT 'pt-BR',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId")
);

-- Order table
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "chatId" TEXT,
    "contactId" TEXT,
    "vendorId" TEXT,
    "vendorOrderNumber" VARCHAR(20),
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "sentToVendor" BOOLEAN NOT NULL DEFAULT false,
    "sentToVendorAt" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "invoiceData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- OrderItem table
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "productSourceId" VARCHAR(255),
    "productSource" VARCHAR(50) NOT NULL DEFAULT 'LOCAL',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- PaymentProof table
CREATE TABLE "PaymentProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "proofType" VARCHAR(50) NOT NULL,
    "proofUrl" TEXT NOT NULL,
    "proofData" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentProof_orderId_key" UNIQUE ("orderId")
);

-- AudioMessage table
CREATE TABLE "AudioMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT,
    "contactId" TEXT,
    "audioPath" TEXT NOT NULL,
    "mimeType" VARCHAR(50) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "duration" DECIMAL(10,2),
    "status" "AudioStatus" NOT NULL DEFAULT 'RECEIVED',
    "transcript" TEXT,
    "transcriptConfidence" DECIMAL(3,2),
    "transcribedAt" TIMESTAMP(3),
    "transcriptionTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioMessage_pkey" PRIMARY KEY ("id")
);

-- TTSCache table
CREATE TABLE "TTSCache" (
    "id" TEXT NOT NULL,
    "textHash" VARCHAR(64) NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "audioPath" TEXT NOT NULL,
    "audioUrl" TEXT,
    "duration" DECIMAL(10,2),
    "provider" VARCHAR(50) NOT NULL DEFAULT 'OLLAMA',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TTSCache_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TTSCache_textHash_language_key" UNIQUE ("textHash", "language")
);

-- TenantWhatsAppConfig table
CREATE TABLE "TenantWhatsAppConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorPhoneNumber" VARCHAR(20),
    "vendorPhoneName" VARCHAR(255),
    "autoSendOrder" BOOLEAN NOT NULL DEFAULT false,
    "includePaymentProof" BOOLEAN NOT NULL DEFAULT false,
    "invoiceTemplate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantWhatsAppConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TenantWhatsAppConfig_tenantId_key" UNIQUE ("tenantId")
);

-- Create indexes
CREATE INDEX "Order_tenantId_paymentStatus_idx" ON "Order"("tenantId", "paymentStatus");
CREATE INDEX "Order_vendorId_idx" ON "Order"("vendorId");
CREATE INDEX "Order_chatId_idx" ON "Order"("chatId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "AudioMessage_chatId_idx" ON "AudioMessage"("chatId");
CREATE INDEX "AudioMessage_contactId_idx" ON "AudioMessage"("contactId");
CREATE INDEX "AudioMessage_status_idx" ON "AudioMessage"("status");
CREATE INDEX "TTSCache_language_expiresAt_idx" ON "TTSCache"("language", "expiresAt");

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "Publication" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('CONTACT', 'PROPERTY', 'VIEWING', 'QUOTATION', 'CONSULTATION');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "csrfToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "status" "Publication" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "location" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(16,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "transaction" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DOUBLE PRECISION,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "specs" JSONB NOT NULL DEFAULT '{}',
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryImage" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "mediaId" TEXT,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EntryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRequest" (
    "id" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "service" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "quantities" TEXT NOT NULL DEFAULT '',
    "preferredDate" TIMESTAMP(3),
    "entryId" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "followUpAt" TIMESTAMP(3),
    "notificationStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folder" TEXT NOT NULL DEFAULT 'general',
    "alt" TEXT NOT NULL DEFAULT '',
    "bytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Category_kind_slug_key" ON "Category"("kind", "slug");

-- CreateIndex
CREATE INDEX "Entry_kind_status_featured_idx" ON "Entry"("kind", "status", "featured");

-- CreateIndex
CREATE INDEX "Entry_location_transaction_price_idx" ON "Entry"("location", "transaction", "price");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_kind_slug_key" ON "Entry"("kind", "slug");

-- CreateIndex
CREATE INDEX "EntryImage_entryId_position_idx" ON "EntryImage"("entryId", "position");

-- CreateIndex
CREATE INDEX "CustomerRequest_kind_status_createdAt_idx" ON "CustomerRequest"("kind", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryImage" ADD CONSTRAINT "EntryImage_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryImage" ADD CONSTRAINT "EntryImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "CustomerRequest_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

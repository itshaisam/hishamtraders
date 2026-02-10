# Story 8.5: Barcode Scanning for Inventory Operations

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft -- Phase 2 (v2.0 -- Revised)

---

## User Story

**As a** warehouse manager,
**I want** to scan barcodes/QR codes for products and stock operations,
**So that** data entry is faster and more accurate.

---

## Acceptance Criteria

1. **Database Schema (NEW fields on Product):**
   - [ ] Product table expanded: barcode (String? @unique), barcodeFormat (String? @default('CODE128')), qrCode (String?)
   - [ ] These fields DO NOT currently exist on the Product model and require a Prisma migration

2. **Backend API:**
   - [ ] PUT /api/v1/products/:id/barcode - updates product barcode
   - [ ] GET /api/v1/products/by-barcode/:barcode - searches product by barcode
   - [ ] Barcode formats supported: EAN-13 (13 digits), UPC-A (12 digits), Code 128 (6+ printable ASCII), QR Code (any string)
   - [ ] Default format: Code 128
   - [ ] Validates barcode format before update (must match selected format spec)
   - [ ] Prevents duplicate barcode assignment across products

3. **Workflows with Barcode Scanning:**
   - [ ] **Stock receiving:** Scan -> auto-populate product -> enter quantity -> repeat -> submit
   - [ ] **Sales invoice:** Scan -> auto-add product -> enter quantity -> repeat -> complete
   - [ ] **Inventory lookup:** Scan -> display product details with current stock
   - [ ] **Stock adjustment:** Scan -> auto-populate product -> enter adjustment quantity

4. **Frontend - Barcode Scanner Modal:**
   - [ ] Camera preview (if using device camera)
   - [ ] "Scan" button
   - [ ] Manual barcode entry fallback
   - [ ] Detected barcode display

5. **Barcode Generation:**
   - [ ] Product form includes "Generate Barcode" button (auto-generates Code 128)
   - [ ] Product detail page displays barcode image (if exists)
   - [ ] Uses jsbarcode (frontend) or bwip-js (backend)

6. **Authorization:**
   - [ ] Warehouse Manager and Admin can manage barcodes

7. **Audit Trail:**
   - [ ] Barcode scanning events logged in audit trail

---

## Dev Notes

### Schema Changes Required (NEW fields -- must add via migration)

> **IMPORTANT:** The Product model currently has NO barcode-related fields. The fields below are NEW additions that require a Prisma migration (`npx prisma migrate dev`).

Current Product model fields: `id, sku, name, categoryId, brandId, uomId, hasVariants, costPrice, sellingPrice, reorderLevel, binLocation, status, createdAt, updatedAt, createdBy, updatedBy`

Add these fields:

```prisma
model Product {
  // ... all existing fields remain unchanged ...

  // NEW barcode fields (Story 8.5)
  barcode       String?  @unique
  barcodeFormat String?  @default("CODE128")  // EAN13, UPC_A, CODE128, QR_CODE
  qrCode        String?

  // ... existing relations remain unchanged ...
}
```

### Barcode Format Support

```typescript
enum BarcodeFormat {
  EAN13 = 'EAN13',
  UPC_A = 'UPC_A',
  CODE128 = 'CODE128',
  QR_CODE = 'QR_CODE'
}

async function getProductByBarcode(barcode: string): Promise<Product | null> {
  // Product has `category` (via categoryId) and `inventory` relations
  return await prisma.product.findFirst({
    where: { barcode },
    include: {
      category: true,
      inventory: true
    }
  });
}

async function updateProductBarcode(
  productId: string,
  barcode: string,
  format: BarcodeFormat = BarcodeFormat.CODE128,
  userId: string
): Promise<Product> {
  // Validate format
  if (!Object.values(BarcodeFormat).includes(format)) {
    throw new BadRequestError('Unsupported barcode format');
  }

  // Validate barcode format-specific rules
  const validationRules: Record<BarcodeFormat, RegExp> = {
    [BarcodeFormat.EAN13]: /^\d{13}$/, // 13 digits
    [BarcodeFormat.UPC_A]: /^\d{12}$/, // 12 digits
    [BarcodeFormat.CODE128]: /^[!-~]{6,}$/, // 6+ printable ASCII
    [BarcodeFormat.QR_CODE]: /^.+$/ // Any non-empty string
  };

  if (!validationRules[format].test(barcode)) {
    throw new BadRequestError(
      `Invalid barcode format for ${format}. Expected: ${getFormatSpec(format)}`
    );
  }

  // Check uniqueness (prevent duplicate barcode assignment)
  const existing = await prisma.product.findFirst({
    where: {
      barcode,
      id: { not: productId }
    }
  });

  if (existing) {
    throw new BadRequestError(
      `Barcode already assigned to product: ${existing.name}`
    );
  }

  // Update barcode
  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      barcode,
      barcodeFormat: format
    }
  });

  // Log barcode change in audit trail using AuditService
  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'Product',
    entityId: productId,
    notes: `Barcode updated: ${barcode} (format: ${format})`
  });

  return updated;
}

function getFormatSpec(format: BarcodeFormat): string {
  const specs: Record<BarcodeFormat, string> = {
    [BarcodeFormat.EAN13]: '13 digits (e.g., 5901234123457)',
    [BarcodeFormat.UPC_A]: '12 digits (e.g., 036000291452)',
    [BarcodeFormat.CODE128]: '6+ printable ASCII characters (e.g., ABC123DEF456)',
    [BarcodeFormat.QR_CODE]: 'Any string, typically used for links or complex data'
  };
  return specs[format];
}

function isValidBarcode(barcode: string, format?: BarcodeFormat): boolean {
  if (!format) format = BarcodeFormat.CODE128; // Default

  const validationRules: Record<BarcodeFormat, RegExp> = {
    [BarcodeFormat.EAN13]: /^\d{13}$/,
    [BarcodeFormat.UPC_A]: /^\d{12}$/,
    [BarcodeFormat.CODE128]: /^[!-~]{6,}$/,
    [BarcodeFormat.QR_CODE]: /^.+$/
  };

  return validationRules[format].test(barcode);
}
```

**Frontend - Barcode Scanner:**

> **New dependency required:** `@zxing/library` -- a JavaScript barcode/QR code reader. Must be added: `npm install @zxing/library` in the `apps/web` package.
> `Modal` and `Input` components exist and can be used directly.
> Use `apiClient` from `@/lib/api-client` (axios). Do NOT use raw `fetch()`.

```tsx
import { FC, useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export const BarcodeScannerModal: FC<{
  onDetected: (barcode: string) => void;
  onClose: () => void;
}> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    if (scanning && videoRef.current) {
      codeReader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            onDetected(result.getText());
            setScanning(false);
            toast.success(`Barcode detected: ${result.getText()}`);
          }
        }
      );
    }

    return () => {
      codeReader.reset();
    };
  }, [scanning]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onDetected(manualInput.trim());
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Scan Barcode</h2>

      {scanning ? (
        <div>
          <video ref={videoRef} className="w-full rounded" />
          <Button
            className="mt-2"
            variant="outline"
            onClick={() => setScanning(false)}
          >
            Stop Scanning
          </Button>
        </div>
      ) : (
        <Button onClick={() => setScanning(true)}>Start Camera</Button>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Or enter manually:
        </label>
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter barcode..."
          />
          <Button onClick={handleManualSubmit}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
};

// Example: Using the scanner in a stock receiving workflow
const StockReceivingWithScanner: FC = () => {
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeDetected = async (barcode: string) => {
    try {
      const { data: product } = await apiClient.get(
        `/products/by-barcode/${encodeURIComponent(barcode)}`
      );
      if (product) {
        // Auto-populate product in the receiving form
        toast.success(`Found: ${product.name}`);
        setShowScanner(false);
        // ... add product to receiving list
      }
    } catch (error) {
      toast.error('Product not found for this barcode');
    }
  };

  return (
    <>
      <Button onClick={() => setShowScanner(true)}>Scan Barcode</Button>
      {showScanner && (
        <BarcodeScannerModal
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
};
```

---

### Key Corrections (from v1.0)

1. **API path:** Changed `/api/products/` to `/api/v1/products/` to match the project's API base URL convention.
2. **`auditLogger.log()` replaced with `AuditService.log()`:** The actual service is `AuditService` with static method `log()`. It accepts `{ userId, action, entityType, entityId?, notes? }` -- NOT `resource`, `resourceId`, `details`.
3. **`action: 'UPDATE_BARCODE'` replaced with `action: 'UPDATE'`:** The `AuditService` only accepts: `CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT | PERMISSION_CHECK`. Custom action strings are invalid. Barcode context is recorded in the `notes` field instead.
4. **Product schema fields clearly marked as NEW:** The Product model currently has NO `barcode`, `barcodeFormat`, or `qrCode` fields. The v1.0 document presented them as existing schema, which is misleading. Explicitly marked these as requiring a new Prisma migration, and listed the current Product fields for clarity.
5. **`findUnique` changed to `findFirst` for barcode lookup:** Since `barcode` is a new field not yet in the schema, `findUnique` with `where: { barcode }` would fail until the unique constraint is added. Using `findFirst` is safer during development; switch to `findUnique` after the migration adds the `@unique` constraint.
6. **`@zxing/library` noted as new dependency:** This package is not currently installed. Added explicit note to install it in the `apps/web` package.
7. **Product relations verified:** `Product` -> `category` (via `categoryId` -> `ProductCategory`) and `Product` -> `inventory` (Inventory[]) are confirmed correct relations in the schema. The `include: { category: true, inventory: true }` pattern is valid.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: corrected API paths, fixed AuditService call signature, clearly marked barcode fields as new schema additions, noted @zxing/library dependency, added apiClient usage | Claude (Tech Review) |

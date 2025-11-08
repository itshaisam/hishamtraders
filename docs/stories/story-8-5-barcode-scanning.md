# Story 8.5: Barcode Scanning for Inventory Operations

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to scan barcodes/QR codes for products and stock operations,
**So that** data entry is faster and more accurate.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Product table expanded: barcode (unique, nullable), qrCode (nullable)

2. **Backend API:**
   - [ ] PUT /api/products/:id/barcode - updates product barcode
   - [ ] GET /api/products/by-barcode/:barcode - searches product by barcode
   - [ ] Barcode formats supported: EAN-13 (13 digits), UPC-A (12 digits), Code 128 (6+ printable ASCII), QR Code (any string)
   - [ ] Default format: Code 128
   - [ ] Validates barcode format before update (must match selected format spec)
   - [ ] Prevents duplicate barcode assignment across products

3. **Workflows with Barcode Scanning:**
   - [ ] **Stock receiving:** Scan → auto-populate product → enter quantity → repeat → submit
   - [ ] **Sales invoice:** Scan → auto-add product → enter quantity → repeat → complete
   - [ ] **Inventory lookup:** Scan → display product details with current stock
   - [ ] **Stock adjustment:** Scan → auto-populate product → enter adjustment quantity

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

```prisma
model Product {
  // ... existing fields
  barcode       String?  @unique
  barcodeFormat String?  @default('CODE128')
  qrCode        String?

  // ... relations
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
  return await prisma.product.findUnique({
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

  // Log barcode change in audit trail
  await auditLogger.log({
    action: 'UPDATE_BARCODE',
    userId,
    resource: 'Product',
    resourceId: productId,
    details: { barcode, format }
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
```tsx
import { FC, useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

export const BarcodeScannerModal: FC<{
  onDetected: (barcode: string) => void;
}> = ({ onDetected }) => {
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
          }
        }
      );
    }

    return () => {
      codeReader.reset();
    };
  }, [scanning]);

  return (
    <Modal>
      <h2>Scan Barcode</h2>

      {scanning ? (
        <div>
          <video ref={videoRef} className="w-full rounded" />
          <Button onClick={() => setScanning(false)}>Stop Scanning</Button>
        </div>
      ) : (
        <Button onClick={() => setScanning(true)}>Start Camera</Button>
      )}

      <div className="mt-4">
        <label>Or enter manually:</label>
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Enter barcode..."
          />
          <Button onClick={() => onDetected(manualInput)}>Submit</Button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

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
   - [ ] Barcode formats supported: EAN-13, UPC-A, Code 128, QR Code

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
  barcode  String?  @unique
  qrCode   String?

  // ... relations
}
```

```typescript
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
  barcode: string
): Promise<Product> {
  // Validate barcode format
  if (!isValidBarcode(barcode)) {
    throw new BadRequestError('Invalid barcode format');
  }

  return await prisma.product.update({
    where: { id: productId },
    data: { barcode }
  });
}

function isValidBarcode(barcode: string): boolean {
  // EAN-13: 13 digits
  // UPC-A: 12 digits
  // Code 128: alphanumeric
  const ean13Regex = /^\d{13}$/;
  const upcaRegex = /^\d{12}$/;
  const code128Regex = /^[\x20-\x7E]+$/;

  return (
    ean13Regex.test(barcode) ||
    upcaRegex.test(barcode) ||
    code128Regex.test(barcode)
  );
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

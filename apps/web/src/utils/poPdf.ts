import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Colours ────────────────────────────────────────────────────────
const DARK: [number, number, number] = [26, 26, 26];        // #1a1a1a
const MUTED: [number, number, number] = [102, 102, 102];     // #666
const LIGHT_GRAY: [number, number, number] = [229, 231, 235]; // #e5e7eb
const BG_GRAY: [number, number, number] = [243, 244, 246];    // #f3f4f6
const GREEN: [number, number, number] = [22, 163, 74];        // #16a34a
const RED: [number, number, number] = [220, 38, 38];          // #dc2626
const BLUE: [number, number, number] = [37, 99, 235];         // #2563eb
const AMBER: [number, number, number] = [202, 138, 4];        // #ca8a04

// ─── Helpers ────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currencySymbol: string): string {
  return `${currencySymbol} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function fmtDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(date: Date): string {
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

const PURPLE: [number, number, number] = [147, 51, 234];      // #9333ea

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'RECEIVED': return GREEN;
    case 'CANCELLED': return RED;
    case 'IN_TRANSIT': return BLUE;
    case 'PARTIALLY_RECEIVED': return PURPLE;
    default: return AMBER;
  }
}

// ─── Main Export ────────────────────────────────────────────────────

export function generatePoPdf(
  purchaseOrder: any,
  companyName: string,
  currencySymbol: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Company Header ──────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, margin, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('PURCHASE ORDER', margin, y + 13);

  // PO number + status on right
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(purchaseOrder.poNumber, pageWidth - margin, y + 7, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statusColor = getStatusColor(purchaseOrder.status);
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${purchaseOrder.status}`, pageWidth - margin, y + 13, { align: 'right' });

  // Separator line
  y += 18;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Supplier Info + Order Details ───────────────────────────────
  // Left: Supplier
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SUPPLIER', margin, y);
  y += 5;

  const supplier = purchaseOrder.supplier || {};

  doc.setTextColor(...DARK);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(supplier.name || '', margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);

  const supplierLines: string[] = [];
  if (supplier.contactPerson) supplierLines.push(`Contact: ${supplier.contactPerson}`);
  if (supplier.email) supplierLines.push(`Email: ${supplier.email}`);
  if (supplier.phone) supplierLines.push(`Phone: ${supplier.phone}`);

  for (const line of supplierLines) {
    doc.text(line, margin, y);
    y += 4.5;
  }

  // Right: Order details
  const detailsX = pageWidth - margin - 70;
  let detailY = y - (supplierLines.length * 4.5) - 10;
  const detailRows: [string, string][] = [
    ['Order Date:', fmtDate(purchaseOrder.orderDate)],
    ['Expected Arrival:', fmtDate(purchaseOrder.expectedArrivalDate)],
  ];

  doc.setFontSize(9);
  for (const [label, value] of detailRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, detailsX, detailY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(value, pageWidth - margin, detailY, { align: 'right' });
    detailY += 5.5;
  }

  y += 6;

  // ── Items Table ─────────────────────────────────────────────────
  const tableHead = [['#', 'Product', 'SKU', 'Qty', 'Unit Cost', 'Total Cost']];

  const tableBody = (purchaseOrder.items || []).map((item: any, idx: number) => {
    const productName = item.product?.name || '';
    const sku = item.product?.sku || '';

    return [
      String(idx + 1),
      productName,
      sku,
      String(item.quantity),
      fmtCurrency(Number(item.unitCost), currencySymbol),
      fmtCurrency(Number(item.totalCost), currencySymbol),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: DARK,
      lineColor: LIGHT_GRAY,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, fontSize: 7 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
  y = finalY + 4;

  // ── Totals ──────────────────────────────────────────────────────
  const totalsX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  // Subtotal
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.4);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;

  // Calculate subtotal from items
  const subtotal = (purchaseOrder.items || []).reduce(
    (sum: number, item: any) => sum + Number(item.totalCost || 0),
    0
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...DARK);
  doc.text(fmtCurrency(subtotal, currencySymbol), totalsValueX, y, { align: 'right' });
  y += 5.5;

  // Tax line (if applicable)
  const taxRate = Number(purchaseOrder.taxRate || 0);
  const taxAmount = Number(purchaseOrder.taxAmount || 0);
  if (taxAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(`Tax (${taxRate}%)`, totalsX, y);
    doc.setTextColor(...DARK);
    doc.text(fmtCurrency(taxAmount, currencySymbol), totalsValueX, y, { align: 'right' });
    y += 2;
  } else {
    y -= 3.5;
  }

  // Total (bold, larger)
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y + 1, pageWidth - margin, y + 1);
  y += 6;

  doc.setFillColor(...BG_GRAY);
  doc.rect(totalsX, y - 4, 70, 8, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('Total', totalsX + 2, y);
  doc.text(fmtCurrency(Number(purchaseOrder.totalAmount), currencySymbol), totalsValueX, y, { align: 'right' });
  y += 10;

  // ── Import Details ──────────────────────────────────────────────
  const hasImportDetails =
    purchaseOrder.containerNo || purchaseOrder.shipDate || purchaseOrder.arrivalDate;

  if (hasImportDetails) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('IMPORT DETAILS', margin, y);
    y += 5;

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.3);

    const importLines: [string, string][] = [];
    if (purchaseOrder.containerNo) {
      importLines.push(['Container No:', purchaseOrder.containerNo]);
    }
    if (purchaseOrder.shipDate) {
      importLines.push(['Ship Date:', fmtDate(purchaseOrder.shipDate)]);
    }
    if (purchaseOrder.arrivalDate) {
      importLines.push(['Arrival Date:', fmtDate(purchaseOrder.arrivalDate)]);
    }

    const boxHeight = importLines.length * 5.5 + 6;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1, 1, 'FD');

    let importY = y + 5;
    doc.setFontSize(9);
    for (const [label, value] of importLines) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      doc.text(label, margin + 4, importY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(value, margin + 40, importY);
      importY += 5.5;
    }

    y += boxHeight + 4;
  }

  // ── Notes ───────────────────────────────────────────────────────
  if (purchaseOrder.notes) {
    y += 2;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.3);

    const noteLines = doc.splitTextToSize(purchaseOrder.notes, contentWidth - 8);
    const noteHeight = noteLines.length * 4 + 10;
    doc.roundedRect(margin, y, contentWidth, noteHeight, 1, 1, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED);
    doc.text('Notes', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.text(noteLines, margin + 4, y + 10);

    y += noteHeight + 4;
  }

  // ── Footer ──────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;

  doc.setDrawColor(221, 221, 221);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 170, 170);
  doc.text(`${companyName} - Purchase Order`, margin, footerY + 5);
  doc.text(`Generated on ${fmtDateTime(new Date())}`, pageWidth - margin, footerY + 5, { align: 'right' });

  return doc;
}

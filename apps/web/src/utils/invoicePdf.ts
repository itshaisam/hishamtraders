import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Colours ────────────────────────────────────────────────────────
const DARK: [number, number, number] = [26, 26, 26];      // #1a1a1a
const MUTED: [number, number, number] = [102, 102, 102];   // #666
const LIGHT_GRAY: [number, number, number] = [229, 231, 235]; // #e5e7eb
const BG_GRAY: [number, number, number] = [243, 244, 246];    // #f3f4f6
const GREEN: [number, number, number] = [22, 163, 74];        // #16a34a
const RED: [number, number, number] = [220, 38, 38];          // #dc2626
const AMBER: [number, number, number] = [202, 138, 4];        // #ca8a04

// ─── Helpers ────────────────────────────────────────────────────────

function fmtCurrency(amount: number, currencySymbol: string): string {
  return `${currencySymbol} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(date: Date): string {
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'PAID': return GREEN;
    case 'VOIDED': return RED;
    case 'OVERDUE': return RED;
    case 'CANCELLED': return MUTED;
    default: return AMBER;
  }
}

// ─── Main Export ────────────────────────────────────────────────────

interface CreditHistoryData {
  invoices: any[];
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
}

export function generateInvoicePdf(
  invoice: any,
  companyName: string,
  currencySymbol: string,
  creditHistory?: CreditHistoryData | null
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
  doc.text('TAX INVOICE', margin, y + 13);

  // Invoice number + status on right
  doc.setTextColor(...DARK);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, pageWidth - margin, y + 7, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statusColor = getStatusColor(invoice.status);
  doc.setTextColor(...statusColor);
  doc.text(`Status: ${invoice.status}`, pageWidth - margin, y + 13, { align: 'right' });

  // Separator line
  y += 18;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Bill To + Invoice Details ───────────────────────────────────
  // Left: Bill To
  doc.setTextColor(...MUTED);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('BILL TO', margin, y);
  y += 5;

  doc.setTextColor(...DARK);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client?.name || '', margin, y);
  y += 5;

  if (invoice.client?.city) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(invoice.client.city, margin, y);
  }

  // Right: Invoice details table
  const detailsX = pageWidth - margin - 70;
  let detailY = y - 10;
  const detailRows = [
    ['Invoice Date:', fmtDate(invoice.invoiceDate)],
    ['Due Date:', fmtDate(invoice.dueDate)],
    ['Payment:', invoice.paymentType || ''],
    ['Warehouse:', invoice.warehouse?.name || ''],
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

  y += 12;

  // ── Items Table ─────────────────────────────────────────────────
  const tableHead = [['#', 'Product', 'SKU', 'Qty', 'Unit Price', 'Disc%', 'Amount']];

  const tableBody = (invoice.items || []).map((item: any, idx: number) => {
    const productName = item.product?.name || '';
    const variantInfo = item.productVariant?.variantName ? `\n${item.productVariant.variantName}` : '';
    const sku = item.productVariant?.sku || item.product?.sku || '';
    const discount = Number(item.discount) > 0 ? `${item.discount}%` : '-';

    return [
      String(idx + 1),
      productName + variantInfo,
      sku,
      String(item.quantity),
      fmtCurrency(Number(item.unitPrice), currencySymbol),
      discount,
      fmtCurrency(Number(item.total), currencySymbol),
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
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
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

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...DARK);
  doc.text(fmtCurrency(Number(invoice.subtotal), currencySymbol), totalsValueX, y, { align: 'right' });
  y += 5.5;

  // Tax
  doc.setTextColor(...MUTED);
  doc.text('Tax', totalsX, y);
  doc.setTextColor(...DARK);
  doc.text(fmtCurrency(Number(invoice.taxAmount), currencySymbol), totalsValueX, y, { align: 'right' });
  y += 2;

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
  doc.text(fmtCurrency(Number(invoice.total), currencySymbol), totalsValueX, y, { align: 'right' });
  y += 7;

  // Paid Amount + Balance Due (credit invoices)
  if (invoice.paymentType === 'CREDIT') {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GREEN);
    doc.text('Paid', totalsX, y);
    doc.text(fmtCurrency(Number(invoice.paidAmount), currencySymbol), totalsValueX, y, { align: 'right' });
    y += 2;

    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(totalsX, y + 1, pageWidth - margin, y + 1);
    y += 5;

    const balanceDue = Number(invoice.total) - Number(invoice.paidAmount);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...RED);
    doc.text('Balance Due', totalsX, y);
    doc.text(fmtCurrency(balanceDue, currencySymbol), totalsValueX, y, { align: 'right' });
    y += 7;
  }

  // ── Notes ───────────────────────────────────────────────────────
  if (invoice.notes) {
    y += 4;
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.3);

    // Calculate note text height
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 8);
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
  doc.text(`${companyName} - Tax Invoice`, margin, footerY + 5);
  doc.text(`Generated on ${fmtDateTime(new Date())}`, pageWidth - margin, footerY + 5, { align: 'right' });

  // ══════════════════════════════════════════════════════════════════
  // Page 2: Client Credit History (matches print layout)
  // ══════════════════════════════════════════════════════════════════
  if (creditHistory && creditHistory.invoices.length > 0) {
    doc.addPage();
    const pg2Width = doc.internal.pageSize.getWidth();
    const pg2Height = doc.internal.pageSize.getHeight();
    let py = margin;

    // ── Company Header ────────────────────────────────────────────
    doc.setTextColor(...DARK);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin, py + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text('CLIENT CREDIT STATEMENT', margin, py + 12);

    // Reference + Date on right
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Reference: `, pg2Width - margin - 55, py + 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(invoice.invoiceNumber, pg2Width - margin, py + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(`Date: ${fmtDateTime(new Date())}`, pg2Width - margin, py + 12, { align: 'right' });

    // Separator
    py += 16;
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.6);
    doc.line(margin, py, pg2Width - margin, py);
    py += 8;

    // ── Client Info ───────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text('Client: ', margin, py);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    const clientLabel = `Client: `;
    const clientLabelWidth = doc.getTextWidth(clientLabel);
    doc.text(invoice.client?.name || '', margin + clientLabelWidth - 3, py);
    if (invoice.client?.city) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      doc.text(` (${invoice.client.city})`, margin + clientLabelWidth - 3 + doc.getTextWidth(invoice.client.name), py);
    }
    py += 10;

    // ── Summary Boxes ─────────────────────────────────────────────
    const boxWidth = (contentWidth - 8) / 3;
    const boxHeight = 18;
    const BLUE_BG: [number, number, number] = [239, 246, 255];
    const BLUE_BORDER: [number, number, number] = [147, 197, 253];
    const GREEN_BG: [number, number, number] = [240, 253, 244];
    const GREEN_BORDER: [number, number, number] = [134, 239, 172];
    const RED_BG: [number, number, number] = [254, 242, 242];
    const RED_BORDER: [number, number, number] = [252, 165, 165];

    const boxes = [
      { label: 'Total Credit', value: creditHistory.totalCredit, bg: BLUE_BG, border: BLUE_BORDER, labelColor: [59, 130, 246] as [number, number, number], valueColor: [30, 58, 95] as [number, number, number] },
      { label: 'Total Paid', value: creditHistory.totalPaid, bg: GREEN_BG, border: GREEN_BORDER, labelColor: GREEN, valueColor: [20, 83, 45] as [number, number, number] },
      { label: 'Outstanding', value: creditHistory.outstandingBalance, bg: RED_BG, border: RED_BORDER, labelColor: RED, valueColor: [127, 29, 29] as [number, number, number] },
    ];

    boxes.forEach((box, i) => {
      const bx = margin + i * (boxWidth + 4);
      doc.setFillColor(...box.bg);
      doc.setDrawColor(...box.border);
      doc.setLineWidth(0.4);
      doc.roundedRect(bx, py, boxWidth, boxHeight, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...box.labelColor);
      doc.text(box.label.toUpperCase(), bx + 4, py + 6);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...box.valueColor);
      doc.text(fmtCurrency(box.value, currencySymbol), bx + 4, py + 14);
    });

    py += boxHeight + 8;

    // ── Credit History Table ──────────────────────────────────────
    const histHead = [['Invoice #', 'Date', 'Total', 'Paid', 'Balance', 'Status']];
    const histBody = creditHistory.invoices.map((inv: any) => {
      const balance = Number(inv.total) - Number(inv.paidAmount);
      const isCurrentInvoice = inv.id === invoice.id;
      return [
        (isCurrentInvoice ? '* ' : '') + inv.invoiceNumber,
        fmtDate(inv.invoiceDate),
        fmtCurrency(Number(inv.total), currencySymbol),
        fmtCurrency(Number(inv.paidAmount), currencySymbol),
        fmtCurrency(balance, currencySymbol),
        inv.status,
      ];
    });

    autoTable(doc, {
      startY: py,
      head: histHead,
      body: histBody,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
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
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { cellWidth: 28 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 22, halign: 'center', fontSize: 7 },
      },
      didParseCell: (data: any) => {
        // Color Paid column green
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = GREEN;
        }
        // Color Balance column red
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.textColor = RED;
        }
        // Color status badges
        if (data.section === 'body' && data.column.index === 5) {
          const status = data.cell.raw;
          if (status === 'PAID') data.cell.styles.textColor = GREEN;
          else if (status === 'VOIDED') data.cell.styles.textColor = RED;
          else if (status === 'PARTIAL') data.cell.styles.textColor = [30, 64, 175];
          else data.cell.styles.textColor = AMBER;
        }
        // Highlight current invoice row
        const rowInvoice = creditHistory.invoices[data.row.index];
        if (data.section === 'body' && rowInvoice?.id === invoice.id) {
          data.cell.styles.fillColor = [254, 252, 232]; // yellow-50
        }
        // Dim voided rows
        if (data.section === 'body' && rowInvoice?.status === 'VOIDED') {
          data.cell.styles.textColor = [170, 170, 170];
        }
      },
      foot: [[
        { content: 'TOTALS (excl. voided)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: BG_GRAY } },
        { content: fmtCurrency(creditHistory.totalCredit, currencySymbol), styles: { fontStyle: 'bold', halign: 'right' as const, fillColor: BG_GRAY } },
        { content: fmtCurrency(creditHistory.totalPaid, currencySymbol), styles: { fontStyle: 'bold', halign: 'right' as const, textColor: GREEN, fillColor: BG_GRAY } },
        { content: fmtCurrency(creditHistory.outstandingBalance, currencySymbol), styles: { fontStyle: 'bold', halign: 'right' as const, textColor: RED, fillColor: BG_GRAY } },
        { content: '', styles: { fillColor: BG_GRAY } },
      ]],
    });

    const histFinalY = (doc as any).lastAutoTable?.finalY || py + 20;

    // ── Current Invoice Note ──────────────────────────────────────
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(170, 170, 170);
    doc.text('* Current invoice', margin, histFinalY + 5);

    // ── Footer ────────────────────────────────────────────────────
    const pg2FooterY = pg2Height - 12;
    doc.setDrawColor(221, 221, 221);
    doc.setLineWidth(0.2);
    doc.line(margin, pg2FooterY, pg2Width - margin, pg2FooterY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(170, 170, 170);
    doc.text(`${companyName} - Client Credit Statement`, margin, pg2FooterY + 5);
    doc.text(`Generated on ${fmtDateTime(new Date())}`, pg2Width - margin, pg2FooterY + 5, { align: 'right' });
  }

  return doc;
}

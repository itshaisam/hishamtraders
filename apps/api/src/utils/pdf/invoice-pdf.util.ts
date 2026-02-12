import PDFDocument from 'pdfkit';

/**
 * Generate a professional Invoice PDF using pdfkit
 * Returns a Buffer containing the PDF data
 */
export async function generateInvoicePdf(invoice: any, companyName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // 50px margin each side

      // ── Company Header ──
      doc.fontSize(22).font('Helvetica-Bold').text(companyName, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(14).font('Helvetica').text('TAX INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // Divider line
      drawLine(doc);
      doc.moveDown(0.5);

      // ── Invoice Info (left) and Bill To (right) ──
      const infoTop = doc.y;

      // Left column: Invoice details
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice Details', 50);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice #:    ${invoice.invoiceNumber}`);
      doc.text(`Date:         ${formatDate(invoice.invoiceDate)}`);
      doc.text(`Due Date:     ${formatDate(invoice.dueDate)}`);
      doc.text(`Status:       ${invoice.status}`);
      doc.text(`Payment Type: ${invoice.paymentType}`);
      if (invoice.warehouse) {
        doc.text(`Warehouse:    ${invoice.warehouse.name}`);
      }

      const leftBottom = doc.y;

      // Right column: Bill To
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To', 320, infoTop);
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica');
      if (invoice.client) {
        doc.text(invoice.client.name, 320);
        if (invoice.client.city) {
          doc.text(invoice.client.city, 320);
        }
        if (invoice.client.phone) {
          doc.text(`Phone: ${invoice.client.phone}`, 320);
        }
      }

      // Move below whichever column is taller
      doc.y = Math.max(leftBottom, doc.y) + 15;

      // Divider line
      drawLine(doc);
      doc.moveDown(0.5);

      // ── Items Table ──
      doc.fontSize(10).font('Helvetica-Bold').text('Items', 50);
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      const colX = {
        num: 50,
        product: 75,
        sku: 220,
        qty: 300,
        price: 350,
        disc: 415,
        amount: 475,
      };

      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('#', colX.num, tableTop);
      doc.text('Product', colX.product, tableTop);
      doc.text('SKU', colX.sku, tableTop);
      doc.text('Qty', colX.qty, tableTop, { width: 40, align: 'right' });
      doc.text('Unit Price', colX.price, tableTop, { width: 55, align: 'right' });
      doc.text('Disc %', colX.disc, tableTop, { width: 45, align: 'right' });
      doc.text('Amount', colX.amount, tableTop, { width: 65, align: 'right' });

      doc.moveDown(0.3);
      drawLine(doc);
      doc.moveDown(0.3);

      // Table rows
      doc.fontSize(8).font('Helvetica');
      const items = invoice.items || [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const y = doc.y;

        // Check if we need a new page
        if (y > doc.page.height - 150) {
          doc.addPage();
        }

        const productName = item.product?.name || 'Unknown Product';
        const variantName = item.productVariant?.variantName;
        const displayName = variantName ? `${productName} (${variantName})` : productName;
        const sku = item.productVariant?.sku || item.product?.sku || '-';
        const qty = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const discount = Number(item.discount);
        const amount = Number(item.total);

        const rowY = doc.y;
        doc.text(`${i + 1}`, colX.num, rowY);
        doc.text(truncateText(displayName, 25), colX.product, rowY);
        doc.text(truncateText(sku, 12), colX.sku, rowY);
        doc.text(qty.toString(), colX.qty, rowY, { width: 40, align: 'right' });
        doc.text(formatCurrency(unitPrice), colX.price, rowY, { width: 55, align: 'right' });
        doc.text(discount > 0 ? `${discount}%` : '-', colX.disc, rowY, { width: 45, align: 'right' });
        doc.text(formatCurrency(amount), colX.amount, rowY, { width: 65, align: 'right' });

        doc.moveDown(0.6);
      }

      doc.moveDown(0.3);
      drawLine(doc);
      doc.moveDown(0.5);

      // ── Totals Section ──
      const totalsX = 380;
      const totalsValueX = 475;
      const totalsWidth = 65;

      doc.fontSize(9).font('Helvetica');
      doc.text('Subtotal:', totalsX, doc.y, { continued: false });
      doc.text(formatCurrency(Number(invoice.subtotal)), totalsValueX, doc.y - doc.currentLineHeight(), { width: totalsWidth, align: 'right' });
      doc.moveDown(0.4);

      if (Number(invoice.taxAmount) > 0) {
        const taxLabel = invoice.taxRate ? `Tax (${Number(invoice.taxRate)}%):` : 'Tax:';
        doc.text(taxLabel, totalsX);
        doc.text(formatCurrency(Number(invoice.taxAmount)), totalsValueX, doc.y - doc.currentLineHeight(), { width: totalsWidth, align: 'right' });
        doc.moveDown(0.4);
      }

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Total:', totalsX);
      doc.text(formatCurrency(Number(invoice.total)), totalsValueX, doc.y - doc.currentLineHeight(), { width: totalsWidth, align: 'right' });
      doc.moveDown(0.4);

      // Paid amount and balance for credit invoices
      if (invoice.paymentType === 'CREDIT') {
        doc.fontSize(9).font('Helvetica');
        doc.text('Paid Amount:', totalsX);
        doc.text(formatCurrency(Number(invoice.paidAmount)), totalsValueX, doc.y - doc.currentLineHeight(), { width: totalsWidth, align: 'right' });
        doc.moveDown(0.4);

        const balanceDue = Number(invoice.total) - Number(invoice.paidAmount);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Balance Due:', totalsX);
        doc.text(formatCurrency(balanceDue), totalsValueX, doc.y - doc.currentLineHeight(), { width: totalsWidth, align: 'right' });
        doc.moveDown(0.4);
      }

      // ── Notes Section ──
      if (invoice.notes) {
        doc.moveDown(0.5);
        drawLine(doc);
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50);
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica').text(invoice.notes, 50, doc.y, {
          width: pageWidth,
        });
      }

      // ── Footer ──
      const footerY = doc.page.height - 60;
      doc.fontSize(7).font('Helvetica').fillColor('#888888');
      doc.text(
        `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        50,
        footerY,
        { align: 'center', width: pageWidth }
      );
      doc.text(
        `${companyName} - Tax Invoice`,
        50,
        footerY + 12,
        { align: 'center', width: pageWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Helpers ──

function drawLine(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 2) + '..';
}

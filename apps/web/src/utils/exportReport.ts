import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;        // PDF column width ratio (default: equal)
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string; // Custom cell formatter
}

export interface ExportFilter {
  label: string;
  value: string;
}

export interface ExportSummaryItem {
  label: string;
  value: string;
}

export interface ExportOptions {
  title: string;
  filename: string;       // Without extension
  columns: ExportColumn[];
  data: Record<string, any>[];
  filters?: ExportFilter[];
  summary?: ExportSummaryItem[];
  orientation?: 'portrait' | 'landscape';
}

// ─── Colours & Styling ──────────────────────────────────────────────

const BRAND_COLOR: [number, number, number] = [30, 64, 175];    // blue-800
const HEADER_BG: [number, number, number] = [241, 245, 249];    // slate-100
const ALT_ROW: [number, number, number] = [248, 250, 252];      // slate-50
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // slate-200
const TEXT_DARK: [number, number, number] = [15, 23, 42];       // slate-900
const TEXT_MUTED: [number, number, number] = [100, 116, 139];   // slate-500

// ─── PDF Export ─────────────────────────────────────────────────────

export function exportPDF(options: ExportOptions) {
  const {
    title,
    filename,
    columns,
    data,
    filters = [],
    summary = [],
    orientation = 'landscape',
  } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // ── Company Header ──
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Hisham Traders', margin, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Enterprise Resource Planning System', margin, 18);

  // Report title on the right
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(
    `Generated: ${now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  y = 34;

  // ── Filters Section ──
  if (filters.length > 0) {
    doc.setFillColor(...HEADER_BG);
    const filterHeight = 6 + Math.ceil(filters.length / 3) * 5.5;
    doc.roundedRect(margin, y, pageWidth - margin * 2, filterHeight, 2, 2, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_MUTED);
    doc.text('APPLIED FILTERS', margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(8);

    const colWidth = (pageWidth - margin * 2 - 8) / 3;
    filters.forEach((f, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const fx = margin + 4 + col * colWidth;
      const fy = y + 9 + row * 5.5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(`${f.label}: `, fx, fy);
      const labelWidth = doc.getTextWidth(`${f.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_DARK);
      doc.text(f.value, fx + labelWidth, fy);
    });

    y += filterHeight + 4;
  }

  // ── Summary Cards ──
  if (summary.length > 0) {
    const cardWidth = (pageWidth - margin * 2 - (summary.length - 1) * 3) / Math.min(summary.length, 4);
    const cardHeight = 14;

    summary.forEach((item, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cx = margin + col * (cardWidth + 3);
      const cy = y + row * (cardHeight + 3);

      // Card background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(item.label.toUpperCase(), cx + 3, cy + 5);

      // Value
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_DARK);
      doc.text(item.value, cx + 3, cy + 11);
    });

    y += Math.ceil(summary.length / 4) * 17 + 2;
  }

  // ── Data Table ──
  const head = [columns.map((c) => c.header)];
  const body = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (col.format) return col.format(val);
      if (val === null || val === undefined) return '-';
      return String(val);
    })
  );

  const columnStyles: Record<number, any> = {};
  columns.forEach((col, i) => {
    if (col.align === 'right') {
      columnStyles[i] = { halign: 'right' };
    } else if (col.align === 'center') {
      columnStyles[i] = { halign: 'center' };
    }
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: BORDER_COLOR,
      lineWidth: 0.2,
      textColor: TEXT_DARK,
    },
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: ALT_ROW,
    },
    columnStyles,
    didDrawPage: (hookData) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      const pageNum = hookData.pageNumber;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(
        `Page ${pageNum} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
      doc.text(
        'Hisham Traders ERP',
        margin,
        doc.internal.pageSize.getHeight() - 8
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ─── Excel Export ───────────────────────────────────────────────────

export function exportExcel(options: ExportOptions) {
  const { title, filename, columns, data, filters = [], summary = [] } = options;

  const wb = XLSX.utils.book_new();

  // Build sheet data
  const sheetData: any[][] = [];

  // Title row
  sheetData.push([title]);
  sheetData.push([`Generated: ${new Date().toLocaleString('en-PK')}`]);
  sheetData.push([]);

  // Filters
  if (filters.length > 0) {
    sheetData.push(['Applied Filters']);
    filters.forEach((f) => {
      sheetData.push([f.label, f.value]);
    });
    sheetData.push([]);
  }

  // Summary
  if (summary.length > 0) {
    sheetData.push(['Summary']);
    summary.forEach((s) => {
      sheetData.push([s.label, s.value]);
    });
    sheetData.push([]);
  }

  // Header row
  const headerRow = columns.map((c) => c.header);
  sheetData.push(headerRow);

  // Data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const val = row[col.key];
      if (col.format) return col.format(val);
      if (val === null || val === undefined) return '';
      return val;
    });
    sheetData.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Column widths — auto-fit based on header length
  ws['!cols'] = columns.map((col) => ({
    wch: Math.max(col.header.length + 4, 14),
  }));

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

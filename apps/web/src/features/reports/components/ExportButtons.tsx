import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}

export default function ExportButtons({ onExportPDF, onExportExcel, disabled }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4" />
        PDF
      </button>
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </button>
    </div>
  );
}

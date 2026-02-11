import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
  isExporting?: boolean;
}

export default function ExportButtons({ onExportPDF, onExportExcel, disabled, isExporting }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportPDF}
        disabled={disabled || isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4" />
        PDF
      </button>
      <button
        onClick={onExportExcel}
        disabled={disabled || isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        {isExporting ? 'Exporting...' : 'Excel'}
      </button>
    </div>
  );
}

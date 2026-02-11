import { useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';

export function useExportExcel() {
  const [isExporting, setIsExporting] = useState(false);

  const exportExcel = async (url: string, filename: string) => {
    setIsExporting(true);
    try {
      const response = await apiClient.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Report exported successfully');
    } catch (error: any) {
      // Try to extract error message from blob response
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          toast.error(json.message || 'Failed to export report');
        } catch {
          toast.error('Failed to export report');
        }
      } else {
        const message = error.response?.data?.message || 'Failed to export report';
        toast.error(message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return { exportExcel, isExporting };
}

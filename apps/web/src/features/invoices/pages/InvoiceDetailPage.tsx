import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, MapPin, Building2, CreditCard, FileText, XCircle, RotateCcw, Printer, FileDown, Link2, Check, PackageX, ClipboardList, History } from 'lucide-react';
import { format } from 'date-fns';
import { useInvoiceById, useVoidInvoice, useInvoices } from '../../../hooks/useInvoices';
import { useCurrencySymbol, useCompanyName, useCompanyLogo } from '../../../hooks/useSettings';
import { formatCurrency } from '../../../lib/formatCurrency';
import { VoidInvoiceModal } from '../components/VoidInvoiceModal';
import { useAuthStore } from '../../../stores/auth.store';
import { generateInvoicePdf } from '../../../utils/invoicePdf';
import { invoicesService } from '../../../services/invoicesService';
import { ChangeHistoryModal } from '../../../components/ChangeHistoryModal';
import toast from 'react-hot-toast';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading, error } = useInvoiceById(id!);
  const { user } = useAuthStore();
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: companyNameData } = useCompanyName();
  const { data: companyLogoData } = useCompanyLogo();
  const companyName = companyNameData?.companyName || 'Hisham Traders';
  const companyLogo = companyLogoData?.companyLogo || '';
  const voidMutation = useVoidInvoice();
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const canVoid =
    invoice?.status === 'PENDING' &&
    (user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT');

  const canReturn =
    (invoice?.status === 'PAID' || invoice?.status === 'PARTIAL') &&
    (user?.role?.name === 'ADMIN' || user?.role?.name === 'ACCOUNTANT');

  const handleVoidConfirm = (reason: string) => {
    if (!id) return;
    voidMutation.mutate(
      { invoiceId: id, reason },
      { onSuccess: () => setShowVoidModal(false) }
    );
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    if (!invoice) return;
    const doc = generateInvoicePdf(invoice, companyName, cs, creditHistory);
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleShareLink = async () => {
    if (!id) return;
    setGeneratingLink(true);
    try {
      const response = await invoicesService.generateShareToken(id);
      await navigator.clipboard.writeText(response.url);
      setLinkCopied(true);
      toast.success('PDF link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const { data: clientInvoicesData } = useInvoices(
    invoice?.clientId ? { clientId: invoice.clientId, limit: 1000 } : undefined
  );

  const creditHistory = useMemo(() => {
    if (!clientInvoicesData?.data) return null;
    const activeInvoices = clientInvoicesData.data.filter(inv => inv.status !== 'VOIDED');
    const totalCredit = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalPaid = activeInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    return {
      invoices: clientInvoicesData.data,
      totalCredit,
      totalPaid,
      outstandingBalance: totalCredit - totalPaid,
    };
  }, [clientInvoicesData]);

  // Compute per-item returned quantities from active (non-voided) credit notes
  const returnsSummary = useMemo(() => {
    if (!invoice?.creditNotes?.length) return null;
    const activeCNs = invoice.creditNotes.filter(cn => cn.status !== 'VOIDED');
    if (!activeCNs.length) return null;

    // Map invoiceItemId → total returned qty
    const returnedByItem: Record<string, number> = {};
    for (const cn of activeCNs) {
      for (const item of cn.items) {
        returnedByItem[item.invoiceItemId] = (returnedByItem[item.invoiceItemId] || 0) + item.quantityReturned;
      }
    }

    const totalReturned = Object.values(returnedByItem).reduce((a, b) => a + b, 0);
    const totalSold = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalCreditAmount = activeCNs.reduce((sum, cn) => sum + Number(cn.totalAmount), 0);

    return {
      creditNotes: activeCNs,
      returnedByItem,
      totalReturned,
      totalSold,
      totalCreditAmount,
      isFullReturn: totalReturned === totalSold,
    };
  }, [invoice]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Failed to load invoice</div>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'VOIDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* ===== Print Styles ===== */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          [class*="h-screen"][class*="fixed"][class*="left-0"] { display: none !important; }
          [class*="sm:hidden"] { display: none !important; }
          [class*="sm:ml-60"] { margin-left: 0 !important; }
          main { margin: 0 !important; padding: 0 !important; }
          .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .shadow { box-shadow: none !important; }
          * { overflow: visible !important; }
          .print-invoice { font-size: 11px; color: #111; padding: 20px; }
          .print-invoice table { border-collapse: collapse; width: 100%; }
          .print-invoice th, .print-invoice td { padding: 6px 10px; }
          .page-break { page-break-before: always; }
          @page { margin: 15mm; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ===================================================================
           PRINT-ONLY: Professional Invoice Layout
           =================================================================== */}
      <div className="print-only print-invoice">
        {/* ---- Page 1: Invoice ---- */}

        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a1a1a', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {companyLogo && <img src={companyLogo} alt="" style={{ height: '50px', objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a' }}>{companyName}</div>
              <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Tax Invoice</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Status: <span style={{ fontWeight: 'bold', color: invoice.status === 'PAID' ? '#16a34a' : invoice.status === 'VOIDED' ? '#dc2626' : '#ca8a04' }}>{invoice.status}</span>
            </div>
          </div>
        </div>

        {/* Bill To / Invoice Details - Two Column */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ flex: '1' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#888', letterSpacing: '1px', marginBottom: '4px' }}>Bill To</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{invoice.client.name}</div>
            {invoice.client.city && <div style={{ fontSize: '12px', color: '#555' }}>{invoice.client.city}</div>}
          </div>
          <div style={{ width: '220px' }}>
            <table style={{ width: '100%', fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#888', padding: '2px 8px 2px 0' }}>Invoice Date:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '2px 8px 2px 0' }}>Due Date:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '2px 8px 2px 0' }}>Payment:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{invoice.paymentType}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '2px 8px 2px 0' }}>Warehouse:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{invoice.warehouse.name}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ marginBottom: '0' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>SKU</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Disc.</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ padding: '7px 10px', color: '#888' }}>{idx + 1}</td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                  {item.productVariant && <div style={{ fontSize: '10px', color: '#888' }}>{item.productVariant.variantName}</div>}
                </td>
                <td style={{ padding: '7px 10px', color: '#666', fontSize: '10px' }}>{item.productVariant?.sku || item.product.sku}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{formatCurrency(Number(item.unitPrice), cs)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{Number(item.discount) > 0 ? `${item.discount}%` : '-'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(Number(item.total), cs)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals - Right Aligned */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0' }}>
          <table style={{ width: '260px', fontSize: '12px' }}>
            <tbody>
              <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                <td style={{ padding: '6px 10px', color: '#666' }}>Subtotal</td>
                <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(Number(invoice.subtotal), cs)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 10px', color: '#666' }}>Tax</td>
                <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(Number(invoice.taxAmount), cs)}</td>
              </tr>
              <tr style={{ borderTop: '2px solid #1a1a1a', backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '14px' }}>Total</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>{formatCurrency(Number(invoice.total), cs)}</td>
              </tr>
              {invoice.paymentType === 'CREDIT' && (
                <>
                  <tr>
                    <td style={{ padding: '6px 10px', color: '#16a34a' }}>Paid</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(Number(invoice.paidAmount), cs)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#dc2626' }}>Balance Due</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>{formatCurrency(Number(invoice.total) - Number(invoice.paidAmount), cs)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Notes</div>
            <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa' }}>
          <div>{companyName} - Tax Invoice</div>
          <div>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
        </div>

        {/* ---- Page 2: Credit History ---- */}
        {creditHistory && (
          <div className="page-break">
            {/* Repeat company header on page 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a1a1a', paddingBottom: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {companyLogo && <img src={companyLogo} alt="" style={{ height: '40px', objectFit: 'contain' }} />}
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>{companyName}</div>
                  <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Customer Credit Statement</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#666' }}>
                <div>Reference: <span style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{invoice.invoiceNumber}</span></div>
                <div>Date: {format(new Date(), 'dd MMM yyyy')}</div>
              </div>
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: '16px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Customer: </span>
              <span style={{ fontWeight: 'bold' }}>{invoice.client.name}</span>
              {invoice.client.city && <span style={{ color: '#888' }}> ({invoice.client.city})</span>}
            </div>

            {/* Summary boxes */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, border: '1px solid #93c5fd', backgroundColor: '#eff6ff', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase' }}>Total Credit</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a5f' }}>{formatCurrency(creditHistory.totalCredit, cs)}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #86efac', backgroundColor: '#f0fdf4', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase' }}>Total Paid</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#14532d' }}>{formatCurrency(creditHistory.totalPaid, cs)}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontSize: '10px', color: '#dc2626', textTransform: 'uppercase' }}>Outstanding</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7f1d1d' }}>{formatCurrency(creditHistory.outstandingBalance, cs)}</div>
              </div>
            </div>

            {/* Credit History Table */}
            <table>
              <thead>
                <tr style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>Invoice #</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Total</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Balance</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', fontSize: '11px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {creditHistory.invoices.map((inv, idx) => {
                  const isCurrentInvoice = inv.id === invoice.id;
                  const isVoided = inv.status === 'VOIDED';
                  return (
                    <tr key={inv.id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: isCurrentInvoice ? '#fefce8' : idx % 2 === 0 ? '#fafafa' : 'white',
                      opacity: isVoided ? 0.5 : 1,
                    }}>
                      <td style={{ padding: '6px 10px', fontWeight: '500', textDecoration: isVoided ? 'line-through' : 'none' }}>
                        {inv.invoiceNumber} {isCurrentInvoice && '*'}
                      </td>
                      <td style={{ padding: '6px 10px' }}>{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(Number(inv.total), cs)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(Number(inv.paidAmount), cs)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(Number(inv.total) - Number(inv.paidAmount), cs)}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          backgroundColor: inv.status === 'PAID' ? '#dcfce7' : inv.status === 'PARTIAL' ? '#dbeafe' : inv.status === 'VOIDED' ? '#fee2e2' : '#fef3c7',
                          color: inv.status === 'PAID' ? '#166534' : inv.status === 'PARTIAL' ? '#1e40af' : inv.status === 'VOIDED' ? '#991b1b' : '#92400e',
                        }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #1a1a1a', fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                  <td colSpan={2} style={{ padding: '8px 10px' }}>TOTALS (excl. voided)</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(creditHistory.totalCredit, cs)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(creditHistory.totalPaid, cs)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(creditHistory.outstandingBalance, cs)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: '8px', fontSize: '9px', color: '#aaa' }}>* Current invoice</div>

            {/* Footer */}
            <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa' }}>
              <div>{companyName} - Customer Credit Statement</div>
              <div>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
           SCREEN-ONLY: Normal Detail View (hidden when printing)
           =================================================================== */}
      <div className="no-print">
        <div className="mb-6">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Invoices
          </button>
        </div>

        {/* Voided Alert */}
        {invoice?.status === 'VOIDED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-900 mb-2">Invoice Voided</h4>
            <div className="text-sm text-red-700 space-y-1">
              <div>Voided on: {format(new Date(invoice.voidedAt!), 'PPP')}</div>
              {invoice.voider && <div>Voided by: {invoice.voider.name}</div>}
              <div className="mt-2">
                <strong>Reason:</strong> {invoice.voidReason}
              </div>
            </div>
          </div>
        )}

        {/* Returns / Credit Notes Banner */}
        {returnsSummary && (
          <div className={`border rounded-lg p-4 mb-6 ${returnsSummary.isFullReturn ? 'bg-orange-50 border-orange-300' : 'bg-amber-50 border-amber-300'}`}>
            <div className="flex items-start gap-3">
              <PackageX className={`mt-0.5 flex-shrink-0 ${returnsSummary.isFullReturn ? 'text-orange-600' : 'text-amber-600'}`} size={20} />
              <div className="flex-1">
                <h4 className={`font-semibold ${returnsSummary.isFullReturn ? 'text-orange-900' : 'text-amber-900'}`}>
                  {returnsSummary.isFullReturn ? 'Fully Returned' : 'Partial Return'}
                  <span className="ml-2 text-sm font-normal opacity-75">
                    ({returnsSummary.totalReturned} of {returnsSummary.totalSold} items returned — {formatCurrency(returnsSummary.totalCreditAmount, cs)} credited)
                  </span>
                </h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {returnsSummary.creditNotes.map(cn => (
                    <button
                      key={cn.id}
                      onClick={() => navigate(`/returns/${cn.id}`)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        cn.status === 'APPLIED'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {cn.creditNoteNumber}
                      <span className="opacity-60">({cn.status})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${invoice.status === 'VOIDED' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(invoice.status)}`}>
                  {invoice.status}
                </span>
                {invoice.gatePass && (
                  <button
                    onClick={() => navigate(`/gate-passes/${invoice.gatePass!.id}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    {invoice.gatePass.gatePassNumber}
                    <span className="opacity-60">({invoice.gatePass.status.replace('_', ' ')})</span>
                  </button>
                )}
                <span className="text-xs text-gray-500">
                  {format(new Date(invoice.createdAt), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span> PDF
              </button>
              <button
                onClick={handleShareLink}
                disabled={generatingLink}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {generatingLink ? 'Generating...' : linkCopied ? 'Copied!' : 'Share Link'}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              {canReturn && (
                <button
                  onClick={() => navigate(`/returns/create/${invoice.id}`)}
                  className="px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Return
                </button>
              )}
              {canVoid && (
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Void
                </button>
              )}
              <button onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                <History size={16} />
                History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Building2 className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                {invoice.client.city && <p className="text-sm text-gray-600">{invoice.client.city}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Warehouse</p>
                <p className="font-semibold text-gray-900">{invoice.warehouse.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Payment Type</p>
                <p className="font-semibold text-gray-900">{invoice.paymentType}</p>
              </div>
            </div>
            {invoice.notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="text-gray-400 mt-1" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Invoice Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Batch</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                  {returnsSummary && <th className="text-right py-3 px-4 text-sm font-medium text-orange-700">Returned</th>}
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Unit Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Discount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                      {item.productVariant && <div className="text-xs text-gray-500">{item.productVariant.variantName}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.productVariant?.sku || item.product.sku}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.batchNo || 'N/A'}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">{item.quantity}</td>
                    {returnsSummary && (
                      <td className="py-3 px-4 text-right text-sm">
                        {returnsSummary.returnedByItem[item.id] ? (
                          <span className={`font-medium ${returnsSummary.returnedByItem[item.id] === item.quantity ? 'text-orange-600' : 'text-amber-600'}`}>
                            {returnsSummary.returnedByItem[item.id]}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right text-sm text-gray-900">{formatCurrency(Number(item.unitPrice), cs)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">{item.discount}%</td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">{formatCurrency(Number(item.total), cs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="max-w-sm ml-auto space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(Number(invoice.subtotal), cs)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax:</span>
              <span className="font-medium">{formatCurrency(Number(invoice.taxAmount), cs)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
              <span>Total:</span>
              <span>{formatCurrency(Number(invoice.total), cs)}</span>
            </div>
            {invoice.paymentType === 'CREDIT' && (
              <>
                <div className="flex justify-between text-gray-700 pt-2 border-t">
                  <span>Paid Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(Number(invoice.paidAmount), cs)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Balance Due:</span>
                  <span className="font-medium text-red-600">{formatCurrency(Number(invoice.total) - Number(invoice.paidAmount), cs)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer Credit History Section */}
        {creditHistory && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              Customer Credit History - {invoice.client.name}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Total Credit</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(creditHistory.totalCredit, cs)}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(creditHistory.totalPaid, cs)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(creditHistory.outstandingBalance, cs)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-2 px-3">Invoice #</th>
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-right py-2 px-3">Total</th>
                    <th className="text-right py-2 px-3">Paid</th>
                    <th className="text-right py-2 px-3">Balance</th>
                    <th className="text-left py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {creditHistory.invoices.map((inv) => (
                    <tr key={inv.id} className={`${inv.id === invoice.id ? 'bg-yellow-50' : ''} ${inv.status === 'VOIDED' ? 'opacity-60' : ''}`}>
                      <td className={`py-2 px-3 font-medium ${inv.status === 'VOIDED' ? 'line-through' : ''}`}>{inv.invoiceNumber}</td>
                      <td className="py-2 px-3">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(Number(inv.total), cs)}</td>
                      <td className="py-2 px-3 text-right text-green-600">{formatCurrency(Number(inv.paidAmount), cs)}</td>
                      <td className="py-2 px-3 text-right text-red-600">{formatCurrency(Number(inv.total) - Number(inv.paidAmount), cs)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(inv.status)}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 font-bold">
                  <tr>
                    <td colSpan={2} className="py-2 px-3">TOTALS (excluding voided)</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(creditHistory.totalCredit, cs)}</td>
                    <td className="py-2 px-3 text-right text-green-600">{formatCurrency(creditHistory.totalPaid, cs)}</td>
                    <td className="py-2 px-3 text-right text-red-600">{formatCurrency(creditHistory.outstandingBalance, cs)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Void Invoice Modal */}
        {showVoidModal && invoice && (
          <VoidInvoiceModal
            invoice={invoice}
            isOpen={showVoidModal}
            onClose={() => setShowVoidModal(false)}
            onConfirm={handleVoidConfirm}
            isLoading={voidMutation.isPending}
          />
        )}

        {id && (
          <ChangeHistoryModal
            entityType="INVOICE"
            entityId={id}
            currentData={invoice as any}
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
}

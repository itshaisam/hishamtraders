import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import {
  useGatePassById,
  useApproveGatePass,
  useDispatchGatePass,
  useCompleteGatePass,
  useCancelGatePass,
} from '../../../hooks/useGatePasses';
import { useCompanyName, useCompanyLogo } from '../../../hooks/useSettings';
import { GatePassStatus } from '../../../types/gate-pass.types';
import { Badge, Button, Spinner, Modal } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const statusVariants: Record<GatePassStatus, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'info',
  IN_TRANSIT: 'default',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const WORKFLOW_STEPS = [
  { status: GatePassStatus.PENDING, label: 'Pending' },
  { status: GatePassStatus.APPROVED, label: 'Approved' },
  { status: GatePassStatus.IN_TRANSIT, label: 'In Transit' },
  { status: GatePassStatus.COMPLETED, label: 'Completed' },
];

function getStepState(currentStatus: GatePassStatus, stepStatus: GatePassStatus) {
  if (currentStatus === GatePassStatus.CANCELLED) return 'cancelled';
  const order = [GatePassStatus.PENDING, GatePassStatus.APPROVED, GatePassStatus.IN_TRANSIT, GatePassStatus.COMPLETED];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepStatus);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
}

export default function GatePassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: gatePass, isLoading } = useGatePassById(id!);
  const { data: companyNameData } = useCompanyName();
  const { data: companyLogoData } = useCompanyLogo();
  const companyName = companyNameData?.companyName || 'Hisham Traders';
  const companyLogo = companyLogoData?.companyLogo || '';
  const approveMutation = useApproveGatePass();
  const dispatchMutation = useDispatchGatePass();
  const completeMutation = useCompleteGatePass();
  const cancelMutation = useCancelGatePass();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!gatePass) return <div className="p-6 text-center text-gray-500">Gate pass not found</div>;

  const handleCancel = async () => {
    if (cancelReason.trim().length < 3) return;
    await cancelMutation.mutateAsync({ id: gatePass.id, reason: cancelReason.trim() });
    setShowCancelModal(false);
    setCancelReason('');
  };

  const isCancelled = gatePass.status === GatePassStatus.CANCELLED;
  const totalQuantity = gatePass.items.reduce((sum, item) => sum + item.quantity, 0);

  const statusColor = gatePass.status === 'COMPLETED' ? '#16a34a'
    : gatePass.status === 'CANCELLED' ? '#dc2626'
    : gatePass.status === 'IN_TRANSIT' ? '#2563eb'
    : gatePass.status === 'APPROVED' ? '#0891b2'
    : '#ca8a04';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Gate Passes', href: '/gate-passes' }, { label: gatePass?.gatePassNumber || 'Gate Pass Detail' }]} className="mb-4" />
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
          .print-gatepass { font-size: 11px; color: #111; padding: 20px; }
          .print-gatepass table { border-collapse: collapse; width: 100%; }
          .print-gatepass th, .print-gatepass td { padding: 6px 10px; }
          @page { margin: 15mm; }
        }
        .print-only { display: none; }
      `}</style>

      {/* ===================================================================
           PRINT-ONLY: Professional Gate Pass Layout
           =================================================================== */}
      <div className="print-only print-gatepass">
        {/* Company Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #1a1a1a', paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {companyLogo && <img src={companyLogo} alt="" style={{ height: '50px', objectFit: 'contain' }} />}
            <div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a' }}>{companyName}</div>
              <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Gate Pass</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a' }}>{gatePass.gatePassNumber}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Status: <span style={{ fontWeight: 'bold', color: statusColor }}>{gatePass.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Details Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ flex: '1' }}>
            <table style={{ fontSize: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0', whiteSpace: 'nowrap' }}>Warehouse:</td>
                  <td style={{ fontWeight: 'bold' }}>{gatePass.warehouse.name}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Date:</td>
                  <td style={{ fontWeight: 'bold' }}>{format(new Date(gatePass.date), 'dd MMM yyyy')}</td>
                </tr>
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Purpose:</td>
                  <td style={{ fontWeight: 'bold' }}>{gatePass.purpose}</td>
                </tr>
                {gatePass.referenceType && (
                  <tr>
                    <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Reference:</td>
                    <td style={{ fontWeight: 'bold' }}>
                      {gatePass.referenceType === 'INVOICE' && gatePass.referenceNumber
                        ? `Invoice ${gatePass.referenceNumber}`
                        : `${gatePass.referenceType}`}
                    </td>
                  </tr>
                )}
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
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>Batch No</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: '11px' }}>Bin Location</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: '11px' }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {gatePass.items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                <td style={{ padding: '7px 10px', color: '#888' }}>{idx + 1}</td>
                <td style={{ padding: '7px 10px', fontWeight: '500' }}>{item.product.name}</td>
                <td style={{ padding: '7px 10px', color: '#666', fontSize: '10px' }}>{item.product.sku}</td>
                <td style={{ padding: '7px 10px', color: '#666' }}>{item.batchNo || '-'}</td>
                <td style={{ padding: '7px 10px', color: '#666' }}>{item.binLocation || '-'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '600' }}>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #1a1a1a', backgroundColor: '#f3f4f6' }}>
              <td colSpan={5} style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '12px' }}>Total Quantity</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>{totalQuantity}</td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {gatePass.notes && (
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Notes</div>
            <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{gatePass.notes}</div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginTop: '24px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px' }}>Timeline</div>
          <table style={{ fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Issued By:</td>
                <td style={{ fontWeight: '500' }}>{gatePass.issuer.name}</td>
              </tr>
              {gatePass.approver && (
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Approved By:</td>
                  <td style={{ fontWeight: '500' }}>{gatePass.approver.name}</td>
                </tr>
              )}
              {gatePass.dispatcherName && (
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Dispatched By:</td>
                  <td style={{ fontWeight: '500' }}>{gatePass.dispatcherName}</td>
                </tr>
              )}
              {gatePass.completerName && (
                <tr>
                  <td style={{ color: '#888', padding: '3px 16px 3px 0' }}>Completed By:</td>
                  <td style={{ fontWeight: '500' }}>{gatePass.completerName}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#aaa' }}>
          <div>{companyName} - Gate Pass</div>
          <div>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
        </div>
      </div>

      {/* ===================================================================
           SCREEN-ONLY: Normal Detail View (hidden when printing)
           =================================================================== */}
      <div className="no-print">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{gatePass.gatePassNumber}</h1>
              <Badge variant={statusVariants[gatePass.status]}>
                {gatePass.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {gatePass.warehouse.name} &bull; {new Date(gatePass.date).toLocaleDateString()}
              {gatePass.referenceType === 'INVOICE' && gatePass.referenceNumber && (
                <> &bull; Ref: {gatePass.referenceNumber}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <Link to="/gate-passes">
              <Button variant="secondary">Back to List</Button>
            </Link>
          </div>
        </div>

        {/* Reference Invoice Link */}
        {gatePass.referenceType === 'INVOICE' && gatePass.referenceId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Linked Invoice:</span>{' '}
              {gatePass.referenceNumber || 'Invoice'}
            </div>
            <button
              onClick={() => navigate(`/invoices/${gatePass.referenceId}`)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              View Invoice
            </button>
          </div>
        )}

        {/* Status Workflow */}
        {!isCancelled && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Status Workflow</h2>
            <div className="flex items-center justify-between">
              {WORKFLOW_STEPS.map((step, index) => {
                const state = getStepState(gatePass.status, step.status);
                return (
                  <div key={step.status} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          state === 'completed'
                            ? 'bg-green-500 text-white'
                            : state === 'current'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {state === 'completed' ? '\u2713' : index + 1}
                      </div>
                      <span className={`text-xs mt-1 ${state === 'current' ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        getStepState(gatePass.status, WORKFLOW_STEPS[index + 1].status) !== 'upcoming'
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && gatePass.cancelReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-800">Cancelled</p>
            <p className="text-sm text-red-600 mt-1">{gatePass.cancelReason}</p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Purpose</dt>
                <dd className="text-sm font-medium text-gray-900">{gatePass.purpose}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Warehouse</dt>
                <dd className="text-sm font-medium text-gray-900">{gatePass.warehouse.name}</dd>
              </div>
              {gatePass.warehouse.gatePassMode && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Gate Pass Mode</dt>
                  <dd className="text-sm font-medium text-gray-900">{gatePass.warehouse.gatePassMode}</dd>
                </div>
              )}
              {gatePass.referenceType && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Reference</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {gatePass.referenceType === 'INVOICE' && gatePass.referenceNumber
                      ? `Invoice ${gatePass.referenceNumber}`
                      : `${gatePass.referenceType}: ${gatePass.referenceId?.slice(0, 8)}...`}
                  </dd>
                </div>
              )}
              {gatePass.notes && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Notes</dt>
                  <dd className="text-sm text-gray-900">{gatePass.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Timeline</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Issued By</dt>
                <dd className="text-sm font-medium text-gray-900">{gatePass.issuer.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{new Date(gatePass.createdAt).toLocaleString()}</dd>
              </div>
              {gatePass.approver && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Approved By</dt>
                  <dd className="text-sm font-medium text-gray-900">{gatePass.approver.name}</dd>
                </div>
              )}
              {gatePass.dispatcherName && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Dispatched By</dt>
                  <dd className="text-sm font-medium text-gray-900">{gatePass.dispatcherName}</dd>
                </div>
              )}
              {gatePass.completerName && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Completed By</dt>
                  <dd className="text-sm font-medium text-gray-900">{gatePass.completerName}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500">Items ({gatePass.items.length})</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bin Location</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gatePass.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.product.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.batchNo || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.binLocation || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-700">Total Quantity</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">{totalQuantity}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {gatePass.status === GatePassStatus.PENDING && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => approveMutation.mutate(gatePass.id)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
          {gatePass.status === GatePassStatus.APPROVED && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => dispatchMutation.mutate(gatePass.id)}
                disabled={dispatchMutation.isPending}
              >
                {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch'}
              </Button>
            </>
          )}
          {gatePass.status === GatePassStatus.IN_TRANSIT && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => completeMutation.mutate(gatePass.id)}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? 'Completing...' : 'Complete'}
              </Button>
            </>
          )}
        </div>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => { setShowCancelModal(false); setCancelReason(''); }}
          title="Cancel Gate Pass"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel gate pass <strong>{gatePass.gatePassNumber}</strong>?
              This will restore any deducted inventory.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Keep Open
              </button>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={cancelReason.trim().length < 3 || cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Gate Pass'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

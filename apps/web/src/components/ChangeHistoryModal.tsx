import { useState } from 'react';
import { format } from 'date-fns';
import { History, RotateCcw, AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import { Spinner, Button } from './ui';
import { useChangeHistory, useCanRollback, useRollback } from '../hooks/useChangeHistory';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

interface ChangeHistoryModalProps {
  entityType: string;
  entityId: string;
  currentData: Record<string, unknown>;
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeHistoryModal({
  entityType,
  entityId,
  currentData,
  isOpen,
  onClose,
}: ChangeHistoryModalProps) {
  const { data: history, isLoading } = useChangeHistory(entityType, entityId, isOpen);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role?.name === 'Admin';
  const { data: rollbackCheck } = useCanRollback(entityType, entityId, isOpen && isAdmin);
  const { mutate: rollback, isPending: isRollingBack } = useRollback();

  const [compareFrom, setCompareFrom] = useState(0); // 0 = current
  const [compareTo, setCompareTo] = useState(1); // 1 = first version

  // Rollback confirmation state
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollbackTargetVersion, setRollbackTargetVersion] = useState<number | null>(null);

  // Build version list: Current + history versions
  const versions = [
    { label: 'Current', data: currentData, changedBy: null, changedAt: null, changeReason: null, version: null },
    ...(history || []).map((h) => ({
      label: `Version ${h.version}`,
      data: h.snapshot as Record<string, unknown>,
      changedBy: h.changedBy,
      changedAt: h.changedAt,
      changeReason: h.changeReason,
      version: h.version,
    })),
  ];

  const dataA = versions[compareFrom]?.data || {};
  const dataB = versions[compareTo]?.data || {};

  // Compute diff
  const allKeys = Array.from(new Set([...Object.keys(dataA), ...Object.keys(dataB)]));
  const diffs = allKeys.map((key) => {
    const valA = dataA[key];
    const valB = dataB[key];
    const changed = JSON.stringify(valA) !== JSON.stringify(valB);
    return { field: key, valA, valB, changed };
  });

  const versionInfo = versions[compareTo];

  const handleRestoreClick = (version: number) => {
    setRollbackTargetVersion(version);
    setRollbackReason('');
    setShowRollbackConfirm(true);
  };

  const handleConfirmRollback = () => {
    if (!rollbackTargetVersion || !rollbackReason.trim()) return;

    rollback(
      { entityType, entityId, targetVersion: rollbackTargetVersion, reason: rollbackReason.trim() },
      {
        onSuccess: () => {
          toast.success(`Rolled back to version ${rollbackTargetVersion}`);
          setShowRollbackConfirm(false);
          setRollbackReason('');
          setRollbackTargetVersion(null);
          onClose();
          // Page will reload entity via query invalidation
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Rollback failed');
        },
      }
    );
  };

  // Compute which fields would change for the rollback preview
  const rollbackPreviewDiffs = rollbackTargetVersion !== null
    ? (() => {
        const targetIdx = versions.findIndex((v) => v.version === rollbackTargetVersion);
        if (targetIdx < 0) return [];
        const targetData = versions[targetIdx]?.data || {};
        const keys = Array.from(new Set([...Object.keys(currentData), ...Object.keys(targetData)]));
        return keys
          .map((key) => ({
            field: key,
            current: currentData[key],
            restored: targetData[key],
            changed: JSON.stringify(currentData[key]) !== JSON.stringify(targetData[key]),
          }))
          .filter((d) => d.changed);
      })()
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change History" size="xl">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !history?.length ? (
        <div className="text-center py-12 text-gray-500">
          <History size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No previous versions recorded yet.</p>
          <p className="text-sm mt-1">Versions will appear here after the record is updated.</p>
        </div>
      ) : showRollbackConfirm ? (
        /* Rollback Confirmation View */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div>
              <p className="font-medium">Restore to Version {rollbackTargetVersion}?</p>
              <p className="text-sm mt-0.5">This will overwrite the current values with the snapshot data.</p>
            </div>
          </div>

          {/* Warning from safety check */}
          {rollbackCheck?.warning && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              <p className="font-medium">Warning</p>
              <p>{rollbackCheck.warning}</p>
            </div>
          )}

          {/* Fields that will change */}
          {rollbackPreviewDiffs.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600 border-b">
                {rollbackPreviewDiffs.length} field(s) will change
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left py-1.5 px-3 font-medium text-gray-600">Field</th>
                    <th className="text-left py-1.5 px-3 font-medium text-gray-600">Current</th>
                    <th className="text-left py-1.5 px-3 font-medium text-gray-600">Will Restore To</th>
                  </tr>
                </thead>
                <tbody>
                  {rollbackPreviewDiffs.map((d) => (
                    <tr key={d.field} className="border-b last:border-0 bg-yellow-50">
                      <td className="py-1.5 px-3 font-medium text-gray-700">{d.field}</td>
                      <td className="py-1.5 px-3 text-red-600">{formatValue(d.current)}</td>
                      <td className="py-1.5 px-3 text-green-700">{formatValue(d.restored)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rollback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="Explain why you're restoring this version..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRollbackConfirm(false)}
              disabled={isRollingBack}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmRollback}
              disabled={!rollbackReason.trim() || isRollingBack}
            >
              {isRollingBack ? (
                <>
                  <Spinner /> Restoring...
                </>
              ) : (
                <>
                  <RotateCcw size={16} /> Confirm Restore
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Normal History View */
        <div className="space-y-4">
          {/* Version selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Compare To</label>
              <select
                value={compareFrom}
                onChange={(e) => setCompareFrom(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((v, idx) => (
                  <option key={idx} value={idx}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Compare From</label>
              <select
                value={compareTo}
                onChange={(e) => setCompareTo(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((v, idx) => (
                  <option key={idx} value={idx}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Version metadata */}
          {versionInfo && versionInfo.changedAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p>
                    <span className="text-gray-600">Snapshot taken: </span>
                    <span className="font-medium">{format(new Date(versionInfo.changedAt), 'dd MMM yyyy, HH:mm:ss')}</span>
                  </p>
                  {versionInfo.changedBy && (
                    <p>
                      <span className="text-gray-600">Changed by: </span>
                      <span className="font-medium">{versionInfo.changedBy.name} ({versionInfo.changedBy.email})</span>
                    </p>
                  )}
                  {versionInfo.changeReason && (
                    <p>
                      <span className="text-gray-600">Reason: </span>
                      <span>{versionInfo.changeReason}</span>
                    </p>
                  )}
                </div>
                {/* Restore button — admin only, not for current version */}
                {isAdmin && versionInfo.version !== null && rollbackCheck?.canRollback && (
                  <button
                    onClick={() => handleRestoreClick(versionInfo.version!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors"
                  >
                    <RotateCcw size={14} />
                    Restore This Version
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rollback blocked notice */}
          {isAdmin && rollbackCheck && !rollbackCheck.canRollback && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-xs text-gray-500">
              Rollback unavailable: {rollbackCheck.blockedReason}
            </div>
          )}

          {/* Comparison table */}
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-600 w-1/4">Field</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 w-[37.5%]">{versions[compareFrom]?.label || 'A'}</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600 w-[37.5%]">{versions[compareTo]?.label || 'B'}</th>
                </tr>
              </thead>
              <tbody>
                {diffs.map((diff) => (
                  <tr key={diff.field} className={`border-b last:border-0 ${diff.changed ? 'bg-yellow-50' : ''}`}>
                    <td className="py-2 px-3 font-medium text-gray-700">{diff.field}</td>
                    <td className={`py-2 px-3 ${diff.changed ? 'text-green-700' : 'text-gray-600'}`}>
                      {formatValue(diff.valA)}
                    </td>
                    <td className={`py-2 px-3 ${diff.changed ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatValue(diff.valB)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400">
            {diffs.filter((d) => d.changed).length} of {diffs.length} fields differ
          </p>
        </div>
      )}
    </Modal>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

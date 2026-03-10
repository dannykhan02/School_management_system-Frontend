import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Loader,
  ClipboardList,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  X,
  ChevronDown,
  ChevronUp,
  UserCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  BookOpen,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Building2,
  Info,
  Gavel,
  Upload,
  Pencil,
  Save,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  StatusBadge,
  TypeBadge,
  PlacementBadge,
  SummaryCard,
  DetailRow,
  SectionHeading,
  EmptyState,
  fmt,
} from '../../../components/EnrollmentBadges';
import EnrollmentConfigModal from '../../../components/EnrollmentConfigModal';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  modalBg:    'bg-white dark:bg-slate-800/50',
  card:       'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
  primary:    'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  secondary:  'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  danger:     'bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  success:    'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  warning:    'bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  cancelPill: 'px-5 py-2 rounded-full text-sm font-semibold bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  deletePill: 'px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
  approvePill:'px-5 py-2 rounded-full text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
  savePill:   'px-5 py-2 rounded-full text-sm font-bold bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
  label:      'block text-sm font-semibold text-[#0d141b] dark:text-slate-300 mb-1.5',
  input:      'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all',
  select:     'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all',
  textarea:   'w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition-all',
};

const Spinner = ({ size = 4 }) => (
  <svg className={`animate-spin h-${size} w-${size}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// APPROVE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ApproveModal = ({ isOpen, enrollment, classrooms, streams, hasStreams, onClose, onConfirm, loading }) => {
  const [classroomId, setClassroomId] = useState('');
  const [streamId,    setStreamId]    = useState('');
  const [notes,       setNotes]       = useState('');

  useEffect(() => {
    if (isOpen) {
      setClassroomId(enrollment?.applying_for_classroom_id?.toString() || '');
      setStreamId(enrollment?.applying_for_stream_id?.toString() || '');
      setNotes('');
    }
  }, [isOpen, enrollment]);

  if (!isOpen || !enrollment) return null;

  const isGovPlacement   = enrollment.enrollment_type === 'government_placement';
  const placementBlocked = isGovPlacement && enrollment.placement_verification_status !== 'verified';

  const handleSubmit = () => {
    if (!classroomId) { toast.error('Please assign a classroom.'); return; }
    if (hasStreams && !streamId) { toast.error('Please assign a stream — this school has streams enabled.'); return; }
    onConfirm({ assigned_classroom_id: classroomId, assigned_stream_id: streamId || undefined, admin_notes: notes || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700`}>

        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Approve Enrollment</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">
              {fmt.name(enrollment)} — {enrollment.applying_for_classroom?.class_name ?? 'Unknown Class'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {placementBlocked && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Cannot Approve</p>
                <p className="text-xs mt-0.5 text-red-700 dark:text-red-400">
                  This is a government placement application. Placement must be <strong>verified</strong> before approval.
                  Current status: <strong>{enrollment.placement_verification_status ?? 'pending'}</strong>.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Assign Classroom <span className="text-red-500">*</span>
            </label>
            <select
              value={classroomId}
              onChange={e => setClassroomId(e.target.value)}
              disabled={placementBlocked || loading}
              className={CLS.select + ' disabled:opacity-50'}
            >
              <option value="">— Select classroom —</option>
              {(classrooms || []).map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>

          {hasStreams && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Assign Stream <span className="text-red-500">*</span>
              </label>
              <select
                value={streamId}
                onChange={e => setStreamId(e.target.value)}
                disabled={placementBlocked || loading}
                className={CLS.select + ' disabled:opacity-50'}
              >
                <option value="">— Select stream —</option>
                {(streams || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Admin Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              disabled={placementBlocked || loading}
              placeholder="Internal notes visible only to admins…"
              className={CLS.textarea + ' disabled:opacity-50'}
            />
          </div>

          {!placementBlocked && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 flex gap-2">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Approving will generate an admission number, create a student record, and send a confirmation email/SMS to the parent.
              </p>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || placementBlocked} className={CLS.approvePill}>
            {loading ? <><Spinner size={3.5} />Approving…</> : <><CheckCircle className="w-3.5 h-3.5" />Approve</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REJECT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const RejectModal = ({ isOpen, enrollment, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [notes,  setNotes]  = useState('');

  useEffect(() => { if (isOpen) { setReason(''); setNotes(''); } }, [isOpen]);

  if (!isOpen || !enrollment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700`}>

        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reject Enrollment</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{fmt.name(enrollment)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              The rejection reason will be sent to the parent via email and SMS. Be clear and constructive.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain clearly why this application is being rejected (min 10 characters)…"
              className={CLS.textarea}
            />
            <p className="mt-1 text-xs text-slate-400">{reason.length}/1000 chars — minimum 10</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Internal Notes <span className="text-slate-400 font-normal">(not sent to parent)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes…"
              className={CLS.textarea}
            />
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button
            onClick={() => onConfirm({ rejection_reason: reason, admin_notes: notes || undefined })}
            disabled={loading || reason.length < 10}
            className={CLS.deletePill}
          >
            {loading ? <><Spinner size={3.5} />Rejecting…</> : <><XCircle className="w-3.5 h-3.5" />Reject</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLACEMENT VERIFY MODAL
// ─────────────────────────────────────────────────────────────────────────────
const PlacementModal = ({ isOpen, enrollment, onClose, onConfirm, loading }) => {
  const [status, setStatus] = useState('verified');
  const [notes,  setNotes]  = useState('');

  useEffect(() => { if (isOpen) { setStatus('verified'); setNotes(''); } }, [isOpen]);

  if (!isOpen || !enrollment) return null;

  const options = [
    { value: 'verified', label: 'Verified',      desc: 'Student is on the official MoE placement list.', icon: ShieldCheck,   color: 'emerald' },
    { value: 'disputed', label: 'Disputed',       desc: 'Not found on list. Parent must visit with original documents.', icon: ShieldAlert, color: 'red' },
    { value: 'manual',   label: 'Manual Review',  desc: 'Placement letter uploaded but needs physical verification.', icon: ShieldQuestion, color: 'blue' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700`}>

        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verify Government Placement</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {fmt.name(enrollment)} — Index: <span className="font-mono">{enrollment.assessment_index_number ?? '—'}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            {options.map(opt => {
              const Icon = opt.icon;
              const colorMap = {
                emerald: 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20',
                red:     'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
                blue:    'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
              };
              const iconColor = { emerald: 'text-emerald-600', red: 'text-red-600', blue: 'text-blue-600' };
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                    ${status === opt.value ? colorMap[opt.color] : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status === opt.value ? iconColor[opt.color] : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about the verification process…"
              className={CLS.textarea}
            />
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button onClick={() => onConfirm({ verification_status: status, notes: notes || undefined })} disabled={loading} className={CLS.approvePill}>
            {loading ? <><Spinner size={3.5} />Saving…</> : <><ShieldCheck className="w-3.5 h-3.5" />Save Verification</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK VERIFY MODAL
// ─────────────────────────────────────────────────────────────────────────────
const BulkVerifyModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [rawText,       setRawText]       = useState('');
  const [placementYear, setPlacementYear] = useState(new Date().getFullYear().toString());
  const [notes,         setNotes]         = useState('');

  useEffect(() => {
    if (isOpen) { setRawText(''); setNotes(''); setPlacementYear(new Date().getFullYear().toString()); }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedNumbers = rawText
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const handleSubmit = () => {
    if (parsedNumbers.length === 0) { toast.error('Paste at least one index number.'); return; }
    if (!placementYear) { toast.error('Placement year is required.'); return; }
    onConfirm({
      index_numbers:  parsedNumbers,
      placement_year: parseInt(placementYear, 10),
      notes:          notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700`}>
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
            <Upload className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bulk Verify Placements</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Paste the official MoE index numbers — one per line or comma-separated.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className={CLS.label}>Placement Year <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={placementYear}
              onChange={e => setPlacementYear(e.target.value)}
              min={2000} max={new Date().getFullYear() + 1}
              className={CLS.input}
            />
          </div>
          <div>
            <label className={CLS.label}>Index Numbers <span className="text-red-500">*</span></label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={6}
              placeholder={"2025/KE/001/0234\n2025/KE/001/0891\n2025/KE/001/1045"}
              className={CLS.textarea}
            />
            {parsedNumbers.length > 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {parsedNumbers.length} index number{parsedNumbers.length !== 1 ? 's' : ''} detected
              </p>
            )}
          </div>
          <div>
            <label className={CLS.label}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Verified from official MoE list received 15 Jan 2026"
              className={CLS.textarea}
            />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Only <strong>pending</strong> government placement enrollments matching these index numbers will be updated. Already verified records are not touched.
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={CLS.approvePill}>
            {loading ? <><Spinner size={3.5} />Verifying…</> : <><ShieldCheck className="w-3.5 h-3.5" />Bulk Verify</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
const EditModal = ({ isOpen, enrollment, classrooms, streams, hasStreams, onClose, onConfirm, loading }) => {
  const [adminNotes,  setAdminNotes]  = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [streamId,    setStreamId]    = useState('');

  useEffect(() => {
    if (isOpen && enrollment) {
      setAdminNotes(enrollment.admin_notes || '');
      setClassroomId(enrollment.assigned_classroom_id?.toString() || '');
      setStreamId(enrollment.assigned_stream_id?.toString() || '');
    }
  }, [isOpen, enrollment]);

  if (!isOpen || !enrollment) return null;

  const handleSubmit = () => {
    onConfirm({
      admin_notes:           adminNotes || undefined,
      assigned_classroom_id: classroomId ? parseInt(classroomId, 10) : undefined,
      assigned_stream_id:    streamId    ? parseInt(streamId, 10)    : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700`}>
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0">
            <Pencil className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Enrollment</h3>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{fmt.name(enrollment)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className={CLS.label}>Admin Notes <span className="text-slate-400 font-normal">(internal only)</span></label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes not visible to the parent…"
              className={CLS.textarea}
            />
          </div>
          <div>
            <label className={CLS.label}>Override Classroom Assignment</label>
            <select value={classroomId} onChange={e => setClassroomId(e.target.value)} className={CLS.select}>
              <option value="">— Keep current / unassigned —</option>
              {(classrooms || []).map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
          </div>
          {hasStreams && (
            <div>
              <label className={CLS.label}>Override Stream Assignment</label>
              <select value={streamId} onChange={e => setStreamId(e.target.value)} className={CLS.select}>
                <option value="">— Keep current / unassigned —</option>
                {(streams || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={CLS.savePill}>
            {loading ? <><Spinner size={3.5} />Saving…</> : <><Save className="w-3.5 h-3.5" />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────
const DetailDrawer = ({
  isOpen, enrollment, classrooms, streams, hasStreams,
  onClose, onStartReview, onApprove, onReject, onVerifyPlacement, onEdit, onPromote,
  actionLoading,
}) => {
  const [tab, setTab] = useState('student');

  useEffect(() => { if (isOpen) setTab('student'); }, [isOpen]);

  if (!isOpen || !enrollment) return null;

  const e = enrollment;
  const isGovPlacement   = e.enrollment_type === 'government_placement';
  const canReview        = e.status === 'submitted';
  const canApprove       = ['submitted', 'under_review'].includes(e.status);
  const canReject        = ['submitted', 'under_review', 'waitlisted'].includes(e.status);
  const canVerifyPlacement = isGovPlacement;
  const isApproved       = e.status === 'approved';

  // academic_year shape: { id, year: 2026, term: "Term 1", ... }
  const academicYearLabel = e.academic_year
    ? `${e.academic_year.year} — ${e.academic_year.term}`
    : '—';

  const tabs = [
    { id: 'student',  label: 'Student',  icon: User },
    { id: 'parent',   label: 'Parent',   icon: UserCheck },
    { id: 'academic', label: 'Academic', icon: BookOpen },
    { id: 'workflow', label: 'Workflow', icon: Gavel },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate leading-tight">{fmt.name(e)}</h2>
              <StatusBadge status={e.status} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap pl-0.5">
              <TypeBadge type={e.enrollment_type} size="xs" />
              {e.is_transfer && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                  <ArrowRightLeft className="w-2.5 h-2.5" /> Transfer
                </span>
              )}
              {e.special_needs && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                  Special Needs
                </span>
              )}
              {isApproved && e.student?.admission_number && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800">
                  <Hash className="w-2.5 h-2.5" />{e.student.admission_number}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 ml-3 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        {(canReview || canApprove || canReject || canVerifyPlacement) && (
          <div className="px-5 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap flex-shrink-0 bg-slate-50 dark:bg-slate-800/60">
            {canReview && (
              <button onClick={() => onStartReview(e)} disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50">
                <Eye className="w-3.5 h-3.5" /> Start Review
              </button>
            )}
            {canVerifyPlacement && (
              <button onClick={() => onVerifyPlacement(e)} disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50">
                <ShieldCheck className="w-3.5 h-3.5" /> Verify Placement
              </button>
            )}
            {canApprove && (
              <button onClick={() => onApprove(e)} disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50">
                {actionLoading ? <Spinner size={3} /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
              </button>
            )}
            {canReject && (
              <button onClick={() => onReject(e)} disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors
                  ${tab === t.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {tab === 'student' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                <SectionHeading title="Personal Information" icon={User} />
                <DetailRow label="Full Name"         value={fmt.name(e)} />
                <DetailRow label="Date of Birth"     value={fmt.date(e.date_of_birth)} />
                <DetailRow label="Gender"            value={e.gender} />
                <DetailRow label="Nationality"       value={e.nationality} />
                <DetailRow label="Religion"          value={e.religion} />
                <DetailRow label="Birth Cert No."    value={e.birth_certificate_number} mono />
                <DetailRow label="Special Needs"     value={e.special_needs ? 'Yes' : 'No'} />
                {e.special_needs && <DetailRow label="Details" value={e.special_needs_details} />}
              </div>

              {e.is_transfer && (
                <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <SectionHeading title="Transfer Information" icon={ArrowRightLeft} />
                  <DetailRow label="Previous School"    value={e.previous_school_name} />
                  <DetailRow label="School Address"     value={e.previous_school_address} />
                  <DetailRow label="Prev. Adm. No."     value={e.previous_admission_number} mono />
                  <DetailRow label="Leaving Cert. No."  value={e.leaving_certificate_number} mono />
                  <DetailRow label="Last Class"         value={e.last_class_attended} />
                </div>
              )}

              {e.enrollment_type === 'government_placement' && (
                <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <SectionHeading title="Government Placement" icon={Building2} />
                  <DetailRow label="Index Number"   value={e.assessment_index_number} mono />
                  <DetailRow label="Placement Year" value={e.placement_year} />
                  <DetailRow label="Reference Code" value={e.placement_reference_code} mono />
                  <DetailRow label="Placed At"      value={e.placement_school_name} />
                  <DetailRow label="Verification">
                    <PlacementBadge status={e.placement_verification_status} />
                  </DetailRow>
                  {e.placement_verification_notes && (
                    <DetailRow label="Verif. Notes" value={e.placement_verification_notes} />
                  )}
                  {e.placement_verified_at && (
                    <DetailRow label="Verified At" value={fmt.datetime(e.placement_verified_at)} />
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'parent' && (
            <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
              <SectionHeading title="Parent / Guardian Information" icon={UserCheck} />
              <DetailRow label="Full Name"      value={fmt.parentName(e)} />
              <DetailRow label="Relationship"   value={e.parent_relationship} />
              <DetailRow label="Phone">
                {e.parent_phone
                  ? <a href={`tel:${e.parent_phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />{e.parent_phone}
                    </a>
                  : <span className="text-slate-400 italic text-sm">—</span>
                }
              </DetailRow>
              <DetailRow label="Email">
                {e.parent_email
                  ? <a href={`mailto:${e.parent_email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3" />{e.parent_email}
                    </a>
                  : <span className="text-slate-400 italic text-sm">—</span>
                }
              </DetailRow>
              <DetailRow label="National ID"    value={e.parent_national_id} mono />
              <DetailRow label="Occupation"     value={e.parent_occupation} />
              <DetailRow label="Address">
                {e.parent_address
                  ? <span className="text-sm text-slate-800 dark:text-slate-200 flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />{e.parent_address}
                    </span>
                  : <span className="text-slate-400 italic text-sm">—</span>
                }
              </DetailRow>
            </div>
          )}

          {tab === 'academic' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                <SectionHeading title="Application Details" icon={BookOpen} />
                {/* Uses year + term from the nested academic_year object */}
                <DetailRow label="Term"              value={academicYearLabel} />
                <DetailRow label="Enrollment Type"><TypeBadge type={e.enrollment_type} /></DetailRow>
                <DetailRow label="Applying For"      value={e.applying_for_classroom?.class_name ?? '—'} />
                <DetailRow label="Preferred Stream"  value={e.applying_for_stream?.name ?? '—'} />
                <DetailRow label="Applied On"        value={fmt.datetime(e.applied_at)} />
              </div>

              {isApproved && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                  <SectionHeading title="Assigned Placement" icon={CheckCircle} />
                  <DetailRow label="Admission No.">
                    <span className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">
                      {e.student?.admission_number ?? '—'}
                    </span>
                  </DetailRow>
                  <DetailRow label="Classroom"     value={e.assigned_classroom?.class_name ?? '—'} />
                  <DetailRow label="Stream"        value={e.assigned_stream?.name ?? '—'} />
                  <DetailRow label="Approved On"   value={fmt.datetime(e.approved_at)} />
                  <DetailRow label="Approved By"   value={e.approved_by_user?.full_name ?? '—'} />
                </div>
              )}

              {e.status === 'rejected' && e.rejection_reason && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/40 rounded-xl p-4">
                  <SectionHeading title="Rejection Details" icon={XCircle} />
                  <DetailRow label="Reason"      value={e.rejection_reason} />
                  <DetailRow label="Rejected On" value={fmt.datetime(e.rejected_at)} />
                </div>
              )}
            </div>
          )}

          {tab === 'workflow' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                <SectionHeading title="Status Timeline" icon={Clock} />
                <div className="space-y-3 mt-2">
                  {[
                    { label: 'Application Created', date: e.created_at,  done: true },
                    { label: 'Submitted',            date: e.applied_at,  done: !!e.applied_at },
                    { label: 'Under Review',         date: e.reviewed_at, done: !!e.reviewed_at },
                    { label: e.status === 'rejected' ? 'Rejected' : 'Approved', date: e.approved_at || e.rejected_at, done: isApproved || e.status === 'rejected' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                        ${step.done
                          ? 'bg-black dark:bg-white border-black dark:border-white'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}>
                        {step.done && <div className="w-2 h-2 rounded-full bg-white dark:bg-black" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${step.done ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                          {step.label}
                        </p>
                        {step.date && <p className="text-xs text-slate-500 dark:text-slate-400">{fmt.datetime(step.date)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {e.admin_notes && (
                <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <SectionHeading title="Admin Notes" icon={MessageSquare} />
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{e.admin_notes}</p>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                <SectionHeading title="Review Chain" icon={UserCheck} />
                <DetailRow label="Reviewed By" value={e.reviewed_by ? (e.reviewedBy?.full_name ?? `User #${e.reviewed_by}`) : '—'} />
                <DetailRow label="Reviewed At" value={fmt.datetime(e.reviewed_at)} />
                <DetailRow label="Approved By" value={e.approved_by ? (e.approvedBy?.full_name ?? `User #${e.approved_by}`) : '—'} />
                <DetailRow label="Approved At" value={fmt.datetime(e.approved_at)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT ROW ACTIONS MENU
// ─────────────────────────────────────────────────────────────────────────────
const EnrollmentRowActionsMenu = ({
  enrollment, canReview, canApprove, canReject, isGov,
  actionLoading, onView, onStartReview, onApprove, onReject, onVerifyPlacement,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const e = enrollment;

  useEffect(() => {
    const handle = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const go = (fn) => { setOpen(false); fn(); };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl shadow-2xl py-1.5">
          <button onClick={() => go(() => onView(e))}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left">
            <Eye className="w-4 h-4 text-slate-400" />View Details
          </button>

          {canReview && (
            <button onClick={() => go(() => onStartReview(e))} disabled={actionLoading}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left disabled:opacity-50">
              <Clock className="w-4 h-4 text-amber-400" />Start Review
            </button>
          )}

          {isGov && (
            <button onClick={() => go(() => onVerifyPlacement(e))} disabled={actionLoading}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left disabled:opacity-50">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />Verify Placement
            </button>
          )}

          {canApprove && (
            <>
              <div className="my-1 border-t border-slate-700/60" />
              <button onClick={() => go(() => onApprove(e))} disabled={actionLoading}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-900/30 transition-colors text-left disabled:opacity-50">
                <CheckCircle className="w-4 h-4" />Approve
              </button>
            </>
          )}

          {canReject && (
            <button onClick={() => go(() => onReject(e))} disabled={actionLoading}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left disabled:opacity-50">
              <XCircle className="w-4 h-4" />Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const EnrollmentRow = ({ enrollment: e, onView, onStartReview, onApprove, onReject, onVerifyPlacement, actionLoading }) => {
  const canReview  = e.status === 'submitted';
  const canApprove = ['submitted', 'under_review'].includes(e.status);
  const canReject  = ['submitted', 'under_review', 'waitlisted'].includes(e.status);
  const isGov      = e.enrollment_type === 'government_placement';

  // Term label from the nested academic_year: "2026 — Term 1"
  const termLabel = e.academic_year
    ? `${e.academic_year.year} — ${e.academic_year.term}`
    : null;

  return (
    <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div>
          <button onClick={() => onView(e)} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-black dark:hover:text-slate-100 text-left">
            {fmt.name(e)}
          </button>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <TypeBadge type={e.enrollment_type} size="xs" />
            {e.is_transfer && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Transfer</span>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4 hidden md:table-cell">
        <div>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {e.applying_for_classroom?.class_name ?? '—'}
            {e.applying_for_stream?.name && <span className="text-slate-400"> / {e.applying_for_stream.name}</span>}
          </span>
          {/* Show term below the classroom for context */}
          {termLabel && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{termLabel}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-1">
          <StatusBadge status={e.status} />
          {isGov && <PlacementBadge status={e.placement_verification_status} size="xs" />}
        </div>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4 hidden lg:table-cell">
        {e.student?.admission_number
          ? <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
              {e.student.admission_number}
            </span>
          : <span className="text-slate-400 text-xs">—</span>
        }
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4 hidden lg:table-cell">
        <span className="text-xs text-slate-500 dark:text-slate-400">{fmt.date(e.applied_at)}</span>
      </td>
      <td className="px-4 py-3 md:px-6 md:py-4 text-right">
        <EnrollmentRowActionsMenu
          enrollment={e}
          canReview={canReview}
          canApprove={canApprove}
          canReject={canReject}
          isGov={isGov}
          actionLoading={actionLoading}
          onView={onView}
          onStartReview={onStartReview}
          onApprove={onApprove}
          onReject={onReject}
          onVerifyPlacement={onVerifyPlacement}
        />
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const EnrollmentManager = () => {
  const { user } = useAuth();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState([]);
  const [summary,     setSummary]     = useState({});
  const [classrooms,  setClassrooms]  = useState([]);
  const [streams,     setStreams]     = useState([]);
  const [hasStreams,   setHasStreams]  = useState(false);
  const [pagination,  setPagination]  = useState(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Config modal ───────────────────────────────────────────────────────────
  const [configOpen,    setConfigOpen]    = useState(false);
  // ALL academic years are passed to the modal (not filtered to active-only)
  // so admins can configure enrollment settings for any term — past, present, or future.
  const [academicYears, setAcademicYears] = useState([]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [showFilters,  setShowFilters]  = useState(false);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [page,         setPage]         = useState(1);
  const searchTimer = useRef(null);

  // ── Selected enrollment for drawer / modals ────────────────────────────────
  const [drawerEnrollment, setDrawerEnrollment] = useState(null);
  const [approveTarget,    setApproveTarget]    = useState(null);
  const [rejectTarget,     setRejectTarget]     = useState(null);
  const [placementTarget,  setPlacementTarget]  = useState(null);
  const [editTarget,       setEditTarget]       = useState(null);
  const [bulkVerifyOpen,   setBulkVerifyOpen]   = useState(false);

  // ── Fetch classrooms, streams, and ALL academic years once ────────────────
  // Academic years: we fetch ALL of them (no active filter) so the config modal
  // lets admins set up enrollment for any term, including future ones that
  // aren't yet active.
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [clsRes, strRes, yearRes] = await Promise.all([
          apiRequest('classrooms', 'GET'),
          apiRequest('streams', 'GET').catch(() => ({ data: [] })),
          apiRequest('academic-years', 'GET').catch(() => []),
        ]);
        const clsData  = Array.isArray(clsRes)  ? clsRes  : Array.isArray(clsRes?.data)  ? clsRes.data  : [];
        const strData  = Array.isArray(strRes)  ? strRes  : Array.isArray(strRes?.data)  ? strRes.data  : [];
        const yearData = Array.isArray(yearRes) ? yearRes : Array.isArray(yearRes?.data) ? yearRes.data : [];

        setClassrooms(clsData);
        setStreams(strData);
        setHasStreams(strData.length > 0);
        // Pass ALL years — the modal groups them by calendar year and marks
        // active ones with a ✓ so admins can still tell which term is live.
        setAcademicYears(yearData);
      } catch {
        // non-fatal — page still works without these
      }
    };
    fetchResources();
  }, []);

  // ── Fetch enrollments ──────────────────────────────────────────────────────
  const fetchEnrollments = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      const resolvedSearch = 'search' in params ? params.search : search;
      const resolvedStatus = 'status' in params ? params.status : statusFilter;
      const resolvedType   = 'type'   in params ? params.type   : typeFilter;
      const resolvedPage   = 'page'   in params ? params.page   : page;
      if (resolvedSearch) query.set('search',          resolvedSearch);
      if (resolvedStatus) query.set('status',          resolvedStatus);
      if (resolvedType)   query.set('enrollment_type', resolvedType);
      query.set('page',     resolvedPage);
      query.set('per_page', '20');

      const res = await apiRequest(`admin/enrollments?${query}`, 'GET');
      const data = res?.enrollments ?? res?.data ?? {};

      setEnrollments(data.data ?? []);
      setPagination({
        current_page: data.current_page ?? 1,
        last_page:    data.last_page    ?? 1,
        total:        data.total        ?? 0,
        per_page:     data.per_page     ?? 20,
        from:         data.from         ?? 0,
        to:           data.to           ?? 0,
      });
      setSummary(res?.summary ?? {});
    } catch {
      toast.error('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => { fetchEnrollments(); }, [statusFilter, typeFilter, page]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchEnrollments({ page: 1 }); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // ── Refresh a single enrollment and update the open drawer ────────────────
  const refreshDrawer = async (id) => {
    try {
      const res = await apiRequest(`admin/enrollments/${id}`, 'GET');
      const updated = res?.enrollment ?? null;
      if (updated) setDrawerEnrollment(updated);
    } catch { /* non-fatal */ }
  };

  // ── Surface validation errors from the backend ────────────────────────────
  const toastErrors = (err, fallback = 'Something went wrong.') => {
    const msgs = err?.response?.data?.errors;
    if (msgs) Object.values(msgs).flat().forEach(m => toast.error(m));
    else toast.error(err?.response?.data?.message ?? fallback);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStartReview = async (enrollment) => {
    setActionLoading(true);
    try {
      await apiRequest(`admin/enrollments/${enrollment.id}/review`, 'POST');
      toast.success('Application moved to Under Review.');
      fetchEnrollments();
      if (drawerEnrollment?.id === enrollment.id) refreshDrawer(enrollment.id);
    } catch (err) { toastErrors(err, 'Failed to start review.'); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async (payload) => {
    setActionLoading(true);
    const targetId = approveTarget.id;
    const wasDrawerOpen = drawerEnrollment?.id === targetId;
    try {
      const res = await apiRequest(`admin/enrollments/${targetId}/approve`, 'POST', payload);
      toast.success(`Approved! Admission number: ${res?.admission_number ?? '—'}`);
      setApproveTarget(null);
      fetchEnrollments();
      if (wasDrawerOpen) refreshDrawer(targetId);
      else setDrawerEnrollment(null);
    } catch (err) { toastErrors(err, 'Approval failed.'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (payload) => {
    setActionLoading(true);
    const targetId = rejectTarget.id;
    const wasDrawerOpen = drawerEnrollment?.id === targetId;
    try {
      await apiRequest(`admin/enrollments/${targetId}/reject`, 'POST', payload);
      toast.success('Enrollment rejected.');
      setRejectTarget(null);
      fetchEnrollments();
      if (wasDrawerOpen) refreshDrawer(targetId);
      else setDrawerEnrollment(null);
    } catch (err) { toastErrors(err, 'Rejection failed.'); }
    finally { setActionLoading(false); }
  };

  const handleVerifyPlacement = async (payload) => {
    setActionLoading(true);
    const targetId = placementTarget.id;
    try {
      await apiRequest(`admin/enrollments/${targetId}/verify-placement`, 'POST', payload);
      toast.success('Placement verification saved.');
      setPlacementTarget(null);
      fetchEnrollments();
      if (drawerEnrollment?.id === targetId) refreshDrawer(targetId);
    } catch (err) { toastErrors(err, 'Verification failed.'); }
    finally { setActionLoading(false); }
  };

  const handleBulkVerify = async (payload) => {
    setActionLoading(true);
    try {
      const res = await apiRequest('admin/enrollments/placements/bulk-verify', 'POST', payload);
      const verified = res?.verified_count ?? 0;
      const notFound = res?.not_found_in_system?.count ?? 0;
      toast.success(`Bulk verify complete — ${verified} verified.`);
      if (notFound > 0) toast.warn(`${notFound} index number(s) had no matching application in the system.`);
      setBulkVerifyOpen(false);
      fetchEnrollments();
    } catch (err) { toastErrors(err, 'Bulk verification failed.'); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async (payload) => {
    setActionLoading(true);
    const targetId = editTarget.id;
    try {
      const res = await apiRequest(`admin/enrollments/${targetId}`, 'PUT', payload);
      toast.success('Enrollment updated.');
      setEditTarget(null);
      fetchEnrollments();
      if (drawerEnrollment?.id === targetId) {
        const updated = res?.enrollment ?? null;
        if (updated) setDrawerEnrollment(updated);
        else refreshDrawer(targetId);
      }
    } catch (err) { toastErrors(err, 'Update failed.'); }
    finally { setActionLoading(false); }
  };

  const handlePromote = async (enrollment) => {
    setActionLoading(true);
    try {
      await apiRequest('admin/enrollments/waitlist/promote', 'POST', {
        academic_year_id: enrollment.academic_year_id,
      });
      toast.success('Application promoted from waitlist to submitted.');
      setDrawerEnrollment(null);
      fetchEnrollments();
    } catch (err) { toastErrors(err, 'Promotion failed.'); }
    finally { setActionLoading(false); }
  };

  // ── Filter options ─────────────────────────────────────────────────────────
  const statusOptions = [
    { value: '',             label: 'All'          },
    { value: 'submitted',    label: 'Submitted'    },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved',     label: 'Approved'     },
    { value: 'rejected',     label: 'Rejected'     },
    { value: 'waitlisted',   label: 'Waitlisted'   },
    { value: 'draft',        label: 'Draft'        },
  ];

  const typeOptions = [
    { value: '',                     label: 'All Types'      },
    { value: 'new_student',          label: 'New Student'    },
    { value: 'transfer',             label: 'Transfer'       },
    { value: 'government_placement', label: 'Gov. Placement' },
    { value: 're_enrollment',        label: 'Re-Enrollment'  },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Enrollment Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base">
            Review, approve and manage student applications for your school.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setConfigOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 hidden md:flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm"
          >
            <Settings className="w-4 h-4" /><span className="hidden sm:inline">Configure</span>
          </button>
          <button
            onClick={() => setBulkVerifyOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 hidden md:flex items-center gap-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm"
          >
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Bulk Verify</span>
          </button>
          <button
            onClick={() => fetchEnrollments()}
            disabled={loading}
            title="Refresh"
            className="bg-black text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Overview</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <SummaryCard label="Total"        value={summary.total}        color="slate"   onClick={() => { setStatusFilter(''); setPage(1); }}             active={statusFilter === ''} />
          <SummaryCard label="Submitted"    value={summary.submitted}    color="blue"    onClick={() => { setStatusFilter('submitted'); setPage(1); }}    active={statusFilter === 'submitted'} />
          <SummaryCard label="Under Review" value={summary.under_review} color="amber"   onClick={() => { setStatusFilter('under_review'); setPage(1); }} active={statusFilter === 'under_review'} />
          <SummaryCard label="Approved"     value={summary.approved}     color="emerald" onClick={() => { setStatusFilter('approved'); setPage(1); }}     active={statusFilter === 'approved'} />
          <SummaryCard label="Rejected"     value={summary.rejected}     color="red"     onClick={() => { setStatusFilter('rejected'); setPage(1); }}     active={statusFilter === 'rejected'} />
          <SummaryCard label="Waitlisted"   value={summary.waitlisted}   color="purple"  onClick={() => { setStatusFilter('waitlisted'); setPage(1); }}   active={statusFilter === 'waitlisted'} />
          <SummaryCard label="Draft"        value={summary.draft}        color="slate"   onClick={() => { setStatusFilter('draft'); setPage(1); }}        active={statusFilter === 'draft'} />
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">
        <button onClick={() => setShowFilters(f => !f)} className="md:hidden w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
            <span className="text-xs text-slate-500">({enrollments.length} shown)</span>
            {(search || statusFilter || typeFilter) && (
              <span className="px-1.5 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">Active</span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
        </button>

        <div className="hidden md:flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
        </div>

        <div className={`${showFilters ? '' : 'hidden'} md:block`}>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, phone or email…"
                className={CLS.input + ' pl-9 pr-3.5'}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className={CLS.select + ' sm:w-48'}
            >
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {statusOptions.map(o => (
              <button
                key={o.value}
                onClick={() => { setStatusFilter(o.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${statusFilter === o.value
                    ? 'bg-cyan-500 text-white border-cyan-500 dark:bg-cyan-500 dark:border-cyan-500'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-600'
                  }`}
              >
                {o.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {enrollments.length} application{enrollments.length !== 1 ? 's' : ''} shown
            </span>
          </div>
        </div>
      </div>

      {/* Enrollments table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 mb-4 md:mb-6 overflow-hidden">
        {!loading && (
          <div className="px-4 md:px-6 pt-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Enrollment Applications
              {pagination && (
                <span className="ml-1.5 text-slate-400 font-normal text-sm">
                  ({enrollments.length}{pagination.total ? ` / ${pagination.total} total` : ''})
                </span>
              )}
            </h2>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading Enrollments...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No enrollments found"
            subtitle={search || statusFilter || typeFilter
              ? 'Try adjusting your filters or search terms.'
              : 'Enrollment applications will appear here once parents start applying.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="border-0">
              {/* Pagination */}
              {pagination && pagination.total > 0 && (() => {
                const { total, per_page, current_page, last_page, from = 0, to = 0 } = pagination;
                const PER_PAGE_OPTIONS = [10, 20, 50, 100];
                const ws = 2;
                let start = Math.max(1, current_page - ws);
                let end   = Math.min(last_page, current_page + ws);
                if (end - start < 4) {
                  if (start === 1) end   = Math.min(last_page, start + 4);
                  else             start = Math.max(1, end - 4);
                }
                const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                const btnBase     = 'h-9 min-w-[36px] px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed';
                const btnGhost    = `${btnBase} text-[#4c739a] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700`;
                const btnActive   = `${btnBase} bg-cyan-500 text-white shadow-sm`;
                const btnInactive = `${btnBase} text-[#0d141b] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700`;
                return (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 text-sm text-[#4c739a] dark:text-slate-400">
                      <span>
                        {from}–{to} of{' '}
                        <strong className="text-[#0d141b] dark:text-white">{total.toLocaleString()}</strong> applications
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="hidden sm:inline text-xs">Rows:</span>
                        <select
                          value={per_page}
                          onChange={e => { setPage(1); fetchEnrollments({ page: 1, per_page: Number(e.target.value) }); }}
                          className="h-8 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(1)}                              disabled={current_page === 1}         className={btnGhost}><ChevronsLeft  className="w-4 h-4" /></button>
                      <button onClick={() => setPage(p => Math.max(1, p-1))}          disabled={current_page === 1}         className={btnGhost}><ChevronLeft   className="w-4 h-4" /></button>
                      {start > 1       && <span className="px-1 text-[#4c739a] text-sm">…</span>}
                      {pages.map(p => (
                        <button key={p} onClick={() => setPage(p)} className={p === current_page ? btnActive : btnInactive}>{p}</button>
                      ))}
                      {end < last_page && <span className="px-1 text-[#4c739a] text-sm">…</span>}
                      <button onClick={() => setPage(p => Math.min(last_page, p+1))}  disabled={current_page === last_page} className={btnGhost}><ChevronRight  className="w-4 h-4" /></button>
                      <button onClick={() => setPage(last_page)}                       disabled={current_page === last_page} className={btnGhost}><ChevronsRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })()}

              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-left">Student</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-left hidden md:table-cell">Applying For</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-left">Status</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-left hidden lg:table-cell">Adm. No.</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-left hidden lg:table-cell">Applied</th>
                    <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <EnrollmentRow
                      key={e.id}
                      enrollment={e}
                      onView={setDrawerEnrollment}
                      onStartReview={handleStartReview}
                      onApprove={setApproveTarget}
                      onReject={setRejectTarget}
                      onVerifyPlacement={setPlacementTarget}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <DetailDrawer
        isOpen={!!drawerEnrollment}
        enrollment={drawerEnrollment}
        classrooms={classrooms}
        streams={streams}
        hasStreams={hasStreams}
        onClose={() => setDrawerEnrollment(null)}
        onStartReview={handleStartReview}
        onApprove={setApproveTarget}
        onReject={setRejectTarget}
        onVerifyPlacement={setPlacementTarget}
        onEdit={setEditTarget}
        onPromote={handlePromote}
        actionLoading={actionLoading}
      />

      <ApproveModal
        isOpen={!!approveTarget}
        enrollment={approveTarget}
        classrooms={classrooms}
        streams={streams}
        hasStreams={hasStreams}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        loading={actionLoading}
      />

      <RejectModal
        isOpen={!!rejectTarget}
        enrollment={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={actionLoading}
      />

      <PlacementModal
        isOpen={!!placementTarget}
        enrollment={placementTarget}
        onClose={() => setPlacementTarget(null)}
        onConfirm={handleVerifyPlacement}
        loading={actionLoading}
      />

      <BulkVerifyModal
        isOpen={bulkVerifyOpen}
        onClose={() => setBulkVerifyOpen(false)}
        onConfirm={handleBulkVerify}
        loading={actionLoading}
      />

      <EditModal
        isOpen={!!editTarget}
        enrollment={editTarget}
        classrooms={classrooms}
        streams={streams}
        hasStreams={hasStreams}
        onClose={() => setEditTarget(null)}
        onConfirm={handleEdit}
        loading={actionLoading}
      />

      <EnrollmentConfigModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        academicYears={academicYears}
        onSuccess={() => fetchEnrollments()}
      />
    </div>
  );
};

export default EnrollmentManager;
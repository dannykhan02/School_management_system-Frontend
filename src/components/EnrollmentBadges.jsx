import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ListOrdered,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  GitBranch,
  ArrowRightLeft,
  Building2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  draft: {
    label: 'Draft',
    icon: Clock,
    classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    dot: 'bg-slate-400',
  },
  submitted: {
    label: 'Submitted',
    icon: ListOrdered,
    classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    dot: 'bg-amber-500 animate-pulse',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    dot: 'bg-red-500',
  },
  waitlisted: {
    label: 'Waitlisted',
    icon: ListOrdered,
    classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT TYPE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_MAP = {
  new_student: {
    label: 'New Student',
    icon: GitBranch,
    classes: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowRightLeft,
    classes: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  },
  government_placement: {
    label: 'Gov. Placement',
    icon: Building2,
    classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
  },
  re_enrollment: {
    label: 'Re-Enrollment',
    icon: ArrowRightLeft,
    classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PLACEMENT VERIFICATION CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PLACEMENT_MAP = {
  pending: {
    label: 'Unverified',
    icon: ShieldQuestion,
    classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  },
  disputed: {
    label: 'Disputed',
    icon: ShieldAlert,
    classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  },
  manual: {
    label: 'Manual Review',
    icon: Eye,
    classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
export const StatusBadge = ({ status, size = 'sm' }) => {
  const cfg = STATUS_MAP[status] || {
    label: status,
    icon: Clock,
    classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    dot: 'bg-slate-400',
  };

  const Icon = cfg.icon;
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const px      = size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${px} rounded-full border font-semibold ${textSize} ${cfg.classes}`}>
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────
export const TypeBadge = ({ type, size = 'sm' }) => {
  const cfg = TYPE_MAP[type] || {
    label: type,
    icon: GitBranch,
    classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  };

  const Icon = cfg.icon;
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const px      = size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${px} rounded-full border font-semibold ${textSize} ${cfg.classes}`}>
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLACEMENT VERIFICATION BADGE
// ─────────────────────────────────────────────────────────────────────────────
export const PlacementBadge = ({ status, size = 'sm' }) => {
  if (!status) return null;
  const cfg = PLACEMENT_MAP[status] || PLACEMENT_MAP.pending;
  const Icon = cfg.icon;
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const px       = size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 ${px} rounded-full border font-semibold ${textSize} ${cfg.classes}`}>
      <Icon className={iconSize} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY STAT CARD  (used in the header row)
// ─────────────────────────────────────────────────────────────────────────────
export const SummaryCard = ({ label, value, color = 'slate', onClick, active }) => {
  const colorMap = {
    slate:   { bg: 'bg-slate-50  dark:bg-slate-800',  ring: 'ring-slate-300  dark:ring-slate-600',  val: 'text-slate-800  dark:text-slate-100',  lbl: 'text-slate-500  dark:text-slate-400' },
    blue:    { bg: 'bg-blue-50   dark:bg-blue-900/20', ring: 'ring-blue-300   dark:ring-blue-700',   val: 'text-blue-800   dark:text-blue-200',    lbl: 'text-blue-600   dark:text-blue-400'  },
    amber:   { bg: 'bg-amber-50  dark:bg-amber-900/20',ring: 'ring-amber-300  dark:ring-amber-700',  val: 'text-amber-800  dark:text-amber-200',   lbl: 'text-amber-600  dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20',ring:'ring-emerald-300 dark:ring-emerald-700',val:'text-emerald-800 dark:text-emerald-200',lbl:'text-emerald-600 dark:text-emerald-400'},
    red:     { bg: 'bg-red-50    dark:bg-red-900/20',  ring: 'ring-red-300    dark:ring-red-700',    val: 'text-red-800    dark:text-red-200',     lbl: 'text-red-600    dark:text-red-400'   },
    purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20',ring:'ring-purple-300 dark:ring-purple-700', val:'text-purple-800 dark:text-purple-200',   lbl:'text-purple-600 dark:text-purple-400' },
  };

  const c = colorMap[color] || colorMap.slate;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center
        ${c.bg}
        ${active
          ? `ring-2 ${c.ring} border-transparent shadow-sm`
          : 'border-slate-200 dark:border-slate-700 hover:shadow-sm'
        }
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <span className={`text-xl font-black tabular-nums ${c.val}`}>{value ?? 0}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${c.lbl}`}>{label}</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL ROW  (label + value pair used inside detail panels)
// ─────────────────────────────────────────────────────────────────────────────
export const DetailRow = ({ label, value, mono = false, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide sm:w-40 flex-shrink-0 pt-0.5">
      {label}
    </span>
    {children
      ? <div className="flex-1">{children}</div>
      : <span className={`text-sm text-slate-800 dark:text-slate-200 flex-1 ${mono ? 'font-mono' : ''}`}>
          {value ?? <span className="text-slate-400 dark:text-slate-500 italic">—</span>}
        </span>
    }
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING  (card-internal section divider)
// ─────────────────────────────────────────────────────────────────────────────
export const SectionHeading = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3">
    {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{title}</h4>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
      <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
    </div>
    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</p>
    {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">{subtitle}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT HELPERS  (shared utilities, no import needed elsewhere)
// ─────────────────────────────────────────────────────────────────────────────
export const fmt = {
  date: (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  datetime: (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  name: (e) => {
    if (!e) return '—';
    return [e.first_name, e.middle_name, e.last_name].filter(Boolean).join(' ');
  },
  parentName: (e) => {
    if (!e) return '—';
    return [e.parent_first_name, e.parent_last_name].filter(Boolean).join(' ');
  },
};

export default { StatusBadge, TypeBadge, PlacementBadge, SummaryCard, DetailRow, SectionHeading, EmptyState, fmt };
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Loader, Hash, RefreshCw, Save, Eye, RotateCcw,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  Settings, AlertTriangle, Copy, Check, ArrowRight,
  BookOpen, Zap, Shield, HelpCircle, X,
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  card:       'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
  primary:    'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  cancelPill: 'px-5 py-2 rounded-full text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50',
  deletePill: 'px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5',
  input:      'w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 transition-all',
};

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS GUIDE
// ─────────────────────────────────────────────────────────────────────────────
const HowItWorksGuide = () => {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      icon: '📋',
      title: 'Parent submits enrollment form',
      desc: 'A parent fills out the online form to enroll their child. No admission number is assigned yet — the student is just "pending".',
      colour: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    {
      icon: '✅',
      title: 'Admin reviews and approves',
      desc: 'You (the admin) review the application and click "Approve". At this exact moment, the system automatically generates a unique admission number.',
      colour: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    },
    {
      icon: '🔢',
      title: 'Number is generated using YOUR pattern',
      desc: 'The system uses the pattern you configured here. For example: KHS/2025/0001 → KHS/2025/0002 → KHS/2025/0003 and so on, automatically.',
      colour: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',
    },
    {
      icon: '📨',
      title: 'Parent is notified immediately',
      desc: 'The admission number is sent to the parent via email and SMS. The student record is also created in the system with that number.',
      colour: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    },
  ];

  const concepts = [
    { term: 'Pattern',         plain: 'The "template" for your number. Think of it like a format you choose, e.g. KHS/2025/001. The system fills in the blanks automatically.' },
    { term: 'Prefix',          plain: 'Your school\'s short code — usually 2–4 letters. E.g. "KHS" for Kibera High School. It appears at the start of every admission number.' },
    { term: 'Padding',         plain: 'How many digits the number part should have. Padding = 3 means numbers look like 001, 002 ... 999. Padding = 4 means 0001, 0002 ... 9999.' },
    { term: 'Sequence',        plain: 'A simple counter that goes up by 1 every time you approve a student. It never goes backwards unless you manually reset it.' },
    { term: 'Year in pattern', plain: 'When you include {YEAR} in your pattern, the current year is inserted automatically (e.g. 2025). This helps distinguish students from different years.' },
  ];

  return (
    <div className={`${CLS.card} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">How does this all work?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plain-English guide — click to {open ? 'hide' : 'read'}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-6 pt-5 space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">The Admission Flow</p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-xl border ${step.colour}`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{step.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Step {i + 1}: {step.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Plain-English Glossary</p>
            <div className="space-y-2">
              {concepts.map((c, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-md bg-black text-white dark:bg-white dark:text-black whitespace-nowrap h-fit mt-0.5">
                    {c.term}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.plain}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Numbers are always unique</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                Even if two admins click "Approve" at the exact same millisecond, the system uses a database lock to guarantee no two students ever get the same admission number.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Set this up once, forget it forever</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Once you save your configuration, you never need to touch this page again unless you want to change your format or start a new academic year. The numbers generate themselves.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN DECODER — live visual breakdown of the pattern
// ─────────────────────────────────────────────────────────────────────────────
const PatternDecoder = ({ pattern, prefix, numberPadding, yearFormat }) => {
  if (!pattern) return null;

  const segments = [];
  const tokenRegex = /(\{PREFIX\}|\{YEAR\}|\{NUMBER\})/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(pattern)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'separator', value: pattern.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'token', value: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < pattern.length) {
    segments.push({ type: 'separator', value: pattern.slice(lastIndex) });
  }

  const getTokenInfo = (token) => {
    const year = new Date().getFullYear();
    const shortYear = String(year).slice(-2);
    switch (token) {
      case '{PREFIX}':
        return {
          example: prefix || 'ABC',
          label:   prefix ? `Your prefix "${prefix}"` : 'School prefix (set below)',
          colour:  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        };
      case '{YEAR}':
        return {
          example: yearFormat === 'YY' ? shortYear : String(year),
          label:   yearFormat === 'YY' ? `2-digit year (${shortYear})` : `4-digit year (${year})`,
          colour:  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        };
      case '{NUMBER}':
        return {
          example: String(1).padStart(numberPadding || 3, '0'),
          label:   `Auto counter, ${numberPadding} digit${numberPadding > 1 ? 's' : ''} wide`,
          colour:  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
        };
      default:
        return { example: token, label: '', colour: '' };
    }
  };

  return (
    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pattern breakdown</p>
      <div className="flex flex-wrap items-center gap-1 mb-3">
        {segments.map((seg, i) => {
          if (seg.type === 'separator') {
            return <span key={i} className="font-mono text-base font-bold text-slate-500 dark:text-slate-400">{seg.value}</span>;
          }
          const info = getTokenInfo(seg.value);
          return (
            <span key={i} className={`px-2 py-0.5 rounded-md font-mono text-sm font-bold ${info.colour}`}>
              {info.example}
            </span>
          );
        })}
      </div>
      <div className="space-y-1">
        {segments.filter(s => s.type === 'token').map((seg, i) => {
          const info = getTokenInfo(seg.value);
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${info.colour}`}>{seg.value}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW BADGE
// ─────────────────────────────────────────────────────────────────────────────
const PreviewBadge = ({ preview, loading }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!preview) return;
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-mono text-base font-black tracking-widest transition-all
        ${loading
          ? 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
          : preview
            ? 'border-cyan-400 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 shadow-sm shadow-cyan-100 dark:shadow-none'
            : 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-800'
        }`}
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : (preview || '—')}
      </div>
      {preview && !loading && (
        <button
          onClick={handleCopy}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET SEQUENCE MODAL
// ─────────────────────────────────────────────────────────────────────────────
const ResetModal = ({ isOpen, onClose, onConfirm, loading, currentSequence }) => {
  const [resetTo, setResetTo] = useState(0);
  const [mode, setMode] = useState('zero');

  if (!isOpen) return null;

  const targetSequence = mode === 'zero' ? 0 : Math.max(0, parseInt(resetTo, 10) || 0);
  const nextNumber = targetSequence + 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
              <RotateCcw className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Sequence Counter</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Current counter is at <strong className="text-slate-700 dark:text-slate-300">{currentSequence}</strong>.
                Next approval would generate number <strong className="text-slate-700 dark:text-slate-300">#{currentSequence + 1}</strong>.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          {/* Explanation */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            <strong className="text-slate-800 dark:text-slate-200">What does "reset sequence" mean?</strong><br />
            The sequence is the counter that auto-increments every time you approve a student. Resetting it changes what the <em>next</em> number will be.
            Use this when starting a new academic year, or when migrating from paper records.
          </div>

          {/* Mode selection */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">What do you want to do?</p>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${mode === 'zero'
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}>
              <input type="radio" name="resetMode" value="zero" checked={mode === 'zero'} onChange={() => setMode('zero')} className="mt-0.5 accent-red-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Start fresh from 1</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Next student approved gets number 1. Use this for a new academic year.</p>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all
              ${mode === 'custom'
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}>
              <input type="radio" name="resetMode" value="custom" checked={mode === 'custom'} onChange={() => setMode('custom')} className="mt-0.5 accent-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Continue from existing paper records</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Already have students on paper? Enter the last number used so this system continues from there.</p>
                {mode === 'custom' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">Last paper number used:</label>
                    <input
                      type="number"
                      min="0"
                      value={resetTo}
                      onChange={e => setResetTo(e.target.value)}
                      className="w-28 px-2.5 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="e.g. 6000"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Result preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">After reset, next approved student gets:</span>
            <span className="font-mono font-black text-slate-900 dark:text-white text-sm">#{nextNumber}</span>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl mb-5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-300">
              <strong>This cannot be undone.</strong> If students already have numbers above your reset target, you risk duplicate numbers. Only proceed if you are sure.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={loading} className={CLS.cancelPill}>Cancel</button>
          <button onClick={() => onConfirm(targetSequence)} disabled={loading} className={CLS.deletePill}>
            {loading
              ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Resetting…</>
              : <><RotateCcw className="w-3.5 h-3.5" />Confirm Reset</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
const FORMAT_TEMPLATES = [
  { label: 'PREFIX/YEAR/001', pattern: '{PREFIX}/{YEAR}/{NUMBER}', desc: 'Most common — includes school code and year' },
  { label: 'PREFIX/001',      pattern: '{PREFIX}/{NUMBER}',        desc: 'Simple — school code + number, no year' },
  { label: 'PREFIX-YEAR-001', pattern: '{PREFIX}-{YEAR}-{NUMBER}', desc: 'Dash separated version' },
  { label: 'YEAR/001',        pattern: '{YEAR}/{NUMBER}',          desc: 'No prefix — just year and number' },
  { label: '001',             pattern: '{NUMBER}',                 desc: 'Simplest — just the number' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function AdmissionConfigManager() {
  const { user, loading: authLoading } = useAuth();

  const [config, setConfig]                 = useState(null);
  const [loading, setLoading]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [resetting, setResetting]           = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAdvanced, setShowAdvanced]     = useState(false);
  const [isDirty, setIsDirty]               = useState(false);

  // ── formData mirrors StoreAdmissionConfigRequest exactly ────────────────────
  const [formData, setFormData] = useState({
    enabled:               true,
    pattern:               '{PREFIX}/{YEAR}/{NUMBER}',
    prefix:                '',
    separator:             '/',
    number_padding:        4,
    include_year:          true,
    year_format:           'YYYY',
    sequence_start:        1,
    reset_yearly:          false,
    allow_manual_override: false,
  });

  const [preview, setPreview]               = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState('');

  const previewDebounceRef = useRef(null);
  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;
  const patternUsesYear = formData.pattern.includes('{YEAR}');

  // Auto-sync include_year from pattern content
  useEffect(() => {
    if (patternUsesYear !== formData.include_year) {
      setFormData(prev => ({ ...prev, include_year: patternUsesYear }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternUsesYear]);

  // Initial load
  useEffect(() => {
    if (schoolId) fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  // Debounced auto-preview on form change
  // NOTE: This preview endpoint is stateless (uses sequence_start param, not DB).
  // It is only used while the admin is TYPING their config.
  // After a reset, preview comes from the reset endpoint response directly.
  useEffect(() => {
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(fetchPreview, 400);
    return () => clearTimeout(previewDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.pattern,
    formData.prefix,
    formData.number_padding,
    formData.include_year,
    formData.year_format,
    formData.separator,
  ]);

  // ── fetchConfig ─────────────────────────────────────────────────────────────
  // Reads the saved config from DB.
  // Response: { status, config: {...}, preview: "KHS/2025/6002" }
  // The `preview` field here is generated by $config->previewNextNumber() on the
  // real saved record — so it correctly reflects current_sequence from DB.
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('admin/admission-config', 'GET');
      const cfg  = response?.config  ?? response?.data?.config  ?? null;
      const prvw = response?.preview ?? response?.data?.preview ?? '';

      if (cfg) {
        setConfig(cfg);
        setFormData({
          enabled:               cfg.enabled               ?? true,
          pattern:               cfg.pattern               || '{PREFIX}/{YEAR}/{NUMBER}',
          prefix:                cfg.prefix                || '',
          separator:             cfg.separator             || '/',
          number_padding:        cfg.number_padding        || 4,
          include_year:          cfg.include_year          ?? true,
          year_format:           cfg.year_format           || 'YYYY',
          sequence_start:        1,
          reset_yearly:          cfg.reset_yearly          ?? false,
          allow_manual_override: cfg.allow_manual_override ?? false,
        });
        // Use the preview from the show endpoint — it reads real DB sequence
        setPreview(prvw);
      }
      setIsDirty(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load admission config');
    } finally {
      setLoading(false);
    }
  };

  // ── fetchPreview ────────────────────────────────────────────────────────────
  // STATELESS — backend builds a temp in-memory config using sequence_start param.
  // This means it always previews from sequence_start (default: 1), NOT the real
  // DB counter. This is intentional — it shows "what will the format look like"
  // as the admin types, not "what is the next real number".
  //
  // DO NOT call this after a reset — use the reset endpoint's next_preview instead.
  const fetchPreview = async () => {
    if (!formData.pattern) return;
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const params = new URLSearchParams({
        pattern:        formData.pattern,
        prefix:         formData.prefix        || '',
        separator:      formData.separator      || '/',
        number_padding: formData.number_padding || 4,
        include_year:   formData.include_year ? '1' : '0',
        year_format:    formData.year_format   || 'YYYY',
        sequence_start: formData.sequence_start || 1,
      });
      const response = await apiRequest(`admin/admission-config/preview?${params.toString()}`, 'GET');
      setPreview(response?.preview ?? response?.data?.preview ?? '');
    } catch (err) {
      setPreviewError(err?.response?.data?.message || 'Preview unavailable');
      setPreview('');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── handleSave ──────────────────────────────────────────────────────────────
  // Payload matches StoreAdmissionConfigRequest 1-to-1.
  // Response: { status, config: {...}, preview: "KHS/2025/6002" }
  // The preview here is from $config->fresh()->previewNextNumber() — real DB sequence.
  const handleSave = async () => {
    if (!formData.pattern.trim()) {
      toast.error('Pattern is required');
      return;
    }
    if (!formData.pattern.includes('{NUMBER}')) {
      toast.error('Pattern must contain the {NUMBER} token');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        enabled:               formData.enabled,
        pattern:               formData.pattern.trim(),
        prefix:                formData.prefix.trim() || null,
        separator:             formData.separator ?? '/',
        number_padding:        parseInt(formData.number_padding, 10),
        include_year:          formData.include_year,
        year_format:           formData.include_year ? (formData.year_format || 'YYYY') : undefined,
        sequence_start:        parseInt(formData.sequence_start, 10) || 1,
        reset_yearly:          formData.reset_yearly,
        allow_manual_override: formData.allow_manual_override,
      };

      const response = await apiRequest('admin/admission-config', 'POST', payload);
      const cfg  = response?.config  ?? response?.data?.config  ?? null;
      // Use preview from save response — reads real DB sequence via $config->fresh()
      const prvw = response?.preview ?? response?.data?.preview ?? '';

      if (cfg) setConfig(cfg);
      if (prvw) setPreview(prvw);
      setIsDirty(false);
      toast.success('Admission number configuration saved successfully');
    } catch (error) {
      const errors = error?.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(m))
        );
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save configuration');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── handleReset ─────────────────────────────────────────────────────────────
  //
  // WHY fetchPreview() is NOT called here:
  // ─────────────────────────────────────
  // The /preview endpoint is STATELESS. It builds a temporary in-memory config
  // using the `sequence_start` query param (default: 1), completely ignoring the
  // real current_sequence stored in DB. So after a reset to 6001, calling
  // fetchPreview() would still return "JHS/2026/001" because sequence_start=1.
  //
  // The /reset-sequence endpoint response already includes `next_preview` which
  // is generated by $fresh->previewNextNumber() — this reads the REAL DB value.
  // We use that directly to update the preview badge instantly and correctly.
  //
  // Response shape: { status, message, config: {...}, next_preview: "JHS/2026/6002" }
  const handleReset = async (targetSequence) => {
    setResetting(true);
    try {
      const response = await apiRequest('admin/admission-config/reset-sequence', 'POST', {
        current_sequence: targetSequence,
      });

      // ✅ Read next_preview from the reset response — it reads the real DB sequence
      // ❌ Do NOT call fetchPreview() — that uses sequence_start param, always shows 001
      const freshPreview = response?.next_preview
                        ?? response?.data?.next_preview
                        ?? '';
      const freshConfig  = response?.config
                        ?? response?.data?.config
                        ?? null;

      // Update both config state and preview badge from the single reset response
      if (freshConfig) setConfig(freshConfig);
      if (freshPreview) setPreview(freshPreview);

      toast.success(
        targetSequence === 0
          ? 'Sequence reset. Next student will be #1.'
          : `Sequence set to ${targetSequence}. Next student will be #${targetSequence + 1}.`
      );
      setShowResetModal(false);

    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reset sequence');
    } finally {
      setResetting(false);
    }
  };

  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      pattern:      tpl.pattern,
      include_year: tpl.pattern.includes('{YEAR}'),
    }));
    setIsDirty(true);
  };

  const TOKENS = [
    { token: '{PREFIX}', colour: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',     tip: 'Inserts your school prefix (e.g. KHS)' },
    { token: '{YEAR}',   colour: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800', tip: 'Inserts the current year (e.g. 2025)' },
    { token: '{NUMBER}', colour: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',     tip: 'Inserts the auto-incrementing number' },
  ];

  // ── Early returns ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24">
        <Loader className="w-10 h-10 text-slate-400 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Initializing…</p>
      </div>
    );
  }
  if (!user || !schoolId) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-900 dark:text-slate-100 text-lg font-bold mb-2">Unable to access admission configuration</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-slate-900 dark:text-white text-2xl sm:text-3xl font-black leading-tight tracking-tight">
              Admission Number Setup
            </h1>
            {isDirty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                <AlertTriangle className="w-2.5 h-2.5" /> Unsaved changes
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Configure how admission numbers look when a student enrollment is approved.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={fetchConfig}
            disabled={loading}
            title="Refresh from server"
            className="p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${CLS.primary}`}
          >
            {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Config</>}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="w-10 h-10 text-slate-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading configuration…</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-4 md:space-y-5">

            {/* Not-configured banner */}
            {!config && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">No configuration saved yet</p>
                  <p className="text-xs text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
                    You must save a configuration before any enrollment approvals can happen. Choose a pattern below and click <strong>Save Config</strong>.
                  </p>
                </div>
              </div>
            )}

            <HowItWorksGuide />

            {/* Pattern builder card */}
            <div className={`${CLS.card} rounded-xl p-5 sm:p-6`}>
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/30">
                  <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Number Pattern</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This defines what your admission numbers will look like</p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black flex-shrink-0">1</span>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pick a starting template</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FORMAT_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.pattern}
                      onClick={() => applyTemplate(tpl)}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all
                        ${formData.pattern === tpl.pattern
                          ? 'bg-cyan-500 text-white border-cyan-500 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-600'
                        }`}
                    >
                      <p className="font-mono text-sm font-bold">{tpl.label}</p>
                      <p className={`text-[10px] mt-0.5 ${formData.pattern === tpl.pattern ? 'text-cyan-100' : 'text-slate-400 dark:text-slate-500'}`}>{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black flex-shrink-0">2</span>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Customise the pattern <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={e => handleChange('pattern', e.target.value)}
                  placeholder="{PREFIX}/{YEAR}/{NUMBER}"
                  className={`${CLS.input} font-mono ${
                    formData.pattern && !formData.pattern.includes('{NUMBER}')
                      ? 'border-red-400 dark:border-red-600 focus:ring-red-400'
                      : ''
                  }`}
                />
                {formData.pattern && !formData.pattern.includes('{NUMBER}') ? (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Pattern must include <code className="px-1 bg-red-100 dark:bg-red-900/40 rounded font-mono">{'{NUMBER}'}</code> — this is how the counter gets inserted.
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Click a token below to insert it, or type separators like <code className="px-1 bg-slate-100 dark:bg-slate-700 rounded">/</code> or <code className="px-1 bg-slate-100 dark:bg-slate-700 rounded">-</code> directly.
                  </p>
                )}

                {/* Token buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOKENS.map(({ token, colour, tip }) => (
                    <button
                      key={token}
                      onClick={() => handleChange('pattern', formData.pattern + token)}
                      title={tip}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-full border transition-all hover:scale-105 active:scale-95 ${colour}`}
                    >
                      {token}
                      <span className="font-sans font-normal text-[10px] opacity-60">+ add</span>
                    </button>
                  ))}
                </div>

                <PatternDecoder
                  pattern={formData.pattern}
                  prefix={formData.prefix}
                  numberPadding={formData.number_padding}
                  yearFormat={formData.year_format}
                />
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black flex-shrink-0">3</span>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set your details</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      School Prefix <span className="font-normal text-slate-400">(used in {'{PREFIX}'})</span>
                    </label>
                    <input
                      type="text"
                      value={formData.prefix}
                      onChange={e => handleChange('prefix', e.target.value.toUpperCase())}
                      placeholder="e.g. KHS"
                      maxLength={10}
                      className={`${CLS.input} font-mono uppercase`}
                    />
                    <p className="mt-1 text-xs text-slate-400">Your school's short code. Max 10 letters, auto-uppercased.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Number Padding <span className="font-normal text-slate-400">(how many digits)</span>
                    </label>
                    <select
                      value={formData.number_padding}
                      onChange={e => handleChange('number_padding', parseInt(e.target.value, 10))}
                      className={CLS.input}
                    >
                      {[1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>
                          {n} digit{n > 1 ? 's' : ''} — {String(1).padStart(n,'0')}, {String(2).padStart(n,'0')} … {String(Math.pow(10,n)-1).padStart(n,'0')}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">4 digits (0001–9999) handles up to 9,999 students without overflow.</p>
                  </div>

                  {patternUsesYear && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Year Format <span className="font-normal text-slate-400">(used in {'{YEAR}'})</span>
                      </label>
                      <select
                        value={formData.year_format}
                        onChange={e => handleChange('year_format', e.target.value)}
                        className={CLS.input}
                      >
                        <option value="YYYY">4 digits — 2025 (recommended)</option>
                        <option value="YY">2 digits — 25</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Default Separator
                    </label>
                    <select
                      value={formData.separator}
                      onChange={e => handleChange('separator', e.target.value)}
                      className={CLS.input}
                    >
                      <option value="/">/  (forward slash)</option>
                      <option value="-">-  (hyphen)</option>
                      <option value=".">. (period)</option>
                      <option value="_">_  (underscore)</option>
                      <option value="">  (none)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced settings */}
            <div className={`${CLS.card} rounded-xl overflow-hidden`}>
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                    <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Advanced Settings</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Enable/disable, yearly reset, manual override, danger zone</p>
                  </div>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showAdvanced && (
                <div className="px-5 pb-6 border-t border-slate-100 dark:border-slate-700 pt-5 space-y-5">

                  {/* ── Enabled toggle ─────────────────────────────────────── */}
                  <div className={`rounded-xl border transition-all overflow-hidden
                    ${formData.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                    {/* Title row — toggle + label on same baseline */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <button
                        onClick={() => handleChange('enabled', !formData.enabled)}
                        role="switch"
                        aria-checked={formData.enabled}
                        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500
                          ${formData.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200
                          ${formData.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        Admission numbers enabled
                      </span>
                      {formData.enabled
                        ? <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full">ON</span>
                        : <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">OFF</span>
                      }
                    </div>
                    <p className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      When off, approving an enrollment will <strong>not</strong> auto-generate an admission number. Leave this on unless you want to temporarily pause number generation.
                    </p>
                  </div>

                  {/* ── Reset yearly toggle ─────────────────────────────────── */}
                  <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <button
                        onClick={() => handleChange('reset_yearly', !formData.reset_yearly)}
                        role="switch"
                        aria-checked={formData.reset_yearly}
                        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500
                          ${formData.reset_yearly ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200
                          ${formData.reset_yearly ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        Reset counter every academic year
                      </span>
                    </div>
                    <p className="px-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      When on, the counter goes back to 001 at the start of each new academic year.
                      Best used when your pattern includes <code className="px-1 bg-slate-200 dark:bg-slate-700 rounded">{'{YEAR}'}</code> so numbers stay short (e.g. KHS/2026/001, KHS/2027/001).
                      When off, the counter never resets — students get ever-increasing unique numbers.
                    </p>
                    {formData.reset_yearly && (
                      <div className="px-4 pb-4 mt-2 flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Counter restarts from 001 each year
                      </div>
                    )}
                    {!formData.reset_yearly && <div className="pb-4" />}
                  </div>

                  {/* ── Allow manual override toggle ────────────────────────── */}
                  <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <button
                        onClick={() => handleChange('allow_manual_override', !formData.allow_manual_override)}
                        role="switch"
                        aria-checked={formData.allow_manual_override}
                        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500
                          ${formData.allow_manual_override ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200
                          ${formData.allow_manual_override ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                        Allow manual number override
                      </span>
                    </div>
                    <p className="px-4 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      When on, admins can manually type a specific admission number when approving a student instead of using the auto-generated one.
                      Useful when migrating students with pre-assigned numbers.{' '}
                      <strong className="text-amber-600 dark:text-amber-400">Use with caution</strong> — manually entered numbers bypass duplicate checking.
                    </p>
                  </div>

                  {/* Start from — only on first config */}
                  {!config && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Start sequence from
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                        Leave as <strong>1</strong> if starting fresh. If you already have students on paper (e.g. you've issued 250 numbers manually), enter <strong>251</strong> so the system picks up where you left off.
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={formData.sequence_start}
                          onChange={e => handleChange('sequence_start', parseInt(e.target.value, 10) || 1)}
                          className={`${CLS.input} w-36`}
                        />
                        {formData.sequence_start > 1 && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ First number generated will be #{formData.sequence_start}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Danger zone — only when config exists */}
                  {config && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-700 dark:text-red-400">Danger Zone — Reset Sequence Counter</p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-1 leading-relaxed">
                            Counter is at <strong>{config.current_sequence ?? 0}</strong>.
                            Next approved student gets <strong>#{(config.current_sequence ?? 0) + 1}</strong>.
                          </p>
                          <p className="text-xs text-red-500 dark:text-red-500 mb-3 leading-relaxed">
                            Only reset if you are starting a new academic year, correcting an error, or continuing from existing paper records.
                          </p>
                          <button
                            onClick={() => setShowResetModal(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset / Change Sequence Counter
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile save */}
            <div className="sm:hidden">
              <button
                onClick={handleSave}
                disabled={saving || loading || !isDirty}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm transition-all ${CLS.primary}`}
              >
                {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Configuration</>}
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Live preview card */}
            <div className={`${CLS.card} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Preview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">What the next number will look like</p>
                </div>
              </div>

              <PreviewBadge preview={preview} loading={previewLoading} />

              {previewError && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {previewError}
                </p>
              )}

              <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                {[
                  ['Status',          formData.enabled ? '✅ Enabled' : '⛔ Disabled'],
                  ['Pattern',         formData.pattern || '—'],
                  ['Prefix',          formData.prefix  || '(none)'],
                  ['Padding',         `${formData.number_padding} digit${formData.number_padding > 1 ? 's' : ''}`],
                  ['Year in #',       formData.include_year ? `Yes (${formData.year_format})` : 'No'],
                  ['Yearly reset',    formData.reset_yearly ? 'Yes' : 'No'],
                  ['Manual override', formData.allow_manual_override ? 'Allowed' : 'Not allowed'],
                  ...(config ? [['Current seq.', String(config.current_sequence ?? 0)]] : []),
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate ml-2 max-w-[140px]">{val}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={fetchPreview}
                disabled={previewLoading}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                Refresh Preview
              </button>
            </div>

            {/* Config status */}
            {config ? (
              <div className={`${CLS.card} rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Config Active</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Saved and running</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Saved Pattern</p>
                    <p className="font-mono text-sm font-bold text-slate-900 dark:text-white break-all">{config.pattern}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Prefix</p>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">{config.prefix || '—'}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Approvals so far</p>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white mt-0.5">{config.current_sequence ?? 0}</p>
                    </div>
                  </div>
                  {config.updated_at && (
                    <p className="text-[10px] text-slate-400 text-right pt-1">
                      Last updated {new Date(config.updated_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${CLS.card} rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Not Configured</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  No configuration saved yet. Fill in your pattern above and click <strong className="text-slate-700 dark:text-slate-300">Save Config</strong>.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  ⚠ Enrollment approvals will fail until this is configured.
                </div>
              </div>
            )}

            {/* Quick FAQ */}
            <div className={`${CLS.card} rounded-xl p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick FAQ</h3>
              </div>
              <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Can I change the pattern later?</p>
                  <p>Yes. Old students keep their existing numbers. New approvals use the updated pattern.</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Can I use just plain numbers like 6001, 6002?</p>
                  <p>Yes. Pick the <strong>001</strong> template, leave prefix blank, set padding to 4, then open Advanced Settings → Reset Sequence → set counter to 6000. Next student gets 6001.</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">What if I already use paper numbers?</p>
                  <p>Open Advanced Settings and set "Start sequence from" to the number <em>after</em> your last paper number. Or use Reset Sequence after saving.</p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Do I generate numbers manually?</p>
                  <p>No. Numbers generate automatically the moment you click "Approve" on any pending enrollment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        loading={resetting}
        currentSequence={config?.current_sequence ?? 0}
      />
    </div>
  );
}

export default AdmissionConfigManager;
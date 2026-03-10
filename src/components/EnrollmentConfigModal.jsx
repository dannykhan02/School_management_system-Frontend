// src/components/EnrollmentConfigModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Enrollment Configuration Modal — 3-step wizard
//   Step 1: Enrollment Window & Capacity
//   Step 2: Approval & Notifications
//   Step 3: Review & Save
//
// API contract (post backend update):
//   GET  admin/enrollment-settings?academic_year_id=X  → load existing term settings
//   POST admin/enrollment-settings                      → create (school_id comes from auth, NOT payload)
//   PUT  admin/enrollment-settings/{id}                → partial update (all fields 'sometimes')
//
// Academic year shape (from /api/academic-years):
//   { id, school_id, year: 2026, term: "Term 1", start_date, end_date, is_active, ... }
//   NOTE: there is no `name` field — label is always `${year} – ${term}`
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Settings, Calendar, CheckCircle, AlertTriangle, Loader,
  Info, Save, ToggleRight, ClipboardList, Users, ArrowRight,
  ShieldCheck, FileText, RefreshCw, Pencil, Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Styling tokens ──────────────────────────────────────────────────────────
const CLS = {
  input:     'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed',
  primary:   'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  secondary: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  cyanBox:   'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800',
  label:     'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide',
};

// ─── Allowed doc slugs — must mirror Rule::in() in StoreEnrollmentSettingRequest
const ALLOWED_DOC_SLUGS = [
  'birth_certificate', 'passport_photo', 'leaving_certificate',
  'report_card', 'immunization_card', 'national_id_copy',
];

const DOC_LABELS = {
  birth_certificate:   'Birth Certificate',
  passport_photo:      'Passport Photo',
  leaving_certificate: 'Leaving Certificate',
  report_card:         'Report Card',
  immunization_card:   'Immunization Card',
  national_id_copy:    'National ID Copy',
};

// ─── Default settings shape ──────────────────────────────────────────────────
const BLANK = {
  enrollment_open: false, open_date: '', close_date: '',
  max_capacity: 0, current_enrolled: 0, allow_waitlist: false,
  auto_approve: false, required_documents: [],
  accept_new_students: true, accept_transfers: true, accept_returning: true,
  notify_parent_on_submit: true, notify_parent_on_approval: true,
  notify_parent_on_rejection: true, notify_admin_on_new_application: true,
};

// ─── Academic year helpers ────────────────────────────────────────────────────
/**
 * Build the human-readable label for an academic year row.
 * Shape: { id, year: 2026, term: "Term 1", ... }  — there is NO `name` field.
 * Matches the backend's termLabel() helper: "2026 – Term 1"
 */
function termLabel(yearObj) {
  if (!yearObj) return '—';
  const year = yearObj.year  ?? '?';
  const term = yearObj.term  ?? '';
  return term ? `${year} – ${term}` : String(year);
}

/**
 * Extract the 4-digit calendar year from an academic year row.
 * yearObj.year is already a number in the API response.
 */
function extractCalendarYear(yearObj) {
  if (!yearObj) return null;
  const y = parseInt(yearObj.year, 10);
  return Number.isFinite(y) ? y : null;
}

// "YYYY-MM-DD" for today
const toDateStr = (d) => d.toISOString().split('T')[0];
const todayStr  = () => toDateStr(new Date());

/**
 * Default open date for a brand-new config:
 *   - academic year is current or future → today
 *   - academic year is in the past → start_date of the term (let backend validate)
 */
function defaultOpenDate(yearObj) {
  if (!yearObj) return todayStr();
  const today = new Date();
  const yr    = extractCalendarYear(yearObj);
  if (!yr || today.getFullYear() <= yr) return todayStr();
  // Past year — use the term's own start_date if available, otherwise first day of year
  return yearObj.start_date
    ? String(yearObj.start_date).slice(0, 10)
    : `${yr}-01-01`;
}

/**
 * Default close date → term's end_date if available, otherwise Dec 31 of year.
 */
function defaultCloseDate(yearObj) {
  if (!yearObj) return '';
  if (yearObj.end_date) return String(yearObj.end_date).slice(0, 10);
  const yr = extractCalendarYear(yearObj);
  return yr ? `${yr}-12-31` : '';
}

/**
 * Strip ISO timestamp → "YYYY-MM-DD" for <input type="date">.
 * Handles "2026-01-01T00:00:00.000000Z", "2026-01-01 00:00:00", plain "2026-01-01".
 */
function toInputDate(val) {
  if (!val) return '';
  return String(val).slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled, label, description }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all
        ${checked ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-700'}`}
    >
      <div className="text-left">
        <p className={`text-sm font-semibold ${checked ? 'text-cyan-800 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

function SectionCard({ title, icon: Icon, iconCls = 'text-cyan-600 dark:text-cyan-400', headerCls = 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-600', wrapCls = 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600', children }) {
  return (
    <div className={`${wrapCls} border rounded-xl overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${headerCls}`}>
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${iconCls}`} />}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function StepDot({ n, label, step }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
      ${step === n ? 'bg-black dark:bg-white text-white dark:text-black'
      : step > n  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      :             'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
    >
      {step > n ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 text-center">{n}</span>}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function Pill({ val, onLabel = 'ON', offLabel = 'OFF' }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
      ${val ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
      {val ? onLabel : offLabel}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EditingBanner
// ─────────────────────────────────────────────────────────────────────────────
function EditingBanner({ isEditing, updatedAt, yearLabel }) {
  if (!isEditing) return null;
  const saved = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
      <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          Editing existing configuration{yearLabel ? ` — ${yearLabel}` : ''}
        </p>
        {saved && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            Last saved {saved}. Your changes will update this record.
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CurrentConfigSnapshot — amber read-only panel shown when editing
// ─────────────────────────────────────────────────────────────────────────────
function CurrentConfigSnapshot({ snap }) {
  if (!snap) return null;

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between py-1 gap-2 border-b border-amber-100 dark:border-amber-900/30 last:border-0">
      <span className="text-[11px] text-amber-700 dark:text-amber-400 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 text-right">{children}</span>
    </div>
  );

  return (
    <SectionCard
      title="Current Saved Configuration"
      icon={Eye}
      iconCls="text-amber-600 dark:text-amber-400"
      headerCls="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
      wrapCls="bg-amber-50/40 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
    >
      <p className="text-[11px] text-amber-600 dark:text-amber-400 -mt-1">
        This is what's currently saved — edit the fields below to make changes.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        <div>
          <Row label="Status"><Pill val={snap.enrollment_open} onLabel="Open" offLabel="Closed" /></Row>
          <Row label="Open Date">{fmtDate(snap.open_date)}</Row>
          <Row label="Close Date">{fmtDate(snap.close_date)}</Row>
          <Row label="Max Capacity">{snap.max_capacity === 0 ? 'Unlimited' : snap.max_capacity}</Row>
          <Row label="Waitlist"><Pill val={snap.allow_waitlist} /></Row>
        </div>
        <div>
          <Row label="Auto-Approve"><Pill val={snap.auto_approve} /></Row>
          <Row label="New Students"><Pill val={snap.accept_new_students} /></Row>
          <Row label="Transfers"><Pill val={snap.accept_transfers} /></Row>
          <Row label="Returning"><Pill val={snap.accept_returning} /></Row>
          <Row label="Req. Docs">{(snap.required_documents || []).length} selected</Row>
        </div>
      </div>
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Enrollment Window & Capacity
// ─────────────────────────────────────────────────────────────────────────────
function StepEnrollmentWindow({
  settings, onChange, academicYears, selectedYearId, onYearChange,
  loading, isEditing, settingsUpdatedAt, yearLabel, savedSnap,
}) {
  const set = (f, v) => onChange({ ...settings, [f]: v });

  const yearObj    = academicYears.find(y => String(y.id) === String(selectedYearId)) ?? null;
  const calendarYr = extractCalendarYear(yearObj);
  const today      = todayStr();

  // Date boundary for the close date (end of term, or end of calendar year as fallback)
  const maxDate = yearObj?.end_date
    ? String(yearObj.end_date).slice(0, 10)
    : (calendarYr ? `${calendarYr}-12-31` : undefined);

  // Min open date:
  //   Editing → allow the already-saved open_date even if it's in the past (browser
  //   won't blank it out). New → enforce today as earliest.
  const minOpenDate = isEditing && settings.open_date
    ? settings.open_date
    : today;

  // Min close date:
  //   Editing with a past close_date → keep that date as its own minimum.
  //   Otherwise open_date (or today) is the floor.
  const minCloseDate = isEditing && settings.close_date && settings.close_date < today
    ? settings.close_date
    : (settings.open_date || today);

  const handleOpenDateChange = (val) => {
    set('open_date', val);
    // If close_date is now before the new open_date, push it to max or open_date
    if (settings.close_date && val > settings.close_date) {
      set('close_date', maxDate || val);
    }
  };

  // Group academic years by calendar year for the optgroup display.
  // e.g. 2026 → [Term 1, Term 2, Term 3]
  const yearGroups = academicYears.reduce((acc, y) => {
    const yr = String(y.year ?? '?');
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(y);
    return acc;
  }, {});

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className={`${CLS.cyanBox} rounded-lg p-3 flex items-start gap-3`}>
        <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-700 dark:text-cyan-300">
          Configure the enrollment window, capacity limits and accepted application types.
          Each term has independent settings — select a term to get started.
          If you leave dates blank, the system will automatically use the term's own start and end dates.
        </p>
      </div>

      {/* ── Term selector ── */}
      <div>
        <label className={CLS.label}>Term <span className="text-red-500">*</span></label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={selectedYearId}
            onChange={e => onYearChange(e.target.value)}
            disabled={loading}
            className={`w-full pl-10 pr-3 py-2.5 text-sm ${CLS.input}`}
          >
            <option value="">Select Term</option>
            {Object.entries(yearGroups)
              .sort(([a], [b]) => Number(b) - Number(a)) // newest year first
              .map(([yr, terms]) => (
                <optgroup key={yr} label={`${yr}`}>
                  {terms.map(y => (
                    <option key={y.id} value={y.id}>
                      {termLabel(y)}{y.is_active ? ' ✓' : ''}
                    </option>
                  ))}
                </optgroup>
              ))
            }
          </select>
        </div>
        {yearObj && (
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Term runs{' '}
            {yearObj.start_date ? new Date(yearObj.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}
            {' – '}
            {yearObj.end_date   ? new Date(yearObj.end_date).toLocaleDateString('en-GB',   { day: 'numeric', month: 'short', year: 'numeric' }) : '?'}.
            {' '}Enrollment dates left blank will default to these.
          </p>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={`flex items-center gap-2 p-4 ${CLS.cyanBox} rounded-lg`}>
          <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm text-cyan-700 dark:text-cyan-300">Loading settings…</span>
        </div>
      )}

      {/* ── Main form (visible once a term is selected and not loading) ── */}
      {!loading && selectedYearId && (
        <>
          <EditingBanner isEditing={isEditing} updatedAt={settingsUpdatedAt} yearLabel={yearLabel} />

          {isEditing && savedSnap && <CurrentConfigSnapshot snap={savedSnap} />}

          {/* ── Enrollment Status ── */}
          <SectionCard title="Enrollment Status" icon={ToggleRight}>
            <ToggleSwitch
              checked={!!settings.enrollment_open}
              onChange={v => set('enrollment_open', v)}
              label={settings.enrollment_open ? 'Enrollment is OPEN' : 'Enrollment is CLOSED'}
              description={settings.enrollment_open
                ? 'Parents can currently submit applications.'
                : 'No new applications will be accepted.'}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Open Date */}
              <div>
                <label className={CLS.label}>
                  Open Date
                  <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={settings.open_date || ''}
                  min={minOpenDate}
                  max={maxDate}
                  onChange={e => handleOpenDateChange(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {settings.open_date
                    ? (isEditing ? 'You may keep or update the existing date.' : 'Cannot be set in the past.')
                    : `Blank = uses term start date (${yearObj?.start_date ? String(yearObj.start_date).slice(0, 10) : 'not set'}).`
                  }
                </p>
              </div>

              {/* Close Date */}
              <div>
                <label className={CLS.label}>
                  Close Date
                  <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="date"
                  value={settings.close_date || ''}
                  min={minCloseDate}
                  max={maxDate}
                  onChange={e => set('close_date', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  {settings.close_date
                    ? `Must be within the term window${maxDate ? ` (max ${maxDate})` : ''}.`
                    : `Blank = uses term end date (${yearObj?.end_date ? String(yearObj.end_date).slice(0, 10) : 'not set'}).`
                  }
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── Capacity ── */}
          <SectionCard title="Capacity" icon={Users}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={CLS.label}>Max Capacity <span className="text-slate-400 font-normal">(0 = unlimited)</span></label>
                <input type="number" min={0} value={settings.max_capacity ?? 0}
                  onChange={e => set('max_capacity', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`} />
              </div>
              <div>
                <label className={CLS.label}>Current Enrolled</label>
                <input type="number" min={0} value={settings.current_enrolled ?? 0}
                  onChange={e => set('current_enrolled', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`} />
              </div>
            </div>

            {settings.max_capacity > 0 && (
              <div className="mt-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    {settings.current_enrolled ?? 0} / {settings.max_capacity} enrolled
                  </span>
                  <span className={`font-semibold ${
                    (settings.current_enrolled ?? 0) >= settings.max_capacity
                      ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {Math.max(0, settings.max_capacity - (settings.current_enrolled ?? 0))} spots left
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (settings.current_enrolled ?? 0) >= settings.max_capacity ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ((settings.current_enrolled ?? 0) / settings.max_capacity) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <ToggleSwitch checked={!!settings.allow_waitlist} onChange={v => set('allow_waitlist', v)}
              label="Allow Waitlist" description="When at capacity, applicants join a waitlist instead of being rejected." />
          </SectionCard>

          {/* ── Enrollment Types ── */}
          <SectionCard title="Accepted Enrollment Types" icon={ClipboardList}>
            <div className="space-y-2">
              <ToggleSwitch checked={!!settings.accept_new_students}  onChange={v => set('accept_new_students', v)}  label="New Students"       description="First-time enrollments to this school." />
              <ToggleSwitch checked={!!settings.accept_transfers}     onChange={v => set('accept_transfers', v)}     label="Transfer Students"  description="Students transferring from another school." />
              <ToggleSwitch checked={!!settings.accept_returning}     onChange={v => set('accept_returning', v)}     label="Returning Students" description="Students re-enrolling after a gap." />
            </div>
            <div className={`${CLS.cyanBox} rounded-lg p-2.5 flex items-start gap-2`}>
              <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-700 dark:text-cyan-300">
                Government placements are always accepted when enrollment is open.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Approval & Notifications
// ─────────────────────────────────────────────────────────────────────────────
function StepApprovalSettings({ settings, onChange }) {
  const set = (f, v) => onChange({ ...settings, [f]: v });
  const requiredDocs = settings.required_documents || [];
  const toggleDoc = (slug) =>
    set('required_documents',
      requiredDocs.includes(slug) ? requiredDocs.filter(s => s !== slug) : [...requiredDocs, slug]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className={`${CLS.cyanBox} rounded-lg p-3 flex items-start gap-3`}>
        <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cyan-700 dark:text-cyan-300">
          Configure the approval workflow and which notifications are sent to parents and admins.
        </p>
      </div>

      <SectionCard title="Approval Workflow" icon={ShieldCheck}>
        <ToggleSwitch checked={!!settings.auto_approve} onChange={v => set('auto_approve', v)}
          label="Auto-Approve Applications"
          description="Skip manual review — applications are approved immediately on submission." />
        {settings.auto_approve && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Auto-approve skips capacity checks. Ensure max capacity is configured correctly.
            </p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Required Documents" icon={FileText}>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Parents will be prompted to upload these during application.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALLOWED_DOC_SLUGS.map(slug => {
            const active = requiredDocs.includes(slug);
            return (
              <button key={slug} type="button" onClick={() => toggleDoc(slug)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all text-xs font-medium
                  ${active
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center
                  ${active ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-500'}`}>
                  {active && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                </span>
                {DOC_LABELS[slug]}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Notification Settings" icon={ClipboardList}>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Parent</p>
          <ToggleSwitch checked={!!settings.notify_parent_on_submit}    onChange={v => set('notify_parent_on_submit', v)}    label="On Submission" description="Confirmation when application is received." />
          <ToggleSwitch checked={!!settings.notify_parent_on_approval}  onChange={v => set('notify_parent_on_approval', v)}  label="On Approval"   description="Notify parent when their application is approved." />
          <ToggleSwitch checked={!!settings.notify_parent_on_rejection} onChange={v => set('notify_parent_on_rejection', v)} label="On Rejection"  description="Notify parent with reason when rejected." />
        </div>
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-600">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Admin</p>
          <ToggleSwitch checked={!!settings.notify_admin_on_new_application} onChange={v => set('notify_admin_on_new_application', v)}
            label="New Application Alert" description="Send admin an alert whenever a new application arrives." />
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Review & Save
// ─────────────────────────────────────────────────────────────────────────────
function StepReview({ settings, yearLabel, isEditing }) {
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-900 dark:text-white">{value ?? <span className="text-slate-400">—</span>}</span>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-3">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {isEditing ? 'Ready to update your enrollment settings' : 'Ready to create enrollment settings'}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            {isEditing
              ? `Your changes for ${yearLabel} will be saved and take effect immediately.`
              : `A new enrollment configuration will be created for ${yearLabel}.`}
          </p>
        </div>
      </div>

      <SectionCard title="Enrollment Window" icon={Calendar}>
        <Row label="Term"           value={yearLabel} />
        <Row label="Status"         value={<Pill val={settings.enrollment_open} onLabel="Open" offLabel="Closed" />} />
        <Row label="Open Date"      value={settings.open_date ? fmtDate(settings.open_date) : 'Auto (term start date)'} />
        <Row label="Close Date"     value={settings.close_date ? fmtDate(settings.close_date) : 'Auto (term end date)'} />
        <Row label="Max Capacity"   value={settings.max_capacity === 0 ? 'Unlimited' : settings.max_capacity} />
        <Row label="Allow Waitlist" value={<Pill val={settings.allow_waitlist} />} />
        <Row label="New Students"   value={<Pill val={settings.accept_new_students} />} />
        <Row label="Transfers"      value={<Pill val={settings.accept_transfers} />} />
        <Row label="Returning"      value={<Pill val={settings.accept_returning} />} />
      </SectionCard>

      <SectionCard title="Approval & Notifications" icon={ShieldCheck}>
        <Row label="Auto-Approve"        value={<Pill val={settings.auto_approve} />} />
        <Row label="Required Docs"       value={`${(settings.required_documents || []).length} required`} />
        <Row label="Notify on Submit"    value={<Pill val={settings.notify_parent_on_submit} />} />
        <Row label="Notify on Approval"  value={<Pill val={settings.notify_parent_on_approval} />} />
        <Row label="Notify on Rejection" value={<Pill val={settings.notify_parent_on_rejection} />} />
        <Row label="Admin New-App Alert" value={<Pill val={settings.notify_admin_on_new_application} />} />
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EnrollmentConfigModal({ isOpen, onClose, academicYears = [], onSuccess }) {
  const { user } = useAuth();
  const [step,              setStep]             = useState(1);
  const [selectedYearId,    setSelectedYearId]   = useState('');
  const [settingsId,        setSettingsId]       = useState(null);
  const [settingsUpdatedAt, setSettingsUpdatedAt]= useState(null);
  const [settings,          setSettings]         = useState({ ...BLANK });
  // savedSnap = last values fetched from server, shown in CurrentConfigSnapshot
  const [savedSnap,         setSavedSnap]        = useState(null);
  const [loadingSettings,   setLoadingSettings]  = useState(false);
  const [submitting,        setSubmitting]        = useState(false);
  const [saved,             setSaved]            = useState(false);

  // ── Reset when modal closes ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedYearId(''); setSettingsId(null);
      setSettingsUpdatedAt(null); setSavedSnap(null); setSaved(false);
      setSettings({ ...BLANK });
    }
  }, [isOpen]);

  // ── Auto-select the first active term when modal opens ────────────────────
  // Uses is_active (integer 0/1) — the API has no is_current field.
  useEffect(() => {
    if (isOpen && academicYears.length && !selectedYearId) {
      const active = academicYears.find(y => y.is_active);
      if (active) setSelectedYearId(String(active.id));
    }
  }, [isOpen, academicYears]);

  // ── Fetch settings whenever selectedYearId changes ────────────────────────
  useEffect(() => {
    if (!selectedYearId) return;
    let cancelled = false;
    const yearObj = academicYears.find(y => String(y.id) === String(selectedYearId)) ?? null;

    const load = async () => {
      setLoadingSettings(true);
      try {
        const res = await apiRequest(`admin/enrollment-settings?academic_year_id=${selectedYearId}`, 'GET');
        if (cancelled) return;

        if (res?.settings) {
          const s = res.settings;
          const loaded = {
            enrollment_open:                 s.enrollment_open                 ?? false,
            open_date:                       toInputDate(s.open_date),
            close_date:                      toInputDate(s.close_date),
            max_capacity:                    s.max_capacity                    ?? 0,
            current_enrolled:                s.current_enrolled                ?? 0,
            allow_waitlist:                  s.allow_waitlist                  ?? false,
            auto_approve:                    s.auto_approve                    ?? false,
            required_documents:              s.required_documents              ?? [],
            accept_new_students:             s.accept_new_students             ?? true,
            accept_transfers:                s.accept_transfers                ?? true,
            accept_returning:                s.accept_returning                ?? true,
            notify_parent_on_submit:         s.notify_parent_on_submit         ?? true,
            notify_parent_on_approval:       s.notify_parent_on_approval       ?? true,
            notify_parent_on_rejection:      s.notify_parent_on_rejection      ?? true,
            notify_admin_on_new_application: s.notify_admin_on_new_application ?? true,
          };
          setSettingsId(s.id ?? null);
          setSettingsUpdatedAt(s.updated_at ?? null);
          setSettings(loaded);
          setSavedSnap({ ...loaded });
        } else {
          // No existing record — apply blank defaults + term-derived dates
          setSettingsId(null);
          setSettingsUpdatedAt(null);
          setSavedSnap(null);
          setSettings({
            ...BLANK,
            open_date:  defaultOpenDate(yearObj),
            close_date: defaultCloseDate(yearObj),
          });
        }
      } catch {
        if (cancelled) return;
        setSettingsId(null);
        setSettingsUpdatedAt(null);
        setSavedSnap(null);
        setSettings({
          ...BLANK,
          open_date:  defaultOpenDate(yearObj),
          close_date: defaultCloseDate(yearObj),
        });
      } finally {
        if (!cancelled) setLoadingSettings(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedYearId, academicYears]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedYearId) { toast.error('Select a term first.'); return; }
    setSubmitting(true);

    // Strip any doc slugs that aren't in the server's allowed list
    const sanitised = {
      ...settings,
      required_documents: (settings.required_documents || []).filter(s => ALLOWED_DOC_SLUGS.includes(s)),
    };

    try {
      if (settingsId) {
        // ── UPDATE (PATCH/PUT) ─────────────────────────────────────────────
        // school_id is NOT sent — backend derives it from auth. Only changed
        // fields need to go, but sending the full object is fine because the
        // backend uses 'sometimes' on every field.
        const res = await apiRequest(`admin/enrollment-settings/${settingsId}`, 'PUT', sanitised);
        if (res?.settings?.updated_at) setSettingsUpdatedAt(res.settings.updated_at);
      } else {
        // ── CREATE (POST) ──────────────────────────────────────────────────
        // school_id is intentionally omitted — the backend takes it from the
        // authenticated user, never from the request payload.
        const res = await apiRequest('admin/enrollment-settings', 'POST', {
          academic_year_id: parseInt(selectedYearId, 10),
          ...sanitised,
        });
        if (res?.settings?.id) {
          setSettingsId(res.settings.id);
          setSettingsUpdatedAt(res.settings.updated_at ?? null);
        }
      }

      setSavedSnap({ ...sanitised });
      toast.success('✅ Enrollment configuration saved!');
      setSaved(true);
      onSuccess?.();
    } catch (err) {
      const msgs = err?.response?.data?.errors;
      if (msgs) Object.values(msgs).flat().forEach(m => toast.error(m));
      else toast.error(err?.response?.data?.message ?? 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedYearId, settingsId, settings, onSuccess]);

  // ── Derived values ────────────────────────────────────────────────────────
  const yearObj   = academicYears.find(y => String(y.id) === String(selectedYearId)) ?? null;
  // termLabel() mirrors the backend helper: "2026 – Term 1"
  const label     = termLabel(yearObj);
  const canProceed = !!selectedYearId && !loadingSettings;
  const isEditing  = !!settingsId;

  if (!isOpen) return null;

  const Connector = ({ done }) => (
    <div className={`flex-1 h-0.5 min-w-[10px] max-w-16 rounded flex-shrink-0 ${done ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 w-full sm:rounded-xl shadow-2xl sm:max-w-3xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span className="truncate">Enrollment Configuration</span>
              {isEditing ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  <Pencil className="w-2.5 h-2.5" /> Editing
                </span>
              ) : selectedYearId ? (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex-shrink-0">
                  New Config
                </span>
              ) : null}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              {isEditing
                ? `Updating enrollment settings for ${label}`
                : selectedYearId
                  ? `Creating new enrollment settings for ${label}`
                  : 'Select a term to configure enrollment settings'}
            </p>
          </div>
          <button onClick={onClose}
            className="ml-2 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step strip ── */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50 overflow-x-auto">
          <StepDot n={1} label="Window"   step={step} />
          <Connector done={step > 1} />
          <StepDot n={2} label="Approval" step={step} />
          <Connector done={step > 2} />
          <StepDot n={3} label="Review"   step={step} />
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6">

            {step === 1 && (
              <StepEnrollmentWindow
                settings={settings}
                onChange={setSettings}
                academicYears={academicYears}
                selectedYearId={selectedYearId}
                onYearChange={id => {
                  setSelectedYearId(id);
                  // Clear stale record state immediately; the fetch effect re-runs
                  setSettingsId(null);
                  setSettingsUpdatedAt(null);
                  setSavedSnap(null);
                }}
                loading={loadingSettings}
                isEditing={isEditing}
                settingsUpdatedAt={settingsUpdatedAt}
                yearLabel={label}
                savedSnap={savedSnap}
              />
            )}

            {step === 2 && (
              <StepApprovalSettings settings={settings} onChange={setSettings} />
            )}

            {step === 3 && !saved && (
              <StepReview settings={settings} yearLabel={label} isEditing={isEditing} />
            )}

            {saved && (
              <div className="max-w-lg mx-auto text-center py-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Configuration Saved!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enrollment settings for <strong>{label}</strong> have been{' '}
                  {isEditing ? 'updated' : 'created'} successfully.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button onClick={onClose} className={`px-6 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>Close</button>
                  <button onClick={() => { setSaved(false); setStep(1); }}
                    className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
                    <RefreshCw className="w-4 h-4" /> Edit Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        {!saved && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            {step > 1
              ? <button onClick={() => setStep(s => s - 1)} className={`px-4 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>Back</button>
              : <div />
            }
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !canProceed) { toast.error('Select a term before continuing.'); return; }
                  setStep(s => s + 1);
                }}
                disabled={step === 1 && !canProceed}
                className={`px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSave} disabled={submitting}
                className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
                {submitting
                  ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" />{isEditing ? 'Update Settings' : 'Save Settings'}</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
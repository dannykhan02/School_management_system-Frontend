// src/components/EnrollmentConfigModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Enrollment Configuration Modal
//
// Single Term mode  — 3-step wizard (Window → Approval → Review)
// Bulk Setup mode   — two-panel layout:
//     LEFT  : term checklist grouped by year
//     RIGHT : Shared Defaults tab / Per-term Override tab
//
// API:
//   GET  admin/enrollment-settings?academic_year_id=X
//   POST admin/enrollment-settings
//   PUT  admin/enrollment-settings/{id}
//   POST admin/enrollment-settings/bulk
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Settings, Calendar, CheckCircle, AlertTriangle, Loader,
  Info, Save, ToggleRight, ClipboardList, Users, ArrowRight,
  ShieldCheck, FileText, RefreshCw, Pencil, Eye, Layers, Zap,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// ─── Style tokens ─────────────────────────────────────────────────────────────
const CLS = {
  input:     'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed',
  primary:   'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  secondary: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  cyanBox:   'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800',
  label:     'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide',
};

const ALLOWED_DOC_SLUGS = [
  'birth_certificate','passport_photo','leaving_certificate',
  'report_card','immunization_card','national_id_copy',
];
const DOC_LABELS = {
  birth_certificate:'Birth Certificate', passport_photo:'Passport Photo',
  leaving_certificate:'Leaving Certificate', report_card:'Report Card',
  immunization_card:'Immunization Card', national_id_copy:'National ID Copy',
};

const BLANK = {
  enrollment_open:false, open_date:'', close_date:'',
  max_capacity:0, current_enrolled:0, allow_waitlist:false,
  auto_approve:false, required_documents:[],
  accept_new_students:true, accept_transfers:true, accept_returning:true,
  notify_parent_on_submit:true, notify_parent_on_approval:true,
  notify_parent_on_rejection:true, notify_admin_on_new_application:true,
};

const BULK_BLANK = {
  enrollment_open:false, open_date:'', close_date:'',
  max_capacity:0, allow_waitlist:false,
  auto_approve:false, required_documents:[],
  accept_new_students:true, accept_transfers:true, accept_returning:true,
  notify_parent_on_submit:true, notify_parent_on_approval:true,
  notify_parent_on_rejection:true, notify_admin_on_new_application:true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function termLabel(yo) {
  if (!yo) return '—';
  return yo.term ? `${yo.year ?? '?'} – ${yo.term}` : String(yo.year ?? '?');
}
function shortDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function defaultOpenDate(yo)  { return yo?.start_date ? String(yo.start_date).slice(0,10) : ''; }
function defaultCloseDate(yo) { return yo?.end_date   ? String(yo.end_date).slice(0,10)   : ''; }
function toInputDate(v)        { return v ? String(v).slice(0,10) : ''; }
function todayStr()            { return new Date().toISOString().split('T')[0]; }
function spotsLeft(max,enrolled){ return max===0 ? null : Math.max(0,max-(enrolled??0)); }
function fillPct(max,enrolled)  { return !max ? 0 : Math.min(100,((enrolled??0)/max)*100); }

// ─── Shared primitives ────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled, label, description }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all
        ${checked ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-700'}`}>
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

function Card({ title, icon:Icon, iconCls='text-cyan-600 dark:text-cyan-400', children }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-600">
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
      ${step===n ? 'bg-black dark:bg-white text-white dark:text-black'
      : step>n   ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      :            'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
      {step>n ? <CheckCircle className="w-3 h-3"/> : <span className="w-3 text-center">{n}</span>}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function Pill({ val, onLabel='ON', offLabel='OFF' }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold
      ${val ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
      {val ? onLabel : offLabel}
    </span>
  );
}

function DocSelector({ selected, onChange }) {
  const toggle = s => onChange(selected.includes(s) ? selected.filter(x=>x!==s) : [...selected,s]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {ALLOWED_DOC_SLUGS.map(slug => {
        const active = selected.includes(slug);
        return (
          <button key={slug} type="button" onClick={()=>toggle(slug)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-xs font-medium transition-all
              ${active ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300'
                       : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
            <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center
              ${active ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 dark:border-slate-500'}`}>
              {active && <CheckCircle className="w-2.5 h-2.5 text-white"/>}
            </span>
            {DOC_LABELS[slug]}
          </button>
        );
      })}
    </div>
  );
}

function EditingBanner({ isEditing, updatedAt, yearLabel }) {
  if (!isEditing) return null;
  const saved = updatedAt ? shortDate(updatedAt) : null;
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
      <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5"/>
      <div>
        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          Editing existing configuration{yearLabel ? ` — ${yearLabel}` : ''}
        </p>
        {saved && <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Last saved {saved}.</p>}
      </div>
    </div>
  );
}

// ─── Single-term: Step 1 ──────────────────────────────────────────────────────
function StepWindow({ settings, onChange, academicYears, selectedYearId, onYearChange, loading, isEditing, settingsUpdatedAt, yearLabel, savedSnap }) {
  const set = (f,v) => onChange({...settings,[f]:v});
  const yo        = academicYears.find(y=>String(y.id)===String(selectedYearId))??null;
  const today     = todayStr();
  const termStart = yo?.start_date ? String(yo.start_date).slice(0,10) : today;
  const termEnd   = yo?.end_date   ? String(yo.end_date).slice(0,10)   : undefined;
  const minOpen   = (isEditing&&settings.open_date&&settings.open_date<termStart) ? settings.open_date : termStart;
  const minClose  = (isEditing&&settings.close_date&&settings.close_date<termStart) ? settings.close_date : (settings.open_date||termStart);
  const maxCap    = settings.max_capacity??0;
  const enrolled  = settings.current_enrolled??0;
  const spots     = spotsLeft(maxCap,enrolled);
  const pct       = fillPct(maxCap,enrolled);
  const atCap     = maxCap>0 && enrolled>=maxCap;

  const yearGroups = academicYears.filter(y=>y.is_active).reduce((acc,y)=>{
    const yr = String(y.year??'?');
    if(!acc[yr]) acc[yr]=[];
    acc[yr].push(y);
    return acc;
  },{});

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className={`${CLS.cyanBox} rounded-lg p-3 flex items-start gap-3`}>
        <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5"/>
        <p className="text-xs text-cyan-700 dark:text-cyan-300">
          Configure enrollment for one term. Need multiple terms at once? Switch to <strong>Bulk Setup</strong>.
        </p>
      </div>

      <div>
        <label className={CLS.label}>Term <span className="text-red-500">*</span></label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
          <select value={selectedYearId} onChange={e=>onYearChange(e.target.value)} disabled={loading}
            className={`w-full pl-10 pr-3 py-2.5 text-sm ${CLS.input}`}>
            <option value="">Select Term</option>
            {Object.entries(yearGroups).sort(([a],[b])=>Number(b)-Number(a)).map(([yr,terms])=>(
              <optgroup key={yr} label={yr}>
                {terms.map(y=><option key={y.id} value={y.id}>{termLabel(y)}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        {yo && (
          <p className="mt-1 text-[11px] text-slate-400">
            Term dates: <span className="font-medium text-slate-600 dark:text-slate-300">
              {yo.start_date ? shortDate(yo.start_date) : '?'} – {yo.end_date ? shortDate(yo.end_date) : '?'}
            </span>
          </p>
        )}
      </div>

      {loading && (
        <div className={`flex items-center gap-2 p-4 ${CLS.cyanBox} rounded-lg`}>
          <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400"/>
          <span className="text-sm text-cyan-700 dark:text-cyan-300">Loading settings…</span>
        </div>
      )}

      {!loading && selectedYearId && (
        <>
          <EditingBanner isEditing={isEditing} updatedAt={settingsUpdatedAt} yearLabel={yearLabel}/>

          <Card title="Enrollment Status" icon={ToggleRight}>
            <Toggle checked={!!settings.enrollment_open} onChange={v=>set('enrollment_open',v)}
              label={settings.enrollment_open ? 'Enrollment is OPEN' : 'Enrollment is CLOSED'}
              description={settings.enrollment_open ? 'Parents can submit applications.' : 'No new applications will be accepted.'}/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={CLS.label}>Opens <span className="text-red-500">*</span></label>
                <input type="date" value={settings.open_date||''} min={minOpen} max={termEnd}
                  onChange={e=>{set('open_date',e.target.value); if(settings.close_date&&e.target.value>settings.close_date) set('close_date',termEnd||e.target.value);}}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`}/>
              </div>
              <div>
                <label className={CLS.label}>Closes <span className="text-red-500">*</span></label>
                <input type="date" value={settings.close_date||''} min={minClose} max={termEnd}
                  onChange={e=>set('close_date',e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`}/>
              </div>
            </div>
          </Card>

          <Card title="Capacity" icon={Users}>
            {enrolled>0 && (
              <div className={`${CLS.cyanBox} rounded-lg p-2.5 flex items-center gap-2`}>
                <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0"/>
                <p className="text-xs text-cyan-700 dark:text-cyan-300">{enrolled} student{enrolled!==1?'s':''} already enrolled this term.</p>
              </div>
            )}
            <div>
              <label className={CLS.label}>Max Capacity <span className="ml-1 font-normal normal-case text-slate-400">(0 = unlimited)</span></label>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={()=>set('max_capacity',Math.max(0,maxCap-1))}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-lg font-bold select-none">−</button>
                <input type="number" min={0} value={maxCap}
                  onChange={e=>set('max_capacity',Math.max(0,parseInt(e.target.value,10)||0))}
                  className={`w-24 text-center px-2 py-2.5 text-sm font-semibold ${CLS.input}`}/>
                <button type="button" onClick={()=>set('max_capacity',maxCap+1)}
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-lg font-bold select-none">+</button>
                <div className="flex gap-1.5 flex-wrap">
                  {[0,30,45,60,90,120].map(n=>(
                    <button key={n} type="button" onClick={()=>set('max_capacity',n)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
                        ${maxCap===n ? 'bg-cyan-500 text-white border-cyan-500'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-cyan-400'}`}>
                      {n===0?'∞':n}
                    </button>
                  ))}
                </div>
              </div>
              {maxCap>0&&maxCap<enrolled && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0"/>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">Capacity ({maxCap}) is below enrolled ({enrolled}). No new spots available.</p>
                </div>
              )}
            </div>
            {maxCap>0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-600">
                  <div className="px-3 py-3 bg-slate-50 dark:bg-slate-700/50 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Enrolled</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{enrolled}</p>
                  </div>
                  <div className={`px-3 py-3 text-center ${atCap?'bg-red-50 dark:bg-red-900/20':'bg-emerald-50 dark:bg-emerald-900/10'}`}>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Available</p>
                    <p className={`text-xl font-black ${atCap?'text-red-600 dark:text-red-400':'text-emerald-600 dark:text-emerald-400'}`}>{spots}</p>
                  </div>
                  <div className="px-3 py-3 bg-slate-50 dark:bg-slate-700/50 text-center">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Max</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{maxCap}</p>
                  </div>
                </div>
                <div className="px-3 pb-3 pt-2 bg-white dark:bg-slate-800/40">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-500 ${atCap?'bg-red-500':'bg-cyan-500'}`} style={{width:`${pct}%`}}/>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{Math.round(pct)}% filled</p>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-200 dark:border-cyan-800 flex items-center gap-2">
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">∞</span>
                <span className="text-xs text-cyan-700 dark:text-cyan-300">Unlimited — set a max above to restrict intake.</span>
              </div>
            )}
            <Toggle checked={!!settings.allow_waitlist} onChange={v=>set('allow_waitlist',v)}
              label="Allow Waitlist" description="At capacity, applicants join waitlist instead of being rejected."/>
          </Card>

          <Card title="Accepted Enrollment Types" icon={ClipboardList}>
            <div className="space-y-2">
              <Toggle checked={!!settings.accept_new_students}  onChange={v=>set('accept_new_students',v)}  label="New Students"       description="First-time enrollments."/>
              <Toggle checked={!!settings.accept_transfers}     onChange={v=>set('accept_transfers',v)}     label="Transfer Students"  description="Transferring from another school."/>
              <Toggle checked={!!settings.accept_returning}     onChange={v=>set('accept_returning',v)}     label="Returning Students" description="Re-enrolling after a gap."/>
            </div>
            <div className={`${CLS.cyanBox} rounded-lg p-2.5 flex items-start gap-2`}>
              <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-cyan-700 dark:text-cyan-300">Government placements are always accepted when enrollment is open.</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Single-term: Step 2 ──────────────────────────────────────────────────────
function StepApproval({ settings, onChange }) {
  const set = (f,v) => onChange({...settings,[f]:v});
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card title="Approval Workflow" icon={ShieldCheck}>
        <Toggle checked={!!settings.auto_approve} onChange={v=>set('auto_approve',v)}
          label="Auto-Approve Applications" description="Skip manual review — approved immediately on submission."/>
        {settings.auto_approve && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-700 dark:text-amber-300">Auto-approve skips capacity checks. Ensure max capacity is set correctly.</p>
          </div>
        )}
      </Card>
      <Card title="Required Documents" icon={FileText}>
        <p className="text-xs text-slate-500 dark:text-slate-400">Parents will be prompted to upload these during application.</p>
        <DocSelector selected={settings.required_documents||[]} onChange={v=>set('required_documents',v)}/>
      </Card>
      <Card title="Notifications" icon={ClipboardList}>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Parent</p>
        <div className="space-y-2">
          <Toggle checked={!!settings.notify_parent_on_submit}    onChange={v=>set('notify_parent_on_submit',v)}    label="On Submission" description="Confirmation email when application is received."/>
          <Toggle checked={!!settings.notify_parent_on_approval}  onChange={v=>set('notify_parent_on_approval',v)}  label="On Approval"   description="Notify parent when approved."/>
          <Toggle checked={!!settings.notify_parent_on_rejection} onChange={v=>set('notify_parent_on_rejection',v)} label="On Rejection"  description="Notify parent with reason when rejected."/>
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pt-2 border-t border-slate-200 dark:border-slate-600">Admin</p>
        <Toggle checked={!!settings.notify_admin_on_new_application} onChange={v=>set('notify_admin_on_new_application',v)}
          label="New Application Alert" description="Alert admin whenever a new application arrives."/>
      </Card>
    </div>
  );
}

// ─── Single-term: Step 3 ──────────────────────────────────────────────────────
function StepReview({ settings, yearLabel, isEditing }) {
  const Row = ({label,value}) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-900 dark:text-white">{value??<span className="text-slate-400">—</span>}</span>
    </div>
  );
  const maxCap = settings.max_capacity??0;
  const spots  = spotsLeft(maxCap,settings.current_enrolled??0);
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-3">
        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {isEditing ? 'Ready to update' : 'Ready to create'} enrollment settings
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
            {isEditing ? `Changes for ${yearLabel} take effect immediately.` : `New config for ${yearLabel}.`}
          </p>
        </div>
      </div>
      <Card title="Enrollment Window" icon={Calendar}>
        <Row label="Term"           value={yearLabel}/>
        <Row label="Status"         value={<Pill val={settings.enrollment_open} onLabel="Open" offLabel="Closed"/>}/>
        <Row label="Opens"          value={shortDate(settings.open_date)}/>
        <Row label="Closes"         value={shortDate(settings.close_date)}/>
        <Row label="Max Capacity"   value={maxCap===0?'Unlimited':maxCap}/>
        <Row label="Available"      value={maxCap===0?'∞':spots===0?<span className="text-red-600 font-bold">Full</span>:spots}/>
        <Row label="Waitlist"       value={<Pill val={settings.allow_waitlist}/>}/>
        <Row label="New Students"   value={<Pill val={settings.accept_new_students}/>}/>
        <Row label="Transfers"      value={<Pill val={settings.accept_transfers}/>}/>
        <Row label="Returning"      value={<Pill val={settings.accept_returning}/>}/>
      </Card>
      <Card title="Approval & Notifications" icon={ShieldCheck}>
        <Row label="Auto-Approve"      value={<Pill val={settings.auto_approve}/>}/>
        <Row label="Required Docs"     value={`${(settings.required_documents||[]).length} required`}/>
        <Row label="Notify: Submit"    value={<Pill val={settings.notify_parent_on_submit}/>}/>
        <Row label="Notify: Approval"  value={<Pill val={settings.notify_parent_on_approval}/>}/>
        <Row label="Notify: Rejection" value={<Pill val={settings.notify_parent_on_rejection}/>}/>
        <Row label="Admin Alert"       value={<Pill val={settings.notify_admin_on_new_application}/>}/>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK — shared defaults form (right panel, defaults tab)
// ─────────────────────────────────────────────────────────────────────────────
function BulkDefaultsForm({ defaults, onChange }) {
  const set = (f,v) => onChange({...defaults,[f]:v});
  return (
    <div className="space-y-5">
      {/* Status & window */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Enrollment Window</p>
        <Toggle checked={!!defaults.enrollment_open} onChange={v=>set('enrollment_open',v)}
          label={defaults.enrollment_open ? 'OPEN by default' : 'CLOSED by default'}
          description="Each selected term inherits this."/>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={CLS.label}>Open Date <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input type="date" value={defaults.open_date||''} onChange={e=>set('open_date',e.target.value)} className={`w-full px-3 py-2 text-sm ${CLS.input}`}/>
            <p className="mt-1 text-[10px] text-slate-400">Blank = each term's own start date</p>
          </div>
          <div>
            <label className={CLS.label}>Close Date <span className="font-normal normal-case text-slate-400">(optional)</span></label>
            <input type="date" value={defaults.close_date||''} onChange={e=>set('close_date',e.target.value)} className={`w-full px-3 py-2 text-sm ${CLS.input}`}/>
            <p className="mt-1 text-[10px] text-slate-400">Blank = each term's own end date</p>
          </div>
        </div>
      </div>

      {/* Capacity */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-3">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Capacity</p>
        <div>
          <label className={CLS.label}>Max Capacity <span className="font-normal normal-case text-slate-400">(0 = unlimited)</span></label>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={()=>set('max_capacity',Math.max(0,(defaults.max_capacity??0)-1))}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-lg font-bold select-none">−</button>
            <input type="number" min={0} value={defaults.max_capacity??0}
              onChange={e=>set('max_capacity',Math.max(0,parseInt(e.target.value,10)||0))}
              className={`w-20 text-center px-2 py-2 text-sm font-semibold ${CLS.input}`}/>
            <button type="button" onClick={()=>set('max_capacity',(defaults.max_capacity??0)+1)}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 text-lg font-bold select-none">+</button>
            <div className="flex gap-1.5 flex-wrap">
              {[0,30,45,60,90,120].map(n=>(
                <button key={n} type="button" onClick={()=>set('max_capacity',n)}
                  className={`px-2 py-1 rounded-full text-xs font-semibold border transition-all
                    ${(defaults.max_capacity??0)===n ? 'bg-cyan-500 text-white border-cyan-500'
                                                     : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-cyan-400'}`}>
                  {n===0?'∞':n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Toggle checked={!!defaults.allow_waitlist} onChange={v=>set('allow_waitlist',v)} label="Allow Waitlist" description="At capacity, applicants join waitlist."/>
      </div>

      {/* Enrollment types */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-2">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Enrollment Types</p>
        <Toggle checked={!!defaults.accept_new_students}  onChange={v=>set('accept_new_students',v)}  label="New Students"/>
        <Toggle checked={!!defaults.accept_transfers}     onChange={v=>set('accept_transfers',v)}     label="Transfer Students"/>
        <Toggle checked={!!defaults.accept_returning}     onChange={v=>set('accept_returning',v)}     label="Returning Students"/>
      </div>

      {/* Approval */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-3">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Approval</p>
        <Toggle checked={!!defaults.auto_approve} onChange={v=>set('auto_approve',v)} label="Auto-Approve" description="Skip manual review for all selected terms."/>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Required Documents</p>
          <DocSelector selected={defaults.required_documents||[]} onChange={v=>set('required_documents',v)}/>
        </div>
      </div>

      {/* Notifications */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-600 space-y-2">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Notifications</p>
        <Toggle checked={!!defaults.notify_parent_on_submit}         onChange={v=>set('notify_parent_on_submit',v)}         label="Parent: On Submission"/>
        <Toggle checked={!!defaults.notify_parent_on_approval}       onChange={v=>set('notify_parent_on_approval',v)}       label="Parent: On Approval"/>
        <Toggle checked={!!defaults.notify_parent_on_rejection}      onChange={v=>set('notify_parent_on_rejection',v)}      label="Parent: On Rejection"/>
        <Toggle checked={!!defaults.notify_admin_on_new_application} onChange={v=>set('notify_admin_on_new_application',v)} label="Admin: New Application Alert"/>
      </div>
    </div>
  );
}

// ─── Override row helper ──────────────────────────────────────────────────────
function OverrideRow({ label, isSet, onClear, defaultVal, children }) {
  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${isSet ? 'border-cyan-300 dark:border-cyan-700' : 'border-slate-200 dark:border-slate-600'}`}>
      <div className={`flex items-center justify-between px-3 py-2 ${isSet ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-slate-50 dark:bg-slate-700/40'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSet ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-500'}`}/>
          <p className={`text-xs font-semibold ${isSet ? 'text-cyan-800 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'}`}>{label}</p>
          {!isSet && defaultVal && <span className="text-[10px] text-slate-400 font-normal">Default: {defaultVal}</span>}
        </div>
        {isSet && (
          <button type="button" onClick={onClear}
            className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            Reset to default
          </button>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-slate-800/40">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK SETUP VIEW — clean two-column layout
//
//  ┌─────────────────────┬──────────────────────────────────┐
//  │  LEFT (fixed width) │  RIGHT (flex)                    │
//  │                     │                                  │
//  │  Year groups with   │  Tab bar:                        │
//  │  checkboxes         │   [Shared Defaults] [Override ▸] │
//  │                     │                                  │
//  │  Click term name    │  Defaults form  OR               │
//  │  → opens override   │  Per-term override fields        │
//  │    tab on right     │                                  │
//  └─────────────────────┴──────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────
function BulkSetupView({ academicYears, onClose, onSuccess, saveRef, submitting, setSubmitting }) {
  const [defaults,     setDefaults]     = useState({ ...BULK_BLANK });
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [overrides,    setOverrides]    = useState({}); // { [id]: { field: value } }
  const [activeTermId, setActiveTermId] = useState(null);
  const [rightTab,     setRightTab]     = useState('defaults'); // 'defaults' | 'override'
  const [bulkSaved,    setBulkSaved]    = useState(null);

  const activeYears = academicYears.filter(y => y.is_active);
  const yearGroups  = activeYears.reduce((acc,y)=>{
    const yr = String(y.year??'?');
    if(!acc[yr]) acc[yr]=[];
    acc[yr].push(y);
    return acc;
  },{});
  const calYears = Object.keys(yearGroups).sort((a,b)=>Number(b)-Number(a));

  // Selection helpers
  const toggleTerm = id => setSelectedIds(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const toggleYear = yr => {
    const ids = yearGroups[yr].map(y=>y.id);
    const all = ids.every(id=>selectedIds.includes(id));
    setSelectedIds(p => all ? p.filter(id=>!ids.includes(id)) : [...new Set([...p,...ids])]);
  };
  const selectAll = () => setSelectedIds(activeYears.map(y=>y.id));
  const clearAll  = () => { setSelectedIds([]); setActiveTermId(null); setRightTab('defaults'); };

  // Open override tab for a term
  const openOverride = (id) => {
    if (!selectedIds.includes(id)) setSelectedIds(p=>[...p,id]);
    setActiveTermId(id);
    setRightTab('override');
  };

  // Override field helpers for currently active term
  const setOv     = (f,v) => setOverrides(p=>({...p,[activeTermId]:{...(p[activeTermId]??{}),[f]:v}}));
  const clearOv   = f     => setOverrides(p=>{ const n={...(p[activeTermId]??{})}; delete n[f]; return {...p,[activeTermId]:n}; });
  const clearAllOv= id    => setOverrides(p=>{ const n={...p}; delete n[id]; return n; });

  const activeOv        = overrides[activeTermId] ?? {};
  const activeYo        = academicYears.find(y=>y.id===activeTermId);
  const activeEffective = { ...defaults, ...activeOv };

  // Save
  const doSave = useCallback(async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one term.'); return; }
    const invalid = selectedIds.find(id => {
      const eff = { ...defaults, ...(overrides[id]??{}) };
      return eff.enrollment_open && !eff.accept_new_students && !eff.accept_transfers && !eff.accept_returning;
    });
    if (invalid) {
      const yo = academicYears.find(y=>y.id===invalid);
      toast.error(`${termLabel(yo)}: enrollment is open but no types are accepted.`);
      return;
    }
    setSubmitting(true);
    const sd = { ...defaults, required_documents:(defaults.required_documents||[]).filter(s=>ALLOWED_DOC_SLUGS.includes(s)) };
    if (!sd.open_date)  delete sd.open_date;
    if (!sd.close_date) delete sd.close_date;
    const terms = selectedIds.map(id => {
      const ov = { ...(overrides[id]??{}), academic_year_id:id };
      if (ov.open_date==='')  delete ov.open_date;
      if (ov.close_date==='') delete ov.close_date;
      if (ov.required_documents) ov.required_documents=ov.required_documents.filter(s=>ALLOWED_DOC_SLUGS.includes(s));
      return ov;
    });
    try {
      const res = await apiRequest('admin/enrollment-settings/bulk','POST',{ defaults:sd, terms });
      setBulkSaved({ created:res?.created??[], updated:res?.updated??[], summary:res?.summary??{} });
      toast.success(`✅ ${res?.message??'Bulk enrollment settings saved!'}`);
      onSuccess?.();
    } catch (err) {
      const msgs = err?.response?.data?.errors;
      if (msgs) Object.values(msgs).flat().forEach(m=>toast.error(m));
      else toast.error(err?.response?.data?.message??'Bulk save failed.');
    } finally { setSubmitting(false); }
  }, [selectedIds, defaults, overrides, academicYears, onSuccess, setSubmitting]);

  useEffect(() => { if(saveRef) saveRef.current = doSave; }, [saveRef, doSave]);

  // ── Success screen ────────────────────────────────────────────────────────
  if (bulkSaved) {
    const { created=[], updated=[], summary={} } = bulkSaved;
    const total = summary.total_processed ?? (created.length+updated.length);
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-emerald-500"/>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Bulk Setup Complete!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{total} term{total!==1?'s':''} processed.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{created.length}</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Created</p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{updated.length}</p>
            <p className="text-xs text-cyan-700 dark:text-cyan-400 mt-0.5">Updated</p>
          </div>
        </div>
        {(created.length+updated.length)>0 && (
          <div className="text-left space-y-1 max-w-sm mx-auto max-h-40 overflow-y-auto">
            {[...created.map(t=>({...t,_k:'created'})),...updated.map(t=>({...t,_k:'updated'}))].map((t,i)=>(
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{t.term_label??`Term ${t.academic_year_id}`}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t._k==='created'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400':'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'}`}>{t._k}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={onClose} className={`px-6 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>Close</button>
          <button onClick={()=>setBulkSaved(null)} className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
            <RefreshCw className="w-4 h-4"/> New Bulk Setup
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = selectedIds.length;
  const ovCount       = Object.values(overrides).filter(o=>Object.keys(o).length>0).length;

  return (
    // h-full fills the flex-1 body above; each column is flex-col with its own overflow-y-auto
    <div className="flex h-full overflow-hidden">

      {/* ══ LEFT: Term checklist ═════════════════════════════════════════════ */}
      <div className="w-44 sm:w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-3 pt-4 pb-3 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">Select Terms</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {selectedCount === 0 ? 'None' : `${selectedCount} / ${activeYears.length}`}
            </span>
            <div className="flex gap-2">
              {selectedCount < activeYears.length && (
                <button type="button" onClick={selectAll}
                  className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">All</button>
              )}
              {selectedCount > 0 && (
                <button type="button" onClick={clearAll}
                  className="text-[10px] font-semibold text-slate-400 hover:text-red-500 hover:underline">Clear</button>
              )}
            </div>
          </div>
        </div>

        {/* Year/term list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {calYears.map(yr => {
            const terms   = yearGroups[yr];
            const termIds = terms.map(y=>y.id);
            const allChosen = termIds.every(id=>selectedIds.includes(id));
            const somChosen = termIds.some(id=>selectedIds.includes(id));
            return (
              <div key={yr}>
                {/* Year row */}
                <button type="button" onClick={()=>toggleYear(yr)}
                  className="flex items-center gap-2 w-full mb-2 group">
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                    ${allChosen ? 'bg-cyan-500 border-cyan-500'
                    : somChosen ? 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-400'
                    :             'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 group-hover:border-cyan-400'}`}>
                    {allChosen && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {somChosen&&!allChosen && <div className="w-1.5 h-0.5 bg-cyan-500 rounded-full"/>}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{yr}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{terms.length}</span>
                </button>

                {/* Terms */}
                <div className="space-y-1 pl-1">
                  {terms.map(yo => {
                    const chosen   = selectedIds.includes(yo.id);
                    const hasOv    = Object.keys(overrides[yo.id]??{}).length > 0;
                    const isActive = activeTermId===yo.id && rightTab==='override';
                    return (
                      <div key={yo.id} className="flex items-center gap-1.5">
                        {/* Checkbox */}
                        <button type="button" onClick={()=>toggleTerm(yo.id)}
                          className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                            ${chosen ? 'bg-cyan-500 border-cyan-500'
                                     : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 hover:border-cyan-400'}`}>
                          {chosen && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>

                        {/* Term label — click to open override */}
                        <button type="button" onClick={()=>openOverride(yo.id)}
                          className={`flex-1 min-w-0 text-left px-2 py-1.5 rounded-lg text-xs font-medium truncate transition-all
                            ${isActive
                              ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200'
                              : chosen
                                ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-600 dark:hover:text-slate-400'}`}>
                          {yo.term ?? termLabel(yo)}
                        </button>

                        {/* Override dot */}
                        {hasOv && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0"/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {activeYears.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-[11px] text-slate-400">No active terms found.</p>
            </div>
          )}
        </div>

        {/* Footer counts */}
        {selectedCount > 0 && (
          <div className="px-3 py-2.5 border-t border-slate-200 dark:border-slate-600 flex-shrink-0 bg-slate-50 dark:bg-slate-700/30">
            <p className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400">{selectedCount} term{selectedCount!==1?'s':''} selected</p>
            {ovCount > 0 && <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-0.5">{ovCount} with overrides</p>}
          </div>
        )}
      </div>

      {/* ══ RIGHT: Defaults / Override panel ═════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-600 flex-shrink-0 px-5 sm:px-6 pt-4">
          <button type="button" onClick={()=>setRightTab('defaults')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors
              ${rightTab==='defaults'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Settings className="w-3.5 h-3.5"/>
            Shared Defaults
          </button>
          <button type="button" onClick={()=>{ if(activeTermId) setRightTab('override'); }} disabled={!activeTermId}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors disabled:opacity-40 disabled:cursor-default
              ${rightTab==='override'
                ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <Pencil className="w-3.5 h-3.5"/>
            {activeTermId && activeYo ? `${activeYo.term ?? termLabel(activeYo)}` : 'Per-term Override'}
          </button>
        </div>

        {/* Panel content — scrollable, pb-6 ensures last item clears the footer */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 pt-4 pb-8">

          {/* DEFAULTS tab */}
          {rightTab === 'defaults' && (
            selectedCount === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-7 h-7 text-slate-400"/>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No terms selected</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs mx-auto">
                  Check terms on the left to begin. Click any term name to set per-term overrides.
                </p>
              </div>
            ) : (
              <div>
                <div className={`${CLS.cyanBox} rounded-lg p-3 flex items-start gap-2 mb-4`}>
                  <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Applied to all <strong>{selectedCount} selected term{selectedCount!==1?'s':''}</strong>.
                    Click any term name on the left to set per-term overrides.
                  </p>
                </div>
                <BulkDefaultsForm defaults={defaults} onChange={setDefaults}/>
              </div>
            )
          )}

          {/* OVERRIDE tab */}
          {rightTab === 'override' && activeTermId && activeYo && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{termLabel(activeYo)}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeYo.start_date ? shortDate(activeYo.start_date) : '?'} – {activeYo.end_date ? shortDate(activeYo.end_date) : '?'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Overrides apply to this term only. All other fields use shared defaults.
                  </p>
                </div>
                {Object.keys(activeOv).length > 0 && (
                  <button type="button" onClick={()=>clearAllOv(activeTermId)}
                    className="text-xs font-semibold text-red-500 hover:underline flex-shrink-0">
                    Clear all
                  </button>
                )}
              </div>

              <OverrideRow label="Enrollment Status" isSet={activeOv.enrollment_open!==undefined} onClear={()=>clearOv('enrollment_open')} defaultVal={defaults.enrollment_open?'Open':'Closed'}>
                <Toggle checked={!!activeEffective.enrollment_open} onChange={v=>setOv('enrollment_open',v)}
                  label={activeEffective.enrollment_open?'Open':'Closed'}
                  description={activeOv.enrollment_open!==undefined ? '(overridden)' : `(default: ${defaults.enrollment_open?'Open':'Closed'})`}/>
              </OverrideRow>

              <OverrideRow label="Open Date" isSet={activeOv.open_date!==undefined} onClear={()=>clearOv('open_date')} defaultVal={defaults.open_date||"Term's start date"}>
                <input type="date" value={activeOv.open_date??''} onChange={e=>setOv('open_date',e.target.value)}
                  className={`w-full px-3 py-2 text-sm ${CLS.input}`}/>
              </OverrideRow>

              <OverrideRow label="Close Date" isSet={activeOv.close_date!==undefined} onClear={()=>clearOv('close_date')} defaultVal={defaults.close_date||"Term's end date"}>
                <input type="date" value={activeOv.close_date??''} onChange={e=>setOv('close_date',e.target.value)}
                  className={`w-full px-3 py-2 text-sm ${CLS.input}`}/>
              </OverrideRow>

              <OverrideRow label="Max Capacity" isSet={activeOv.max_capacity!==undefined} onClear={()=>clearOv('max_capacity')} defaultVal={defaults.max_capacity===0?'∞ Unlimited':String(defaults.max_capacity??0)}>
                <div className="flex items-center gap-2">
                  <input type="number" min={0}
                    value={activeOv.max_capacity??''}
                    placeholder={defaults.max_capacity===0?'∞':String(defaults.max_capacity??0)}
                    onChange={e=>setOv('max_capacity',Math.max(0,parseInt(e.target.value,10)||0))}
                    className={`w-32 px-3 py-2 text-sm font-semibold ${CLS.input}`}/>
                  <span className="text-xs text-slate-400">{activeOv.max_capacity===undefined?'(default)':'(overridden)'}</span>
                </div>
              </OverrideRow>

              {/* Rest from defaults summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Remaining settings from shared defaults</p>
                  <button type="button" onClick={()=>setRightTab('defaults')}
                    className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                    Edit defaults →
                  </button>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-y-2 gap-x-6">
                  {[
                    ['Waitlist',     defaults.allow_waitlist],
                    ['Auto-Approve', defaults.auto_approve],
                    ['New Students', defaults.accept_new_students],
                    ['Transfers',    defaults.accept_transfers],
                    ['Returning',    defaults.accept_returning],
                  ].map(([lbl,val])=>(
                    <div key={lbl} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{lbl}</span>
                      <Pill val={val}/>
                    </div>
                  ))}
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 mt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Required Docs</span>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{(defaults.required_documents||[]).length} selected</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Override tab — no term active */}
          {rightTab === 'override' && !activeTermId && (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">Click a term name on the left to set overrides.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EnrollmentConfigModal({ isOpen, onClose, academicYears = [], onSuccess }) {
  const { user } = useAuth();

  const [mode,              setMode]             = useState('single');
  const [step,              setStep]             = useState(1);
  const [selectedYearId,    setSelectedYearId]   = useState('');
  const [settingsId,        setSettingsId]       = useState(null);
  const [settingsUpdatedAt, setSettingsUpdatedAt]= useState(null);
  const [settings,          setSettings]         = useState({ ...BLANK });
  const [savedSnap,         setSavedSnap]        = useState(null);
  const [loadingSettings,   setLoadingSettings]  = useState(false);
  const [submitting,        setSubmitting]       = useState(false);
  const [saved,             setSaved]            = useState(false);

  const bulkSaveRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setMode('single'); setStep(1); setSelectedYearId(''); setSettingsId(null);
      setSettingsUpdatedAt(null); setSavedSnap(null); setSaved(false);
      setSettings({ ...BLANK });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && academicYears.length && !selectedYearId) {
      const active = academicYears.find(y=>y.is_active);
      if (active) setSelectedYearId(String(active.id));
    }
  }, [isOpen, academicYears]);

  useEffect(() => {
    if (!selectedYearId || mode !== 'single') return;
    let cancelled = false;
    const yo = academicYears.find(y=>String(y.id)===String(selectedYearId))??null;
    const load = async () => {
      setLoadingSettings(true);
      try {
        const res = await apiRequest(`admin/enrollment-settings?academic_year_id=${selectedYearId}`,'GET');
        if (cancelled) return;
        if (res?.settings) {
          const s = res.settings;
          const loaded = {
            enrollment_open:s.enrollment_open??false, open_date:toInputDate(s.open_date), close_date:toInputDate(s.close_date),
            max_capacity:s.max_capacity??0, current_enrolled:s.current_enrolled??0, allow_waitlist:s.allow_waitlist??false,
            auto_approve:s.auto_approve??false, required_documents:s.required_documents??[],
            accept_new_students:s.accept_new_students??true, accept_transfers:s.accept_transfers??true, accept_returning:s.accept_returning??true,
            notify_parent_on_submit:s.notify_parent_on_submit??true, notify_parent_on_approval:s.notify_parent_on_approval??true,
            notify_parent_on_rejection:s.notify_parent_on_rejection??true, notify_admin_on_new_application:s.notify_admin_on_new_application??true,
          };
          setSettingsId(s.id??null); setSettingsUpdatedAt(s.updated_at??null); setSettings(loaded); setSavedSnap({...loaded});
        } else {
          setSettingsId(null); setSettingsUpdatedAt(null); setSavedSnap(null);
          setSettings({...BLANK, open_date:defaultOpenDate(yo), close_date:defaultCloseDate(yo)});
        }
      } catch {
        if (cancelled) return;
        setSettingsId(null); setSettingsUpdatedAt(null); setSavedSnap(null);
        setSettings({...BLANK, open_date:defaultOpenDate(yo), close_date:defaultCloseDate(yo)});
      } finally { if(!cancelled) setLoadingSettings(false); }
    };
    load();
    return () => { cancelled=true; };
  }, [selectedYearId, academicYears, mode]);

  const handleSingleSave = useCallback(async () => {
    if (!selectedYearId) { toast.error('Select a term first.'); return; }
    setSubmitting(true);
    const sanitised = {...settings, required_documents:(settings.required_documents||[]).filter(s=>ALLOWED_DOC_SLUGS.includes(s))};
    const { current_enrolled, ...payload } = sanitised;
    try {
      if (settingsId) {
        const res = await apiRequest(`admin/enrollment-settings/${settingsId}`,'PUT',payload);
        if (res?.settings?.updated_at) setSettingsUpdatedAt(res.settings.updated_at);
        if (res?.settings?.current_enrolled!==undefined) setSettings(p=>({...p,current_enrolled:res.settings.current_enrolled}));
      } else {
        const res = await apiRequest('admin/enrollment-settings','POST',{academic_year_id:parseInt(selectedYearId,10),...payload});
        if (res?.settings?.id) { setSettingsId(res.settings.id); setSettingsUpdatedAt(res.settings.updated_at??null); }
      }
      setSavedSnap({...sanitised}); toast.success('✅ Enrollment configuration saved!'); setSaved(true); onSuccess?.();
    } catch (err) {
      const msgs = err?.response?.data?.errors;
      if (msgs) Object.values(msgs).flat().forEach(m=>toast.error(m));
      else toast.error(err?.response?.data?.message??'Save failed.');
    } finally { setSubmitting(false); }
  }, [selectedYearId, settingsId, settings, onSuccess]);

  const yo         = academicYears.find(y=>String(y.id)===String(selectedYearId))??null;
  const label      = termLabel(yo);
  const canProceed = !!selectedYearId && !loadingSettings;
  const isEditing  = !!settingsId;

  if (!isOpen) return null;

  const Conn = ({done}) => <div className={`flex-1 h-0.5 min-w-[8px] max-w-12 rounded ${done?'bg-green-400':'bg-slate-200 dark:bg-slate-700'}`}/>;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 w-full sm:rounded-xl shadow-2xl sm:max-w-4xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <Settings className="w-4 h-4 flex-shrink-0 text-cyan-600 dark:text-cyan-400"/>
              <span className="truncate">Enrollment Configuration</span>
              {mode==='bulk'
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex-shrink-0"><Layers className="w-2.5 h-2.5"/> Bulk</span>
                : isEditing
                  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex-shrink-0"><Pencil className="w-2.5 h-2.5"/> Editing</span>
                  : selectedYearId
                    ? <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex-shrink-0">New</span>
                    : null}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              {mode==='bulk'
                ? 'Check terms on the left → configure shared defaults on the right → optionally click any term to override.'
                : isEditing ? `Updating settings for ${label}`
                : selectedYearId ? `Creating settings for ${label}`
                : 'Select a term to begin.'}
            </p>
          </div>
          <button onClick={onClose} className="ml-2 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Mode toggle + step dots */}
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-x-auto">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0">
            <button type="button" onClick={()=>setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all
                ${mode==='single' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Settings className="w-3 h-3"/>
              <span className="hidden sm:inline">Single Term</span>
            </button>
            <button type="button" onClick={()=>setMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all border-l border-slate-200 dark:border-slate-700
                ${mode==='bulk' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Layers className="w-3 h-3"/>
              <span className="hidden sm:inline">Bulk Setup</span>
            </button>
          </div>
          {mode==='single' && (
            <>
              <StepDot n={1} label="Window"   step={step}/>
              <Conn done={step>1}/>
              <StepDot n={2} label="Approval" step={step}/>
              <Conn done={step>2}/>
              <StepDot n={3} label="Review"   step={step}/>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode==='bulk' ? (
            // Bulk: fill remaining height, each column scrolls independently
            <div className="flex-1 overflow-hidden">
              <BulkSetupView
                academicYears={academicYears}
                onClose={onClose}
                onSuccess={onSuccess}
                saveRef={bulkSaveRef}
                submitting={submitting}
                setSubmitting={setSubmitting}
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                {step===1 && (
                  <StepWindow settings={settings} onChange={setSettings}
                    academicYears={academicYears} selectedYearId={selectedYearId}
                    onYearChange={id=>{setSelectedYearId(id);setSettingsId(null);setSettingsUpdatedAt(null);setSavedSnap(null);}}
                    loading={loadingSettings} isEditing={isEditing}
                    settingsUpdatedAt={settingsUpdatedAt} yearLabel={label} savedSnap={savedSnap}/>
                )}
                {step===2 && <StepApproval settings={settings} onChange={setSettings}/>}
                {step===3 && !saved && <StepReview settings={settings} yearLabel={label} isEditing={isEditing}/>}
                {saved && (
                  <div className="max-w-lg mx-auto text-center py-8 space-y-4">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto"/>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Configuration Saved!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Settings for <strong>{label}</strong> {isEditing?'updated':'created'} successfully.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <button onClick={onClose} className={`px-6 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>Close</button>
                      <button onClick={()=>{setSaved(false);setStep(1);}} className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
                        <RefreshCw className="w-4 h-4"/> Edit Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — single */}
        {mode==='single' && !saved && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            {step>1
              ? <button onClick={()=>setStep(s=>s-1)} className={`px-4 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>Back</button>
              : <div/>}
            {step<3 ? (
              <button onClick={()=>{if(step===1&&!canProceed){toast.error('Select a term first.');return;}setStep(s=>s+1);}}
                disabled={step===1&&!canProceed}
                className={`px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
                Continue <ArrowRight className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={handleSingleSave} disabled={submitting}
                className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
                {submitting ? <><Loader className="w-4 h-4 animate-spin"/> Saving…</> : <><Save className="w-4 h-4"/>{isEditing?'Update Settings':'Save Settings'}</>}
              </button>
            )}
          </div>
        )}

        {/* Footer — bulk */}
        {mode==='bulk' && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
              Existing settings will be updated; new ones created.
            </p>
            <button onClick={()=>bulkSaveRef.current?.()} disabled={submitting}
              className={`px-6 py-2.5 text-sm rounded-lg flex items-center gap-2 ${CLS.primary}`}>
              {submitting ? <><Loader className="w-4 h-4 animate-spin"/> Saving…</> : <><Zap className="w-4 h-4"/> Apply to Selected Terms</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
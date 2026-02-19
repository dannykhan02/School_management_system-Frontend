// src/components/BulkAssignmentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, User, Calendar, ChevronDown, CheckCircle, AlertCircle, AlertTriangle,
  Loader, BookOpen, Layers, Send, RefreshCw, Info, CheckSquare, Square,
  XCircle, Clock, Wrench, Minus, Plus, RotateCcw, TrendingUp, ShieldAlert
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT — mirrors ManageAssignments exactly
//
// Modal wrapper:      bg-white dark:bg-slate-800/50
// Header/sticky:      bg-white dark:bg-slate-800/50  border-slate-200 dark:border-slate-700
// Title:              text-slate-900 dark:text-white
// Subtitle:           text-slate-500 dark:text-slate-400
// Labels:             text-slate-700 dark:text-slate-300
// Close btn:          text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
//                     hover:bg-slate-100 dark:hover:bg-slate-700
// All inputs/selects: border-slate-300 dark:border-slate-600
//                     bg-white dark:bg-slate-700
//                     text-slate-900 dark:text-white  focus:ring-cyan-500
// Info boxes (cyan):  bg-cyan-50 dark:bg-cyan-900/20  border-cyan-200 dark:border-cyan-800
//                     icon text-cyan-600 dark:text-cyan-400
//                     text  text-cyan-700 dark:text-cyan-300
// Neutral panel:      bg-slate-50 dark:bg-slate-700/40  border-slate-200 dark:border-slate-600
// Primary btn:        bg-black dark:bg-white  text-white dark:text-black
//                     hover:bg-gray-800 dark:hover:bg-gray-200  disabled:opacity-40
// Secondary btn:      border-slate-300 dark:border-slate-600  text-slate-700 dark:text-slate-300
//                     bg-white dark:bg-slate-700  hover:bg-slate-50 dark:hover:bg-slate-600
// Card:               bg-white dark:bg-slate-800/50  border-slate-200 dark:border-slate-700
// Badge (valid/type): bg-cyan-100 dark:bg-cyan-900/30  text-cyan-800 dark:text-cyan-300
// Bar track:          bg-slate-200 dark:bg-slate-700
// ─────────────────────────────────────────────────────────────────────────────

// Shared class strings — single source of truth
const CLS = {
  input:     'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg',
  primary:   'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  secondary: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  cyanBox:   'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800',
  card:      'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
};

// ─── Level mapping for compatibility check ───────────────────────────────────
const LEVEL_GRADE_MAP = {
  'Pre-Primary':      ['PP1-PP2'],
  'Primary':          ['Grade 1-3', 'Grade 4-6', 'Standard 1-4', 'Standard 5-8'],
  'Junior Secondary': ['Grade 7-9'],
  'Senior Secondary': ['Grade 10-12'],
  'Secondary':        ['Form 1-4'],
};

function levelFromGrade(gradeLevel) {
  for (const [level, grades] of Object.entries(LEVEL_GRADE_MAP)) {
    if (grades.includes(gradeLevel)) return level;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkloadBar
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadBar({ current, max, adding = 0, showMath = true }) {
  const newTotal  = current + adding;
  const pct       = Math.min((newTotal / max) * 100, 100);
  const over      = newTotal > max;
  const near      = !over && newTotal >= max * 0.9;
  const barColor  = over ? 'bg-red-500' : near ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = over  ? 'text-red-600 dark:text-red-400'
                  : near  ? 'text-yellow-600 dark:text-yellow-400'
                  :         'text-slate-700 dark:text-slate-300';
  return (
    <div className="flex items-center gap-2">
      {/* Track: ManageAssignments bg-slate-200 dark:bg-slate-700 */}
      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden min-w-0">
        <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {showMath && (
        <span className={`text-xs font-semibold whitespace-nowrap flex-shrink-0 ${textColor}`}>
          {adding > 0 ? `${current}+${adding}=${newTotal}/${max}` : `${current}/${max}`}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CumulativeWorkloadBanner
// ─────────────────────────────────────────────────────────────────────────────
function CumulativeWorkloadBanner({ teacherWorkload, validSubjects, rows }) {
  if (!teacherWorkload) return null;
  const base      = teacherWorkload.total_lessons ?? 0;
  const max       = teacherWorkload.max_lessons   ?? 0;
  const adding    = validSubjects.reduce((s, sub) => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);
  const newTotal  = base + adding;
  const over      = newTotal > max;
  const near      = !over && newTotal >= max * 0.9;
  const remaining = Math.max(0, max - newTotal);

  const wrapCls = over  ? 'bg-red-50    dark:bg-red-900/20    border-red-300    dark:border-red-700'
                : near  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                :         'bg-green-50  dark:bg-green-900/20  border-green-300  dark:border-green-700';
  const titleCls = over  ? 'text-red-800 dark:text-red-200'
                 : near  ? 'text-yellow-800 dark:text-yellow-200'
                 :         'text-green-800 dark:text-green-200';
  const badgeCls = over  ? 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300'
                 : near  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                 :         'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300';

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${wrapCls}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {over  ? <ShieldAlert   className="w-4 h-4 text-red-600    dark:text-red-400"    />
          : near  ? <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          :         <TrendingUp   className="w-4 h-4 text-green-600  dark:text-green-400"  />}
          <span className={`text-sm font-bold ${titleCls}`}>
            {over ? 'Cumulative workload EXCEEDED — fix before saving'
            : near ? 'Workload nearing maximum'
            :        'Cumulative workload looks good'}
          </span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
          {newTotal}/{max} periods/wk
        </span>
      </div>

      <WorkloadBar current={base} max={max} adding={adding} showMath={false} />

      {/* Breakdown cells — white/black overlay matches the pattern in ManageAssignments workload grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: 'Current load',                          val: base,      color: 'text-slate-700 dark:text-slate-300' },
          { label: `Adding (${validSubjects.length} subj.)`, val: adding,   color: 'text-cyan-600 dark:text-cyan-400'   },
          { label: 'New total',                             val: newTotal,  color: over ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white' },
          { label: 'Remaining',                             val: remaining, color: remaining === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white/60 dark:bg-black/20 rounded-lg py-2 px-1">
            <p className={`text-lg font-bold ${color}`}>{val}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {validSubjects.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Breakdown:</p>
          <div className="flex flex-wrap gap-1.5">
            {validSubjects.map(s => (
              <span key={s.id} className="text-xs px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-full text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {s.name} <strong>{rows[s.id]?.weekly_periods}p</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {over && (
        <div className="flex items-start gap-2 bg-red-100 dark:bg-red-900/30 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">
            Total would be <strong>{newTotal}</strong> — <strong>{newTotal - max}</strong> over the limit.
            Reduce periods on one or more subjects below before saving.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpecializationHint
// ─────────────────────────────────────────────────────────────────────────────
function SpecializationHint({ teachers, teacherId, subject }) {
  const teacher = teachers.find(t => t.id === parseInt(teacherId));
  if (!teacher || !subject || !teacher.specialization) return null;
  const spec  = (teacher.specialization || '').toLowerCase();
  const cat   = (subject.category || '').toLowerCase();
  const kw    = {
    mathematics:     ['math','mathematics'],
    sciences:        ['science','biology','chemistry','physics'],
    languages:       ['language','english','kiswahili','french','literature'],
    humanities:      ['history','geography','cre','ire','social'],
    technical:       ['technical','computer','ict','business','agriculture'],
    'creative arts': ['art','music','drama','creative'],
    'physical ed':   ['pe','physical','sport'],
  };
  const match = (kw[cat] || []).some(k => spec.includes(k));
  return match
    ? <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3 flex-shrink-0" />Specialization matches {subject.category}</p>
    : <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" />Specializes in <strong className="mx-1">{teacher.specialization}</strong>— subject is {subject.category}. Still allowed.</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkloadFixPanel — stepper + re-validate
// Primary button: ManageAssignments bg-black dark:bg-white token
// Stepper inputs: ManageAssignments input token
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadFixPanel({ currentLessons, maxLessons, requestedPeriods, maxAllowed, onApply, revalidating }) {
  const [fixPeriods, setFixPeriods] = useState(Math.max(1, maxAllowed));
  useEffect(() => { setFixPeriods(Math.max(1, maxAllowed)); }, [maxAllowed]);
  const adjust = d => setFixPeriods(p => Math.max(1, Math.min(maxAllowed, p + d)));

  return (
    <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-red-800 dark:text-red-200">Workload exceeded</p>
          <p className="text-red-600 dark:text-red-400 mt-0.5">
            {currentLessons} current + {requestedPeriods} requested = <strong>{currentLessons + requestedPeriods}</strong> (max <strong>{maxLessons}</strong>).
            {maxAllowed > 0 ? <> Reduce to ≤ <strong>{maxAllowed}</strong>.</> : ' No capacity remaining.'}
          </p>
        </div>
      </div>

      {maxAllowed > 0 ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">New periods/week:</span>
            <div className="flex items-center gap-1">
              {/* Stepper buttons — ManageAssignments hover:bg-slate-100 dark:hover:bg-slate-700 */}
              <button onClick={() => adjust(-1)} disabled={fixPeriods <= 1}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input type="number" value={fixPeriods} min={1} max={maxAllowed}
                onChange={e => setFixPeriods(Math.min(maxAllowed, Math.max(1, parseInt(e.target.value) || 1)))}
                className={`w-14 text-center text-sm font-bold py-1.5 ${CLS.input}`} />
              <button onClick={() => adjust(+1)} disabled={fixPeriods >= maxAllowed}
                className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">(max {maxAllowed})</span>
            </div>
          </div>

          <WorkloadBar current={currentLessons} max={maxLessons} adding={fixPeriods} />

          {/* Primary btn — ManageAssignments: bg-black dark:bg-white */}
          <button onClick={() => onApply(fixPeriods)} disabled={revalidating}
            className={`w-full py-2 text-xs rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
            {revalidating
              ? <><Loader className="w-3.5 h-3.5 animate-spin" />Re-validating…</>
              : <><RotateCcw className="w-3.5 h-3.5" />Apply {fixPeriods}p/wk &amp; Re-validate</>}
          </button>
        </>
      ) : (
        <p className="text-xs text-red-700 dark:text-red-300 text-center py-1">
          Teacher is fully booked — remove another assignment first.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubjectRow — Step 2
// Unchecked: ManageAssignments card token (bg-white dark:bg-slate-800/50)
// Selected:  cyan info-box token (bg-cyan-50 dark:bg-cyan-900/20)
// Inputs:    ManageAssignments input token
// ─────────────────────────────────────────────────────────────────────────────
function SubjectRow({ subject, checked, onToggle, classroomValue, streamValue, onClassroomChange, onStreamChange,
  teacherClassrooms, teacherStreams, hasStreams, validationState, weeklyPeriods, onPeriodsChange,
  validationErrors, validationWarnings, workloadSummary, teachers, teacherId,
  onFixPeriods, onRevalidate, revalidating }) {

  const [otherOpen, setOtherOpen] = useState(false);
  const hasLocation    = hasStreams ? streamValue : classroomValue;
  const hasPeriods     = weeklyPeriods && parseInt(weeklyPeriods) >= 1;
  const isIncomplete   = checked && (!hasLocation || !hasPeriods);
  const hasWorkloadErr = validationErrors?.some(e => e.type === 'workload_exceeded');
  const maxAllowed     = workloadSummary ? Math.max(0, workloadSummary.max_lessons - workloadSummary.current_lessons) : 0;
  const [fixOpen, setFixOpen] = useState(false);
  useEffect(() => { if (hasWorkloadErr) setFixOpen(true); }, [hasWorkloadErr]);

  const statusIcon = () => {
    if (validationState === 'valid')   return <CheckCircle   className="w-4 h-4 text-green-600  dark:text-green-400  flex-shrink-0" />;
    if (validationState === 'invalid') return <AlertCircle   className="w-4 h-4 text-red-600    dark:text-red-400    flex-shrink-0" />;
    if (validationState === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
    if (isIncomplete)                  return <AlertCircle   className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />;
    return null;
  };

  const rowBg = !checked
    ? 'bg-white dark:bg-slate-800/50 border-transparent'           // ManageAssignments card token
    : isIncomplete
    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700'
    : validationState === 'valid'
    ? 'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800'
    : validationState === 'invalid'
    ? 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800'
    : validationState === 'warning'
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    : 'bg-cyan-50   dark:bg-cyan-900/20   border-cyan-200   dark:border-cyan-800'; // ManageAssignments info box

  const selectCls = `w-full px-3 py-2 text-xs ${CLS.input} appearance-none`;

  return (
    <div className={`border rounded-lg transition-all duration-200 ${rowBg}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-shrink-0">
          {/* Checkbox — cyan accent icon, ManageAssignments Pencil btn hover colour */}
          {checked
            ? <CheckSquare className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            : <Square      className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{subject.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{subject.code}</span>
            {subject.is_core && (
              <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">Core</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Recommended: {subject.minimum_weekly_periods || 3}–{subject.maximum_weekly_periods || 6} p/wk
          </p>
          {isIncomplete && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              Missing: {!hasLocation && (hasStreams ? 'stream' : 'classroom')}{!hasLocation && !hasPeriods && ' and '}{!hasPeriods && 'weekly periods'}
            </p>
          )}
        </div>
        {statusIcon()}
      </div>

      {/* Expanded form */}
      {checked && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {hasStreams ? 'Stream' : 'Classroom'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select value={hasStreams ? streamValue : classroomValue}
                  onChange={hasStreams ? onStreamChange : onClassroomChange}
                  onClick={e => e.stopPropagation()}
                  className={`${selectCls} pl-8`}>
                  <option value="">Select…</option>
                  {(hasStreams ? teacherStreams : teacherClassrooms).map(item => (
                    <option key={item.id} value={item.id}>{item.name}{item.is_class_teacher ? ' ⭐' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Periods */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Periods/Week <span className="text-red-500">*</span>
                {hasWorkloadErr && maxAllowed > 0 && <span className="ml-1 text-red-500">(max {maxAllowed})</span>}
              </label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="number" value={weeklyPeriods} min={1}
                  max={hasWorkloadErr && maxAllowed > 0 ? maxAllowed : 40}
                  onChange={onPeriodsChange} onClick={e => e.stopPropagation()}
                  className={`w-full pl-8 pr-2 py-2 text-xs ${CLS.input} ${hasWorkloadErr ? 'border-red-400 dark:border-red-600' : ''}`} />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select onClick={e => e.stopPropagation()} defaultValue="main_teacher" className={selectCls}>
                <option value="main_teacher">Main Teacher</option>
                <option value="assistant_teacher">Assistant</option>
                <option value="substitute">Substitute</option>
              </select>
            </div>
          </div>

          {/* Spec hint */}
          {teacherId && (
            <div className="px-3 sm:px-4 pb-2">
              <SpecializationHint teachers={teachers} teacherId={teacherId} subject={subject} />
            </div>
          )}

          {/* Workload fix panel */}
          {hasWorkloadErr && (
            <div className="px-3 sm:px-4 pb-3">
              <button onClick={e => { e.stopPropagation(); setFixOpen(v => !v); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors">
                <Wrench className="w-3.5 h-3.5" />
                {fixOpen ? 'Hide fix panel' : 'Fix workload overload ↓'}
              </button>
              {fixOpen && (
                <WorkloadFixPanel
                  currentLessons={workloadSummary?.current_lessons ?? 0}
                  maxLessons={workloadSummary?.max_lessons ?? 0}
                  requestedPeriods={parseInt(weeklyPeriods) || 0}
                  maxAllowed={maxAllowed}
                  onApply={newP => { onFixPeriods(newP); onRevalidate(newP); }}
                  revalidating={revalidating}
                />
              )}
            </div>
          )}

          {/* Other errors/warnings */}
          {((validationErrors?.filter(e => e.type !== 'workload_exceeded').length > 0) || validationWarnings?.length > 0) && (
            <div className="px-3 sm:px-4 pb-3">
              <button onClick={e => { e.stopPropagation(); setOtherOpen(v => !v); }}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${otherOpen ? 'rotate-180' : ''}`} />
                {otherOpen ? 'Hide' : 'Show'} other details
              </button>
              {otherOpen && (
                <div className="mt-2 space-y-1.5">
                  {validationErrors?.filter(e => e.type !== 'workload_exceeded').map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 dark:text-red-300">{err.message}</p>
                    </div>
                  ))}
                  {validationWarnings?.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-700 dark:text-amber-300">{w.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReviewCard — Step 3
// Valid card:   ManageAssignments card token (bg-white dark:bg-slate-800/50)
// Valid badge:  ManageAssignments badge token (bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300)
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({ subject, row, location, cumulativeOverflow, onFixPeriods, onRevalidate, revalidating }) {
  const val            = row.validation;
  const hasWorkloadErr = val?.errors?.some(e => e.type === 'workload_exceeded');
  const ws             = val?.workload_summary;
  const maxAllowed     = ws ? Math.max(0, ws.max_lessons - ws.current_lessons) : 0;
  const [fixOpen, setFixOpen] = useState(false);
  useEffect(() => { if (hasWorkloadErr || cumulativeOverflow) setFixOpen(true); }, [hasWorkloadErr, cumulativeOverflow]);

  const isValid          = val?.valid;
  const hasCumulativeWarn= !hasWorkloadErr && cumulativeOverflow && isValid;

  const cardBg = !isValid
    ? 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800'
    : hasCumulativeWarn
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
    : 'bg-white     dark:bg-slate-800/50  border-slate-200  dark:border-slate-700'; // ManageAssignments card token

  const badgeCls = !isValid
    ? 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300'
    : hasCumulativeWarn
    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
    : 'bg-cyan-100   text-cyan-800   dark:bg-cyan-900/30   dark:text-cyan-300'; // ManageAssignments badge token

  return (
    <div className={`border rounded-lg p-3 sm:p-4 transition-all ${cardBg}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {!isValid
            ? <XCircle      className="w-4 h-4 text-red-600    dark:text-red-400"    />
            : hasCumulativeWarn
            ? <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            : <CheckCircle  className="w-4 h-4 text-green-600  dark:text-green-400"  />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{subject.name}</span>
              {location && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">→ {location}</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{row.weekly_periods}p/wk</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>
                {!isValid ? '✗ Invalid' : hasCumulativeWarn ? '⚠ Adjust' : '✓ Valid'}
              </span>
            </div>
          </div>

          {hasCumulativeWarn && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1.5 flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              This subject contributes to a cumulative overload. Reduce its periods below.
            </p>
          )}
          {val?.errors?.filter(e => e.type !== 'workload_exceeded').map((err, i) => (
            <p key={i} className="text-xs text-red-600 dark:text-red-400 mt-1">• {err.message}</p>
          ))}
          {val?.warnings?.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚡ {w.message}</p>
          ))}
        </div>
      </div>

      {(hasWorkloadErr || hasCumulativeWarn) && (
        <div className="mt-2">
          <button onClick={() => setFixOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors">
            <Wrench className="w-3.5 h-3.5" />
            {fixOpen ? 'Hide fix' : hasWorkloadErr ? 'Fix overload ↓' : 'Reduce periods ↓'}
          </button>
          {fixOpen && (
            <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-3">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                {hasWorkloadErr
                  ? `Individual workload exceeded. Max ${maxAllowed} period${maxAllowed !== 1 ? 's' : ''} allowed.`
                  : `Cumulative total is too high. Reduce this subject's periods to bring the total within limit.`}
              </p>
              <WorkloadFixPanel
                currentLessons={ws?.current_lessons ?? 0}
                maxLessons={ws?.max_lessons ?? 0}
                requestedPeriods={parseInt(row.weekly_periods) || 0}
                maxAllowed={hasWorkloadErr ? maxAllowed : parseInt(row.weekly_periods) - 1}
                onApply={newP => { onFixPeriods(newP); onRevalidate(newP); }}
                revalidating={revalidating}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BulkAssignmentModal — main
// ─────────────────────────────────────────────────────────────────────────────
export default function BulkAssignmentModal({ isOpen, onClose, academicYears, teachers, subjects, hasStreams, onSuccess }) {
  const [step, setStep]                          = useState(1);
  const [selectedTeacherId, setSelectedTeacherId]= useState('');
  const [selectedAcademicYearId, setAcYr]        = useState('');
  const [teacherWorkload, setTeacherWorkload]     = useState(null);
  const [teacherClassrooms, setTeacherClassrooms]= useState([]);
  const [teacherStreams, setTeacherStreams]       = useState([]);
  const [loadingTeacher, setLoadingTeacher]      = useState(false);
  const [rows, setRows]                          = useState({});
  const [validating, setValidating]              = useState(false);
  const [revalidatingRows, setRevalidatingRows]  = useState({});
  const [submitting, setSubmitting]              = useState(false);
  const [results, setResults]                    = useState(null);
  const [filterCat, setFilterCat]                = useState('all');
  const [searchTerm, setSearchTerm]              = useState('');
  const [teacherProfile, setTeacherProfile]       = useState(null); // NEW: store full teacher object

  const selectedTeacher  = teachers.find(t => t.id === parseInt(selectedTeacherId));
  const checkedSubjects  = subjects.filter(s => rows[s.id]?.checked);
  const validSubjects    = checkedSubjects.filter(s => rows[s.id]?.validation?.valid);
  const invalidSubjects  = checkedSubjects.filter(s => rows[s.id]?.validation && !rows[s.id].validation.valid);
  const warnSubjects     = validSubjects.filter(s => rows[s.id]?.validation?.warnings?.length > 0);
  const totalPeriodsAdding = checkedSubjects.reduce((s, sub) => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);
  const validPeriodsAdding = validSubjects.reduce((s, sub)  => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);

  const cumulativeBase   = teacherWorkload?.total_lessons ?? 0;
  const cumulativeMax    = teacherWorkload?.max_lessons   ?? 0;
  const cumulativeTotal  = cumulativeBase + validPeriodsAdding;
  const cumulativeOver   = cumulativeTotal > cumulativeMax;
  const cumulativeOverBy = Math.max(0, cumulativeTotal - cumulativeMax);

  const categories       = ['all', ...new Set(subjects.map(s => s.category).filter(Boolean))];
  const filteredSubjects = subjects.filter(s => {
    const mc = filterCat === 'all' || s.category === filterCat;
    const ms = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return mc && ms;
  });

  // NEW: compatibility filter
  const isSubjectCompatible = useCallback((subject) => {
    if (!teacherProfile) return true;
    const teachingLevels = teacherProfile.teaching_levels || [];
    const teachingPathways = teacherProfile.teaching_pathways || [];
    if (teachingLevels.length === 0) return true;

    const subjectLevel = levelFromGrade(subject.grade_level);
    if (subjectLevel && !teachingLevels.includes(subjectLevel)) return false;
    if (subject.pathway && teachingPathways.length > 0 && !teachingPathways.includes(subject.pathway)) return false;
    return true;
  }, [teacherProfile]);

  const compatibleFilteredSubjects = filteredSubjects.filter(s => isSubjectCompatible(s));
  const incompatibleFilteredSubjects = filteredSubjects.filter(s => !isSubjectCompatible(s));

  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedTeacherId(''); setAcYr('');
      setTeacherWorkload(null); setTeacherClassrooms([]); setTeacherStreams([]);
      setRows({}); setResults(null); setFilterCat('all'); setSearchTerm('');
      setRevalidatingRows({});
      setTeacherProfile(null);  // ← reset teacher profile
    }
  }, [isOpen]);

  useEffect(() => {
    const cur = academicYears.find(y => y.is_current);
    if (cur && !selectedAcademicYearId && isOpen) setAcYr(String(cur.id));
  }, [academicYears, isOpen]);

  useEffect(() => {
    if (!selectedTeacherId || !selectedAcademicYearId) { setTeacherWorkload(null); return; }
    fetchTeacherData();
  }, [selectedTeacherId, selectedAcademicYearId]);

  const fetchTeacherData = async () => {
    setLoadingTeacher(true);
    try {
      const [wlRes, tRes, locRes] = await Promise.all([
        apiRequest(`teachers/${selectedTeacherId}/workload?academic_year_id=${selectedAcademicYearId}`, 'GET'),
        apiRequest(`teachers/${selectedTeacherId}`, 'GET'),
        hasStreams ? apiRequest('streams', 'GET') : apiRequest('classrooms', 'GET'),
      ]);
      setTeacherWorkload(wlRes.data || wlRes);
      const td = tRes.data || tRes;
      setTeacherProfile(td);  // ← store full teacher object
      if (hasStreams) {
        const ctIds = new Set((td.classTeacherStreams || td.class_teacher_streams || []).map(s => s.id || s.stream_id));
        const all   = Array.isArray(locRes) ? locRes : (locRes?.data || []);
        setTeacherStreams(all.map(s => ({
          id: s.id,
          name: s.classroom?.class_name ? `${s.classroom.class_name} - ${s.name}` : (s.name || `Stream ${s.id}`),
          is_class_teacher: ctIds.has(s.id),
        })).sort((a, b) => a.is_class_teacher === b.is_class_teacher ? a.name.localeCompare(b.name) : a.is_class_teacher ? -1 : 1));
        setTeacherClassrooms([]);
      } else {
        const all = Array.isArray(locRes) ? locRes : (locRes?.data || []);
        setTeacherClassrooms(all.map(c => ({ id: c.id, name: c.class_name || c.name || `Class ${c.id}`, is_class_teacher: false })));
        setTeacherStreams([]);
      }
    } catch { toast.error('Failed to load teacher data'); }
    finally { setLoadingTeacher(false); }
  };

  const toggleRow = useCallback((subject) => {
    setRows(prev => {
      const ex = prev[subject.id];
      if (ex?.checked) return { ...prev, [subject.id]: { ...ex, checked: false } };
      return { ...prev, [subject.id]: { checked: true, classroom_id: '', stream_id: '', weekly_periods: subject.minimum_weekly_periods || 3, assignment_type: 'main_teacher', validation: null } };
    });
  }, []);

  const updateRow = useCallback((id, field, value) => {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], [field]: value, validation: null } }));
  }, []);

  const selectAll = () => {
    setRows(prev => {
      const u = { ...prev };
      compatibleFilteredSubjects.forEach(s => {  // ← use compatible subjects only
        if (!u[s.id]?.checked) u[s.id] = {
          checked: true,
          classroom_id:  hasStreams ? '' : (teacherClassrooms[0]?.id || ''),
          stream_id:     hasStreams ? (teacherStreams[0]?.id || '') : '',
          weekly_periods: s.minimum_weekly_periods || 3,
          assignment_type: 'main_teacher',
          validation: null,
        };
      });
      return u;
    });
  };

  const validateRow = async (subjectId, periodsOverride) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const row     = rows[subjectId];
    const periods = periodsOverride ?? parseInt(row.weekly_periods);
    setRevalidatingRows(r => ({ ...r, [subjectId]: true }));
    try {
      const res = await apiRequest(`teachers/${selectedTeacherId}/validate-assignment`, 'POST', {
        subject_id: subjectId, academic_year_id: parseInt(selectedAcademicYearId), weekly_periods: periods,
        classroom_id: row.classroom_id ? parseInt(row.classroom_id) : null,
        stream_id:    row.stream_id    ? parseInt(row.stream_id)    : null,
      });
      setRows(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], weekly_periods: String(periods), validation: { valid: res.valid, errors: res.data?.errors || [], warnings: res.data?.warnings || [], workload_summary: res.data?.workload_summary } } }));
      toast[res.valid ? 'success' : 'warning'](`${res.valid ? '✅' : '⚠️'} ${subject.name}: ${res.valid ? 'valid!' : 'still has issues.'}`);
    } catch { toast.error(`Re-validation failed for ${subject.name}`); }
    finally { setRevalidatingRows(r => ({ ...r, [subjectId]: false })); }
  };

  const validateAll = async () => {
    if (!checkedSubjects.length) { toast.warning('Select at least one subject'); return; }
    const incomplete = checkedSubjects.filter(s => {
      const r = rows[s.id];
      return !(hasStreams ? r.stream_id : r.classroom_id) || !r.weekly_periods || parseInt(r.weekly_periods) < 1;
    });
    if (incomplete.length) { toast.error(`Fill in all fields for: ${incomplete.map(s => s.name).join(', ')}`); return; }
    setValidating(true);
    const updated = { ...rows };
    for (const sub of checkedSubjects) {
      const r = rows[sub.id];
      try {
        const res = await apiRequest(`teachers/${selectedTeacherId}/validate-assignment`, 'POST', {
          subject_id: sub.id, academic_year_id: parseInt(selectedAcademicYearId), weekly_periods: parseInt(r.weekly_periods),
          classroom_id: r.classroom_id ? parseInt(r.classroom_id) : null,
          stream_id:    r.stream_id    ? parseInt(r.stream_id)    : null,
        });
        updated[sub.id] = { ...r, validation: { valid: res.valid, errors: res.data?.errors || [], warnings: res.data?.warnings || [], workload_summary: res.data?.workload_summary } };
      } catch (err) {
        updated[sub.id] = { ...r, validation: { valid: false, errors: [{ type: 'api_error', message: err?.response?.data?.message || 'Validation failed.' }], warnings: [] } };
      }
    }
    setRows(updated);
    setValidating(false);
    const vCount = checkedSubjects.filter(s => updated[s.id]?.validation?.valid).length;
    const iCount = checkedSubjects.length - vCount;
    if (iCount === 0) { toast.success(`✅ All ${vCount} valid!`); setStep(3); }
    else if (vCount > 0) { toast.warning(`⚠️ ${vCount} valid, ${iCount} need fixing.`); setStep(3); }
    else toast.error(`❌ All have errors — fix using the panels.`);
  };

  const submitAssignments = async () => {
    if (cumulativeOver) { toast.error(`Cumulative workload exceeds max by ${cumulativeOverBy} period${cumulativeOverBy !== 1 ? 's' : ''}. Reduce periods first.`); return; }
    if (!validSubjects.length) { toast.error('No valid assignments to save'); return; }
    setSubmitting(true);
    const success = [], fail = [];
    for (const sub of validSubjects) {
      const r = rows[sub.id];
      try {
        await apiRequest('subject-assignments', 'POST', { teacher_id: parseInt(selectedTeacherId), subject_id: sub.id, academic_year_id: parseInt(selectedAcademicYearId), weekly_periods: parseInt(r.weekly_periods), assignment_type: r.assignment_type || 'main_teacher', classroom_id: r.classroom_id ? parseInt(r.classroom_id) : null, stream_id: r.stream_id ? parseInt(r.stream_id) : null });
        success.push(sub.name);
      } catch (err) { fail.push({ name: sub.name, reason: err?.response?.data?.message || 'Unknown error' }); }
    }
    setResults({ success, failed: fail });
    setSubmitting(false);
    if (success.length) { toast.success(`✅ ${success.length} saved!`); onSuccess?.(); }
    if (fail.length) toast.error(`❌ ${fail.length} failed`);
  };

  if (!isOpen) return null;

  // Step indicator dot
  // Active:  ManageAssignments primary btn (bg-black dark:bg-white)
  // Done:    green semantic
  // Idle:    ManageAssignments bar track (bg-slate-200 dark:bg-slate-700)
  const StepDot = ({ n, label }) => (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
      step === n ? 'bg-black dark:bg-white text-white dark:text-black'
      : step > n  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      :             'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
    }`}>
      {step > n ? <CheckCircle className="w-3 h-3" /> : <span>{n}</span>}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4">

      {/* Modal — ManageAssignments: bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 */}
      <div className="bg-white dark:bg-slate-800/50 w-full sm:rounded-xl shadow-2xl sm:max-w-5xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">

        {/* ── Header — ManageAssignments sticky header token */}
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0">
            {/* ManageAssignments: text-lg sm:text-xl font-semibold text-slate-900 dark:text-white */}
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Bulk Subject Assignment</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              Assign multiple subjects to a teacher at once
            </p>
          </div>
          {/* ManageAssignments close btn exact token */}
          <button onClick={onClose}
            className="ml-2 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step strip — same bg as header */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50 overflow-x-auto">
          <StepDot n={1} label="Setup" />
          <div className={`flex-1 h-0.5 max-w-8 sm:max-w-16 rounded flex-shrink-0 ${step > 1 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={2} label="Select & Validate" />
          <div className={`flex-1 h-0.5 max-w-8 sm:max-w-16 rounded flex-shrink-0 ${step > 2 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={3} label="Review & Save" />
        </div>

        {/* ── Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ STEP 1: Setup ════ */}
          {step === 1 && (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-5">

              {/* Info panel — ManageAssignments cyan info-box token */}
              <div className={`${CLS.cyanBox} rounded-lg p-3 sm:p-4 flex items-start gap-3`}>
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300">
                  Select a teacher and year, then choose subjects to assign. Each is validated individually and the <strong>cumulative total</strong> is checked before saving.
                </p>
              </div>

              {/* Academic Year — ManageAssignments label + select token */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={selectedAcademicYearId} onChange={e => setAcYr(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 text-sm ${CLS.input}`}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher — ManageAssignments label + select + disabled token */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                    disabled={!selectedAcademicYearId}
                    className={`w-full pl-10 pr-3 py-2 text-sm ${CLS.input} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} — {t.specialization || t.curriculum_specialization || 'N/A'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading — ManageAssignments: bg-cyan-50 dark:bg-cyan-900/20 spinner text-cyan-600 */}
              {loadingTeacher && (
                <div className={`flex items-center gap-2 p-4 ${CLS.cyanBox} rounded-lg`}>
                  <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm text-cyan-700 dark:text-cyan-300">Loading teacher data…</span>
                </div>
              )}

              {/* Teacher workload panel — ManageAssignments: bg-cyan-50 border-cyan-200 */}
              {!loadingTeacher && teacherWorkload && selectedTeacher && (
                <div className={`${CLS.cyanBox} rounded-lg p-4 space-y-3`}>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    {selectedTeacher.name}'s Current Workload
                  </h4>
                  <WorkloadBar current={teacherWorkload.total_lessons} max={teacherWorkload.max_lessons} />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { v: teacherWorkload.total_lessons,      l: 'Current'   },
                      { v: teacherWorkload.max_lessons,        l: 'Max'       },
                      { v: teacherWorkload.available_capacity, l: 'Available' },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-white/60 dark:bg-black/20 rounded-lg py-2 px-1">
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{v}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{l}</p>
                      </div>
                    ))}
                  </div>
                  {teacherWorkload.available_capacity <= 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg p-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Teacher is fully booked. Assignments will be blocked.
                    </div>
                  )}
                </div>
              )}

              {/* Continue — ManageAssignments primary btn */}
              <button onClick={() => setStep(2)}
                disabled={!selectedTeacherId || !selectedAcademicYearId || loadingTeacher}
                className={`w-full py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                Continue to Subject Selection <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════ STEP 2: Select & Validate ════ */}
          {step === 2 && (
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">

              {/* Projected workload — ManageAssignments cyan info-box */}
              {teacherWorkload && (
                <div className={`${CLS.cyanBox} rounded-lg p-3 sm:p-4`}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      {selectedTeacher?.name} — projected workload
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">+{totalPeriodsAdding}p from {checkedSubjects.length} subjects</span>
                  </div>
                  <WorkloadBar current={teacherWorkload.total_lessons} max={teacherWorkload.max_lessons} adding={totalPeriodsAdding} />
                </div>
              )}

              {/* Filters — ManageAssignments input token */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Search subjects…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`flex-1 px-3 py-2 text-sm ${CLS.input}`} />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                  className={`sm:w-40 px-3 py-2 text-sm ${CLS.input}`}>
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {/* Select All — ManageAssignments badge/cyan token for secondary-accent btn */}
                  <button onClick={selectAll}
                    className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-all">
                    Select All
                  </button>
                  {/* Clear — ManageAssignments secondary btn */}
                  <button onClick={() => setRows({})}
                    className={`flex-1 sm:flex-none px-3 py-2 text-xs rounded-lg ${CLS.secondary}`}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{checkedSubjects.length}</strong> of {subjects.length} selected
                </span>
                {checkedSubjects.length > 0 && (
                  <span className="text-slate-500 dark:text-slate-400">{totalPeriodsAdding} total p/wk</span>
                )}
              </div>

              {/* Subject list */}
              <div className="space-y-2 max-h-[50vh] sm:max-h-[45vh] overflow-y-auto pr-0.5">
                {filteredSubjects.length === 0
                  ? <div className="text-center py-12 text-slate-500 dark:text-slate-400">No subjects found</div>
                  : (
                    <>
                      {/* Compatible subjects */}
                      {compatibleFilteredSubjects.map(sub => {
                        const row = rows[sub.id] || {};
                        const val = row.validation;
                        const vs  = !val ? null : !val.valid ? 'invalid' : val.warnings?.length ? 'warning' : 'valid';
                        return (
                          <SubjectRow key={sub.id} subject={sub}
                            checked={!!row.checked} onToggle={() => toggleRow(sub)}
                            classroomValue={row.classroom_id || ''} streamValue={row.stream_id || ''}
                            onClassroomChange={e => updateRow(sub.id, 'classroom_id', e.target.value)}
                            onStreamChange={e => updateRow(sub.id, 'stream_id', e.target.value)}
                            teacherClassrooms={teacherClassrooms} teacherStreams={teacherStreams} hasStreams={hasStreams}
                            validationState={vs}
                            weeklyPeriods={row.weekly_periods ?? (sub.minimum_weekly_periods || 3)}
                            onPeriodsChange={e => updateRow(sub.id, 'weekly_periods', e.target.value)}
                            validationErrors={val?.errors} validationWarnings={val?.warnings}
                            workloadSummary={val?.workload_summary}
                            teachers={teachers} teacherId={selectedTeacherId}
                            onFixPeriods={newP => updateRow(sub.id, 'weekly_periods', String(newP))}
                            onRevalidate={p => validateRow(sub.id, p)}
                            revalidating={!!revalidatingRows[sub.id]}
                          />
                        );
                      })}

                      {/* Incompatible subjects — shown but blocked */}
                      {incompatibleFilteredSubjects.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 py-2">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium px-2">
                              {incompatibleFilteredSubjects.length} subject{incompatibleFilteredSubjects.length !== 1 ? 's' : ''} incompatible with this teacher
                            </span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                          </div>
                          {incompatibleFilteredSubjects.map(sub => (
                            <div key={sub.id}
                              className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30 opacity-60 p-3 sm:p-4 flex items-center gap-3">
                              <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">{sub.name}</span>
                                  <span className="text-xs text-slate-400 font-mono">{sub.code}</span>
                                </div>
                                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {(() => {
                                    const level = levelFromGrade(sub.grade_level);
                                    const teachingLevels = teacherProfile?.teaching_levels || [];
                                    if (level && teachingLevels.length > 0 && !teachingLevels.includes(level))
                                      return `Teacher doesn't teach ${level}`;
                                    if (sub.pathway)
                                      return `Teacher doesn't teach ${sub.pathway} pathway`;
                                    return 'Incompatible with this teacher';
                                  })()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )
                }
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {/* Back — ManageAssignments secondary / Cancel btn */}
                <button onClick={() => setStep(1)}
                  className={`px-4 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>
                  Back
                </button>
                {/* Validate — ManageAssignments primary btn */}
                <button onClick={validateAll} disabled={!checkedSubjects.length || validating}
                  className={`flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                  {validating
                    ? <><Loader className="w-4 h-4 animate-spin" />Validating {checkedSubjects.length} assignment{checkedSubjects.length !== 1 ? 's' : ''}…</>
                    : <><CheckCircle className="w-4 h-4" />Validate {checkedSubjects.length} Assignment{checkedSubjects.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: Review & Save ════ */}
          {step === 3 && !results && (
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">

              <CumulativeWorkloadBanner teacherWorkload={teacherWorkload} validSubjects={validSubjects} rows={rows} />

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { icon: CheckCircle,   count: validSubjects.length,   label: 'Ready to Save', color: 'green'  },
                  { icon: AlertTriangle, count: warnSubjects.length,    label: 'With Warnings', color: 'yellow' },
                  { icon: XCircle,       count: invalidSubjects.length, label: 'Need Fixing',   color: 'red'    },
                ].map(({ icon: Icon, count, label, color }) => (
                  <div key={label} className={`text-center p-3 sm:p-4 bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-lg`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${color}-600 dark:text-${color}-400 mx-auto mb-1.5`} />
                    <p className={`text-xl sm:text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{count}</p>
                    <p className={`text-xs text-${color}-700 dark:text-${color}-300 font-medium leading-tight`}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Blocked save banner */}
              {cumulativeOver && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 dark:text-red-300">
                    <strong>Save blocked:</strong> Combined workload ({cumulativeBase} + {validPeriodsAdding} = {cumulativeTotal}) exceeds max ({cumulativeMax}) by <strong>{cumulativeOverBy} period{cumulativeOverBy !== 1 ? 's' : ''}</strong>.
                    Use the <em>Reduce periods</em> panels below.
                  </div>
                </div>
              )}

              {/* Review cards — valid ones use ManageAssignments card token */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-0.5">
                {checkedSubjects.map(sub => {
                  const row = rows[sub.id];
                  const loc = hasStreams
                    ? teacherStreams.find(s => String(s.id) === String(row.stream_id))?.name
                    : teacherClassrooms.find(c => String(c.id) === String(row.classroom_id))?.name;
                  return (
                    <ReviewCard key={sub.id} subject={sub} row={row} location={loc}
                      cumulativeOverflow={cumulativeOver && row.validation?.valid}
                      onFixPeriods={newP => updateRow(sub.id, 'weekly_periods', String(newP))}
                      onRevalidate={p => validateRow(sub.id, p)}
                      revalidating={!!revalidatingRows[sub.id]}
                    />
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(2)}
                  className={`px-4 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>
                  Back
                </button>
                <button onClick={submitAssignments}
                  disabled={!validSubjects.length || submitting || cumulativeOver}
                  className={`flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                  {submitting
                    ? <><Loader className="w-4 h-4 animate-spin" />Saving…</>
                    : cumulativeOver
                    ? <><ShieldAlert className="w-4 h-4" />Fix overload first</>
                    : <><Send className="w-4 h-4" />Save {validSubjects.length} Valid Assignment{validSubjects.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          )}

          {/* ════ Results ════ */}
          {results && (
            <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-4">
              <div className="text-center">
                {results.success.length > 0 && results.failed.length === 0
                  ? <CheckCircle   className="w-14 h-14 sm:w-16 sm:h-16 text-green-500  mx-auto mb-3" />
                  : results.success.length === 0
                  ? <XCircle       className="w-14 h-14 sm:w-16 sm:h-16 text-red-500    mx-auto mb-3" />
                  : <AlertTriangle className="w-14 h-14 sm:w-16 sm:h-16 text-yellow-500 mx-auto mb-3" />}
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {results.success.length > 0 && results.failed.length === 0 ? 'All Done!'
                  : results.success.length === 0 ? 'All Failed' : 'Partially Complete'}
                </h3>
              </div>

              {results.success.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />{results.success.length} Saved
                  </h4>
                  <ul className="space-y-1">
                    {results.success.map((n, i) => (
                      <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />{n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.failed.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />{results.failed.length} Failed
                  </h4>
                  <ul className="space-y-1.5">
                    {results.failed.map(({ name, reason }, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-300"><strong>{name}:</strong> {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                {/* Close — ManageAssignments Cancel btn token */}
                <button onClick={onClose}
                  className={`flex-1 py-2.5 text-sm rounded-lg ${CLS.secondary}`}>
                  Close
                </button>
                {results.failed.length > 0 && (
                  <button onClick={() => { setResults(null); setStep(2); }}
                    className={`flex-1 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                    <RefreshCw className="w-4 h-4" />Fix &amp; Retry
                  </button>
                )}
              </div>
            </div>
          )}

        </div>{/* end scrollable body */}
      </div>
    </div>
  );
}
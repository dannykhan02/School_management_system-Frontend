// src/components/BulkAssignmentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, User, Calendar, ChevronDown, CheckCircle, AlertCircle, AlertTriangle,
  Loader, BookOpen, Layers, Send, RefreshCw, Info, CheckSquare, Square,
  Clock, Minus, Plus, RotateCcw, Filter, Wrench   // ← Wrench added
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT — mirrors ManageAssignments exactly
// ─────────────────────────────────────────────────────────────────────────────

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

// ─── Specialization keyword mapping ─────────────────────────────────────────
const SPEC_KEYWORDS = {
  mathematics:     ['math', 'mathematics'],
  sciences:        ['science', 'biology', 'chemistry', 'physics'],
  languages:       ['language', 'english', 'kiswahili', 'french', 'literature'],
  humanities:      ['history', 'geography', 'cre', 'ire', 'social'],
  technical:       ['technical', 'computer', 'ict', 'business', 'agriculture'],
  'creative arts': ['art', 'music', 'drama', 'creative'],
  'physical ed':   ['pe', 'physical', 'sport'],
};

/**
 * Returns true if the subject is fully compatible with the teacher's profile.
 * Compatibility rules (ALL must pass):
 *  1. Teaching level must include the subject's level (if teacher has levels defined)
 *  2. Teaching pathway must include the subject's pathway (if both are defined)
 *  3. Specialization must loosely match the subject's category (if teacher has specialization)
 */
function isCompatible(subject, teacherProfile) {
  if (!teacherProfile) return true;

  const teachingLevels   = teacherProfile.teaching_levels   || [];
  const teachingPathways = teacherProfile.teaching_pathways || [];
  const specialization   = (teacherProfile.specialization || teacherProfile.curriculum_specialization || '').toLowerCase();

  // 1. Level check
  if (teachingLevels.length > 0) {
    const subjectLevel = levelFromGrade(subject.grade_level);
    if (subjectLevel && !teachingLevels.includes(subjectLevel)) return false;
  }

  // 2. Pathway check
  if (subject.pathway && teachingPathways.length > 0) {
    if (!teachingPathways.includes(subject.pathway)) return false;
  }

  // 3. Specialization check — only filter when there's a strong mismatch
  if (specialization) {
    const cat = (subject.category || '').toLowerCase();
    const keywords = SPEC_KEYWORDS[cat] || [];
    if (keywords.length > 0) {
      const matches = keywords.some(k => specialization.includes(k));
      if (!matches) return false;
    }
  }

  return true;
}

/**
 * Returns a human-readable reason why a subject is incompatible.
 */
function incompatibilityReason(subject, teacherProfile) {
  if (!teacherProfile) return null;

  const teachingLevels   = teacherProfile.teaching_levels   || [];
  const teachingPathways = teacherProfile.teaching_pathways || [];
  const specialization   = (teacherProfile.specialization || teacherProfile.curriculum_specialization || '').toLowerCase();

  if (teachingLevels.length > 0) {
    const subjectLevel = levelFromGrade(subject.grade_level);
    if (subjectLevel && !teachingLevels.includes(subjectLevel))
      return `Teacher teaches: ${teachingLevels.join(', ')} — subject is ${subjectLevel}`;
  }

  if (subject.pathway && teachingPathways.length > 0) {
    if (!teachingPathways.includes(subject.pathway))
      return `Teacher pathway: ${teachingPathways.join(', ')} — subject is ${subject.pathway}`;
  }

  if (specialization) {
    const cat = (subject.category || '').toLowerCase();
    const keywords = SPEC_KEYWORDS[cat] || [];
    if (keywords.length > 0 && !keywords.some(k => specialization.includes(k)))
      return `Specialization (${teacherProfile.specialization || teacherProfile.curriculum_specialization}) doesn't cover ${subject.category}`;
  }

  return 'Incompatible with this teacher';
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkloadBar
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadBar({ current, max, adding = 0, showMath = true }) {
  const newTotal = current + adding;
  const pct      = Math.min((newTotal / max) * 100, 100);
  const over     = newTotal > max;
  const near     = !over && newTotal >= max * 0.9;
  const barColor = over ? 'bg-red-500' : near ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = over  ? 'text-red-600 dark:text-red-400'
                  : near  ? 'text-yellow-600 dark:text-yellow-400'
                  :         'text-slate-700 dark:text-slate-300';
  return (
    <div className="flex items-center gap-2">
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
// WorkloadSummaryBar — simple inline workload line for Step 3
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadSummaryBar({ teacherWorkload, validSubjects, rows }) {
  if (!teacherWorkload) return null;
  const base     = teacherWorkload.total_lessons ?? 0;
  const max      = teacherWorkload.max_lessons   ?? 0;
  const adding   = validSubjects.reduce((s, sub) => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);
  const newTotal = base + adding;
  const over     = newTotal > max;
  const pct      = Math.min((newTotal / max) * 100, 100);
  const barColor = over ? 'bg-slate-700 dark:bg-slate-300' : 'bg-cyan-500';

  return (
    <div className={`${CLS.card} rounded-lg p-3 space-y-2`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Workload after saving</span>
        <span className={`font-semibold ${over ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
          {newTotal} / {max} periods/wk
          {over && <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">({newTotal - max} over)</span>}
        </span>
      </div>
      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {over && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reduce periods on the subjects below to bring the total within the limit before saving.
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpecializationHint
// ─────────────────────────────────────────────────────────────────────────────
function SpecializationHint({ teacherProfile, subject }) {
  if (!teacherProfile || !subject || !(teacherProfile.specialization || teacherProfile.curriculum_specialization)) return null;
  const spec  = (teacherProfile.specialization || teacherProfile.curriculum_specialization || '').toLowerCase();
  const cat   = (subject.category || '').toLowerCase();
  const match = (SPEC_KEYWORDS[cat] || []).some(k => spec.includes(k));
  return match
    ? <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3 flex-shrink-0" />Specialization matches {subject.category}</p>
    : <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" />Specializes in <strong className="mx-1">{teacherProfile.specialization || teacherProfile.curriculum_specialization}</strong>— subject is {subject.category}.</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkloadFixPanel
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
// ─────────────────────────────────────────────────────────────────────────────
function SubjectRow({ subject, checked, onToggle, classroomValue, streamValue, onClassroomChange, onStreamChange,
  teacherClassrooms, teacherStreams, hasStreams, validationState, weeklyPeriods, onPeriodsChange,
  validationErrors, validationWarnings, workloadSummary, teacherProfile,
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
    ? 'bg-white dark:bg-slate-800/50 border-transparent'
    : isIncomplete
    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700'
    : validationState === 'valid'
    ? 'bg-green-50  dark:bg-green-900/20  border-green-200  dark:border-green-800'
    : validationState === 'invalid'
    ? 'bg-red-50    dark:bg-red-900/20    border-red-200    dark:border-red-800'
    : validationState === 'warning'
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    : 'bg-cyan-50   dark:bg-cyan-900/20   border-cyan-200   dark:border-cyan-800';

  const selectCls = `w-full px-3 py-2 text-xs ${CLS.input} appearance-none`;

  return (
    <div className={`border rounded-lg transition-all duration-200 ${rowBg}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex-shrink-0">
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
          {/* Responsive grid: 1-col on mobile, 3-col on sm+ */}
          <div className="p-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          {teacherProfile && (
            <div className="px-3 pb-2">
              <SpecializationHint teacherProfile={teacherProfile} subject={subject} />
            </div>
          )}

          {/* Workload fix panel */}
          {hasWorkloadErr && (
            <div className="px-3 pb-3">
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
            <div className="px-3 pb-3">
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
// ReviewCard — Step 3 (simplified)
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({ subject, row, location, cumulativeOverflow, onFixPeriods, onRevalidate, revalidating }) {
  const val            = row.validation;
  const isValid        = val?.valid;
  const hasWorkloadErr = val?.errors?.some(e => e.type === 'workload_exceeded');
  const ws             = val?.workload_summary;
  const maxAllowed     = ws ? Math.max(0, ws.max_lessons - ws.current_lessons) : 0;
  const needsAdjust    = hasWorkloadErr || (!hasWorkloadErr && cumulativeOverflow && isValid);

  const [periods, setPeriods] = useState(parseInt(row.weekly_periods) || 3);
  useEffect(() => { setPeriods(parseInt(row.weekly_periods) || 3); }, [row.weekly_periods]);

  const cap = needsAdjust ? (hasWorkloadErr ? maxAllowed : Math.max(1, periods - 1)) : 40;

  const applyPeriods = (p) => {
    const clamped = Math.max(1, Math.min(cap, p));
    setPeriods(clamped);
    onFixPeriods(clamped);
    onRevalidate(clamped);
  };

  const errors  = val?.errors?.filter(e => e.type !== 'workload_exceeded') || [];
  const warnings = val?.warnings || [];

  return (
    <div className={`${CLS.card} rounded-lg p-3 flex items-start gap-3`}>
      {/* Status dot */}
      <div className="flex-shrink-0 mt-0.5">
        {!isValid
          ? <div className="w-2 h-2 rounded-full bg-slate-400 mt-1" />
          : needsAdjust
          ? <div className="w-2 h-2 rounded-full bg-slate-400 mt-1" />
          : <CheckCircle className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* Subject name + location */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{subject.name}</span>
            {location && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{location}</span>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            !isValid
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              : needsAdjust
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400'
          }`}>
            {!isValid ? 'Invalid' : needsAdjust ? 'Adjust periods' : 'Ready'}
          </span>
        </div>

        {/* Period adjuster — only shown when something needs fixing */}
        {needsAdjust && cap > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">Periods/wk:</span>
            <div className="flex items-center gap-1">
              <button onClick={() => applyPeriods(periods - 1)} disabled={periods <= 1 || revalidating}
                className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">{periods}</span>
              <button onClick={() => applyPeriods(periods + 1)} disabled={periods >= cap || revalidating}
                className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">max {cap}</span>
            <button onClick={() => applyPeriods(periods)} disabled={revalidating}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              {revalidating ? <Loader className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              {revalidating ? 'Checking…' : 'Re-check'}
            </button>
          </div>
        )}

        {/* Period display when not adjusting */}
        {!needsAdjust && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{row.weekly_periods} periods/week</p>
        )}

        {/* Errors (non-workload) */}
        {errors.map((err, i) => (
          <p key={i} className="text-xs text-slate-500 dark:text-slate-400">↳ {err.message}</p>
        ))}
        {/* Warnings */}
        {warnings.map((w, i) => (
          <p key={i} className="text-xs text-slate-400 dark:text-slate-500">↳ {w.message}</p>
        ))}
      </div>
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
  const [showFilters, setShowFilters]            = useState(false);
  const [teacherProfile, setTeacherProfile]      = useState(null);

  const selectedTeacher = teachers.find(t => t.id === parseInt(selectedTeacherId));

  // ── Hard-filtered subject list: incompatible subjects never appear ──────────
  const compatibleSubjects = subjects.filter(s => isCompatible(s, teacherProfile));
  const hiddenCount        = subjects.length - compatibleSubjects.length;

  const checkedSubjects    = compatibleSubjects.filter(s => rows[s.id]?.checked);
  const validSubjects      = checkedSubjects.filter(s => rows[s.id]?.validation?.valid);
  const invalidSubjects    = checkedSubjects.filter(s => rows[s.id]?.validation && !rows[s.id].validation.valid);
  const warnSubjects       = validSubjects.filter(s => rows[s.id]?.validation?.warnings?.length > 0);
  const totalPeriodsAdding = checkedSubjects.reduce((s, sub) => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);
  const validPeriodsAdding = validSubjects.reduce((s, sub)  => s + (parseInt(rows[sub.id]?.weekly_periods) || 0), 0);

  const cumulativeBase   = teacherWorkload?.total_lessons ?? 0;
  const cumulativeMax    = teacherWorkload?.max_lessons   ?? 0;
  const cumulativeTotal  = cumulativeBase + validPeriodsAdding;
  const cumulativeOver   = cumulativeTotal > cumulativeMax;
  const cumulativeOverBy = Math.max(0, cumulativeTotal - cumulativeMax);

  const categories       = ['all', ...new Set(compatibleSubjects.map(s => s.category).filter(Boolean))];
  const filteredSubjects = compatibleSubjects.filter(s => {
    const mc = filterCat === 'all' || s.category === filterCat;
    const ms = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code?.toLowerCase().includes(searchTerm.toLowerCase());
    return mc && ms;
  });

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedTeacherId(''); setAcYr('');
      setTeacherWorkload(null); setTeacherClassrooms([]); setTeacherStreams([]);
      setRows({}); setResults(null); setFilterCat('all'); setSearchTerm('');
      setRevalidatingRows({}); setTeacherProfile(null); setShowFilters(false);
    }
  }, [isOpen]);

  // Auto-select current academic year
  useEffect(() => {
    const cur = academicYears.find(y => y.is_current);
    if (cur && !selectedAcademicYearId && isOpen) setAcYr(String(cur.id));
  }, [academicYears, isOpen]);

  // Fetch teacher data on selection change
  useEffect(() => {
    if (!selectedTeacherId || !selectedAcademicYearId) { setTeacherWorkload(null); return; }
    fetchTeacherData();
  }, [selectedTeacherId, selectedAcademicYearId]);

  // Auto-uncheck rows that become incompatible when teacher changes
  useEffect(() => {
    if (!teacherProfile) return;
    setRows(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach(id => {
        const sub = subjects.find(s => s.id === parseInt(id));
        if (sub && !isCompatible(sub, teacherProfile) && updated[id]?.checked) {
          updated[id] = { ...updated[id], checked: false };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [teacherProfile, subjects]);

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
      setTeacherProfile(td);
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
      filteredSubjects.forEach(s => {
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
        await apiRequest('subject-assignments', 'POST', {
          teacher_id: parseInt(selectedTeacherId), subject_id: sub.id, academic_year_id: parseInt(selectedAcademicYearId),
          weekly_periods: parseInt(r.weekly_periods), assignment_type: r.assignment_type || 'main_teacher',
          classroom_id: r.classroom_id ? parseInt(r.classroom_id) : null,
          stream_id:    r.stream_id    ? parseInt(r.stream_id)    : null,
        });
        success.push(sub.name);
      } catch (err) { fail.push({ name: sub.name, reason: err?.response?.data?.message || 'Unknown error' }); }
    }
    setResults({ success, failed: fail });
    setSubmitting(false);
    if (success.length) { toast.success(`✅ ${success.length} saved!`); onSuccess?.(); }
    if (fail.length) toast.error(`❌ ${fail.length} failed`);
  };

  if (!isOpen) return null;

  const StepDot = ({ n, label }) => (
    <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
      step === n ? 'bg-black dark:bg-white text-white dark:text-black'
      : step > n  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      :             'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
    }`}>
      {step > n ? <CheckCircle className="w-3 h-3" /> : <span className="w-3 text-center">{n}</span>}
      <span className="hidden xs:inline">{label}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-0 sm:p-4">
      {/* Modal */}
      <div className="bg-white dark:bg-slate-800/50 w-full sm:rounded-xl shadow-2xl sm:max-w-5xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Bulk Subject Assignment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              Assign multiple subjects to a teacher at once
            </p>
          </div>
          <button onClick={onClose}
            className="ml-2 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step strip ── */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50 overflow-x-auto">
          <StepDot n={1} label="Setup" />
          <div className={`flex-1 h-0.5 min-w-[10px] max-w-16 rounded flex-shrink-0 ${step > 1 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={2} label="Select & Validate" />
          <div className={`flex-1 h-0.5 min-w-[10px] max-w-16 rounded flex-shrink-0 ${step > 2 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={3} label="Review & Save" />
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* ════ STEP 1: Setup ════ */}
          {step === 1 && (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

              <div className={`${CLS.cyanBox} rounded-lg p-3 sm:p-4 flex items-start gap-3`}>
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300">
                  Select a teacher and year. Subjects are <strong>automatically filtered</strong> by the teacher's
                  teaching level, pathway and specialization — only compatible subjects appear in Step 2.
                </p>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={selectedAcademicYearId} onChange={e => setAcYr(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm ${CLS.input}`}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map(y => (
                      <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (Current)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                    disabled={!selectedAcademicYearId}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm ${CLS.input} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {/* FIX 1: Show combination name if available */}
                        {t.name} — {t.combination?.name || t.specialization || t.curriculum_specialization || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading */}
              {loadingTeacher && (
                <div className={`flex items-center gap-2 p-4 ${CLS.cyanBox} rounded-lg`}>
                  <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm text-cyan-700 dark:text-cyan-300">Loading teacher data…</span>
                </div>
              )}

              {/* Teacher profile + workload panel */}
              {!loadingTeacher && teacherWorkload && selectedTeacher && (
                <div className={`${CLS.cyanBox} rounded-lg p-4 space-y-3`}>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    {selectedTeacher.name}'s Profile &amp; Workload
                  </h4>

                  {/* Profile attribute tags */}
                  {teacherProfile && (
                    <div className="flex flex-wrap gap-1.5">
                      {(teacherProfile.teaching_levels || []).map(lvl => (
                        <span key={lvl} className="text-xs px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-medium">
                          📚 {lvl}
                        </span>
                      ))}
                      {(teacherProfile.teaching_pathways || []).map(pw => (
                        <span key={pw} className="text-xs px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium">
                          🛤 {pw}
                        </span>
                      ))}
                      {(teacherProfile.specialization || teacherProfile.curriculum_specialization) && (
                        <span className="text-xs px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                          🎓 {teacherProfile.specialization || teacherProfile.curriculum_specialization}
                        </span>
                      )}
                      {/* FIX 2: Add combination chip */}
                      {teacherProfile?.combination?.name && (
                        <span className="text-xs px-2 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                          📋 {teacherProfile.combination.name}
                        </span>
                      )}
                    </div>
                  )}

                  <WorkloadBar current={teacherWorkload.total_lessons} max={teacherWorkload.max_lessons} />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { v: teacherWorkload.total_lessons,      l: 'Current'   },
                      { v: teacherWorkload.max_lessons,        l: 'Max'       },
                      { v: teacherWorkload.available_capacity, l: 'Available' },
                    ].map(({ v, l }) => (
                      <div key={l} className="bg-white/60 dark:bg-black/20 rounded-lg py-2 px-1">
                        <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{v}</p>
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

                  {/* Compatibility filter summary */}
                  {hiddenCount > 0 && (
                    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                      <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>{hiddenCount}</strong> incompatible subject{hiddenCount !== 1 ? 's' : ''} removed based on this teacher's level, pathway &amp; specialization.
                        {' '}<strong>{compatibleSubjects.length}</strong> subject{compatibleSubjects.length !== 1 ? 's' : ''} available to assign.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => setStep(2)}
                disabled={!selectedTeacherId || !selectedAcademicYearId || loadingTeacher}
                className={`w-full py-3 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                Continue to Subject Selection <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ════ STEP 2: Select & Validate ════ */}
          {step === 2 && (
            <div className="p-3 sm:p-6 space-y-3">

              {/* Projected workload */}
              {teacherWorkload && (
                <div className={`${CLS.cyanBox} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 min-w-0">
                      <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{selectedTeacher?.name} — projected</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">+{totalPeriodsAdding}p / {checkedSubjects.length} subj.</span>
                  </div>
                  <WorkloadBar current={teacherWorkload.total_lessons} max={teacherWorkload.max_lessons} adding={totalPeriodsAdding} />
                </div>
              )}

              {/* Filter notice */}
              {hiddenCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Showing <strong>{compatibleSubjects.length}</strong> compatible subjects only.
                    <strong> {hiddenCount}</strong> incompatible subject{hiddenCount !== 1 ? 's' : ''} removed.
                  </p>
                </div>
              )}

              {/* Search + filters — responsive */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" placeholder="Search subjects…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`flex-1 px-3 py-2 text-sm ${CLS.input}`} />
                  {/* Mobile: filter toggle button */}
                  <button onClick={() => setShowFilters(v => !v)}
                    className={`sm:hidden flex items-center gap-1 px-3 py-2 text-xs rounded-lg flex-shrink-0 ${showFilters ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700' : CLS.secondary}`}>
                    <Filter className="w-3.5 h-3.5" />
                  </button>
                  {/* Desktop: category select inline */}
                  <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                    className={`hidden sm:block w-40 px-3 py-2 text-sm ${CLS.input}`}>
                    {categories.map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                    ))}
                  </select>
                  <div className="hidden sm:flex gap-2 flex-shrink-0">
                    <button onClick={selectAll}
                      className="px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-all whitespace-nowrap">
                      Select All
                    </button>
                    <button onClick={() => setRows({})}
                      className={`px-3 py-2 text-xs rounded-lg ${CLS.secondary}`}>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Mobile expanded filter row */}
                {showFilters && (
                  <div className="flex gap-2 sm:hidden">
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                      className={`flex-1 px-3 py-2 text-sm ${CLS.input}`}>
                      {categories.map(c => (
                        <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
                      ))}
                    </select>
                    <button onClick={selectAll}
                      className="px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-all whitespace-nowrap">
                      All
                    </button>
                    <button onClick={() => setRows({})}
                      className={`px-3 py-2 text-xs rounded-lg ${CLS.secondary}`}>
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Count bar */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-white">{checkedSubjects.length}</strong> of {compatibleSubjects.length} selected
                </span>
                {checkedSubjects.length > 0 && (
                  <span className="text-slate-500 dark:text-slate-400">{totalPeriodsAdding} total p/wk</span>
                )}
              </div>

              {/* Subject list */}
              <div className="space-y-2 max-h-[52vh] sm:max-h-[45vh] overflow-y-auto overscroll-contain pr-0.5">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
                    {compatibleSubjects.length === 0
                      ? "No subjects are compatible with this teacher's profile."
                      : 'No subjects match the current search/filter.'}
                  </div>
                ) : (
                  filteredSubjects.map(sub => {
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
                        teacherProfile={teacherProfile}
                        onFixPeriods={newP => updateRow(sub.id, 'weekly_periods', String(newP))}
                        onRevalidate={p => validateRow(sub.id, p)}
                        revalidating={!!revalidatingRows[sub.id]}
                      />
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 sm:gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className={`px-3 sm:px-4 py-2.5 text-sm rounded-lg flex-shrink-0 ${CLS.secondary}`}>
                  Back
                </button>
                <button onClick={validateAll} disabled={!checkedSubjects.length || validating}
                  className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 min-w-0 ${CLS.primary}`}>
                  {validating
                    ? <><Loader className="w-4 h-4 animate-spin flex-shrink-0" /><span className="truncate">Validating {checkedSubjects.length}…</span></>
                    : <><CheckCircle className="w-4 h-4 flex-shrink-0" /><span className="truncate">Validate {checkedSubjects.length} Assignment{checkedSubjects.length !== 1 ? 's' : ''}</span></>}
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: Review & Save ════ */}
          {step === 3 && !results && (
            <div className="p-3 sm:p-6 space-y-3">

              {/* Workload bar — simple, no color drama */}
              <WorkloadSummaryBar teacherWorkload={teacherWorkload} validSubjects={validSubjects} rows={rows} />

              {/* Compact summary row */}
              <div className="flex items-center gap-3 px-1 text-sm text-slate-500 dark:text-slate-400">
                <span><strong className="text-slate-900 dark:text-white">{validSubjects.length}</strong> ready to save</span>
                {invalidSubjects.length > 0 && <span>· <strong className="text-slate-700 dark:text-slate-300">{invalidSubjects.length}</strong> need fixing</span>}
                {warnSubjects.length > 0 && <span>· <strong className="text-slate-700 dark:text-slate-300">{warnSubjects.length}</strong> warnings</span>}
                {cumulativeOver && <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">Adjust periods to save</span>}
              </div>

              {/* Review cards — clean list */}
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto overscroll-contain pr-0.5">
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
              <div className="flex gap-2 sm:gap-3 pt-1">
                <button onClick={() => setStep(2)}
                  className={`px-3 sm:px-4 py-2.5 text-sm rounded-lg flex-shrink-0 ${CLS.secondary}`}>
                  Back
                </button>
                <button onClick={submitAssignments}
                  disabled={!validSubjects.length || submitting || cumulativeOver}
                  className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 min-w-0 ${CLS.primary}`}>
                  {submitting
                    ? <><Loader className="w-4 h-4 animate-spin flex-shrink-0" />Saving…</>
                    : cumulativeOver
                    ? <span className="truncate">Adjust periods to enable save</span>
                    : <><Send className="w-4 h-4 flex-shrink-0" /><span className="truncate">Save {validSubjects.length} Assignment{validSubjects.length !== 1 ? 's' : ''}</span></>}
                </button>
              </div>
            </div>
          )}

          {/* ════ Results ════ */}
          {results && (
            <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-4">
              <div className="text-center pt-2">
                {results.success.length > 0 && results.failed.length === 0
                  ? <CheckCircle   className="w-14 h-14 text-green-500  mx-auto mb-3" />
                  : results.success.length === 0
                  ? <AlertCircle   className="w-14 h-14 text-red-500    mx-auto mb-3" />
                  : <AlertTriangle className="w-14 h-14 text-yellow-500 mx-auto mb-3" />}
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
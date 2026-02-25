// src/components/BulkAssignmentModal.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X, User, Calendar, ChevronDown, CheckCircle, AlertCircle, AlertTriangle,
  Loader, BookOpen, Layers, Send, RefreshCw, Info, CheckSquare, Square,
  Clock, Minus, Plus, RotateCcw, Filter, Wrench, Search, Trash2,
  UserCheck, GraduationCap, ArrowRight, ShieldCheck, Users
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

// ─── Grade‑level filter – copied from ManageAssignments ─────────────────────
const GRADE_PREFIXES = {
  'PP1-PP2':      ['pp1', 'pp2'],
  'Grade 1-3':    ['grade 1', 'grade 2', 'grade 3'],
  'Grade 4-6':    ['grade 4', 'grade 5', 'grade 6'],
  'Grade 7-9':    ['grade 7', 'grade 8', 'grade 9'],
  'Grade 10-12':  ['grade 10', 'grade 11', 'grade 12'],
  'Standard 1-4': ['standard 1', 'standard 2', 'standard 3', 'standard 4',
                   'std 1', 'std 2', 'std 3', 'std 4'],
  'Standard 5-8': ['standard 5', 'standard 6', 'standard 7', 'standard 8',
                   'std 5', 'std 6', 'std 7', 'std 8'],
  'Form 1-4':     ['form 1', 'form 2', 'form 3', 'form 4'],
};

function extractGradePrefix(loc) {
  const candidates = [
    loc.name,
    loc.class_name,
    loc.stream_name,
    loc.classroom?.class_name,
    loc.classroom?.name,
  ].filter(Boolean);

  for (const raw of candidates) {
    const prefix = raw.split(/\s*-\s*/)[0].trim().toLowerCase();
    if (prefix) return prefix;
  }
  return '';
}

function locationMatchesSubject(loc, subjectGradeLevel) {
  if (!subjectGradeLevel) return true;
  const allowed = GRADE_PREFIXES[subjectGradeLevel];
  if (!allowed) return true;
  const prefix = extractGradePrefix(loc);
  if (!prefix) return true;
  return allowed.includes(prefix);
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
// WorkloadFixPanel
// ─────────────────────────────────────────────────────────────────────────────
function WorkloadFixPanel({ currentLessons, maxLessons, requestedPeriods, maxAllowed, onApply, revalidating }) {
  const [fixPeriods, setFixPeriods] = useState(Math.max(1, maxAllowed));
  useEffect(() => { setFixPeriods(Math.max(1, maxAllowed)); }, [maxAllowed]);
  const adjust = d => setFixPeriods(p => Math.max(1, Math.min(maxAllowed, p + d)));

  return (
    <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        </div>
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
// SpecializationHint
// ─────────────────────────────────────────────────────────────────────────────
function SpecializationHint({ teacherProfile, subject }) {
  if (!teacherProfile || !subject || !(teacherProfile.specialization || teacherProfile.curriculum_specialization)) return null;
  const spec  = (teacherProfile.specialization || teacherProfile.curriculum_specialization || '').toLowerCase();
  const cat   = (subject.category || '').toLowerCase();
  const match = (SPEC_KEYWORDS[cat] || []).some(k => spec.includes(k));
  return match
    ? (
      <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle className="w-2.5 h-2.5" />
        </span>
        Specialization matches {subject.category}
      </p>
    )
    : (
      <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <AlertTriangle className="w-2.5 h-2.5" />
        </span>
        Specializes in <strong className="mx-1">{teacherProfile.specialization || teacherProfile.curriculum_specialization}</strong>— subject is {subject.category}.
      </p>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TeacherSelect – custom dropdown for teacher selection per row
// ─────────────────────────────────────────────────────────────────────────────
function TeacherSelect({ teachers, value, onChange, disabled, rowId, openDropdownId, setOpenDropdownId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = teachers.find(t => t.id === parseInt(value));

  const filtered = teachers.filter(t => {
    const name = t.name?.toLowerCase() || '';
    const combo = (t.combination?.name || t.specialization || t.curriculum_specialization || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || combo.includes(s);
  });

  useEffect(() => {
    if (openDropdownId !== rowId && open) {
      setOpen(false);
    }
  }, [openDropdownId, rowId, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpenDropdownId]);

  const handleToggle = () => {
    if (disabled) return;
    const newOpen = !open;
    setOpen(newOpen);
    setOpenDropdownId(newOpen ? rowId : null);
    if (newOpen) setSearch('');
  };

  const handleSelect = (teacherId) => {
    onChange(teacherId);
    setOpen(false);
    setOpenDropdownId(null);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 pl-8 pr-3 py-2 text-xs border rounded-lg text-left transition-all
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700/50'
            : 'bg-white dark:bg-slate-700 cursor-pointer hover:border-cyan-400 dark:hover:border-cyan-500'}
          ${open ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-slate-300 dark:border-slate-600'}
          text-slate-900 dark:text-white`}
      >
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none flex-shrink-0 transition-colors text-slate-400" />
        <span className="flex-1 truncate min-w-0">
          {selected
            ? <span className="truncate block">
                {selected.name}
                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                  — {selected.combination?.name || selected.specialization || selected.curriculum_specialization || 'N/A'}
                </span>
              </span>
            : <span className="text-slate-400 dark:text-slate-500">Select teacher</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                No teachers match your search
              </div>
            ) : (
              filtered.map(teacher => {
                const isActive = teacher.id === parseInt(value);
                return (
                  <div
                    key={teacher.id}
                    onClick={() => handleSelect(teacher.id)}
                    className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0
                      ${isActive
                        ? 'bg-cyan-50 dark:bg-cyan-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isActive ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {isActive
                          ? <UserCheck className="w-3 h-3 text-white" />
                          : <User className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-900 dark:text-white'}`}>
                          {teacher.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {teacher.combination?.name || teacher.specialization || teacher.curriculum_specialization || 'No specialization'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AssignmentCard – represents one teacher+locations combination inside a subject
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentCard({
  assignment,
  index,
  subject,
  teacherLocations,
  hasStreams,
  onUpdate,
  onRemove,
  availableTeachers,
  assignedLocationIds,
  subjectGradeLevel,
  revalidating,
  onRevalidate,
  workloadSummary,
  validationErrors,
  validationWarnings,
  teacherProfile,
  onFixPeriods,
  rowId,
  openDropdownId,
  setOpenDropdownId,
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const hasWorkloadErr = validationErrors?.some(e => e.type === 'workload_exceeded');
  const maxAllowed = workloadSummary ? Math.max(0, workloadSummary.max_lessons - workloadSummary.current_lessons) : 0;
  useEffect(() => { if (hasWorkloadErr) setFixOpen(true); }, [hasWorkloadErr]);

  // Filter locations for this teacher by subject grade level
  const availableLocations = teacherLocations?.filter(loc => locationMatchesSubject(loc, subjectGradeLevel)) || [];
  const filteredOutCount = (teacherLocations?.length || 0) - availableLocations.length;

  const hasTeacher = !!assignment.teacher_id;
  const hasPeriods = assignment.weekly_periods && parseInt(assignment.weekly_periods) >= 1;
  const hasLocations = assignment.selectedLocationIds?.length > 0;
  const incomplete = !hasTeacher || !hasLocations || !hasPeriods;

  const validationState = !assignment.validation ? null
    : !assignment.validation.valid ? 'invalid'
    : assignment.validation.warnings?.length ? 'warning'
    : 'valid';

  const statusIcon = () => {
    if (validationState === 'valid')   return <CheckCircle   className="w-4 h-4 text-green-600  dark:text-green-400  flex-shrink-0" />;
    if (validationState === 'invalid') return <AlertCircle   className="w-4 h-4 text-red-600    dark:text-red-400    flex-shrink-0" />;
    if (validationState === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
    if (incomplete)                  return <AlertCircle   className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />;
    return null;
  };

  const updateAssignment = (field, value) => {
    onUpdate(index, field, value);
  };

  const handleLocationToggle = (locId) => {
    const current = assignment.selectedLocationIds || [];
    const newLocations = current.includes(locId)
      ? current.filter(id => id !== locId)
      : [...current, locId];
    updateAssignment('selectedLocationIds', newLocations);
  };

  const handleSelectAllLocations = () => {
    const allIds = availableLocations.map(l => l.id);
    updateAssignment('selectedLocationIds', allIds);
  };

  const handleClearLocations = () => {
    updateAssignment('selectedLocationIds', []);
  };

  return (
    <div className={`border rounded-lg p-3 mt-2 ${validationState === 'invalid' ? 'border-red-300 dark:border-red-700 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {statusIcon()}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            Assignment #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title="Remove this assignment"
          aria-label="Remove assignment"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Teacher <span className="text-red-500">*</span>
          </label>
          <TeacherSelect
            teachers={availableTeachers}
            value={assignment.teacher_id || ''}
            onChange={(teacherId) => updateAssignment('teacher_id', teacherId)}
            disabled={false}
            rowId={`${rowId}-${index}`}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Periods/Week <span className="text-red-500">*</span>
            {hasWorkloadErr && maxAllowed > 0 && <span className="ml-1 text-red-500">(max {maxAllowed})</span>}
          </label>
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center pointer-events-none">
              <Clock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-300" />
            </div>
            <input
              type="number"
              value={assignment.weekly_periods || ''}
              min={1}
              max={hasWorkloadErr && maxAllowed > 0 ? maxAllowed : 40}
              onChange={(e) => updateAssignment('weekly_periods', e.target.value)}
              className={`w-full pl-8 pr-2 py-2 text-xs ${CLS.input} ${hasWorkloadErr ? 'border-red-400 dark:border-red-600' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Location multi‑select */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {hasStreams ? 'Streams' : 'Classrooms'} <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
              (select one or more)
            </span>
          </label>
          {assignment.selectedLocationIds?.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 rounded-full">
              {assignment.selectedLocationIds.length} selected
            </span>
          )}
        </div>

        {!assignment.teacher_id ? (
          <div className="flex items-center gap-2.5 px-3 py-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-400 dark:text-slate-500">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            Select a teacher first
          </div>
        ) : availableLocations.length === 0 ? (
          <div className="flex items-start gap-2.5 px-3 py-3 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/10">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                No matching {hasStreams ? 'streams' : 'classrooms'} found.
              </p>
              {filteredOutCount > 0 && (
                <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">
                  {filteredOutCount} {hasStreams ? 'stream' : 'classroom'}{filteredOutCount !== 1 ? 's' : ''} hidden
                  — they belong to a different grade level.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {availableLocations.length} matching
                {filteredOutCount > 0 && (
                  <span className="ml-1 text-slate-400 dark:text-slate-500">
                    ({filteredOutCount} hidden — wrong grade)
                  </span>
                )}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllLocations}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Select all
                </button>
                {assignment.selectedLocationIds?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLocations}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
              {availableLocations.map(loc => {
                const isSelected = assignment.selectedLocationIds?.includes(loc.id);
                const isAssigned = assignedLocationIds?.has(loc.id);
                const isClassTeacher = loc.is_class_teacher;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    disabled={isAssigned}
                    onClick={() => !isAssigned && handleLocationToggle(loc.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isAssigned
                        ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30'
                        : isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-900/25 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
                          : 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all
                      ${isAssigned
                        ? 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-700'
                        : isSelected
                          ? 'border-cyan-500 bg-cyan-500'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && !isAssigned && <CheckCircle className="w-3 h-3 text-white" />}
                      {isAssigned && <CheckCircle className="w-3 h-3 text-slate-400" />}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate block">
                        {loc.name || loc.class_name}
                        {isClassTeacher && <span className="ml-1.5 text-amber-500" title="Class Teacher">⭐</span>}
                      </span>
                      {isAssigned && <span className="text-xs text-slate-400 dark:text-slate-500">Already assigned</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Type */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
        <select
          value={assignment.assignment_type || 'main_teacher'}
          onChange={(e) => updateAssignment('assignment_type', e.target.value)}
          className={`w-full px-3 py-2 text-xs ${CLS.input} appearance-none`}
        >
          <option value="main_teacher">Main Teacher</option>
          <option value="assistant_teacher">Assistant</option>
          <option value="substitute">Substitute</option>
        </select>
      </div>

      {/* Specialization hint */}
      {teacherProfile && (
        <div className="mb-2">
          <SpecializationHint teacherProfile={teacherProfile} subject={subject} />
        </div>
      )}

      {/* Workload fix panel */}
      {hasWorkloadErr && (
        <div className="mb-2">
          <button
            onClick={(e) => { e.stopPropagation(); setFixOpen(v => !v); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 px-2 py-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <Wrench className="w-3 h-3" />
            {fixOpen ? 'Hide fix panel' : 'Fix workload overload ↓'}
          </button>
          {fixOpen && (
            <WorkloadFixPanel
              currentLessons={workloadSummary?.current_lessons ?? 0}
              maxLessons={workloadSummary?.max_lessons ?? 0}
              requestedPeriods={parseInt(assignment.weekly_periods) || 0}
              maxAllowed={maxAllowed}
              onApply={(newP) => {
                onFixPeriods(index, newP);
                onRevalidate(index, newP);
              }}
              revalidating={revalidating}
            />
          )}
        </div>
      )}

      {/* Other errors/warnings */}
      {((validationErrors?.filter(e => e.type !== 'workload_exceeded').length > 0) || validationWarnings?.length > 0) && (
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); setOtherOpen(v => !v); }}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${otherOpen ? 'rotate-180' : ''}`} />
            {otherOpen ? 'Hide' : 'Show'} other details
          </button>
          {otherOpen && (
            <div className="mt-2 space-y-1.5">
              {validationErrors?.filter(e => e.type !== 'workload_exceeded').map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mt-0.5">
                    <AlertCircle className="w-2.5 h-2.5 text-red-500" />
                  </div>
                  <p className="text-red-700 dark:text-red-300">{err.message}</p>
                </div>
              ))}
              {validationWarnings?.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mt-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  </div>
                  <p className="text-amber-700 dark:text-amber-300">{w.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubjectRow – holds multiple teacher assignments per subject
// ─────────────────────────────────────────────────────────────────────────────
function SubjectRow({
  subject,
  checked,
  onToggle,
  assignments,
  onUpdateAssignment,
  onAddAssignment,
  onRemoveAssignment,
  teacherLocations,
  hasStreams,
  availableTeachers,
  assignedLocationIds,
  subjectGradeLevel,
  rowId,
  openDropdownId,
  setOpenDropdownId,
  onRevalidate,
  revalidatingRows,
  selectedAcademicYearId,
  teacherProfiles,
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const hasAnyTeacher = assignments.some(a => a.teacher_id);
  const hasAnyLocation = assignments.some(a => a.selectedLocationIds?.length > 0);
  const hasAnyPeriods = assignments.some(a => a.weekly_periods && parseInt(a.weekly_periods) >= 1);
  const isIncomplete = checked && (!hasAnyTeacher || !hasAnyLocation || !hasAnyPeriods);

  const allValid = assignments.every(a => a.validation?.valid);
  const anyInvalid = assignments.some(a => a.validation && !a.validation.valid);
  const anyWarnings = assignments.some(a => a.validation?.warnings?.length > 0);

  const validationState = !checked ? null
    : anyInvalid ? 'invalid'
    : anyWarnings ? 'warning'
    : allValid ? 'valid'
    : null;

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
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                <AlertCircle className="w-2.5 h-2.5" />
              </span>
              Some assignments are incomplete.
            </p>
          )}
        </div>
        {statusIcon()}
      </div>

      {/* Expanded form */}
      {checked && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
          {/* List of assignments */}
          {assignments.map((assignment, idx) => {
            const teacherLocList = assignment.teacher_id ? teacherLocations[assignment.teacher_id] || [] : [];

            const assignedIds = new Set(
              (assignedLocationIds[assignment.teacher_id] || [])
                .filter(a => a.subject_id === subject.id && a.academic_year_id === parseInt(selectedAcademicYearId))
                .map(a => hasStreams ? a.stream_id : a.classroom_id)
            );

            return (
              <AssignmentCard
                key={idx}
                assignment={assignment}
                index={idx}
                subject={subject}
                teacherLocations={teacherLocList}
                hasStreams={hasStreams}
                onUpdate={onUpdateAssignment}
                onRemove={onRemoveAssignment}
                availableTeachers={availableTeachers}
                assignedLocationIds={assignedIds}
                subjectGradeLevel={subjectGradeLevel}
                revalidating={revalidatingRows[`${subject.id}-${idx}`]}
                onRevalidate={(index, p) => onRevalidate(subject.id, index, p)}
                workloadSummary={assignment.validation?.workload_summary}
                validationErrors={assignment.validation?.errors}
                validationWarnings={assignment.validation?.warnings}
                teacherProfile={assignment.teacher_id ? teacherProfiles[assignment.teacher_id] : null}
                onFixPeriods={(index, newP) => onUpdateAssignment(index, 'weekly_periods', String(newP))}
                rowId={`${rowId}-${idx}`}
                openDropdownId={openDropdownId}
                setOpenDropdownId={setOpenDropdownId}
              />
            );
          })}

          {/* Add another teacher button */}
          <button
            type="button"
            onClick={onAddAssignment}
            className="w-full py-2 text-xs border border-dashed border-cyan-300 dark:border-cyan-700 rounded-lg text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center flex-shrink-0">
              <Plus className="w-2.5 h-2.5" />
            </div>
            Add another teacher
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TeacherMultiSelect – Step 1 checkbox list
// ─────────────────────────────────────────────────────────────────────────────
function TeacherMultiSelect({ teachers, selectedIds, onChange }) {
  const [search, setSearch] = useState('');
  const filtered = teachers.filter(t => {
    const name = t.name?.toLowerCase() || '';
    const combo = (t.combination?.name || t.specialization || t.curriculum_specialization || '').toLowerCase();
    const s = search.toLowerCase();
    return name.includes(s) || combo.includes(s);
  });

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onChange(filtered.map(t => t.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {selectedIds.length} selected
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={selectAll} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
            Select all
          </button>
          {selectedIds.length > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-slate-500 dark:text-slate-400 hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
            No teachers match your search
          </div>
        ) : (
          filtered.map(teacher => {
            const isSelected = selectedIds.includes(teacher.id);
            return (
              <button
                key={teacher.id}
                type="button"
                onClick={() => toggle(teacher.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                  ${isSelected ? 'bg-cyan-50 dark:bg-cyan-900/25' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'}`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'border-cyan-500 bg-cyan-500'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </span>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'}`}>
                  {teacher.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate block">
                    {teacher.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                    {teacher.combination?.name || teacher.specialization || teacher.curriculum_specialization || 'No specialization'}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BulkAssignmentModal – main component
// ─────────────────────────────────────────────────────────────────────────────
export default function BulkAssignmentModal({ isOpen, onClose, academicYears, teachers, subjects, hasStreams, assignments = [], onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedAcademicYearId, setAcYr] = useState('');
  const [teacherProfiles, setTeacherProfiles] = useState({});
  const [teacherWorkloads, setTeacherWorkloads] = useState({});
  const [teacherLocations, setTeacherLocations] = useState({});
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [rows, setRows] = useState({});
  const [validating, setValidating] = useState(false);
  const [revalidatingRows, setRevalidatingRows] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const selectedTeachers = teachers.filter(t => selectedTeacherIds.includes(t.id));

  const getQualifiedSubjectIds = useCallback((teacherId) => {
    const profile = teacherProfiles[teacherId];
    if (!profile || !profile.qualified_subjects) return [];
    return profile.qualified_subjects.map(s => s.id);
  }, [teacherProfiles]);

  const qualifiedSubjectIds = useMemo(() => {
    const union = new Set();
    selectedTeacherIds.forEach(id => {
      getQualifiedSubjectIds(id).forEach(sid => union.add(sid));
    });
    return union;
  }, [selectedTeacherIds, getQualifiedSubjectIds]);

  // Build a lookup of already-assigned locations per teacher
  const assignedLocationIds = useMemo(() => {
    const map = {};
    assignments.forEach(a => {
      const tid = a.teacher_id;
      if (!map[tid]) map[tid] = [];
      map[tid].push({
        subject_id: a.subject_id,
        academic_year_id: a.academic_year_id,
        stream_id: a.stream_id,
        classroom_id: a.classroom_id,
      });
    });
    return map;
  }, [assignments, hasStreams]);

  const availableSubjects = useMemo(
    () => subjects.filter(s => qualifiedSubjectIds.has(s.id)),
    [subjects, qualifiedSubjectIds]
  );

  const categories = useMemo(
    () => ['all', ...new Set(availableSubjects.map(s => s.category).filter(Boolean))],
    [availableSubjects]
  );

  const filteredSubjects = useMemo(() =>
    availableSubjects.filter(s => {
      const mc = filterCat === 'all' || s.category === filterCat;
      const ms = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code?.toLowerCase().includes(searchTerm.toLowerCase());
      return mc && ms;
    }),
    [availableSubjects, filterCat, searchTerm]
  );

  const createDefaultAssignment = useCallback((subject, teacherId = '') => ({
    teacher_id: teacherId,
    selectedLocationIds: [],
    weekly_periods: subject.minimum_weekly_periods || 3,
    assignment_type: 'main_teacher',
    validation: null,
  }), []);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedTeacherIds([]);
      setAcYr('');
      setTeacherProfiles({});
      setTeacherWorkloads({});
      setTeacherLocations({});
      setRows({});
      setResults(null);
      setFilterCat('all');
      setSearchTerm('');
      setRevalidatingRows({});
      setShowFilters(false);
      setOpenDropdownId(null);
    }
  }, [isOpen]);

  // Auto-select current academic year
  useEffect(() => {
    const cur = academicYears.find(y => y.is_current);
    if (cur && !selectedAcademicYearId && isOpen) setAcYr(String(cur.id));
  }, [academicYears, isOpen]);

  const fetchTeachersData = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      // Fetch all teachers in parallel instead of sequentially
      const results = await Promise.all(
        selectedTeacherIds.map(async (tid) => {
          const [tRes, wlRes] = await Promise.all([
            apiRequest(`teachers/${tid}`, 'GET'),
            apiRequest(`teachers/${tid}/workload?academic_year_id=${selectedAcademicYearId}`, 'GET'),
          ]);
          const profile = tRes.data || tRes;
          const workload = wlRes.data || wlRes;

          let locationList = [];
          if (hasStreams) {
            const [streamsRes] = await Promise.all([
              apiRequest('streams', 'GET'),
            ]);
            const allStreams = Array.isArray(streamsRes) ? streamsRes : (streamsRes?.data || []);
            const teacherData = tRes.data || tRes;
            const ctStreams = teacherData.classTeacherStreams || teacherData.class_teacher_streams || [];
            const ctIds = new Set(ctStreams.map(s => s.id || s.stream_id));
            locationList = allStreams.map(s => ({
              id: s.id,
              name: s.classroom?.class_name ? `${s.classroom.class_name} - ${s.name}` : (s.name || `Stream ${s.id}`),
              is_class_teacher: ctIds.has(s.id),
            })).sort((a, b) =>
              a.is_class_teacher === b.is_class_teacher
                ? a.name.localeCompare(b.name)
                : a.is_class_teacher ? -1 : 1
            );
          } else {
            const classroomsRes = await apiRequest('classrooms', 'GET');
            const allClassrooms = Array.isArray(classroomsRes) ? classroomsRes : (classroomsRes?.data || []);
            locationList = allClassrooms.map(c => ({
              id: c.id,
              name: c.class_name || c.name || `Class ${c.id}`,
              is_class_teacher: false,
            }));
          }

          return { tid, profile, workload, locationList };
        })
      );

      const profiles = {};
      const workloads = {};
      const locations = {};
      results.forEach(({ tid, profile, workload, locationList }) => {
        profiles[tid] = profile;
        workloads[tid] = workload;
        locations[tid] = locationList;
      });

      setTeacherProfiles(profiles);
      setTeacherWorkloads(workloads);
      setTeacherLocations(locations);
    } catch (error) {
      toast.error('Failed to load teacher data');
    } finally {
      setLoadingTeachers(false);
    }
  }, [selectedTeacherIds, selectedAcademicYearId, hasStreams]);

  // Fetch teacher data when selection or year changes
  useEffect(() => {
    if (!selectedTeacherIds.length || !selectedAcademicYearId) {
      setTeacherProfiles({});
      setTeacherWorkloads({});
      setTeacherLocations({});
      return;
    }
    fetchTeachersData();
  }, [fetchTeachersData, selectedTeacherIds, selectedAcademicYearId]);

  // When teachers are deselected, remove rows that use them
  useEffect(() => {
    setRows(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach(subjectId => {
        const row = updated[subjectId];
        if (row.checked) {
          const filteredAssignments = row.assignments.filter(a =>
            !a.teacher_id || selectedTeacherIds.includes(a.teacher_id)
          );
          if (filteredAssignments.length !== row.assignments.length) {
            updated[subjectId] = { ...row, assignments: filteredAssignments };
            changed = true;
          }
        }
      });
      return changed ? updated : prev;
    });
  }, [selectedTeacherIds]);

  const toggleRow = useCallback((subject) => {
    setRows(prev => {
      const ex = prev[subject.id];
      if (ex?.checked) {
        return { ...prev, [subject.id]: { ...ex, checked: false } };
      } else {
        const qualifiedTeacherIds = selectedTeacherIds.filter(id =>
          getQualifiedSubjectIds(id).includes(subject.id)
        );
        const defaultTeacherId = qualifiedTeacherIds.length ? qualifiedTeacherIds[0] : '';
        return {
          ...prev,
          [subject.id]: {
            checked: true,
            assignments: ex?.assignments?.length ? ex.assignments : [createDefaultAssignment(subject, defaultTeacherId)],
          }
        };
      }
    });
  }, [selectedTeacherIds, getQualifiedSubjectIds]);

  const addAssignment = useCallback((subjectId) => {
    setRows(prev => {
      const row = prev[subjectId];
      if (!row) return prev;
      const subject = subjects.find(s => s.id === subjectId);
      const qualifiedTeacherIds = selectedTeacherIds.filter(id =>
        getQualifiedSubjectIds(id).includes(subjectId)
      );
      const defaultTeacherId = qualifiedTeacherIds.length ? qualifiedTeacherIds[0] : '';
      const newAssignment = createDefaultAssignment(subject, defaultTeacherId);
      return {
        ...prev,
        [subjectId]: {
          ...row,
          assignments: [...row.assignments, newAssignment],
        }
      };
    });
  }, [selectedTeacherIds, getQualifiedSubjectIds, subjects]);

  const removeAssignment = useCallback((subjectId, assignmentIndex) => {
    setRows(prev => {
      const row = prev[subjectId];
      if (!row) return prev;
      const newAssignments = row.assignments.filter((_, i) => i !== assignmentIndex);
      return {
        ...prev,
        [subjectId]: {
          ...row,
          assignments: newAssignments,
        }
      };
    });
  }, []);

  const updateAssignment = useCallback((subjectId, assignmentIndex, field, value) => {
    setRows(prev => {
      const row = prev[subjectId];
      if (!row) return prev;
      const updatedAssignments = [...row.assignments];
      updatedAssignments[assignmentIndex] = {
        ...updatedAssignments[assignmentIndex],
        [field]: value,
        validation: null,
      };
      return {
        ...prev,
        [subjectId]: {
          ...row,
          assignments: updatedAssignments,
        }
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!selectedTeacherIds.length) {
      toast.warning('Select at least one teacher first');
      return;
    }
    setRows(prev => {
      const u = { ...prev };
      filteredSubjects.forEach(s => {
        if (!u[s.id]?.checked) {
          const qualifiedTeacherIds = selectedTeacherIds.filter(id =>
            getQualifiedSubjectIds(id).includes(s.id)
          );
          const defaultTeacherId = qualifiedTeacherIds.length ? qualifiedTeacherIds[0] : '';
          u[s.id] = {
            checked: true,
            assignments: [createDefaultAssignment(s, defaultTeacherId)],
          };
        }
      });
      return u;
    });
  }, [selectedTeacherIds, filteredSubjects, getQualifiedSubjectIds, createDefaultAssignment]);

  const validateAssignment = useCallback(async (subjectId, assignmentIndex, periodsOverride) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const row = rows[subjectId];
    if (!row) return;
    const assignment = row.assignments[assignmentIndex];
    if (!assignment.teacher_id) {
      toast.error('Select a teacher first');
      return;
    }
    if (assignment.selectedLocationIds.length === 0) {
      toast.error('Select at least one location');
      return;
    }
    const periods = periodsOverride ?? parseInt(assignment.weekly_periods);
    const key = `${subjectId}-${assignmentIndex}`;
    setRevalidatingRows(r => ({ ...r, [key]: true }));

    const firstLocationId = assignment.selectedLocationIds[0];
    try {
      const res = await apiRequest(`teachers/${assignment.teacher_id}/validate-assignment`, 'POST', {
        subject_id: subjectId,
        academic_year_id: parseInt(selectedAcademicYearId),
        weekly_periods: periods,
        classroom_id: !hasStreams ? parseInt(firstLocationId) : null,
        stream_id:    hasStreams  ? parseInt(firstLocationId) : null,
      });
      setRows(prev => {
        const updatedRow = { ...prev[subjectId] };
        const updatedAssignments = [...updatedRow.assignments];
        updatedAssignments[assignmentIndex] = {
          ...updatedAssignments[assignmentIndex],
          weekly_periods: String(periods),
          validation: {
            valid: res.valid,
            errors: res.data?.errors || [],
            warnings: res.data?.warnings || [],
            workload_summary: res.data?.workload_summary,
          }
        };
        updatedRow.assignments = updatedAssignments;
        return { ...prev, [subjectId]: updatedRow };
      });
      toast[res.valid ? 'success' : 'warning'](`${res.valid ? '✅' : '⚠️'} ${subject.name}: ${res.valid ? 'valid!' : 'still has issues.'}`);
    } catch (err) {
      toast.error(`Re-validation failed for ${subject.name}`);
    } finally {
      setRevalidatingRows(r => ({ ...r, [key]: false }));
    }
  }, [rows, subjects, selectedAcademicYearId, hasStreams]);

  const validateAll = useCallback(async () => {
    const checked = Object.entries(rows).filter(([_, row]) => row.checked).map(([id]) => parseInt(id));
    if (!checked.length) { toast.warning('Select at least one subject'); return; }

    const incomplete = [];
    checked.forEach(subjectId => {
      const row = rows[subjectId];
      row.assignments.forEach((a, idx) => {
        if (!a.teacher_id || a.selectedLocationIds.length === 0 || !a.weekly_periods || parseInt(a.weekly_periods) < 1) {
          incomplete.push(`${subjects.find(s => s.id === subjectId)?.name} (assignment ${idx + 1})`);
        }
      });
    });
    if (incomplete.length) {
      toast.error(`Fill in all fields for: ${incomplete.join(', ')}`);
      return;
    }

    setValidating(true);
    const updatedRows = { ...rows };
    for (const subjectId of checked) {
      const row = updatedRows[subjectId];
      for (let i = 0; i < row.assignments.length; i++) {
        const a = row.assignments[i];
        const firstLocationId = a.selectedLocationIds[0];
        try {
          const res = await apiRequest(`teachers/${a.teacher_id}/validate-assignment`, 'POST', {
            subject_id: subjectId,
            academic_year_id: parseInt(selectedAcademicYearId),
            weekly_periods: parseInt(a.weekly_periods),
            classroom_id: !hasStreams ? parseInt(firstLocationId) : null,
            stream_id:    hasStreams  ? parseInt(firstLocationId) : null,
          });
          row.assignments[i] = {
            ...a,
            validation: {
              valid: res.valid,
              errors: res.data?.errors || [],
              warnings: res.data?.warnings || [],
              workload_summary: res.data?.workload_summary,
            }
          };
        } catch (err) {
          row.assignments[i] = {
            ...a,
            validation: {
              valid: false,
              errors: [{ type: 'api_error', message: err?.response?.data?.message || 'Validation failed.' }],
              warnings: []
            }
          };
        }
      }
    }
    setRows(updatedRows);
    setValidating(false);

    const allValid = checked.every(subjectId =>
      updatedRows[subjectId].assignments.every(a => a.validation?.valid)
    );
    const anyInvalid = checked.some(subjectId =>
      updatedRows[subjectId].assignments.some(a => a.validation && !a.validation.valid)
    );

    if (allValid) {
      toast.success('✅ All assignments are valid!');
      setStep(3);
    } else if (anyInvalid) {
      toast.warning('⚠️ Some assignments have errors – fix using the panels.');
      setStep(3);
    } else {
      toast.error('❌ All assignments have errors.');
      setStep(3);
    }
  }, [rows, subjects, selectedAcademicYearId, hasStreams]);

  const submitAssignments = useCallback(async () => {
    const validSubjects = Object.entries(rows)
      .filter(([_, row]) => row.checked)
      .filter(([_, row]) => row.assignments.every(a => a.validation?.valid));

    if (!validSubjects.length) { toast.error('No valid assignments to save'); return; }

    setSubmitting(true);
    const success = [], fail = [];
    for (const [subjectIdStr, row] of validSubjects) {
      const subjectId = parseInt(subjectIdStr);
      const subject = subjects.find(s => s.id === subjectId);
      for (const a of row.assignments) {
        for (const locId of a.selectedLocationIds) {
          try {
            await apiRequest('subject-assignments', 'POST', {
              teacher_id: parseInt(a.teacher_id),
              subject_id: subjectId,
              academic_year_id: parseInt(selectedAcademicYearId),
              weekly_periods: parseInt(a.weekly_periods),
              assignment_type: a.assignment_type || 'main_teacher',
              classroom_id: !hasStreams ? parseInt(locId) : null,
              stream_id:    hasStreams  ? parseInt(locId) : null,
            });
          } catch (err) {
            fail.push({ name: subject.name, reason: err?.response?.data?.message || 'Unknown error' });
            break;
          }
        }
      }
      if (!fail.some(f => f.name === subject.name)) {
        success.push(subject.name);
      }
    }
    const uniqueSuccess = [...new Set(success)];
    setResults({ success: uniqueSuccess, failed: fail });
    setSubmitting(false);
    if (uniqueSuccess.length) { toast.success(`✅ ${uniqueSuccess.length} subjects saved!`); onSuccess?.(); }
    if (fail.length) toast.error(`❌ ${fail.length} subjects failed`);
  }, [rows, subjects, selectedAcademicYearId, hasStreams, onSuccess]);

  // Derived count of checked subject rows — used in multiple places in the JSX
  const checkedCount = useMemo(
    () => Object.values(rows).filter(r => r.checked).length,
    [rows]
  );

  // Checked rows array for step 3 review list
  const checkedRows = useMemo(
    () => Object.entries(rows).filter(([_, r]) => r.checked),
    [rows]
  );

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
      <div className="bg-white dark:bg-slate-800/50 w-full sm:rounded-xl shadow-2xl sm:max-w-5xl border-0 sm:border border-slate-200 dark:border-slate-700 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Bulk Subject Assignment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
              Assign multiple subjects to multiple teachers in one go
            </p>
          </div>
          <button onClick={onClose}
            className="ml-2 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step strip */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50 overflow-x-auto">
          <StepDot n={1} label="Setup" />
          <div className={`flex-1 h-0.5 min-w-[10px] max-w-16 rounded flex-shrink-0 ${step > 1 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={2} label="Select & Validate" />
          <div className={`flex-1 h-0.5 min-w-[10px] max-w-16 rounded flex-shrink-0 ${step > 2 ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <StepDot n={3} label="Review & Save" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* STEP 1: Setup */}
          {step === 1 && (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
              <div className={`${CLS.cyanBox} rounded-lg p-3 sm:p-4 flex items-start gap-3`}>
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300">
                  Select an academic year and one or more teachers. Subjects will be filtered to those at least one teacher is qualified for.
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

              {/* Teachers - multi-select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Teachers <span className="text-red-500">*</span>
                </label>
                <TeacherMultiSelect
                  teachers={teachers}
                  selectedIds={selectedTeacherIds}
                  onChange={setSelectedTeacherIds}
                />
                {selectedTeacherIds.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">Select at least one teacher</p>
                )}
              </div>

              {/* Loading */}
              {loadingTeachers && (
                <div className={`flex items-center gap-2 p-4 ${CLS.cyanBox} rounded-lg`}>
                  <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm text-cyan-700 dark:text-cyan-300">Loading teacher data…</span>
                </div>
              )}

              {/* Teacher workload cards */}
              {!loadingTeachers && selectedTeacherIds.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Teacher Workloads
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTeachers.map(teacher => {
                      const workload = teacherWorkloads[teacher.id];
                      if (!workload) return null;
                      const profile = teacherProfiles[teacher.id];
                      return (
                        <div key={teacher.id} className={`${CLS.cyanBox} rounded-lg p-3 space-y-2`}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {teacher.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{teacher.name}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {profile?.teaching_levels?.map(lvl => (
                              <span key={lvl} className="text-xs px-1.5 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 flex-shrink-0" />{lvl}
                              </span>
                            ))}
                            {profile?.teaching_pathways?.map(pw => (
                              <span key={pw} className="text-xs px-1.5 py-0.5 bg-white/70 dark:bg-black/20 rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 flex-shrink-0" />{pw}
                              </span>
                            ))}
                          </div>
                          <WorkloadBar current={workload.total_lessons} max={workload.max_lessons} showMath={false} />
                          <div className="grid grid-cols-3 gap-1 text-center text-xs">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{workload.total_lessons}</p>
                              <p className="text-slate-500 dark:text-slate-400">Current</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{workload.max_lessons}</p>
                              <p className="text-slate-500 dark:text-slate-400">Max</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{workload.available_capacity}</p>
                              <p className="text-slate-500 dark:text-slate-400">Available</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => setStep(2)}
                disabled={!selectedAcademicYearId || selectedTeacherIds.length === 0 || loadingTeachers}
                className={`w-full py-3 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}>
                Continue to Subject Selection <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Select & Validate */}
          {step === 2 && (
            <div className="p-3 sm:p-6 space-y-3">

              {/* Search + filters */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder="Search subjects…" value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-sm ${CLS.input}`} />
                  </div>
                  <button onClick={() => setShowFilters(v => !v)}
                    className={`sm:hidden flex items-center gap-1 px-3 py-2 text-xs rounded-lg flex-shrink-0 ${showFilters ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700' : CLS.secondary}`}>
                    <Filter className="w-3.5 h-3.5" />
                  </button>
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
                  <strong className="text-slate-900 dark:text-white">{checkedCount}</strong> of {filteredSubjects.length} selected
                </span>
              </div>

              {/* Subject list */}
              <div className="space-y-2 max-h-[52vh] sm:max-h-[45vh] overflow-y-auto overscroll-contain pr-0.5">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
                    No subjects match the current search/filter.
                  </div>
                ) : (
                  filteredSubjects.map(sub => {
                    const row = rows[sub.id] || { checked: false, assignments: [] };
                    const qualifiedTeacherIds = selectedTeacherIds.filter(id =>
                      getQualifiedSubjectIds(id).includes(sub.id)
                    );
                    const qualifiedTeachers = selectedTeachers.filter(t =>
                      qualifiedTeacherIds.includes(t.id)
                    );

                    return (
                      <SubjectRow
                        key={sub.id}
                        subject={sub}
                        checked={row.checked}
                        onToggle={() => toggleRow(sub)}
                        assignments={row.assignments}
                        onUpdateAssignment={(idx, field, val) => updateAssignment(sub.id, idx, field, val)}
                        onAddAssignment={() => addAssignment(sub.id)}
                        onRemoveAssignment={(idx) => removeAssignment(sub.id, idx)}
                        teacherLocations={teacherLocations}
                        hasStreams={hasStreams}
                        availableTeachers={qualifiedTeachers}
                        assignedLocationIds={assignedLocationIds}
                        subjectGradeLevel={sub.grade_level}
                        rowId={sub.id}
                        openDropdownId={openDropdownId}
                        setOpenDropdownId={setOpenDropdownId}
                        onRevalidate={(subjectId, idx, p) => validateAssignment(subjectId, idx, p)}
                        revalidatingRows={revalidatingRows}
                        // Pass selectedAcademicYearId and teacherProfiles down so SubjectRow has them in scope
                        selectedAcademicYearId={selectedAcademicYearId}
                        teacherProfiles={teacherProfiles}
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
                <button onClick={validateAll} disabled={checkedCount === 0 || validating}
                  className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 min-w-0 ${CLS.primary}`}>
                  {validating
                    ? <><Loader className="w-4 h-4 animate-spin flex-shrink-0" /><span className="truncate">Validating…</span></>
                    : <><CheckCircle className="w-4 h-4 flex-shrink-0" /><span className="truncate">Validate Selected</span></>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Save */}
          {step === 3 && !results && (
            <div className="p-3 sm:p-6 space-y-3">
              <div className="flex items-center gap-3 px-1 text-sm text-slate-500 dark:text-slate-400">
                <span><strong className="text-slate-900 dark:text-white">{checkedCount}</strong> subjects ready</span>
              </div>
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto overscroll-contain pr-0.5">
                {checkedRows.map(([subjectId, row]) => {
                  const subject = subjects.find(s => s.id === parseInt(subjectId));
                  const totalAssignments = row.assignments.length;
                  const totalLocations = row.assignments.reduce((sum, a) => sum + a.selectedLocationIds.length, 0);
                  return (
                    <div key={subjectId} className={`${CLS.card} rounded-lg p-3 flex items-center gap-3`}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{subject.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''} · {totalLocations} location{totalLocations !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 sm:gap-3 pt-1">
                <button onClick={() => setStep(2)}
                  className={`px-3 sm:px-4 py-2.5 text-sm rounded-lg flex-shrink-0 ${CLS.secondary}`}>
                  Back
                </button>
                <button onClick={submitAssignments}
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-xs sm:text-sm rounded-lg flex items-center justify-center gap-2 min-w-0 ${CLS.primary}`}>
                  {submitting
                    ? <><Loader className="w-4 h-4 animate-spin flex-shrink-0" />Saving…</>
                    : <><Send className="w-4 h-4 flex-shrink-0" /><span className="truncate">Save All</span></>}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
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
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />{n}
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
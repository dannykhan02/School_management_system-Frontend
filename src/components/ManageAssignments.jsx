// src/components/ManageAssignments.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Users, Calendar, User, Layers, Clock, AlertCircle, CheckCircle,
  Trash2, Loader, AlertTriangle, Info, Pencil, Save, XCircle,
  ChevronDown, Plus, UserCheck, GraduationCap, BookOpen, ShieldCheck,
  Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';
import WorkloadMeter from './WorkloadMeter';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT — shared design tokens
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  input:     'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg',
  primary:   'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  secondary: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  cyanBox:   'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800',
  card:      'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// Specialization keyword mapping
// ─────────────────────────────────────────────────────────────────────────────
const SPEC_KEYWORDS = {
  mathematics:     ['math', 'mathematics'],
  sciences:        ['science', 'biology', 'chemistry', 'physics'],
  languages:       ['language', 'english', 'kiswahili', 'french', 'literature'],
  humanities:      ['history', 'geography', 'cre', 'ire', 'social'],
  technical:       ['technical', 'computer', 'ict', 'business', 'agriculture'],
  'creative arts': ['art', 'music', 'drama', 'creative'],
  'physical ed':   ['pe', 'physical', 'sport'],
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
function ManageAssignments({
  isOpen,
  onClose,
  selectedSubject,
  hasStreams,
  academicYears,
  teachers,
  assignments,
  loading,
  assignmentFormData,
  selectedTeacher,
  teacherClassrooms,
  teacherStreams,
  selectedAcademicYearInfo,
  onAcademicYearChange,
  onTeacherSelection,
  onAssignmentInputChange,
  onCreateAssignment,
  onDeleteAssignment,
}) {
  // ── Multi-location selection state ──────────────────────────────────────────
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [validationResult, setValidationResult]   = useState(null);
  const [validating, setValidating]               = useState(false);
  const [submitting, setSubmitting]               = useState(false);

  // Reset locations whenever teacher or academic year changes
  useEffect(() => {
    setSelectedLocations([]);
    setValidationResult(null);
  }, [assignmentFormData.teacher_id, assignmentFormData.academic_year_id]);

  // ── Derived booleans ────────────────────────────────────────────────────────
  const weeklyPeriods   = parseInt(assignmentFormData.weekly_periods);
  const hasValidPeriods = !isNaN(weeklyPeriods) && weeklyPeriods >= 1;
  const hasTeacher      = Boolean(assignmentFormData.teacher_id);
  const hasAcYear       = Boolean(assignmentFormData.academic_year_id);
  const hasLocations    = selectedLocations.length > 0;

  const missingFields = [];
  if (!hasAcYear)       missingFields.push('Academic Year');
  if (!hasTeacher)      missingFields.push('Teacher');
  if (!hasLocations)    missingFields.push(hasStreams ? 'at least one Stream' : 'at least one Classroom');
  if (!hasValidPeriods) missingFields.push('Weekly Periods (min 1)');

  const formComplete = missingFields.length === 0;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateAssignment = useCallback(async () => {
    if (!formComplete || !selectedSubject) return;

    setValidating(true);
    try {
      const firstLocation = selectedLocations[0];
      const response = await apiRequest(
        `teachers/${assignmentFormData.teacher_id}/validate-assignment`,
        'POST',
        {
          subject_id:       selectedSubject.id,
          academic_year_id: assignmentFormData.academic_year_id,
          weekly_periods:   weeklyPeriods,
          classroom_id:     !hasStreams ? firstLocation : null,
          stream_id:        hasStreams  ? firstLocation : null,
        }
      );
      setValidationResult(response);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        valid: false,
        data: {
          errors: [{ type: 'api_error', message: 'Could not reach validation service. Check your connection.' }],
          warnings: [],
        },
      });
    } finally {
      setValidating(false);
    }
  }, [
    formComplete, selectedSubject,
    assignmentFormData.teacher_id,
    assignmentFormData.academic_year_id,
    selectedLocations, weeklyPeriods, hasStreams,
  ]);

  useEffect(() => {
    if (formComplete) {
      validateAssignment();
    } else {
      setValidationResult(null);
    }
  }, [
    assignmentFormData.teacher_id,
    assignmentFormData.academic_year_id,
    selectedLocations,
    weeklyPeriods,
    formComplete,
  ]);

  // ── Location toggle ─────────────────────────────────────────────────────────
  const toggleLocation = (id) => {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  // ── Periods handlers ────────────────────────────────────────────────────────
  const handlePeriodsChange = (e) =>
    onAssignmentInputChange({ target: { name: 'weekly_periods', value: e.target.value } });

  const handlePeriodsBlur = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 1)
      onAssignmentInputChange({ target: { name: 'weekly_periods', value: '' } });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formComplete) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    if (validationResult && !validationResult.valid) {
      toast.error('Fix the errors shown before creating this assignment.');
      return;
    }
    if (validationResult?.data?.warnings?.length > 0) {
      validationResult.data.warnings.forEach(w =>
        toast.warning(w.message, { autoClose: 6000 })
      );
    }

    setSubmitting(true);
    try {
      const assignmentsPayload = selectedLocations.map(locId => {
        const entry = {
          teacher_id:       parseInt(assignmentFormData.teacher_id, 10),
          subject_id:       parseInt(selectedSubject.id, 10),
          academic_year_id: parseInt(assignmentFormData.academic_year_id, 10),
          weekly_periods:   weeklyPeriods,
          assignment_type:  assignmentFormData.assignment_type || 'main_teacher',
        };
        if (hasStreams) {
          entry.stream_id    = parseInt(locId, 10);
        } else {
          entry.classroom_id = parseInt(locId, 10);
        }
        return entry;
      });

      let response;

      if (selectedLocations.length === 1) {
        try {
          response = await apiRequest('subject-assignments', 'POST', assignmentsPayload[0]);
        } catch (err) {
          const laravelErrors = err?.response?.data?.errors;
          const detail = laravelErrors
            ? Object.values(laravelErrors).flat().join(' | ')
            : err?.response?.data?.message || err?.message || 'Failed to create assignment.';
          toast.error(detail);
          return;
        }

        if (response?.warnings?.length > 0) {
          response.warnings.forEach(w => toast.warning(w, { autoClose: 6000 }));
        }
        toast.success('Assignment created successfully.');

      } else {
        try {
          response = await apiRequest('subject-assignments/batch', 'POST', {
            assignments: assignmentsPayload,
          });
        } catch (err) {
          const laravelErrors = err?.response?.data?.errors;
          const detail = laravelErrors
            ? Object.values(laravelErrors).flat().join(' | ')
            : err?.response?.data?.message || err?.message || 'Batch failed.';
          toast.error(detail);
          return;
        }

        if (response?.warnings?.length > 0) {
          response.warnings.forEach(w => toast.warning(w, { autoClose: 6000 }));
        }
        if (response?.errors?.length > 0) {
          response.errors.forEach(errMsg => toast.warning(errMsg, { autoClose: 7000 }));
        }
        toast.success(
          `${selectedLocations.length} assignment${selectedLocations.length > 1 ? 's' : ''} created successfully.`
        );
      }

      setSelectedLocations([]);
      setValidationResult(null);
      await onCreateAssignment({ preventDefault: () => {}, _refreshOnly: true });

    } catch (err) {
      const laravelErrors = err?.response?.data?.errors;
      const msg = laravelErrors
        ? Object.values(laravelErrors).flat().join(' | ')
        : err?.response?.data?.message || err?.message || 'Failed to create assignment(s).';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled =
    submitting || loading || validating || !formComplete ||
    (validationResult !== null && !validationResult.valid);

  // ── Grade-level filter ──────────────────────────────────────────────────────
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

  const extractGradePrefix = (loc) => {
    const candidates = [
      loc.name, loc.class_name, loc.stream_name,
      loc.classroom?.class_name, loc.classroom?.name,
    ].filter(Boolean);
    for (const raw of candidates) {
      const prefix = raw.split(/\s*-\s*/)[0].trim().toLowerCase();
      if (prefix) return prefix;
    }
    return '';
  };

  const locationMatchesSubject = (loc) => {
    const gradeLevel = selectedSubject?.grade_level;
    if (!gradeLevel) return true;
    const allowed = GRADE_PREFIXES[gradeLevel];
    if (!allowed) return true;
    const prefix = extractGradePrefix(loc);
    if (!prefix) return true;
    return allowed.includes(prefix);
  };

  const allLocations       = hasStreams ? teacherStreams : teacherClassrooms;
  const availableLocations = allLocations.filter(locationMatchesSubject);
  const filteredOutCount   = allLocations.length - availableLocations.length;

  const assignedLocationIds = new Set(
    assignments
      .filter(a =>
        String(a.teacher_id) === String(assignmentFormData.teacher_id) &&
        String(a.academic_year_id) === String(assignmentFormData.academic_year_id)
      )
      .map(a => hasStreams ? a.stream_id : a.classroom_id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[70] p-2 sm:p-4 overflow-y-auto">
      <div className={`${CLS.card} rounded-xl shadow-2xl w-full max-w-6xl my-4`}>

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 rounded-t-xl">
          <div className="min-w-0 flex-1 mr-4 flex items-center gap-3">
            {/* Subject icon pill */}
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 dark:text-white truncate">
                Manage Assignments: {selectedSubject?.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Code: {selectedSubject?.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">

          {/* ══════════════════════════════════════
              LEFT — Create Assignment Form
          ══════════════════════════════════════ */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Create New Assignment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={assignmentFormData.academic_year_id}
                    onChange={onAcademicYearChange}
                    required
                    className={`w-full pl-10 pr-8 py-2.5 text-sm ${CLS.input}`}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>
                        {year.name} {(year.is_active || year.is_current) && '(Current)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <TeacherDropdown
                  teachers={teachers}
                  value={assignmentFormData.teacher_id}
                  onChange={onTeacherSelection}
                  disabled={!assignmentFormData.academic_year_id}
                />
                {selectedSubject && assignmentFormData.teacher_id && (
                  <SpecializationHint
                    teachers={teachers}
                    teacherId={assignmentFormData.teacher_id}
                    subject={selectedSubject}
                  />
                )}
              </div>

              {/* Teacher Workload */}
              {hasTeacher && hasAcYear && (
                <div className={`${CLS.cyanBox} rounded-lg p-3 sm:p-4`}>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-200 dark:bg-cyan-800 flex items-center justify-center">
                      <Info className="w-3 h-3 text-cyan-700 dark:text-cyan-300" />
                    </div>
                    Current Teacher Workload
                  </h4>
                  <WorkloadMeter
                    teacherId={parseInt(assignmentFormData.teacher_id)}
                    academicYearId={assignmentFormData.academic_year_id}
                    compact={false}
                  />
                </div>
              )}

              {/* ── Multi-location picker ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {hasStreams ? 'Streams' : 'Classrooms'}{' '}
                    <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
                      (select one or more)
                    </span>
                  </label>
                  {selectedLocations.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 rounded-full">
                      {selectedLocations.length} selected
                    </span>
                  )}
                </div>

                {!hasTeacher ? (
                  <div className="flex items-center gap-2.5 px-3 py-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-400 dark:text-slate-500">
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
                      {filteredOutCount > 0 ? (
                        <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">
                          {filteredOutCount} {hasStreams ? 'stream' : 'classroom'}{filteredOutCount !== 1 ? 's' : ''} hidden
                          — they belong to a different grade level than{' '}
                          <strong>{selectedSubject?.grade_level}</strong>.
                          This teacher may not have {hasStreams ? 'streams' : 'classes'} at this grade.
                        </p>
                      ) : (
                        <p className="text-xs text-amber-500 dark:text-amber-500 mt-0.5">
                          This teacher has no {hasStreams ? 'streams' : 'classrooms'} configured.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    {/* Toolbar */}
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
                          onClick={() => {
                            const unassigned = availableLocations
                              .filter(l => !assignedLocationIds.has(l.id))
                              .map(l => l.id);
                            setSelectedLocations(unassigned);
                          }}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                          Select all
                        </button>
                        {selectedLocations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedLocations([])}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Location list */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                      {availableLocations.map(loc => {
                        const isSelected     = selectedLocations.includes(loc.id);
                        const isAssigned     = assignedLocationIds.has(loc.id);
                        const isClassTeacher = loc.is_class_teacher;

                        return (
                          <button
                            key={loc.id}
                            type="button"
                            disabled={isAssigned}
                            onClick={() => !isAssigned && toggleLocation(loc.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                              ${isAssigned
                                ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30'
                                : isSelected
                                  ? 'bg-cyan-50 dark:bg-cyan-900/25 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
                                  : 'bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40'
                              }`}
                          >
                            {/* Checkbox visual */}
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
                                {isClassTeacher && (
                                  <span className="ml-1.5 text-amber-500" title="Class Teacher">⭐</span>
                                )}
                              </span>
                              {isAssigned && (
                                <span className="text-xs text-slate-400 dark:text-slate-500">Already assigned</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected summary pills */}
                {selectedLocations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedLocations.map(id => {
                      const loc = availableLocations.find(l => l.id === id);
                      return loc ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 rounded-full"
                        >
                          {loc.name || loc.class_name}
                          <button
                            type="button"
                            onClick={() => toggleLocation(id)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Weekly Periods */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Weekly Periods <span className="text-red-500">*</span>
                  {selectedLocations.length > 1 && (
                    <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                      (applied to each {hasStreams ? 'stream' : 'class'})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center pointer-events-none">
                    <Clock className="w-3 h-3 text-slate-500 dark:text-slate-300" />
                  </div>
                  <input
                    type="number"
                    name="weekly_periods"
                    value={assignmentFormData.weekly_periods}
                    onChange={handlePeriodsChange}
                    onBlur={handlePeriodsBlur}
                    min="1"
                    max="40"
                    required
                    placeholder="e.g. 5"
                    className={`w-full pl-10 pr-3 py-2.5 text-sm ${CLS.input} ${
                      !hasValidPeriods && assignmentFormData.weekly_periods !== ''
                        ? 'border-red-400 dark:border-red-500'
                        : ''
                    }`}
                  />
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recommended: {selectedSubject?.minimum_weekly_periods || 5}–{selectedSubject?.maximum_weekly_periods || 7} periods/week
                  </p>
                  {!hasValidPeriods && assignmentFormData.weekly_periods !== '' && (
                    <p className="text-xs text-red-500 dark:text-red-400">Minimum is 1</p>
                  )}
                </div>
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Assignment Type
                </label>
                <select
                  name="assignment_type"
                  value={assignmentFormData.assignment_type}
                  onChange={onAssignmentInputChange}
                  className={`w-full px-3 py-2.5 text-sm ${CLS.input}`}
                >
                  <option value="main_teacher">Main Teacher</option>
                  <option value="assistant_teacher">Assistant Teacher</option>
                  <option value="substitute">Substitute</option>
                </select>
              </div>

              {/* Validation Panel */}
              <ValidationPanel
                formComplete={formComplete}
                missingFields={missingFields}
                validating={validating}
                validationResult={validationResult}
                locationCount={selectedLocations.length}
                hasStreams={hasStreams}
              />

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 px-4 py-2.5 text-sm rounded-lg ${CLS.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  title={isSubmitDisabled && missingFields.length > 0 ? `Fill in: ${missingFields.join(', ')}` : ''}
                  className={`flex-1 px-4 py-2.5 text-sm rounded-lg flex items-center justify-center gap-2 ${CLS.primary}`}
                >
                  {submitting || loading ? (
                    <><Loader className="w-4 h-4 animate-spin flex-shrink-0" /> Creating…</>
                  ) : validating ? (
                    <><Loader className="w-4 h-4 animate-spin flex-shrink-0" /> Validating…</>
                  ) : selectedLocations.length > 1 ? (
                    <><Plus className="w-4 h-4 flex-shrink-0" /> Create {selectedLocations.length} Assignments</>
                  ) : (
                    'Create Assignment'
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ══════════════════════════════════════
              RIGHT — Current Assignments
          ══════════════════════════════════════ */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </div>
              Current Assignments
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                {assignments.length}
              </span>
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No assignments yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Create one using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {assignments.map(assignment => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    hasStreams={hasStreams}
                    onDelete={onDeleteAssignment}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: TeacherDropdown
───────────────────────────────────────────────────────────────────────────── */
function TeacherDropdown({ teachers, value, onChange, disabled }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState('');
  const ref                   = useRef(null);

  const selected = teachers.find(t => t.id === parseInt(value));

  const filtered = teachers.filter(t => {
    const name  = t.name?.toLowerCase() || '';
    const spec  = (t.specialization || t.curriculum_specialization || '').toLowerCase();
    const s     = search.toLowerCase();
    return name.includes(s) || spec.includes(s);
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (teacher) => {
    onChange({ target: { value: String(teacher.id) } });
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange({ target: { value: '' } });
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 pl-10 pr-3 py-2.5 text-sm border rounded-lg text-left transition-all
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700/50'
            : 'bg-white dark:bg-slate-700 cursor-pointer hover:border-cyan-400 dark:hover:border-cyan-500'}
          ${open ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-slate-300 dark:border-slate-600'}
          text-slate-900 dark:text-white`}
      >
        {/* Icon: UserCheck when selected, User otherwise */}
        {selected
          ? <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500 pointer-events-none flex-shrink-0" />
          : <User      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex-shrink-0" />
        }
        <span className="flex-1 truncate min-w-0">
          {selected
            ? <span className="truncate block">
                {selected.name}
                {(selected.specialization || selected.curriculum_specialization) && (
                  <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    — {selected.specialization || selected.curriculum_specialization}
                  </span>
                )}
              </span>
            : <span className="text-slate-400 dark:text-slate-500">Select Teacher</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {/* Search bar */}
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

          {/* Clear option */}
          <div
            onClick={handleClear}
            className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer border-b border-slate-100 dark:border-slate-700"
          >
            — None —
          </div>

          {/* Teacher list */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">
                No teachers match your search
              </div>
            ) : (
              filtered.map(teacher => {
                const spec     = teacher.specialization || teacher.curriculum_specialization;
                const isActive = teacher.id === parseInt(value);
                return (
                  <div
                    key={teacher.id}
                    onClick={() => handleSelect(teacher)}
                    className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0
                      ${isActive
                        ? 'bg-cyan-50 dark:bg-cyan-900/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Avatar initial circle */}
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'}`}>
                        {teacher.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-900 dark:text-white'}`}>
                          {teacher.name}
                        </p>
                        {spec && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{spec}</p>
                        )}
                      </div>
                      {isActive && (
                        <UserCheck className="w-4 h-4 text-cyan-500 flex-shrink-0 ml-auto" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Selected teacher info card */}
      {selected && (
        <div className="mt-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-2.5">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-white">
            {selected.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 break-words leading-snug">
              {selected.name}
            </p>
            {(selected.specialization || selected.curriculum_specialization) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words leading-snug">
                {selected.specialization || selected.curriculum_specialization}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: SpecializationHint
───────────────────────────────────────────────────────────────────────────── */
function SpecializationHint({ teachers, teacherId, subject }) {
  const teacher = teachers.find(t => t.id === parseInt(teacherId));
  if (!teacher || !subject) return null;

  const teacherSpec     = (teacher.specialization || '').toLowerCase();
  const subjectCategory = (subject.category || '').toLowerCase();
  const matchKeywords   = SPEC_KEYWORDS[subjectCategory] || [];
  const isMatch         = matchKeywords.some(kw => teacherSpec.includes(kw));

  if (!teacherSpec) return null;

  if (isMatch) {
    return (
      <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
        <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle className="w-2.5 h-2.5" />
        </span>
        <span>Specialization matches this subject ({subject.category})</span>
      </p>
    );
  }

  return (
    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
        <AlertTriangle className="w-2.5 h-2.5" />
      </span>
      <span>
        Teacher specializes in <strong className="mx-0.5">{teacher.specialization || 'Unknown'}</strong>
        — this subject is <strong className="ml-0.5">{subject.category}</strong>.
        Assignment is still allowed with a warning.
      </span>
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: ValidationPanel
───────────────────────────────────────────────────────────────────────────── */
function ValidationPanel({ formComplete, missingFields, validating, validationResult, locationCount, hasStreams }) {
  if (!formComplete) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
        <div className="flex items-start gap-2.5 mb-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center mt-0.5">
            <Info className="w-3 h-3 text-slate-500 dark:text-slate-400" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Complete the form to validate
          </h4>
        </div>
        <ul className="space-y-1.5 ml-7">
          {missingFields.map((field, i) => (
            <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
              {field} is required
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (validating) {
    return (
      <div className={`${CLS.cyanBox} rounded-lg p-4`}>
        <div className="flex items-center gap-2.5">
          <Loader className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm text-cyan-700 dark:text-cyan-300">Checking assignment validity…</span>
        </div>
      </div>
    );
  }

  if (!validationResult) return null;

  const { valid, data } = validationResult;
  const errors   = data?.errors   || [];
  const warnings = data?.warnings || [];
  const workload = data?.workload_summary;

  if (valid) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
            Valid — ready to create
            {locationCount > 1 && (
              <span className="ml-1 font-normal text-green-700 dark:text-green-300">
                ({locationCount} {hasStreams ? 'streams' : 'classes'})
              </span>
            )}
          </h4>
        </div>

        {workload && (
          <div className="grid grid-cols-3 gap-2 text-xs bg-green-100/60 dark:bg-green-900/30 rounded-md p-2">
            <div className="text-center">
              <div className="font-bold text-green-900 dark:text-green-100">{workload.current_lessons}</div>
              <div className="text-green-700 dark:text-green-400">Current</div>
            </div>
            <div className="text-center border-x border-green-200 dark:border-green-700">
              <div className="font-bold text-green-900 dark:text-green-100">
                {workload.new_total}/{workload.max_lessons}
              </div>
              <div className="text-green-700 dark:text-green-400">After add</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-900 dark:text-green-100">
                {Math.max(0, workload.max_lessons - workload.new_total)}
              </div>
              <div className="text-green-700 dark:text-green-400">Remaining</div>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-green-200 dark:border-green-700">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
              </span>
              Warnings (assignment still allowed):
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400 ml-5 break-words">• {w.message}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        </div>
        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
          Cannot create this assignment
        </h4>
      </div>
      <div className="space-y-2">
        {errors.map((err, i) => <ErrorItem key={i} error={err} />)}
      </div>
      {workload && (
        <div className="grid grid-cols-3 gap-2 text-xs bg-red-100/60 dark:bg-red-900/30 rounded-md p-2">
          <div className="text-center">
            <div className="font-bold text-red-900 dark:text-red-100">{workload.current_lessons}</div>
            <div className="text-red-700 dark:text-red-400">Current</div>
          </div>
          <div className="text-center border-x border-red-200 dark:border-red-700">
            <div className="font-bold text-red-900 dark:text-red-100">
              {workload.new_total}/{workload.max_lessons}
            </div>
            <div className="text-red-700 dark:text-red-400">Would be</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-red-900 dark:text-red-100">
              {Math.max(0, workload.max_lessons - workload.current_lessons)}
            </div>
            <div className="text-red-700 dark:text-red-400">Available</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: ErrorItem
───────────────────────────────────────────────────────────────────────────── */
function ErrorItem({ error }) {
  const messages = {
    workload_exceeded: {
      title: 'Teacher is overloaded',
      hint:  'Reduce the weekly periods, or choose a different teacher with more capacity.',
    },
    specialization_mismatch: {
      title: "Subject outside teacher's specialization",
      hint:  "This teacher's specialization does not match this subject's category.",
    },
    insufficient_periods: {
      title: 'Not enough timetable slots',
      hint:  "The teacher's timetable doesn't have enough free periods.",
    },
    api_error: {
      title: 'Validation service unavailable',
      hint:  'Could not connect to the server. Check your connection and try again.',
    },
    level_mismatch: {
      title: 'Teacher not qualified for this level',
      hint:  "This teacher's teaching levels don't include the level required by this subject.",
    },
    pathway_mismatch: {
      title: 'Teacher not qualified for this pathway',
      hint:  "This teacher's teaching pathways don't include the pathway required by this subject.",
    },
  };

  const known = messages[error.type];

  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mt-0.5">
        <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-red-800 dark:text-red-200 break-words">
          {known?.title || error.message}
        </p>
        {known && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">{known.hint}</p>
        )}
        {known && error.message && (
          <p className="text-xs text-red-500/70 dark:text-red-500/60 mt-0.5 italic break-words">{error.message}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: AssignmentCard
───────────────────────────────────────────────────────────────────────────── */
function AssignmentCard({ assignment, hasStreams, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editData, setEditData]   = useState({
    weekly_periods:  assignment.weekly_periods  ?? 5,
    assignment_type: assignment.assignment_type ?? 'main_teacher',
  });

  const teacherName =
    assignment.teacher?.user?.full_name ||
    assignment.teacher?.user?.name ||
    'Unknown Teacher';

  const location = hasStreams
    ? (() => {
        const className  = assignment.stream?.classroom?.class_name || '';
        const streamName = assignment.stream?.name || assignment.stream?.stream_name || '';
        return className && streamName
          ? `${className} — ${streamName}`
          : streamName || className || 'Unknown Stream';
      })()
    : (assignment.classroom?.class_name || 'Unknown Classroom');

  const typeLabel = (t) =>
    (t || 'main_teacher').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleCancel = () => {
    setEditData({
      weekly_periods:  assignment.weekly_periods  ?? 5,
      assignment_type: assignment.assignment_type ?? 'main_teacher',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    const periods = parseInt(editData.weekly_periods);
    if (isNaN(periods) || periods < 1) {
      toast.error('Weekly periods must be at least 1.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`subject-assignments/${assignment.id}`, 'PUT', {
        weekly_periods:  periods,
        assignment_type: editData.assignment_type,
      });
      assignment.weekly_periods  = periods;
      assignment.assignment_type = editData.assignment_type;
      toast.success('Assignment updated successfully.');
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${CLS.card} rounded-lg p-4 hover:shadow-md transition-shadow`}>

      <div className="flex items-start justify-between mb-3 gap-2">
        {/* Teacher identity */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-bold text-white mt-0.5">
            {teacherName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-white break-words">{teacherName}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 break-words">{location}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                title="Save changes"
                className={`p-1.5 text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors flex items-center`}
              >
                {saving ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Cancel"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                title="Edit assignment"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(assignment.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete assignment"
                aria-label="Delete assignment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* View mode */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
              <Clock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-300" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {assignment.weekly_periods} p/wk
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full whitespace-nowrap">
            {typeLabel(assignment.assignment_type)}
          </span>
          {assignment.is_outside_specialization && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
              <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <AlertTriangle className="w-2 h-2" />
              </span>
              Outside specialization
            </span>
          )}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="mt-2 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Edit Assignment
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Weekly Periods</label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center pointer-events-none">
                <Clock className="w-2.5 h-2.5 text-slate-500 dark:text-slate-300" />
              </div>
              <input
                type="number" min="1" max="40"
                value={editData.weekly_periods}
                onChange={e => setEditData(prev => ({ ...prev, weekly_periods: e.target.value }))}
                className={`w-full pl-9 pr-3 py-1.5 text-sm ${CLS.input}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Assignment Type</label>
            <select
              value={editData.assignment_type}
              onChange={e => setEditData(prev => ({ ...prev, assignment_type: e.target.value }))}
              className={`w-full px-3 py-1.5 text-sm ${CLS.input}`}
            >
              <option value="main_teacher">Main Teacher</option>
              <option value="assistant_teacher">Assistant Teacher</option>
              <option value="substitute">Substitute</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel} disabled={saving}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${CLS.secondary} disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 ${CLS.primary} disabled:opacity-50`}
            >
              {saving
                ? <><Loader className="w-3 h-3 animate-spin" /> Saving…</>
                : <><Save className="w-3 h-3" /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManageAssignments;
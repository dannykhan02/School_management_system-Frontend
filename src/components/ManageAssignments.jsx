import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Calendar, User, Layers, Clock, AlertCircle, CheckCircle, Trash2, Loader, AlertTriangle, Info, Pencil, Save, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';
import WorkloadMeter from './WorkloadMeter';

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

function ManageAssignments({
  isOpen,
  onClose,
  selectedSubject,
  hasStreams,
  academicYears,
  teachers,
  allTeachersCount,      // NEW
  incompatibleCount,     // NEW
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
  onDeleteAssignment
}) {
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  // ─── Determine if form is "ready to validate" ───────────────────────────────
  const weeklyPeriods = parseInt(assignmentFormData.weekly_periods);
  const hasValidPeriods = !isNaN(weeklyPeriods) && weeklyPeriods >= 1;
  const hasTeacher    = Boolean(assignmentFormData.teacher_id);
  const hasAcYear     = Boolean(assignmentFormData.academic_year_id);
  const hasLocation   = hasStreams
    ? Boolean(assignmentFormData.stream_id)
    : Boolean(assignmentFormData.classroom_id);

  const missingFields = [];
  if (!hasAcYear)   missingFields.push('Academic Year');
  if (!hasTeacher)  missingFields.push('Teacher');
  if (!hasLocation) missingFields.push(hasStreams ? 'Stream' : 'Classroom');
  if (!hasValidPeriods) missingFields.push('Weekly Periods (min 1)');

  const formComplete = missingFields.length === 0;

  // ─── Validate whenever relevant fields change ───────────────────────────────
  const validateAssignment = useCallback(async () => {
    if (!formComplete || !selectedSubject) return;

    setValidating(true);
    try {
      const response = await apiRequest(
        `teachers/${assignmentFormData.teacher_id}/validate-assignment`,
        'POST',
        {
          subject_id: selectedSubject.id,
          academic_year_id: assignmentFormData.academic_year_id,
          weekly_periods: weeklyPeriods,
          classroom_id: assignmentFormData.classroom_id || null,
          stream_id:    assignmentFormData.stream_id    || null,
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
    formComplete,
    selectedSubject,
    assignmentFormData.teacher_id,
    assignmentFormData.academic_year_id,
    assignmentFormData.stream_id,
    assignmentFormData.classroom_id,
    weeklyPeriods,
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
    assignmentFormData.stream_id,
    assignmentFormData.classroom_id,
    weeklyPeriods,
    formComplete,
  ]);

  const handlePeriodsChange = (e) => {
    const raw = e.target.value;
    onAssignmentInputChange({ target: { name: 'weekly_periods', value: raw } });
  };

  const handlePeriodsBlur = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) {
      onAssignmentInputChange({ target: { name: 'weekly_periods', value: '' } });
    }
  };

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

    await onCreateAssignment(e);
    setValidationResult(null);
  };

  const isSubmitDisabled =
    loading ||
    validating ||
    !formComplete ||
    (validationResult !== null && !validationResult.valid);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-6xl border border-slate-200 dark:border-slate-700 my-4 max-h-[95vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Manage Assignments: {selectedSubject?.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Code: {selectedSubject?.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">

          {/* ════════════════════════════════════════
              LEFT COLUMN — Create Assignment Form
          ════════════════════════════════════════ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create New Assignment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Academic Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={assignmentFormData.academic_year_id}
                    onChange={onAcademicYearChange}
                    required
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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

                {/* NEW: incompatibility notice */}
                {incompatibleCount > 0 && (
                  <div className="mb-2 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <strong>{incompatibleCount} teacher{incompatibleCount !== 1 ? 's' : ''} hidden</strong> — not qualified for{' '}
                      {selectedSubject?.pathway ? `${selectedSubject.pathway} pathway` : levelFromGrade(selectedSubject?.grade_level) || 'this level'}.
                      Only showing {allTeachersCount - incompatibleCount} compatible teacher{allTeachersCount - incompatibleCount !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={assignmentFormData.teacher_id}
                    onChange={onTeacherSelection}
                    required
                    disabled={!assignmentFormData.academic_year_id}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} — {teacher.specialization || teacher.curriculum_specialization || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
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
                <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Current Teacher Workload
                  </h4>
                  <WorkloadMeter
                    teacherId={parseInt(assignmentFormData.teacher_id)}
                    academicYearId={assignmentFormData.academic_year_id}
                    compact={false}
                  />
                </div>
              )}

              {/* Stream / Classroom */}
              {hasStreams ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Stream <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="stream_id"
                      value={assignmentFormData.stream_id}
                      onChange={onAssignmentInputChange}
                      required
                      disabled={!hasTeacher}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!hasTeacher ? 'Select a teacher first' : 'Select Stream'}
                      </option>
                      {teacherStreams.map(stream => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}{stream.is_class_teacher ? ' ⭐ (Class Teacher)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasTeacher && teacherStreams.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      No streams found. Make sure streams are configured for this school.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Classroom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="classroom_id"
                      value={assignmentFormData.classroom_id}
                      onChange={onAssignmentInputChange}
                      required
                      disabled={!hasTeacher}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                    >
                      <option value="">
                        {!hasTeacher ? 'Select a teacher first' : 'Select Classroom'}
                      </option>
                      {teacherClassrooms.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}{cls.is_class_teacher ? ' ⭐ (Class Teacher)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Weekly Periods */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Weekly Periods <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      !hasValidPeriods && assignmentFormData.weekly_periods !== ''
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recommended: {selectedSubject?.minimum_weekly_periods || 5}–{selectedSubject?.maximum_weekly_periods || 7} periods/week
                  </p>
                  {!hasValidPeriods && (
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
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="main_teacher">Main Teacher</option>
                  <option value="assistant_teacher">Assistant Teacher</option>
                  <option value="substitute">Substitute</option>
                </select>
              </div>

              {/* ── Validation Status Panel ── */}
              <ValidationPanel
                formComplete={formComplete}
                missingFields={missingFields}
                validating={validating}
                validationResult={validationResult}
              />

              {/* ── Actions ── */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  title={isSubmitDisabled && missingFields.length > 0 ? `Fill in: ${missingFields.join(', ')}` : ''}
                  className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : validating ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Validating...</>
                  ) : (
                    'Create Assignment'
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — Existing Assignments
          ════════════════════════════════════════ */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current Assignments ({assignments.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No assignments yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Create one using the form on the left
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
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

/* ──────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: SpecializationHint
────────────────────────────────────────────────────────────────────────────── */
function SpecializationHint({ teachers, teacherId, subject }) {
  const teacher = teachers.find(t => t.id === parseInt(teacherId));
  if (!teacher || !subject) return null;

  const teacherSpec = (teacher.specialization || '').toLowerCase();
  const subjectCategory = (subject.category || '').toLowerCase();

  const keywords = {
    mathematics:   ['math', 'mathematics'],
    sciences:      ['science', 'biology', 'chemistry', 'physics'],
    languages:     ['language', 'english', 'kiswahili', 'french', 'literature'],
    humanities:    ['history', 'geography', 'cre', 'ire', 'social'],
    technical:     ['technical', 'computer', 'ict', 'business', 'agriculture'],
    'creative arts': ['art', 'music', 'drama', 'creative'],
    'physical ed': ['pe', 'physical', 'sport'],
  };

  const matchKeywords = keywords[subjectCategory] || [];
  const isMatch = matchKeywords.some(kw => teacherSpec.includes(kw));

  if (!teacherSpec) return null;

  if (isMatch) {
    return (
      <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Specialization matches this subject ({subject.category})
      </p>
    );
  }

  return (
    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      Teacher specializes in <strong className="mx-0.5">{teacher.specialization || 'Unknown'}</strong>
      — this subject is <strong className="ml-0.5">{subject.category}</strong>.
      Assignment is still allowed with a warning.
    </p>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: ValidationPanel
────────────────────────────────────────────────────────────────────────────── */
function ValidationPanel({ formComplete, missingFields, validating, validationResult }) {
  if (!formComplete) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Complete the form to validate
          </h4>
        </div>
        <ul className="space-y-1 ml-6">
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
      <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
            Assignment Valid — ready to create
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
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Warnings (assignment still allowed):
            </p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400 ml-5">• {w.message}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
          Cannot create this assignment
        </h4>
      </div>

      <div className="space-y-2">
        {errors.map((err, i) => (
          <ErrorItem key={i} error={err} />
        ))}
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

/* ──────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: ErrorItem
────────────────────────────────────────────────────────────────────────────── */
function ErrorItem({ error }) {
  const messages = {
    workload_exceeded: {
      title: 'Teacher is overloaded',
      hint:  'Reduce the weekly periods, or choose a different teacher with more capacity.',
    },
    specialization_mismatch: {
      title: 'Subject outside teacher\'s specialization',
      hint:  'This teacher\'s specialization does not match this subject\'s category.',
    },
    insufficient_periods: {
      title: 'Not enough timetable slots',
      hint:  'The teacher\'s timetable doesn\'t have enough free periods.',
    },
    api_error: {
      title: 'Validation service unavailable',
      hint:  'Could not connect to the server. Check your connection and try again.',
    },
    level_mismatch: {   // NEW
      title: "Teacher not qualified for this level",
      hint: "This teacher's teaching levels don't include the level required by this subject.",
    },
    pathway_mismatch: { // NEW
      title: "Teacher not qualified for this pathway",
      hint: "This teacher's teaching pathways don't include the pathway required by this subject.",
    },
  };

  const known = messages[error.type];

  return (
    <div className="flex items-start gap-2 text-sm">
      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-red-800 dark:text-red-200">
          {known?.title || error.message}
        </p>
        {known && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{known.hint}</p>
        )}
        {known && error.message && (
          <p className="text-xs text-red-500/70 dark:text-red-500/60 mt-0.5 italic">{error.message}</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: AssignmentCard  — with inline edit panel
────────────────────────────────────────────────────────────────────────────── */
function AssignmentCard({ assignment, hasStreams, onDelete }) {
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [editData, setEditData]     = useState({
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

  // ── Cancel edit — restore original values ─────────────────────────────────
  const handleCancel = () => {
    setEditData({
      weekly_periods:  assignment.weekly_periods  ?? 5,
      assignment_type: assignment.assignment_type ?? 'main_teacher',
    });
    setIsEditing(false);
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
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

      // Mutate the assignment in-place so the card reflects the new values
      // without needing a full refetch — parent will refetch on next open anyway
      assignment.weekly_periods  = periods;
      assignment.assignment_type = editData.assignment_type;

      toast.success('Assignment updated successfully.');
      setIsEditing(false);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update assignment.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">

      {/* ── Top row: name + location + action buttons ── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">{teacherName}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{location}</p>
        </div>

        {/* Buttons — show different sets depending on editing state */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {isEditing ? (
            <>
              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                title="Save changes"
                className="p-1.5 text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1"
              >
                {saving
                  ? <Loader className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
              </button>
              {/* Cancel */}
              <button
                onClick={handleCancel}
                disabled={saving}
                title="Cancel"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              {/* Edit */}
              <button
                onClick={() => setIsEditing(true)}
                title="Edit assignment"
                className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {/* Delete */}
              <button
                onClick={() => onDelete(assignment.id)}
                title="Delete assignment"
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── View mode: summary row ── */}
      {!isEditing && (
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Periods/week: </span>
            <span className="font-semibold text-slate-900 dark:text-white">{assignment.weekly_periods}</span>
          </div>
          <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full">
            {typeLabel(assignment.assignment_type)}
          </span>
        </div>
      )}

      {/* ── Edit mode: inline form ── */}
      {isEditing && (
        <div className="mt-2 space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Edit Assignment
          </p>

          {/* Weekly Periods */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Weekly Periods
            </label>
            <div className="relative">
              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min="1"
                max="40"
                value={editData.weekly_periods}
                onChange={e => setEditData(prev => ({ ...prev, weekly_periods: e.target.value }))}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Assignment Type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Assignment Type
            </label>
            <select
              value={editData.assignment_type}
              onChange={e => setEditData(prev => ({ ...prev, assignment_type: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="main_teacher">Main Teacher</option>
              <option value="assistant_teacher">Assistant Teacher</option>
              <option value="substitute">Substitute</option>
            </select>
          </div>

          {/* Inline save/cancel buttons (also available at top-right) */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-3 py-1.5 bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {saving ? (
                <><Loader className="w-3 h-3 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-3 h-3" /> Save Changes</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Outside-specialisation warning badge ── */}
      {assignment.is_outside_specialization && (
        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          Outside specialization
        </div>
      )}
    </div>
  );
}

export default ManageAssignments;
import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  User, 
  School, 
  Layers, 
  Clock, 
  Calendar,
  Book,
  GraduationCap,
  UserCheck,
  Trash2,
  Loader,
  AlertCircle
} from 'lucide-react';

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
  
  // Event handlers
  onAcademicYearChange,
  onTeacherSelection,
  onAssignmentInputChange,
  onCreateAssignment,
  onDeleteAssignment
}) {
  const ASSIGNMENT_TYPES = [
    { value: 'main_teacher', label: 'Main Teacher' },
    { value: 'assistant_teacher', label: 'Assistant Teacher' },
    { value: 'substitute', label: 'Substitute' }
  ];

  const getCurriculumBadgeColor = (type) => {
    return type === 'CBC' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : type === '8-4-4'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-300';
  };

  if (!isOpen) return null;

  // Function to get teacher name from assignment
  const getTeacherName = (assignment) => {
    if (assignment.teacher?.user?.full_name) return assignment.teacher.user.full_name;
    if (assignment.teacher?.user?.name) return assignment.teacher.user.name;
    if (assignment.teacher?.full_name) return assignment.teacher.full_name;
    return 'Unknown';
  };

  // Function to get classroom/stream name
  const getClassroomOrStreamName = (assignment) => {
    if (hasStreams) {
      // For schools with streams
      if (assignment.stream?.classroom?.class_name && assignment.stream?.name) {
        return `${assignment.stream.classroom.class_name} - ${assignment.stream.name}`;
      }
      if (assignment.stream?.classroom?.class_name) {
        return assignment.stream.classroom.class_name;
      }
      if (assignment.stream?.name) {
        return assignment.stream.name;
      }
      return 'Unknown';
    } else {
      // For schools without streams
      if (assignment.classroom?.class_name) {
        return assignment.classroom.class_name;
      }
      if (assignment.classroom_id) {
        return `Classroom ${assignment.classroom_id}`;
      }
      return 'Unknown';
    }
  };

  // Function to get academic year display
  const getAcademicYearDisplay = (assignment) => {
    if (assignment.academic_year) {
      return `${assignment.academic_year.year} (${assignment.academic_year.term})`;
    }
    if (assignment.academic_year_id) {
      return `Year ${assignment.academic_year_id}`;
    }
    return 'Unknown';
  };

  // Function to get curriculum type from assignment
  const getCurriculumType = (assignment) => {
    if (assignment.subject?.curriculum_type) {
      return assignment.subject.curriculum_type;
    }
    if (assignment.academic_year?.curriculum_type) {
      return assignment.academic_year.curriculum_type;
    }
    return 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Manage Assignments
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Subject: <span className="font-medium">{selectedSubject?.name}</span> ({selectedSubject?.code})
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                School Type:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                hasStreams 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {hasStreams ? 'Streams Enabled' : 'Direct Classroom Assignment'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create New Assignment Form */}
        <form onSubmit={onCreateAssignment} className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
            Create New Assignment
          </h4>
          
          <div className="space-y-6">
            {/* Academic Year Selection */}
            <div>
              <label htmlFor="academic_year_select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Academic Year *
              </label>
              <div className="relative">
                <select
                  id="academic_year_select"
                  value={assignmentFormData.academic_year_id || ''}
                  onChange={onAcademicYearChange}
                  required
                  className="w-full px-4 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">Select academic year</option>
                  {academicYears.map(year => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                      {year.is_current && ' (Current)'}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {/* Selected Academic Year Info */}
              {selectedAcademicYearInfo && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Selected:</p>
                      <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {selectedAcademicYearInfo.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(selectedAcademicYearInfo.curriculum_type)}`}>
                          {selectedAcademicYearInfo.curriculum_type}
                        </span>
                        {selectedAcademicYearInfo.is_current && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                    <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              )}
              
              {academicYears.length === 0 && (
                <div className="mt-3 text-center py-3 text-slate-500 dark:text-slate-400 text-sm">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No academic years found. Please create an academic year first.</p>
                </div>
              )}
            </div>

            {/* Teacher Selection Section */}
            <div>
              <label htmlFor="teacher_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Teacher *
              </label>
              <div className="space-y-3">
                <select
                  id="teacher_id"
                  name="teacher_id"
                  value={assignmentFormData.teacher_id}
                  onChange={onTeacherSelection}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                >
                  <option value="">Select teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {/* FIX: Display curriculum_specialization instead of specialization */}
                      {teacher.curriculum_specialization && teacher.curriculum_specialization !== 'N/A' && ` - ${teacher.curriculum_specialization}`}
                      {teacher.is_class_teacher && ' (Class Teacher)'}
                    </option>
                  ))}
                </select>
                
                {/* Teacher Assignment Info */}
                {selectedTeacher && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900 dark:text-white">{selectedTeacher.name}</h5>
                        <div className="mt-2 space-y-1">
                          {/* FIX: Show curriculum_specialization first, then specialization */}
                          {selectedTeacher.curriculum_specialization && selectedTeacher.curriculum_specialization !== 'N/A' && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-medium">Curriculum:</span> {selectedTeacher.curriculum_specialization}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Specialization:</span> {selectedTeacher.specialization || 'N/A'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Status:</span> {selectedTeacher.is_class_teacher ? 'Class Teacher' : 'Regular Teacher'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Classroom/Stream Selection Section */}
            {selectedTeacher && (
              <div>
                <label htmlFor={hasStreams ? "stream_id" : "classroom_id"} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  {hasStreams ? <Layers className="w-4 h-4" /> : <School className="w-4 h-4" />}
                  {hasStreams ? 'Select Stream/Class *' : 'Select Classroom *'}
                </label>
                
                {hasStreams ? (
                  // Streams selection for schools with streams
                  <div className="space-y-2">
                    <select
                      id="stream_id"
                      name="stream_id"
                      value={assignmentFormData.stream_id}
                      onChange={onAssignmentInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                    >
                      <option value="">Select stream</option>
                      {teacherStreams.map(stream => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name}
                          {stream.is_class_teacher && ' (Class Teacher)'}
                        </option>
                      ))}
                    </select>
                    
                    {/* Streams Info */}
                    {teacherStreams.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Teacher is assigned to {teacherStreams.length} stream(s):
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teacherStreams.map(stream => (
                            <span 
                              key={stream.id} 
                              className={`px-3 py-1.5 text-xs rounded-lg ${
                                stream.is_class_teacher
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                              }`}
                            >
                              {stream.name}
                              {stream.is_class_teacher && ' (Class Teacher)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Classrooms selection for schools without streams
                  <div className="space-y-2">
                    <select
                      id="classroom_id"
                      name="classroom_id"
                      value={assignmentFormData.classroom_id || ''}
                      onChange={onAssignmentInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                    >
                      <option value="">Select classroom</option>
                      {teacherClassrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                          {classroom.is_class_teacher && ' (Class Teacher)'}
                        </option>
                      ))}
                    </select>
                    
                    {/* Classrooms Info */}
                    {teacherClassrooms.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Teacher is assigned to {teacherClassrooms.length} classroom(s):
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teacherClassrooms.map(classroom => (
                            <span 
                              key={classroom.id} 
                              className={`px-3 py-1.5 text-xs rounded-lg ${
                                classroom.is_class_teacher
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                              }`}
                            >
                              {classroom.name}
                              {classroom.is_class_teacher && ' (Class Teacher)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Weekly Periods and Assignment Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="weekly_periods" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Weekly Sessions *
                </label>
                <div className="relative">
                  <input
                    id="weekly_periods"
                    name="weekly_periods"
                    type="number"
                    value={assignmentFormData.weekly_periods}
                    onChange={onAssignmentInputChange}
                    min="1"
                    max="40"
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm pr-10"
                    placeholder="e.g., 5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-slate-500 dark:text-slate-400">times/week</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Number of times this subject is taught per week
                </p>
              </div>
              
              <div>
                <label htmlFor="assignment_type" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assignment Type *
                </label>
                <select
                  id="assignment_type"
                  name="assignment_type"
                  value={assignmentFormData.assignment_type}
                  onChange={onAssignmentInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
                >
                  {ASSIGNMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !assignmentFormData.academic_year_id}
                className="w-full px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Assignment...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Existing Assignments List */}
        <div className="p-6 bg-white dark:bg-slate-800/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Existing Assignments ({assignments.length})
          </h4>
          
          {loading && assignments.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map(assignment => {
                const teacherName = getTeacherName(assignment);
                const classroomOrStreamName = getClassroomOrStreamName(assignment);
                const academicYearDisplay = getAcademicYearDisplay(assignment);
                const curriculumType = getCurriculumType(assignment);
                
                return (
                  <div
                    key={assignment.id}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Teacher Info */}
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Teacher</p>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {teacherName}
                                </p>
                                {assignment.teacher?.specialization && (
                                  <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {assignment.teacher.specialization}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Classroom/Stream Info */}
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {hasStreams ? 'Stream/Class' : 'Classroom'}
                            </p>
                            <div className="flex items-center gap-2">
                              {hasStreams ? (
                                <Layers className="w-4 h-4 text-green-500" />
                              ) : (
                                <School className="w-4 h-4 text-green-500" />
                              )}
                              <p className="font-medium text-slate-900 dark:text-white">
                                {classroomOrStreamName}
                              </p>
                            </div>
                          </div>
                          
                          {/* Academic Year Info */}
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Academic Year</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-500" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {academicYearDisplay}
                                </p>
                                {curriculumType && curriculumType !== 'Unknown' && (
                                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(curriculumType)}`}>
                                    {curriculumType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Assignment Details */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {assignment.weekly_periods || 0} times/week
                              </span>
                            </div>
                            
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              assignment.assignment_type === 'main_teacher'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : assignment.assignment_type === 'assistant_teacher'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {ASSIGNMENT_TYPES.find(t => t.value === assignment.assignment_type)?.label || 'Unknown'}
                            </span>
                            
                            {assignment.created_at && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Created: {new Date(assignment.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => onDeleteAssignment(assignment.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium mb-1">No assignments found</p>
                <p className="text-xs">Create your first assignment using the form above</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageAssignments;
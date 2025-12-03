// src/Dashboard/Pages/Admin/SubjectManager.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  BookOpen,
  Plus, 
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Calendar,
  GraduationCap,
  Award,
  Clock,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from "react-toastify";

function SubjectManager() {
  const { schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCoreStatus, setFilterCoreStatus] = useState('all');
  const [school, setSchool] = useState(null);
  const [hasStreams, setHasStreams] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    subjectId: null,
    subjectName: ''
  });

  // Delete assignment modal state
  const [deleteAssignmentModal, setDeleteAssignmentModal] = useState({
    isOpen: false,
    assignmentId: null,
    assignmentInfo: ''
  });

  // Mobile-specific states
  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    subject: null
  });

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    curriculum_type: '',
    grade_level: '',
    category: '',
    is_core: false,
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    teacher_id: '',
    stream_id: '',
    academic_year_id: '',
    weekly_periods: 5,
    assignment_type: 'main_teacher',
  });

  // --- Constants ---
  const CURRICULUM_TYPES = ['CBC', '8-4-4'];
  const CBC_GRADE_LEVELS = [
    'Grade 1-3 (Lower Primary)',
    'Grade 4-6 (Upper Primary)',
    'Grade 7-9 (Junior Secondary)'
  ];
  const LEGACY_GRADE_LEVELS = [
    'Standard 1-4',
    'Standard 5-8',
    'Form 1-4'
  ];
  const CATEGORIES = [
    'Languages',
    'Mathematics',
    'Sciences',
    'Humanities',
    'Technical',
    'Creative Arts',
    'Physical Ed'
  ];
  const ASSIGNMENT_TYPES = [
    { value: 'main_teacher', label: 'Main Teacher' },
    { value: 'assistant_teacher', label: 'Assistant Teacher' },
    { value: 'substitute', label: 'Substitute' }
  ];

  // --- Data Fetching ---
  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools', 'GET');
      const schoolData = response.data || response;
      setSchool(schoolData);
      setHasStreams(schoolData?.has_streams || false);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        apiRequest(`subjects`, 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest(`academic-years`, 'GET')
      ];
      
      if (hasStreams) {
        requests.push(apiRequest(`streams`, 'GET'));
      }
      
      const responses = await Promise.all(requests);
      
      setSubjects(Array.isArray(responses[0]) ? responses[0] : (responses[0]?.data || []));
      setTeachers(Array.isArray(responses[1]) ? responses[1] : (responses[1]?.teachers || []));
      setAcademicYears(Array.isArray(responses[2]) ? responses[2] : (responses[2]?.data || []));
      
      if (hasStreams && responses[3]) {
        const streamsResponse = responses[3];
        setStreams(Array.isArray(streamsResponse) ? streamsResponse : (streamsResponse?.data || []));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, hasStreams]);

  useEffect(() => {
    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId, fetchSchoolInfo]);

  useEffect(() => {
    if (school !== null) {
      fetchInitialData();
    }
  }, [school, fetchInitialData]);

  // Apply filters
  useEffect(() => {
    let filtered = [...subjects];
    
    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCurriculum !== 'all') {
      filtered = filtered.filter(subject => subject.curriculum_type === filterCurriculum);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(subject => subject.category === filterCategory);
    }
    
    if (filterCoreStatus !== 'all') {
      filtered = filtered.filter(subject => 
        (filterCoreStatus === 'core' && subject.is_core) ||
        (filterCoreStatus === 'elective' && !subject.is_core)
      );
    }
    
    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, filterCurriculum, filterCategory, filterCoreStatus]);

  const fetchAssignments = async (subjectId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`subject-assignments?subject_id=${subjectId}`, 'GET');
      setAssignments(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      toast.error('Could not fetch assignments for this subject.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedSubject(null);
    
    let defaultCurriculum = '';
    if (school) {
      if (school.primary_curriculum === 'CBC') {
        defaultCurriculum = 'CBC';
      } else if (school.primary_curriculum === '8-4-4') {
        defaultCurriculum = '8-4-4';
      }
    }
    
    setFormData({
      name: '',
      code: '',
      curriculum_type: defaultCurriculum,
      grade_level: '',
      category: '',
      is_core: false,
    });
  };

  const showEditForm = (subject) => {
    setView('edit');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      curriculum_type: subject.curriculum_type,
      grade_level: subject.grade_level,
      category: subject.category,
      is_core: subject.is_core,
    });
  };

  const showManageAssignmentsView = async (subject) => {
    setView('manage-assignments');
    setSelectedSubject(subject);
    await fetchAssignments(subject.id);
    setAssignmentFormData({
      teacher_id: '',
      stream_id: '',
      academic_year_id: academicYears.find(ay => ay.is_current)?.id || '',
      weekly_periods: 5,
      assignment_type: 'main_teacher',
    });
  };

  const backToList = () => {
    setView('list');
    setSelectedSubject(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, school_id: schoolId };
      
      if (view === 'edit') {
        await apiRequest(`subjects/${selectedSubject.id}`, 'PUT', payload);
        toast.success('Subject updated successfully');
      } else {
        await apiRequest('subjects', 'POST', payload);
        toast.success('Subject created successfully');
      }
      
      backToList();
    } catch (error) {
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} subject.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    const subjectToDelete = subjects.find(subject => subject.id === id);
    if (subjectToDelete) {
      if (mobileSheet.isOpen) {
        closeMobileSheet();
      }
      setDeleteModal({
        isOpen: true,
        subjectId: id,
        subjectName: `${subjectToDelete.name} (${subjectToDelete.code})`
      });
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`subjects/${deleteModal.subjectId}`, 'DELETE');
      toast.success('Subject deleted successfully');
      setDeleteModal({ isOpen: false, subjectId: null, subjectName: '' });
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete subject';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('subject-assignments', 'POST', {
        ...assignmentFormData,
        subject_id: selectedSubject.id,
      });
      toast.success('Assignment created successfully');
      await fetchAssignments(selectedSubject.id);
      setAssignmentFormData({
        teacher_id: '',
        stream_id: '',
        academic_year_id: academicYears.find(ay => ay.is_current)?.id || '',
        weekly_periods: 5,
        assignment_type: 'main_teacher',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = (assignmentId) => {
    const assignmentToDelete = assignments.find(a => a.id === assignmentId);
    if (assignmentToDelete) {
      setDeleteAssignmentModal({
        isOpen: true,
        assignmentId: assignmentId,
        assignmentInfo: `${assignmentToDelete.teacher?.user?.name || 'Unknown Teacher'} - ${selectedSubject?.name}`
      });
    }
  };

  const confirmDeleteAssignment = async () => {
    setLoading(true);
    try {
      await apiRequest(`subject-assignments/${deleteAssignmentModal.assignmentId}`, 'DELETE');
      toast.success('Assignment deleted successfully');
      setDeleteAssignmentModal({ isOpen: false, assignmentId: null, assignmentInfo: '' });
      await fetchAssignments(selectedSubject.id);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete assignment';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mobile bottom sheet handlers
  const openMobileSheet = (subject) => {
    setMobileSheet({ isOpen: true, subject });
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, subject: null });
    document.body.style.overflow = '';
  };

  // Helper functions
  const getCurriculumBadgeColor = (type) => {
    return type === 'CBC' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      'Languages': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      'Mathematics': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
      'Sciences': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      'Humanities': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
      'Technical': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      'Creative Arts': 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
      'Physical Ed': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
  };

  // Render Delete Confirmation Modal
  const renderDeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transform transition-all duration-200 scale-100">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Subject
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.subjectName}"</span>?
                  This action cannot be undone and will remove all associated data.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">
                  <strong>Warning:</strong> This will permanently delete all data associated with this subject including assignments, grading information, and scheduling.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteModal({ isOpen: false, subjectId: null, subjectName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Subject
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Subject
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Assignment Delete Confirmation Modal
  const renderDeleteAssignmentModal = () => {
    if (!deleteAssignmentModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transform transition-all duration-200 scale-100">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Assignment
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete this assignment?
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">
                  <strong>Warning:</strong> This will remove this teacher's assignment to teach this subject. Any related scheduling will be affected.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteAssignmentModal({ isOpen: false, assignmentId: null, assignmentInfo: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Assignment
            </button>
            <button
              onClick={confirmDeleteAssignment}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Assignment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Mobile Bottom Sheet
  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.subject) return null;
    const subject = mobileSheet.subject;
    
    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-2xl md:hidden transition-transform duration-300 ease-out"
          style={{ maxHeight: '85vh' }}
        >
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {subject.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {subject.code}
                </p>
              </div>
              <button
                onClick={closeMobileSheet}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Subject Information
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {subject.name}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(subject.curriculum_type)}`}>
                    {subject.curriculum_type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Code: <span className="font-semibold text-slate-900 dark:text-white">{subject.code}</span>
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Subject Details
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Grade Level</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {subject.grade_level}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>
                    {subject.category}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                {subject.is_core ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                )}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Subject Type
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {subject.is_core ? (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Core Subject
                  </span>
                ) : (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Elective Subject
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => {
                closeMobileSheet();
                showEditForm(subject);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Subject
            </button>
            <button
              onClick={() => {
                closeMobileSheet();
                showManageAssignmentsView(subject);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-[0.98] transition-all"
            >
              <Users className="w-4 h-4" />
              Manage Assignments
            </button>
            <button
              onClick={() => handleDelete(subject.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Subject
            </button>
          </div>
        </div>
      </>
    );
  };

  // Get unique categories from subjects
  const availableCategories = [...new Set(subjects.map(s => s.category))].filter(Boolean);

  // --- Render Functions ---
  const renderListView = () => (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Subject Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage subjects, create assignments, and oversee curriculum.
          </p>
          {school && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                School Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                school.primary_curriculum === 'Both' 
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-300'
                  : getCurriculumBadgeColor(school.primary_curriculum)
              }`}>
                {school.primary_curriculum}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                Streams:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                hasStreams 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
              }`}>
                {hasStreams ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={fetchInitialData}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={showCreateForm} 
            disabled={!school}
            className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            New Subject
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
          {/* Mobile: Collapsible Filters */}
          <div className="block md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Filters
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({filteredSubjects.length}/{subjects.length})
                </span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            {showFilters && (
              <div className="space-y-3">
                {/* Search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search subjects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Curriculum
                    </label>
                    <select
                      value={filterCurriculum}
                      onChange={(e) => setFilterCurriculum(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Curriculums</option>
                      <option value="CBC">CBC</option>
                      <option value="8-4-4">8-4-4</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Type
                  </label>
                  <select
                    value={filterCoreStatus}
                    onChange={(e) => setFilterCoreStatus(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Core & Elective</option>
                    <option value="core">Core Only</option>
                    <option value="elective">Elective Only</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop: Always Visible Filters */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex flex-col gap-1 sm:gap-2 sm:col-span-2 lg:col-span-1"> 
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Curriculum Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Curriculum
                </label>
                <select
                  value={filterCurriculum}
                  onChange={(e) => setFilterCurriculum(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Curriculums</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                </select>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Type Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={filterCoreStatus}
                  onChange={(e) => setFilterCoreStatus(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Core & Elective</option>
                  <option value="core">Core Only</option>
                  <option value="elective">Elective Only</option>
                </select>
              </div>
              
              {/* Results Count */}
              <div className="flex items-end lg:col-span-1">
                <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{filteredSubjects.length}</span> of <span className="font-semibold">{subjects.length}</span> subjects
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading subjects...</p>
        </div>
      )}

      {/* Table Section - Desktop and Tablet */}
      {!loading && (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
              Subjects
            </h2>
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700 min-w-[700px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Subject</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Code</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Curriculum</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Grade Level</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Category</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Type</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Assignments</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject) => (
                        <tr 
                          key={subject.id} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                        >
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                              <span className="font-medium text-slate-900 dark:text-white">{subject.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{subject.code}</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(subject.curriculum_type)}`}>
                              {subject.curriculum_type}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-600 dark:text-slate-400 text-xs">{subject.grade_level}</td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>
                              {subject.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className={`flex items-center gap-1 text-xs ${
                              subject.is_core 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-orange-600 dark:text-orange-400'
                            }`}>
                              <Award className="w-3 h-3" />
                              {subject.is_core ? 'Core' : 'Elective'}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <button 
                              onClick={() => showManageAssignmentsView(subject)} 
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Manage</span>
                            </button>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => showEditForm(subject)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label={`Edit ${subject.name}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(subject.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label={`Delete ${subject.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                          {searchTerm || filterCurriculum !== 'all' || filterCategory !== 'all' || filterCoreStatus !== 'all'
                            ? 'No subjects match your filters.'
                            : 'No subjects found. Create your first subject to get started.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card View with Bottom Sheet */}
          <div className="md:hidden space-y-3">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => openMobileSheet(subject)}
                  className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {subject.code}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Curriculum</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(subject.curriculum_type)}`}>
                        {subject.curriculum_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Type</span>
                      {subject.is_core ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Core</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-orange-400 dark:text-orange-300" />
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Elective</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Category</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>
                        {subject.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {searchTerm || filterCurriculum !== 'all' || filterCategory !== 'all' || filterCoreStatus !== 'all'
                    ? 'No subjects match your filters.'
                    : 'No subjects found. Create one to get started.'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  const renderFormView = () => {
    const gradeLevels = formData.curriculum_type === 'CBC' ? CBC_GRADE_LEVELS : LEGACY_GRADE_LEVELS;
    const isCurriculumFixed = school && school.primary_curriculum !== 'Both';
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 transform transition-all duration-200 scale-100">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {view === 'edit' ? 'Edit Subject' : 'Create New Subject'}
                </h3>
                {school && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      School Primary Curriculum:
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      school.primary_curriculum === 'Both' 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-300'
                        : getCurriculumBadgeColor(school.primary_curriculum)
                    }`}>
                      {school.primary_curriculum}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={backToList} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject Name *
                </label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject Code *
                </label>
                <input 
                  type="text" 
                  id="code"
                  name="code" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., G7-MAT"
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
            </div>

            {/* Curriculum Type Section - Mirrored from Academic Year Setup */}
            <div className="space-y-2">
              <label htmlFor="curriculum_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Curriculum Type *
              </label>
              <div className="relative">
                <select
                  id="curriculum_type"
                  name="curriculum_type"
                  value={formData.curriculum_type}
                  onChange={handleInputChange}
                  required
                  disabled={isCurriculumFixed}
                  className={`w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                    isCurriculumFixed ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                  }`}
                >
                  {isCurriculumFixed ? (
                    <option value={school.primary_curriculum}>{school.primary_curriculum}</option>
                  ) : (
                    <>
                      <option value="">Select curriculum</option>
                      {CURRICULUM_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              {isCurriculumFixed && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Curriculum type is fixed based on your school's primary curriculum.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category *
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="grade_level" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Grade Level *
                </label>
                <div className="relative">
                  <select
                    id="grade_level"
                    name="grade_level"
                    value={formData.grade_level}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.curriculum_type}
                    className={`w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                      !formData.curriculum_type ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select grade level</option>
                    {gradeLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                {!formData.curriculum_type && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select curriculum type first to see available grade levels.
                  </p>
                )}
              </div>
            </div>

            {/* Core Subject Checkbox - Mirrored from Academic Year Setup */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="is_core"
                    name="is_core"
                    checked={formData.is_core}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-slate-400 dark:group-hover:border-slate-500 transition-all">
                    {formData.is_core && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">
                  Core/Compulsory Subject
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={backToList} 
                className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] flex items-center justify-center"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  view === 'edit' ? 'Update Subject' : 'Create Subject'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderManageAssignmentsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              School: <span className="font-medium">{hasStreams ? 'Streams Enabled' : 'Direct Teacher Assignment'}</span>
            </p>
          </div>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Create New Assignment Form */}
        <form onSubmit={handleCreateAssignment} className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New Assignment</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="teacher_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teacher *</label>
              <select
                id="teacher_id"
                name="teacher_id"
                value={assignmentFormData.teacher_id}
                onChange={handleAssignmentInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.name} - {teacher.curriculum_specialization}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Conditional rendering based on whether school has streams */}
            {hasStreams ? (
              <div>
                <label htmlFor="stream_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Stream/Class *</label>
                <select
                  id="stream_id"
                  name="stream_id"
                  value={assignmentFormData.stream_id}
                  onChange={handleAssignmentInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select stream</option>
                  {streams.map(stream => (
                    <option key={stream.id} value={stream.id}>
                      {stream.classroom?.name} - {stream.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="classroom_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Classroom *</label>
                <select
                  id="classroom_id"
                  name="classroom_id"
                  value={assignmentFormData.classroom_id || ''}
                  onChange={handleAssignmentInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select classroom</option>
                  {streams.length > 0 && streams[0].classroom ? (
                    [...new Set(streams.map(s => s.classroom))].map(classroom => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No classrooms available</option>
                  )}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="academic_year_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Academic Year *</label>
              <select
                id="academic_year_id"
                name="academic_year_id"
                value={assignmentFormData.academic_year_id}
                onChange={handleAssignmentInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select year</option>
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.name} {year.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="weekly_periods" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Weekly Periods *</label>
              <input
                id="weekly_periods"
                type="number"
                name="weekly_periods"
                value={assignmentFormData.weekly_periods}
                onChange={handleAssignmentInputChange}
                min="1"
                max="40"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="assignment_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assignment Type *</label>
              <select
                id="assignment_type"
                name="assignment_type"
                value={assignmentFormData.assignment_type}
                onChange={handleAssignmentInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                {ASSIGNMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Existing Assignments List */}
        <div className="p-6 bg-white dark:bg-slate-800/50">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Existing Assignments ({assignments.length})
          </h4>
          {loading && assignments.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : assignments.length > 0 ? (
            <div className="space-y-3">
              {assignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Teacher</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        {assignment.teacher?.user?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {hasStreams ? 'Stream' : 'Classroom'}
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {hasStreams 
                          ? `${assignment.stream?.classroom?.name} - ${assignment.stream?.name}`
                          : assignment.classroom?.name || 'Unknown'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Academic Year</p>
                      <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        {assignment.academic_year?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Details</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-4 h-4" />
                          {assignment.weekly_periods}h/week
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          assignment.assignment_type === 'main_teacher'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : assignment.assignment_type === 'assistant_teacher'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {ASSIGNMENT_TYPES.find(t => t.value === assignment.assignment_type)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="ml-4 p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No assignments yet. Create one above to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- Main Render ---
  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Subjects...</p>
        </div>
      )}
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-assignments' && renderManageAssignmentsView()}
      
      {/* Modals */}
      {renderDeleteConfirmationModal()}
      {renderDeleteAssignmentModal()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default SubjectManager;
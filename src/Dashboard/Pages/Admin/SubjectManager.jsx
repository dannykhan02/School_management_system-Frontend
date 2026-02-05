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
  CheckCircle,
  School,
  Building,
  User,
  Bookmark,
  Layers,
  UserCheck,
  Book
} from 'lucide-react';
import { toast } from "react-toastify";
import ManageAssignments from '../../../components/ManageAssignments';

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
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCoreStatus, setFilterCoreStatus] = useState('all');
  const [school, setSchool] = useState(null);
  const [hasStreams, setHasStreams] = useState(false);
  const [schoolLevels, setSchoolLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [gradeLevels, setGradeLevels] = useState([]);
  
  // Academic year state
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [selectedAcademicYearInfo, setSelectedAcademicYearInfo] = useState(null);
  
  // Teacher and classroom/stream selection state
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherClassrooms, setTeacherClassrooms] = useState([]);
  const [teacherStreams, setTeacherStreams] = useState([]);
  
  // Constants from API
  const [constants, setConstants] = useState({
    curriculum_types: [],
    educational_levels: [],
    cbc_grade_levels: [],
    legacy_grade_levels: [],
    senior_secondary_pathways: [],
    categories: []
  });
  const [constantsLoading, setConstantsLoading] = useState(true);
  
  // Subject search state
  const [subjectSearchResults, setSubjectSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [subjectExists, setSubjectExists] = useState(false);
  
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
    category: '',
    is_core: false,
  });

  const [assignmentFormData, setAssignmentFormData] = useState({
    teacher_id: '',
    classroom_id: '',
    stream_id: '',
    academic_year_id: '',
    term_id: '',
    weekly_periods: 5,
    assignment_type: 'main_teacher',
  });

  // --- Data Fetching ---
  const fetchConstants = useCallback(async () => {
    try {
      const response = await apiRequest('subjects/constants', 'GET');
      setConstants(response.data || {});
    } catch (error) {
      console.error('Failed to fetch constants:', error);
      toast.error('Failed to fetch constants');
    } finally {
      setConstantsLoading(false);
    }
  }, []);

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET'); // ✅ Fixed endpoint
      const schoolData = response.data || response;
      setSchool(schoolData);
      setHasStreams(schoolData?.has_streams || false);
      setGradeLevels(schoolData?.grade_levels || []);
      
      // Get school levels based on school configuration
      const levels = [];
      if (schoolData?.has_pre_primary) levels.push('Pre-Primary');
      if (schoolData?.has_primary) levels.push('Primary');
      if (schoolData?.has_junior_secondary) levels.push('Junior Secondary');
      if (schoolData?.has_senior_secondary) levels.push('Senior Secondary');
      if (schoolData?.has_secondary && !schoolData?.has_junior_secondary && !schoolData?.has_senior_secondary) {
        levels.push('Secondary');
      }
      setSchoolLevels(levels);
      
      setFiltersInitialized(true);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const response = await apiRequest('academic-years', 'GET');
      const years = Array.isArray(response) ? response : (response?.data || []);
      
      // Transform academic years to simple format
      const transformedYears = years.map(year => ({
        id: year.id,
        name: `${year.year} - ${year.term}`,
        year: year.year,
        term: year.term,
        is_current: year.is_current,
        curriculum_type: year.curriculum_type
      }));
      
      setAcademicYears(transformedYears);
      
      // Set current academic year if available
      const currentYear = transformedYears.find(year => year.is_current);
      if (currentYear) {
        setSelectedAcademicYear(currentYear.id);
        setSelectedAcademicYearInfo(currentYear);
        setAssignmentFormData(prev => ({
          ...prev,
          academic_year_id: currentYear.id,
          term_id: currentYear.term_id || ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      toast.error('Failed to fetch academic years');
    }
  }, []);

  const fetchTeachersWithAssignments = useCallback(async () => {
    try {
      // Use the new API endpoint to get teachers with their assignments
      const response = await apiRequest('teachers/with-assignments', 'GET');
      const teachersData = response.data || [];
      
      // Transform data for easier access - FIXED: Use curriculum_specialization from backend
      const transformedTeachers = teachersData.map(teacher => ({
        id: teacher.id,
        name: teacher.name || teacher.user?.name || 'N/A',
        email: teacher.email || teacher.user?.email || 'N/A',
        is_class_teacher: hasStreams 
          ? (teacher.class_teacher_streams?.length > 0)
          : (teacher.class_teacher_classrooms?.length > 0),
        // FIXED: Use curriculum_specialization from backend response
        curriculum_specialization: teacher.curriculum_specialization || 'N/A',
        // Add specialization field as well
        specialization: teacher.specialization || 'N/A',
        // Store assignments for later use
        assignments: teacher
      }));
      
      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Failed to fetch teachers with assignments:', error);
      toast.error('Failed to fetch teachers');
    }
  }, [hasStreams]);

  const fetchStreams = useCallback(async () => {
    try {
      const response = await apiRequest('streams', 'GET');
      const streamsData = Array.isArray(response) ? response : (response?.data || []);
      setStreams(streamsData);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      toast.error('Failed to fetch streams');
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        apiRequest('subjects', 'GET'),
        fetchTeachersWithAssignments(),
        fetchAcademicYears()
      ];
      
      if (hasStreams) {
        requests.push(fetchStreams());
      }
      
      await Promise.all(requests);
      
      // Fetch subjects separately
      const subjectsResponse = await apiRequest('subjects', 'GET');
      setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []));
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh page.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, hasStreams, fetchTeachersWithAssignments, fetchAcademicYears, fetchStreams]);

  // Search for subjects by name
  const searchSubjects = useCallback(async (name) => {
    if (name.length < 2) {
      setSubjectSearchResults([]);
      setShowSubjectSuggestions(false);
      setSubjectExists(false);
      return;
    }

    setSearchLoading(true);
    try {
      let url = `subjects/search?name=${encodeURIComponent(name)}`;
      
      // Include school's primary curriculum in search
      if (school?.primary_curriculum) {
        url += `&curriculum_type=${encodeURIComponent(school.primary_curriculum)}`;
      }
      
      const response = await apiRequest(url, 'GET');
      setSubjectSearchResults(response.data || []);
      setShowSubjectSuggestions(true);
      
      // Check if subject exists in database
      if (response.data && response.data.length > 0) {
        setSubjectExists(true);
      } else {
        setSubjectExists(false);
      }
    } catch (error) {
      console.error('Failed to search subjects:', error);
      toast.error('Failed to search subjects');
      setSubjectSearchResults([]);
      setShowSubjectSuggestions(false);
      setSubjectExists(false);
    } finally {
      setSearchLoading(false);
    }
  }, [school?.primary_curriculum]);

  // Auto-fill form data when a subject is selected
  const selectSubject = useCallback((subject) => {
    setFormData(prev => ({
      ...prev,
      name: subject.name,
      code: subject.codes[0] || '',
      category: subject.categories[0] || ''
    }));
    setShowSubjectSuggestions(false);
    setSubjectExists(true);
  }, []);

  // Handle teacher selection
  const handleTeacherSelection = (teacherId) => {
    setSelectedTeacher(teacherId);
    setAssignmentFormData(prev => ({ ...prev, teacher_id: teacherId }));
    
    // Clear previous classroom/stream selection
    setAssignmentFormData(prev => ({ 
      ...prev, 
      classroom_id: '',
      stream_id: ''
    }));
    
    // Find the selected teacher
    const teacher = teachers.find(t => t.id === parseInt(teacherId));
    if (teacher) {
      setSelectedTeacher(teacher);
      
      if (hasStreams) {
        // For schools with streams
        const classTeacherStreams = teacher.assignments?.class_teacher_streams || [];
        const teachingStreams = teacher.assignments?.teaching_streams || [];
        const allStreams = [...classTeacherStreams, ...teachingStreams];
        
        // Get unique streams
        const uniqueStreams = [];
        const seenStreams = new Set();
        allStreams.forEach(stream => {
          if (stream.stream_id && !seenStreams.has(stream.stream_id)) {
            seenStreams.add(stream.stream_id);
            uniqueStreams.push({
              id: stream.stream_id,
              name: stream.full_name,
              is_class_teacher: classTeacherStreams.some(s => s.stream_id === stream.stream_id)
            });
          }
        });
        
        setTeacherStreams(uniqueStreams);
        setTeacherClassrooms([]);
      } else {
        // For schools without streams
        const classrooms = teacher.assignments?.classrooms || [];
        setTeacherClassrooms(classrooms.map(cls => ({
          id: cls.classroom_id,
          name: cls.classroom_name,
          is_class_teacher: cls.is_class_teacher
        })));
        setTeacherStreams([]);
      }
    }
  };

  // Handle academic year change - SIMPLIFIED
  const handleAcademicYearChange = (yearId) => {
    const year = academicYears.find(ay => ay.id === yearId);
    setSelectedAcademicYear(yearId);
    setSelectedAcademicYearInfo(year);
    setAssignmentFormData(prev => ({
      ...prev,
      academic_year_id: yearId,
      term_id: year?.term_id || ''
    }));
  };

  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

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
    
    // Filter by school's curriculum
    if (school?.primary_curriculum) {
      filtered = filtered.filter(subject => subject.curriculum_type === school.primary_curriculum);
    }
    
    // Filter by school's levels
    if (schoolLevels && schoolLevels.length > 0) {
      filtered = filtered.filter(subject => 
        schoolLevels.includes(subject.level)
      );
    }
    
    // Filter by school's pathways (if applicable)
    if (school?.senior_secondary_pathways && school.senior_secondary_pathways.length > 0) {
      filtered = filtered.filter(subject => {
        if (subject.level === 'Senior Secondary') {
          return school.senior_secondary_pathways.includes(subject.pathway);
        }
        return true;
      });
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
  }, [subjects, searchTerm, filterCategory, filterCoreStatus, school, schoolLevels]);

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
    
    setFormData({
      name: '',
      code: '',
      category: '',
      is_core: false
    });
    setSubjectExists(false);
  };

  const showEditForm = (subject) => {
    setView('edit');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      is_core: subject.is_core
    });
  };

  const showManageAssignmentsView = async (subject) => {
    setView('manage-assignments');
    setSelectedSubject(subject);
    await fetchAssignments(subject.id);
    
    // Reset form state
    setSelectedTeacher(null);
    setTeacherClassrooms([]);
    setTeacherStreams([]);
    
    // Reset assignment form with current academic year
    const currentYear = academicYears.find(ay => ay.is_current);
    setSelectedAcademicYear(currentYear?.id || null);
    setSelectedAcademicYearInfo(currentYear || null);
    setAssignmentFormData({
      teacher_id: '',
      classroom_id: '',
      stream_id: '',
      academic_year_id: currentYear?.id || '',
      term_id: currentYear?.term_id || '',
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
    
    if (name === 'name') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
      searchSubjects(value);
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create payload with school's predetermined values
      const payload = { 
        ...formData, 
        school_id: schoolId,
        curriculum_type: school.primary_curriculum,
      };
      
      if (view === 'edit') {
        await apiRequest(`subjects/${selectedSubject.id}`, 'PUT', payload);
        toast.success('Subject updated successfully');
      } else {
        await apiRequest('subjects', 'POST', payload);
        toast.success('Subject created successfully');
      }
      
      backToList();
    } catch (error) {
      if (error.response?.status === 422) {
        const errorData = error.response.data;
        let errorMessage = 'Validation failed. Please check the form.';
        
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat();
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ');
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} subject.`);
      }
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
    
    if (!assignmentFormData.academic_year_id) {
      toast.error('Please select an academic year first');
      return;
    }
    
    if (!assignmentFormData.teacher_id) {
      toast.error('Please select a teacher');
      return;
    }
    
    if (hasStreams && !assignmentFormData.stream_id) {
      toast.error('Please select a stream');
      return;
    }
    
    if (!hasStreams && !assignmentFormData.classroom_id) {
      toast.error('Please select a classroom');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...assignmentFormData,
        subject_id: selectedSubject.id,
      };
      
      await apiRequest('subject-assignments', 'POST', payload);
      toast.success('Assignment created successfully');
      await fetchAssignments(selectedSubject.id);
      
      // Reset form but keep academic year
      setSelectedTeacher(null);
      setTeacherClassrooms([]);
      setTeacherStreams([]);
      setAssignmentFormData({
        teacher_id: '',
        classroom_id: '',
        stream_id: '',
        academic_year_id: assignmentFormData.academic_year_id,
        term_id: selectedAcademicYearInfo?.term_id || '',
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
      : type === '8-4-4'
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-300';
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

  const getPathwayBadgeColor = (pathway) => {
    const colors = {
      'STEM': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
      'Arts': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
      'Social Sciences': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
    };
    return colors[pathway] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
  };

  // Get unique classrooms from streams (for schools without streams)
  const getClassroomsFromStreams = () => {
    const classrooms = new Map();
    streams.forEach(stream => {
      if (stream.classroom && !classrooms.has(stream.classroom.id)) {
        classrooms.set(stream.classroom.id, {
          id: stream.classroom.id,
          name: stream.classroom.class_name
        });
      }
    });
    return Array.from(classrooms.values());
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
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
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
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>
                  {subject.category}
                </span>
              </div>
              {subject.pathway && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pathway</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPathwayBadgeColor(subject.pathway)}`}>
                    {subject.pathway}
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
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
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  School:
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                  {school.name}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Curriculum:
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>
                  {school.primary_curriculum}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Levels:
                </span>
                <div className="flex flex-wrap gap-1">
                  {schoolLevels.map((level, index) => (
                    <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {level}
                    </span>
                  ))}
                </div>
              </div>
              {school.senior_secondary_pathways && school.senior_secondary_pathways.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Pathways:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {school.senior_secondary_pathways.map((pathway, index) => (
                      <span key={index} className={`px-2 py-1 text-xs font-semibold rounded-full ${getPathwayBadgeColor(pathway)}`}>
                        {pathway}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {gradeLevels.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Grade Levels:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {gradeLevels.slice(0, 3).map((level, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {level}
                      </span>
                    ))}
                    {gradeLevels.length > 3 && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        +{gradeLevels.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {constants.categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
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
              </div>
            )}
          </div>
          
          {/* Desktop: Always Visible Filters */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              {filtersInitialized && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Auto-configured based on school settings
                </span>
              )}
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
                  {constants.categories.map(cat => (
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
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
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
                        <td colSpan="6" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                          {searchTerm || filterCategory !== 'all' || filterCoreStatus !== 'all'
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
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>
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
                  {searchTerm || filterCategory !== 'all' || filterCoreStatus !== 'all'
                    ? 'No subjects match your filters.'
                    : 'No subjects found. Create one to get started.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  const renderFormView = () => {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-2 sm:p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800/50 z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
              {view === 'edit' ? 'Edit Subject' : 'Create New Subject'}
            </h2>
            <button 
              onClick={backToList} 
              type="button"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Subject Name and Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              <div className="space-y-1 relative">
                <label htmlFor="name" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
                {/* Subject Suggestions Dropdown */}
                {showSubjectSuggestions && subjectSearchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {subjectSearchResults.map((subject, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                        onClick={() => selectSubject(subject)}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">{subject.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Code: {subject.codes[0]} | Category: {subject.categories[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Subject Exists Message - Only show when suggestions are not visible */}
                {subjectExists && !showSubjectSuggestions && (
                  <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Subject Already Exists
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          This subject is already in the database. No need to create it again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="code" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  id="code"
                  name="code" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., G7-MAT"
                  className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                />
              </div>
            </div>

            {/* Category and Core Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
              <div className="space-y-1">
                <label htmlFor="category" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all"
                  >
                    <option value="">Select category</option>
                    {constants.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              {/* Core Subject Checkbox - Properly aligned */}
              <div className="space-y-1 flex items-end pb-1">
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
                  <span className="text-sm font-medium text-[#0d141b] dark:text-slate-300 select-none">
                    Core/Compulsory Subject
                  </span>
                </label>
              </div>
            </div>

            {/* School Configuration Info Box */}
            {school && (
              <div className="bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-slate-200 dark:bg-slate-600/50 rounded-md flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#0d141b] dark:text-white mb-2">
                      Subject will be configured based on your school settings:
                    </h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
                        <span><strong className="font-semibold">Curriculum Type:</strong> {school.primary_curriculum}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
                        <span><strong className="font-semibold">Educational Levels:</strong> {schoolLevels.join(', ')}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
                        <span><strong className="font-semibold">Grade Levels:</strong> {gradeLevels.join(', ')}</span>
                      </li>
                      {school.senior_secondary_pathways && school.senior_secondary_pathways.length > 0 && (
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-400"></div>
                          <span><strong className="font-semibold">Pathways:</strong> {school.senior_secondary_pathways.join(', ')}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
              <button 
                type="button" 
                onClick={backToList} 
                className="px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all mt-2 sm:mt-0"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="px-4 py-2 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px] flex items-center justify-center"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  view === 'edit' ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
      
      {/* Use the new ManageAssignments component */}
      <ManageAssignments
        isOpen={view === 'manage-assignments'}
        onClose={backToList}
        selectedSubject={selectedSubject}
        hasStreams={hasStreams}
        academicYears={academicYears}
        teachers={teachers}
        assignments={assignments}
        loading={loading}
        assignmentFormData={assignmentFormData}
        selectedTeacher={selectedTeacher}
        teacherClassrooms={teacherClassrooms}
        teacherStreams={teacherStreams}
        selectedAcademicYearInfo={selectedAcademicYearInfo}
        
        // Event handlers
        onAcademicYearChange={(e) => handleAcademicYearChange(e.target.value)}
        onTeacherSelection={(e) => handleTeacherSelection(e.target.value)}
        onAssignmentInputChange={handleAssignmentInputChange}
        onCreateAssignment={handleCreateAssignment}
        onDeleteAssignment={handleDeleteAssignment}
      />
      
      {/* Modals */}
      {renderDeleteConfirmationModal()}
      {renderDeleteAssignmentModal()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default SubjectManager;
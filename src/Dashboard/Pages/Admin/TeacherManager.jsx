// src/Dashboard/Pages/Admin/TeacherManager.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  GraduationCap,
  Search,
  AlertCircle,
  Filter,
  BarChart3,
  RefreshCw,
  Building,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from 'lucide-react';
import { toast } from "react-toastify";
import TeacherForm from '../../../components/TeacherForm';
import WorkloadMeter from '../../../components/WorkloadMeter';

// Filter Panel Component
const FilterPanel = ({ filters, setFilters, curriculumOptions, specializationOptions, onClearFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters {Object.values(filters).some(v => v) && <span className="ml-2 px-2 py-1 bg-cyan-500 text-white rounded text-xs">Active</span>}
      </button>

      {showFilters && (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Curriculum Specialization
            </label>
            <select
              value={filters.curriculum_specialization}
              onChange={(e) => setFilters({ ...filters, curriculum_specialization: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Curricula</option>
              {curriculumOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Specialization
            </label>
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Specializations</option>
              {specializationOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Employment Type
            </label>
            <select
              value={filters.employment_type}
              onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Temporary">Temporary</option>
            </select>
          </div>

          <button
            onClick={onClearFilters}
            className="col-span-1 md:col-span-3 px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Teacher Statistics Component
const TeacherStatistics = ({ teachers, subjects, streams }) => {
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const teachersWithSubjects = teachers.filter(t => t.subjects && t.subjects.length > 0).length;
    const avgSubjectsPerTeacher = teachersWithSubjects > 0 
      ? (teachers.reduce((sum, t) => sum + (t.subjects?.length || 0), 0) / teachersWithSubjects).toFixed(1)
      : 0;

    const specializationCount = teachers.reduce((acc, teacher) => {
      const spec = teacher.specialization || 'General';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});

    const employmentStats = teachers.reduce((acc, teacher) => {
      const type = teacher.employment_type || 'Not specified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTeachers,
      teachersWithSubjects,
      avgSubjectsPerTeacher,
      specializationCount,
      employmentStats
    };
  }, [teachers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Teachers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalTeachers}</p>
          </div>
          <Users className="w-8 h-8 text-cyan-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Subject Coverage</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.teachersWithSubjects}</p>
          </div>
          <BookOpen className="w-8 h-8 text-green-500" />
        </div>
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          {stats.avgSubjectsPerTeacher} avg subjects
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Specializations</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {Object.keys(stats.specializationCount).length}
            </p>
          </div>
          <GraduationCap className="w-8 h-8 text-purple-500" />
        </div>
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Top: {Object.keys(stats.specializationCount).sort((a, b) => stats.specializationCount[b] - stats.specializationCount[a])[0] || 'None'}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Full-time Staff</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
              {stats.employmentStats['Full-time'] || 0}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-orange-500" />
        </div>
        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          {stats.employmentStats['Part-time'] || 0} part-time
        </div>
      </div>
    </div>
  );
};

function TeacherManager() {
  const { user, schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [filteredAcademicYears, setFilteredAcademicYears] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    curriculum_specialization: '',
    specialization: '',
    employment_type: ''
  });
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    qualification: '',
    employment_type: '',
    employment_status: 'active',
    tsc_number: '',
    tsc_status: '',
    specialization: '',
    curriculum_specialization: '',
    teaching_levels: [],
    teaching_pathways: [],
    subject_ids: [],
    subject_pivot_meta: {},
    max_subjects: '',
    max_classes: '',
    max_weekly_lessons: '',
    min_weekly_lessons: ''
  });

  const [school, setSchool] = useState(null);
  const [hasStreams, setHasStreams] = useState(false);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    teacherId: null,
    teacherName: ''
  });

  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    teacher: null
  });

  const curriculumOptions = ['CBC', '8-4-4', 'Both'];
  
  const specializationOptions = useMemo(() => {
    const specs = teachers.map(t => t.specialization).filter(Boolean);
    return [...new Set(specs)].sort();
  }, [teachers]);

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET');
      const schoolData = response?.data || response;
      setSchool(schoolData);
      setGradeLevels(schoolData?.grade_levels || []);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  useEffect(() => {
    const fetchCurrentAcademicYear = async () => {
      try {
        const response = await apiRequest('academic-years', 'GET');
        const years = Array.isArray(response) ? response : (response?.data || []);
        const currentYear = years.find(year => year.is_active === 1 || year.is_active === true || year.is_current);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
      }
    };

    if (schoolId) {
      fetchCurrentAcademicYear();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [teachersResponse, rolesResponse, subjectsResponse, academicYearsResponse] = await Promise.all([
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest('roles', 'GET'),
        apiRequest(`subjects`, 'GET'),
        apiRequest(`academic-years`, 'GET')
      ]);

      const teachersData = teachersResponse?.data || [];
      const hasStreamsFromAPI = teachersResponse?.has_streams || false;
      
      setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []));
      setAcademicYears(Array.isArray(academicYearsResponse) ? academicYearsResponse : (academicYearsResponse?.data || []));
      setFilteredAcademicYears(Array.isArray(academicYearsResponse) ? academicYearsResponse : (academicYearsResponse?.data || []));
      setHasStreams(hasStreamsFromAPI);
      
      const teacherRole = Array.isArray(rolesResponse) 
        ? rolesResponse.find(role => role.name === 'Teacher' || role.name === 'teacher')
        : null;
      
      if (teacherRole) {
        const usersResponse = await apiRequest(`users?role_id=${teacherRole.id}`, 'GET');
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      }
      
      let enrichedTeachers = Array.isArray(teachersData) ? teachersData : [];

      if (hasStreamsFromAPI) {
        enrichedTeachers = enrichedTeachers.map(teacher => ({
          ...teacher,
          streamCount: teacher.teaching_streams?.length || 0,
          classTeacherStreamCount: teacher.class_teacher_streams?.length || 0
        }));
      } else {
        enrichedTeachers = enrichedTeachers.map(teacher => {
          const teacherClassrooms = teacher.classrooms || [];
          const classTeacherClassroom = teacherClassrooms.find(c => 
            c.pivot?.is_class_teacher === true
          );
          return {
            ...teacher,
            classroomCount: teacherClassrooms.length,
            classTeacherClassroom
          };
        });
      }
      
      setTeachers(enrichedTeachers);
      
      if (hasStreamsFromAPI) {
        try {
          const streamsResponse = await apiRequest('streams', 'GET');
          setStreams(Array.isArray(streamsResponse) ? streamsResponse : (streamsResponse?.data || []));
        } catch (error) {
          console.error('Failed to fetch streams:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = searchTerm === '' || 
        teacher.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.tsc_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCurriculum = !filters.curriculum_specialization || 
        teacher.curriculum_specialization === filters.curriculum_specialization;
      
      const matchesSpecialization = !filters.specialization || 
        teacher.specialization === filters.specialization;
      
      const matchesEmployment = !filters.employment_type || 
        teacher.employment_type === filters.employment_type;
      
      return matchesSearch && matchesCurriculum && matchesSpecialization && matchesEmployment;
    });
  }, [teachers, searchTerm, filters]);

  const showCreateForm = () => {
    setShowForm(true);
    setSelectedTeacher(null);
    
    let defaultCurriculum = '';
    if (school && school.primary_curriculum !== 'Both') {
      defaultCurriculum = school.primary_curriculum;
    }
    
    setFormData({
      user_id: '',
      qualification: '',
      employment_type: '',
      employment_status: 'active',
      tsc_number: '',
      tsc_status: '',
      specialization: '',
      curriculum_specialization: defaultCurriculum,
      teaching_levels: [],
      teaching_pathways: [],
      subject_ids: [],
      subject_pivot_meta: {},
      max_subjects: '',
      max_classes: '',
      max_weekly_lessons: '',
      min_weekly_lessons: ''
    });
  };

  const showEditForm = (teacher) => {
    if (mobileSheet.isOpen) {
      closeMobileSheet();
    }
    setShowForm(true);
    setSelectedTeacher(teacher);
    const pivotMeta = (teacher.qualified_subjects || []).reduce((acc, s) => {
      if (s.pivot?.combination_label || s.pivot?.years_experience) {
        acc[s.id] = {
          combination_label: s.pivot.combination_label || '',
          years_experience: s.pivot.years_experience || null,
          is_primary_subject: s.pivot.is_primary_subject || false,
        };
      }
      return acc;
    }, {});

    setFormData({
      user_id: teacher.user_id,
      qualification: teacher.qualification || '',
      employment_type: teacher.employment_type || '',
      employment_status: teacher.employment_status || 'active',
      tsc_number: teacher.tsc_number || '',
      tsc_status: teacher.tsc_status || '',
      specialization: teacher.specialization || '',
      curriculum_specialization: teacher.curriculum_specialization || '',
      teaching_levels: teacher.teaching_levels || [],
      teaching_pathways: teacher.teaching_pathways || [],
      subject_ids: teacher.qualified_subjects?.map(s => s.id) || [],
      subject_pivot_meta: pivotMeta,
      max_subjects: teacher.max_subjects || '',
      max_classes: teacher.max_classes || '',
      max_weekly_lessons: teacher.max_weekly_lessons || '',
      min_weekly_lessons: teacher.min_weekly_lessons || ''
    });
  };

  const showClassroomsView = async (teacher) => {
    setView('classrooms');
    setSelectedTeacher(teacher);
    setLoading(true);
    try {
      const response = await apiRequest(`teachers/${teacher.id}/classrooms`, 'GET');
      const teacherClassrooms = response?.data || [];
      
      setSelectedTeacher(prev => ({
        ...prev,
        classrooms: teacherClassrooms,
        classroomCount: teacherClassrooms.length
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not load classrooms';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showStreamsView = async (teacher) => {
    setView('streams');
    setSelectedTeacher(teacher);
    setLoading(true);
    try {
      const response = await apiRequest(`teachers/${teacher.id}`, 'GET');
      const teacherData = response?.data || response;

      setSelectedTeacher(prev => ({
        ...prev,
        classTeacherStreams: teacherData.class_teacher_streams || [],
        teachingStreams: teacherData.teaching_streams || [],
        streamCount: teacherData.teaching_streams?.length || 0,
        classTeacherStreamCount: teacherData.class_teacher_streams?.length || 0
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not load streams';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setShowForm(false);
    setSelectedTeacher(null);
    fetchInitialData();
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedTeacher(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.teaching_levels?.length > 0 &&
      (!formData.subject_ids || formData.subject_ids.length === 0)
    ) {
      toast.error('Please select at least one qualified subject for the selected teaching levels.');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        user_id: formData.user_id,
        qualification: formData.qualification || null,
        employment_type: formData.employment_type || null,
        employment_status: formData.employment_status || 'active',
        tsc_number: formData.tsc_number || null,
        tsc_status: formData.tsc_status || null,
        curriculum_specialization: formData.curriculum_specialization || null,
        teaching_levels: formData.teaching_levels?.length > 0 ? formData.teaching_levels : null,
        teaching_pathways: formData.teaching_pathways?.length > 0 ? formData.teaching_pathways : null,
        subject_ids: formData.subject_ids?.length > 0 ? formData.subject_ids : undefined,
        subject_pivot_meta: formData.subject_pivot_meta || undefined,
        max_subjects: formData.max_subjects ? parseInt(formData.max_subjects) : null,
        max_classes: formData.max_classes ? parseInt(formData.max_classes) : null,
        max_weekly_lessons: formData.max_weekly_lessons ? parseInt(formData.max_weekly_lessons) : null,
        min_weekly_lessons: formData.min_weekly_lessons ? parseInt(formData.min_weekly_lessons) : null,
      };
      delete payload.specialization;

      if (school && school.primary_curriculum !== 'Both') {
        delete payload.curriculum_specialization;
      }

      console.log('Submitting payload:', payload);
      
      let response;
      if (selectedTeacher) {
        response = await apiRequest(`teachers/${selectedTeacher.id}`, 'PUT', payload);
        toast.success('Teacher updated successfully');
      } else {
        response = await apiRequest('teachers', 'POST', payload);
        toast.success('Teacher created successfully');
      }
      
      backToList();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      const validationErrors = error?.response?.data?.errors;
      
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) 
            ? validationErrors[key].join(', ') 
            : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
      } else {
        toast.error(`Failed to ${selectedTeacher ? 'update' : 'create'} teacher: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (teacher) => {
    if (mobileSheet.isOpen) {
      closeMobileSheet();
    }
    setDeleteModal({
      isOpen: true,
      teacherId: teacher.id,
      teacherName: teacher.user?.full_name || teacher.user?.name || 'Unknown'
    });
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`teachers/${deleteModal.teacherId}`, 'DELETE');
      toast.success('Teacher deleted successfully');
      setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' });
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete teacher.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      curriculum_specialization: '',
      specialization: '',
      employment_type: ''
    });
    setSearchTerm('');
  };

  const getCurriculumBadgeColor = (type) => {
    return type === 'CBC' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  };

  const openMobileSheet = (teacher) => {
    setMobileSheet({ isOpen: true, teacher });
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, teacher: null });
    document.body.style.overflow = '';
  };

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
                  Delete Teacher
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.teacherName}"</span>?
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
                  <strong>Warning:</strong> This will permanently delete all data associated with this teacher including assignments, grading information, and scheduling.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Teacher
            </button>
            <button
              onClick={handleDelete}
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
                  Delete Teacher
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.teacher) return null;
    const teacher = mobileSheet.teacher;
    
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
                  {teacher.user?.full_name || teacher.user?.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {teacher.user?.email || 'No email'}
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
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Teacher Information
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {teacher.user?.full_name || teacher.user?.name}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>
                    {teacher.curriculum_specialization}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Qualification: <span className="font-semibold text-slate-900 dark:text-white">{teacher.qualification || 'Not specified'}</span>
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  TSC: <span className="font-semibold text-slate-900 dark:text-white">{teacher.tsc_number || 'Not specified'}</span>
                </p>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Specialization</p>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300">
                  {teacher.specialization || 'General'}
                </span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Assignments
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{hasStreams ? 'Streams' : 'Classrooms'}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {hasStreams ? (teacher.streamCount || 0) : (teacher.classroomCount || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Class Teacher</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {hasStreams 
                      ? (teacher.classTeacherStreamCount > 0 ? 'Yes' : 'No')
                      : (teacher.classTeacherClassroom ? 'Yes' : 'No')
                    }
                  </span>
                </div>
              </div>
            </div>

            {selectedAcademicYear && (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Workload
                  </h3>
                </div>
                <WorkloadMeter 
                  teacherId={teacher.id} 
                  academicYearId={selectedAcademicYear}
                  compact={false}
                />
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => {
                closeMobileSheet();
                showEditForm(teacher);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Teacher
            </button>
            <button
              onClick={() => {
                closeMobileSheet();
                hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 active:scale-[0.98] transition-all"
            >
              <Users className="w-4 h-4" />
              View {hasStreams ? 'Streams' : 'Classrooms'}
            </button>
            <button
              onClick={() => handleDeleteClick(teacher)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Teacher
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderListView = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Teacher Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage teaching staff, their assignments, and qualifications.
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
                  Type:
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  hasStreams 
                    ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {hasStreams ? 'Streams Enabled' : 'Direct Classroom Assignment'}
                </span>
              </div>
              {gradeLevels.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Grade Levels:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {gradeLevels.slice(0, 3).map((level, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
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
            title={!school ? "Loading school information..." : "Create new teacher"}
          >
            <Plus className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            New Teacher
          </button>
        </div>
      </div>

      <TeacherStatistics teachers={teachers} subjects={subjects} streams={streams} />

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
                  ({filteredTeachers.length}/{teachers.length})
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or TSC number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Curriculum
                    </label>
                    <select
                      value={filters.curriculum_specialization}
                      onChange={(e) => setFilters({ ...filters, curriculum_specialization: e.target.value })}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Curricula</option>
                      {curriculumOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Employment
                    </label>
                    <select
                      value={filters.employment_type}
                      onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">All Types</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
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
                    placeholder="Search by name, email, or TSC number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              
              {/* Curriculum Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Curriculum
                </label>
                <select
                  value={filters.curriculum_specialization}
                  onChange={(e) => setFilters({ ...filters, curriculum_specialization: e.target.value })}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">All Curricula</option>
                  {curriculumOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {/* Specialization Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">All Specializations</option>
                  {specializationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {/* Results Count */}
              <div className="flex items-end lg:col-span-1">
                <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{filteredTeachers.length}</span> of <span className="font-semibold">{teachers.length}</span> teachers
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
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading teachers...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
              Existing Teachers ({filteredTeachers.length})
            </h2>
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700 min-w-[700px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Name</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Email</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Qualification</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Specialization</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Curriculum</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Employment</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Workload</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">{hasStreams ? 'Streams' : 'Classrooms'}</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Class Teacher</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <tr 
                          key={teacher.id} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                        >
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-slate-100">
                            {teacher.user?.full_name || teacher.user?.name || 'Unknown'}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 text-xs">
                            {teacher.user?.email || '-'}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                            {teacher.qualification || '-'}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300">
                              {teacher.specialization || 'General'}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              teacher.curriculum_specialization === 'CBC' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : teacher.curriculum_specialization === '8-4-4'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}>
                              {teacher.curriculum_specialization}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 text-xs">
                            {teacher.employment_type || '-'}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            {selectedAcademicYear ? (
                              <WorkloadMeter 
                                teacherId={teacher.id} 
                                academicYearId={selectedAcademicYear}
                                compact={true}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                            {hasStreams ? (
                              <span>{teacher.streamCount || 0} Stream(s)</span>
                            ) : (
                              <span>{teacher.classroomCount || 0} Classroom(s)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                            {hasStreams ? (
                              <span>{teacher.classTeacherStreamCount > 0 ? 'Yes' : 'No'}</span>
                            ) : (
                              <span>{teacher.classTeacherClassroom ? 'Yes' : 'No'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher)} 
                                className="p-1.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title={hasStreams ? "View Streams" : "View Classrooms"}
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => showEditForm(teacher)} 
                                className="p-1.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Edit Teacher"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(teacher)} 
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Delete Teacher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                          {searchTerm || Object.values(filters).some(v => v) 
                            ? 'No teachers match your filters.' 
                            : 'No teachers found.'}
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
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => openMobileSheet(teacher)}
                  className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {teacher.user?.full_name || teacher.user?.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {teacher.user?.email || 'No email'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Specialization</span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300">
                        {teacher.specialization || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{hasStreams ? 'Streams' : 'Classrooms'}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {hasStreams ? (teacher.streamCount || 0) : (teacher.classroomCount || 0)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {searchTerm || Object.values(filters).some(v => v)
                    ? 'No teachers match your filters.'
                    : 'No teachers found. Create one to get started.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  const renderClassroomsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Classrooms for {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Classrooms: <span className="font-medium">{selectedTeacher?.classroomCount || 0}</span>
            </p>
          </div>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:bg-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTeacher?.classrooms && selectedTeacher.classrooms.length > 0 ? (
                selectedTeacher.classrooms.map(classroom => (
                  <div 
                    key={classroom.id} 
                    className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{classroom.class_name}</p>
                        {classroom.pivot?.is_class_teacher && (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                            Class Teacher
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Capacity: {classroom.capacity || 0} students
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{classroom.capacity || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No classrooms found for this teacher.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Streams for {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Teaching:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTeacher?.streamCount || 0}
              </span>{' '}
              streams | Class Teacher:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTeacher?.classTeacherStreamCount || 0}
              </span>{' '}
              streams
            </p>
          </div>
          <button
            onClick={backToList}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Teaching Streams */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Teaching Streams
                </h4>
                <div className="space-y-3">
                  {selectedTeacher?.teachingStreams?.length > 0 ? (
                    selectedTeacher.teachingStreams.map(stream => (
                      <div
                        key={stream.id}
                        className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white truncate">{stream.name}</p>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 rounded-full text-xs font-medium">
                              {stream.classroom?.class_name || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Capacity: {stream.capacity || 0} students
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 ml-4 flex-shrink-0">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{stream.capacity || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-700/20 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <Users className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No teaching streams assigned.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Teacher Streams */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Class Teacher Streams
                </h4>
                <div className="space-y-3">
                  {selectedTeacher?.classTeacherStreams?.length > 0 ? (
                    selectedTeacher.classTeacherStreams.map(stream => (
                      <div
                        key={stream.id}
                        className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white truncate">{stream.name}</p>
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50 rounded-full text-xs font-medium">
                              Class Teacher
                            </span>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 rounded-full text-xs font-medium">
                              {stream.classroom?.class_name || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Capacity: {stream.capacity || 0} students
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 ml-4 flex-shrink-0">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{stream.capacity || 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-slate-50 dark:bg-slate-700/20 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <Users className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">No class teacher streams assigned.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );

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

  if (!user || !schoolId) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">
            Unable to access teacher management
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading Teachers...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {view === 'classrooms' && renderClassroomsView()}
      {view === 'streams' && renderStreamsView()}
      
      {showForm && (
        <TeacherForm
          formData={formData}
          editingTeacher={selectedTeacher}
          onInputChange={handleInputChange}
          onArrayChange={handleArrayChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSubmitting={loading}
          users={users}
          school={school}
          specializationOptions={specializationOptions}
        />
      )}
      
      {renderDeleteConfirmationModal()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default TeacherManager;
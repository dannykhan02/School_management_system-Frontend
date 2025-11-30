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
  ChevronDown,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { toast } from "react-toastify";

// Custom Searchable Dropdown Component
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = useMemo(() => 
    options.find(option => option.id === value), 
    [options, value]
  );
  
  const filteredOptions = useMemo(() => 
    options.filter(option => 
      option.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ), 
    [options, searchTerm]
  );
  
  return (
    <div className="relative">
      <div 
        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white flex items-center justify-between cursor-text ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selectedOption ? `${selectedOption.full_name} (${selectedOption.email})` : placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-slate-400" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-slate-200 dark:border-slate-600">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 ${option.id === value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="font-medium">{option.full_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{option.email}</div>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-slate-500 dark:text-slate-400">No matching users found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

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
        Filters {Object.values(filters).some(v => v) && <span className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">Active</span>}
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
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
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
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
          <Users className="w-8 h-8 text-blue-500" />
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
  const [formData, setFormData] = useState({
    user_id: '',
    qualification: '',
    employment_type: '',
    tsc_number: '',
    specialization: '',
    curriculum_specialization: '',
    max_subjects: '',
    max_classes: ''
  });
  const [assignmentData, setAssignmentData] = useState({ 
    subject_ids: [], 
    stream_id: '',
    academic_year_id: '',
    weekly_periods: 5,
    assignment_type: 'main_teacher'
  });
  
  // Add school state
  const [school, setSchool] = useState(null);
  const [hasStreams, setHasStreams] = useState(false);

  const curriculumOptions = ['CBC', '8-4-4', 'Both'];
  const specializationOptions = ['Sciences', 'Languages', 'Mathematics', 'Social Studies', 'Technical', 'Arts'];

  // Fetch school information to get primary curriculum and stream setting
  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools', 'GET');
      const schoolData = response?.data || response;
      setSchool(schoolData);
      // Don't set hasStreams here - it comes from teachers endpoint
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  // Fetch initial data including school information
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [teachersResponse, rolesResponse, subjectsResponse, academicYearsResponse] = await Promise.all([
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest('roles', 'GET'),
        apiRequest(`subjects`, 'GET'),
        apiRequest(`academic-years`, 'GET')
      ]);

      // Handle new response structure from backend
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
      
      // Enrich teachers with appropriate relationships based on school type
      let enrichedTeachers = Array.isArray(teachersData) ? teachersData : [];

      if (hasStreamsFromAPI) {
        // For stream schools, teachers already have streams loaded
        enrichedTeachers = enrichedTeachers.map(teacher => ({
          ...teacher,
          streamCount: teacher.teachingStreams?.length || 0,
          classTeacherStreamCount: teacher.classTeacherStreams?.length || 0
        }));
      } else {
        // For non-stream schools, teachers already have classrooms loaded
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
      
      // Fetch streams if school has streams
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

  // New function to fetch academic years by curriculum
  const fetchAcademicYearsByCurriculum = useCallback(async (curriculum) => {
    if (!curriculum || curriculum === 'Both') {
      // If curriculum is 'Both' or not specified, use all academic years
      setFilteredAcademicYears(academicYears);
      return;
    }

    // Normalize curriculum value to ensure it matches expected values
    const normalizedCurriculum = curriculum.trim().toUpperCase();
    
    // Validate curriculum value before making API call
    if (!['CBC', '8-4-4'].includes(normalizedCurriculum)) {
      console.error('Invalid curriculum value:', curriculum);
      toast.error(`Invalid curriculum type: ${curriculum}. Expected 'CBC' or '8-4-4'.`);
      setFilteredAcademicYears(academicYears);
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`academic-years/by-curriculum/${normalizedCurriculum}`, 'GET');
      const curriculumAcademicYears = Array.isArray(response) ? response : (response?.data || []);
      setFilteredAcademicYears(curriculumAcademicYears);
      
      // Reset academic year selection if current selection is not in the filtered list
      if (assignmentData.academic_year_id && !curriculumAcademicYears.find(ay => ay.id === assignmentData.academic_year_id)) {
        setAssignmentData(prev => ({
          ...prev,
          academic_year_id: ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch academic years by curriculum:', error);
      toast.error('Failed to load academic years for curriculum');
      // Fallback to all academic years
      setFilteredAcademicYears(academicYears);
    } finally {
      setLoading(false);
    }
  }, [academicYears, assignmentData.academic_year_id]);

  // --- Filtered Teachers ---
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

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedTeacher(null);
    
    let defaultCurriculum = '';
    if (school && school.primary_curriculum !== 'Both') {
      defaultCurriculum = school.primary_curriculum;
    }
    
    setFormData({
      user_id: '',
      qualification: '',
      employment_type: '',
      tsc_number: '',
      specialization: '',
      curriculum_specialization: defaultCurriculum,
      max_subjects: '',
      max_classes: ''
    });
  };

  const showEditForm = (teacher) => {
    setView('edit');
    setSelectedTeacher(teacher);
    setFormData({
      user_id: teacher.user_id,
      qualification: teacher.qualification || '',
      employment_type: teacher.employment_type || '',
      tsc_number: teacher.tsc_number || '',
      specialization: teacher.specialization || '',
      curriculum_specialization: teacher.curriculum_specialization || '',
      max_subjects: teacher.max_subjects || '',
      max_classes: teacher.max_classes || ''
    });
  };

  const showManageSubjectsView = async (teacher) => {
    setView('manage-subjects');
    setSelectedTeacher(teacher);
    const subjectIds = teacher.subjects?.map(s => s.id) || [];
    
    // Set default academic year to current academic year
    const currentAcademicYear = academicYears.find(ay => ay.is_active);
    
    setAssignmentData({ 
      subject_ids: subjectIds, 
      stream_id: '',
      academic_year_id: currentAcademicYear?.id || '',
      weekly_periods: 5,
      assignment_type: 'main_teacher'
    });
    
    // Fetch academic years based on teacher's curriculum specialization
    // Normalize the curriculum value before passing it
    const curriculum = teacher.curriculum_specialization?.trim().toUpperCase();
    await fetchAcademicYearsByCurriculum(curriculum);
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
        classTeacherStreams: teacherData.classTeacherStreams || [],
        teachingStreams: teacherData.teachingStreams || [],
        streamCount: teacherData.teachingStreams?.length || 0,
        classTeacherStreamCount: teacherData.classTeacherStreams?.length || 0
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
    setSelectedTeacher(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'subject_ids') {
      const selectedIds = Array.from(options)
        .filter(option => option.selected)
        .map(option => Number(option.value));
      setAssignmentData(prev => ({ ...prev, subject_ids: selectedIds }));
    } else {
      setAssignmentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        max_subjects: formData.max_subjects ? parseInt(formData.max_subjects) : null,
        max_classes: formData.max_classes ? parseInt(formData.max_classes) : null
      };
      
      // Only send curriculum_specialization if school requires it
      if (school && school.primary_curriculum !== 'Both') {
        delete payload.curriculum_specialization;
      }
      
      let response;
      if (view === 'edit') {
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
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} teacher: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiRequest(`teachers/${id}`, 'DELETE');
        toast.success('Teacher deleted successfully');
        fetchInitialData();
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete teacher.';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // Updated handleSaveSubjectAssignments function with proper academic year validation
  const handleSaveSubjectAssignments = async () => {
    setLoading(true);
    try {
      // Get current academic year if not selected
      const currentAcademicYear = filteredAcademicYears.find(ay => ay.is_active);
      const academicYearId = assignmentData.academic_year_id || currentAcademicYear?.id;
      
      // Validate academic year is selected
      if (!academicYearId) {
        toast.error('Please select an academic year');
        setLoading(false);
        return;
      }
      
      if (hasStreams) {
        // For schools with streams, create assignments for each subject-stream combination
        const assignments = [];
        
        for (const subjectId of assignmentData.subject_ids) {
          // If stream_id is selected, create assignment for that specific stream
          if (assignmentData.stream_id) {
            assignments.push({
              teacher_id: selectedTeacher.id,
              subject_id: subjectId,
              academic_year_id: academicYearId,
              stream_id: assignmentData.stream_id,
              weekly_periods: assignmentData.weekly_periods,
              assignment_type: assignmentData.assignment_type
            });
          } else {
            // If no stream selected, we need to get all streams for this teacher's school
            // and create assignments for each stream
            const streamAssignments = streams.map(stream => ({
              teacher_id: selectedTeacher.id,
              subject_id: subjectId,
              academic_year_id: academicYearId,
              stream_id: stream.id,
              weekly_periods: assignmentData.weekly_periods,
              assignment_type: assignmentData.assignment_type
            }));
            
            assignments.push(...streamAssignments);
          }
        }
        
        // Send all assignments in a batch
        await apiRequest(`subject-assignments/batch`, 'POST', {
          assignments: assignments
        });
      } else {
        // For schools without streams, create assignments without stream_id
        const assignments = assignmentData.subject_ids.map(subjectId => ({
          teacher_id: selectedTeacher.id,
          subject_id: subjectId,
          academic_year_id: academicYearId,
          weekly_periods: assignmentData.weekly_periods,
          assignment_type: assignmentData.assignment_type
          // Note: stream_id is not included for schools without streams
        }));
        
        // Send all assignments in a batch
        await apiRequest(`subject-assignments/batch`, 'POST', {
          assignments: assignments
        });
      }
      
      toast.success('Subject assignments updated successfully');
      backToList();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update subject assignments.';
      const validationErrors = error?.response?.data?.errors;
      
      if (validationErrors) {
        // Handle array of errors
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach(err => {
            toast.error(err);
          });
        } else {
          // Handle object of errors
          Object.keys(validationErrors).forEach(key => {
            const messages = Array.isArray(validationErrors[key]) 
              ? validationErrors[key].join(', ') 
              : validationErrors[key];
            toast.error(`${key}: ${messages}`);
          });
        }
      } else {
        toast.error(errorMessage);
      }
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

  // Helper function to get curriculum badge color
  const getCurriculumBadgeColor = (type) => {
    return type === 'CBC' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  };

  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Teacher Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">Manage teaching staff, their assignments, and qualifications.</p>
          {school && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                School Type:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                hasStreams 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {hasStreams ? 'Streams Enabled' : 'Direct Classroom Assignment'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={showCreateForm} 
            disabled={!school}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title={!school ? "Loading school information..." : "Create new teacher"}
          >
            <Plus className="w-5 h-5" />
            New Teacher
          </button>
        </div>
      </div>

      <TeacherStatistics teachers={teachers} subjects={subjects} streams={streams} />

      <FilterPanel 
        filters={filters} 
        setFilters={setFilters} 
        curriculumOptions={curriculumOptions}
        specializationOptions={specializationOptions}
        onClearFilters={clearAllFilters}
      />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or TSC number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
            Existing Teachers ({filteredTeachers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Qualification</th>
                  <th className="px-6 py-4 font-medium">Specialization</th>
                  <th className="px-6 py-4 font-medium">Curriculum</th>
                  <th className="px-6 py-4 font-medium">Employment</th>
                  <th className="px-6 py-4 font-medium">{hasStreams ? 'Streams' : 'Classrooms'}</th>
                  <th className="px-6 py-4 font-medium">Class Teacher</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {teacher.user?.full_name || teacher.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {teacher.user?.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {teacher.qualification || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                          {teacher.specialization || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          teacher.curriculum_specialization === 'CBC' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : teacher.curriculum_specialization === '8-4-4'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {teacher.curriculum_specialization}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {teacher.employment_type || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {hasStreams ? (
                          <span>{teacher.streamCount || 0} Stream(s)</span>
                        ) : (
                          <span>{teacher.classroomCount || 0} Classroom(s)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {hasStreams ? (
                          <span>{teacher.classTeacherStreamCount > 0 ? 'Yes' : 'No'}</span>
                        ) : (
                          <span>{teacher.classTeacherClassroom ? 'Yes' : 'No'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => showManageSubjectsView(teacher)} 
                            className="p-2 text-slate-500 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Manage Subjects"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher)} 
                            className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title={hasStreams ? "View Streams" : "View Classrooms"}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => showEditForm(teacher)} 
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher.id)} 
                            className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
    </>
  );

  const renderFormView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {view === 'edit' ? 'Edit Teacher' : 'Create New Teacher'}
          </h3>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="user_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                User <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={users}
                value={formData.user_id}
                onChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                placeholder="Select a user"
                disabled={view === 'edit'}
              />
              {view === 'edit' && (
                <p className="text-xs text-slate-500 mt-1">User cannot be changed after creation</p>
              )}
            </div>

            {school && school.primary_curriculum === 'Both' && (
              <div>
                <label htmlFor="curriculum_specialization" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Curriculum Specialization <span className="text-red-500">*</span>
                </label>
                <select 
                  id="curriculum_specialization"
                  name="curriculum_specialization" 
                  value={formData.curriculum_specialization} 
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select curriculum</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Specialization
              </label>
              <select 
                id="specialization"
                name="specialization" 
                value={formData.specialization} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select specialization</option>
                {specializationOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Qualification
              </label>
              <input 
                type="text" 
                id="qualification"
                name="qualification" 
                value={formData.qualification} 
                onChange={handleInputChange}
                placeholder="e.g., B.Sc Education"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Employment Type
              </label>
              <select 
                id="employment_type"
                name="employment_type" 
                value={formData.employment_type} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label htmlFor="tsc_number" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                TSC Number
              </label>
              <input 
                type="text" 
                id="tsc_number"
                name="tsc_number" 
                value={formData.tsc_number} 
                onChange={handleInputChange}
                placeholder="e.g., TSC123456"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="max_subjects" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Max Subjects to Teach
              </label>
              <input 
                type="number"
                id="max_subjects"
                name="max_subjects" 
                value={formData.max_subjects} 
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 4"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="max_classes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Max Classes to Teach
              </label>
              <input 
                type="number"
                id="max_classes"
                name="max_classes" 
                value={formData.max_classes} 
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 6"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button 
              type="button" 
              onClick={backToList} 
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || (view === 'create' && !formData.user_id)} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                view === 'edit' ? 'Update Teacher' : 'Create Teacher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderManageSubjectsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5" />Manage Subject Assignments
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
            </p>
            {selectedTeacher?.curriculum_specialization && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Curriculum:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedTeacher.curriculum_specialization === 'CBC' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {selectedTeacher.curriculum_specialization}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Select Subjects ({assignmentData.subject_ids.length} selected)
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700/50">
              {subjects.length > 0 ? (
                subjects.map(subject => (
                  <label key={subject.id} className="flex items-center space-x-3 p-3 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      value={subject.id}
                      checked={assignmentData.subject_ids.includes(subject.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignmentData(prev => ({ 
                            ...prev, 
                            subject_ids: [...prev.subject_ids, subject.id] 
                          }));
                        } else {
                          setAssignmentData(prev => ({ 
                            ...prev, 
                            subject_ids: prev.subject_ids.filter(id => id !== subject.id) 
                          }));
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {subject.name}
                      </span>
                      {subject.code && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                          ({subject.code})
                        </span>
                      )}
                      {subject.curriculum_type && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          subject.curriculum_type === 'CBC' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                          {subject.curriculum_type}
                        </span>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No subjects available</p>
              )}
            </div>
          </div>
          
          {/* Additional assignment fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="academic_year_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                id="academic_year_id"
                name="academic_year_id"
                value={assignmentData.academic_year_id}
                onChange={handleAssignmentChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select academic year</option>
                {filteredAcademicYears.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.year} - {year.term} {year.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
              {selectedTeacher?.curriculum_specialization && selectedTeacher?.curriculum_specialization !== 'Both' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Showing academic years for {selectedTeacher.curriculum_specialization} curriculum
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="weekly_periods" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Weekly Periods
              </label>
              <input
                id="weekly_periods"
                type="number"
                name="weekly_periods"
                value={assignmentData.weekly_periods}
                onChange={handleAssignmentChange}
                min="1"
                max="40"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="assignment_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Assignment Type
              </label>
              <select
                id="assignment_type"
                name="assignment_type"
                value={assignmentData.assignment_type}
                onChange={handleAssignmentChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="main_teacher">Main Teacher</option>
                <option value="assistant_teacher">Assistant Teacher</option>
                <option value="substitute">Substitute</option>
              </select>
            </div>
          </div>
          
          {/* Stream selection for schools with streams */}
          {hasStreams && (
            <div className="mb-6">
              <label htmlFor="stream_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stream (Optional)
              </label>
              <select
                id="stream_id"
                name="stream_id"
                value={assignmentData.stream_id}
                onChange={handleAssignmentChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select stream (optional)</option>
                {streams.map(stream => (
                  <option key={stream.id} value={stream.id}>
                    {stream.classroom?.name} - {stream.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Leave empty to assign to all streams or select a specific stream
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={backToList} 
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveSubjectAssignments} 
              disabled={loading || assignmentData.subject_ids.length === 0} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Assignments'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // New view for showing classrooms assigned to a teacher (for non-stream schools)
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
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
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

  // New view for showing streams assigned to a teacher (for stream schools)
  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              Streams for {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Teaching: <span className="font-medium">{selectedTeacher?.streamCount || 0}</span> streams | 
              Class Teacher: <span className="font-medium">{selectedTeacher?.classTeacherStreamCount || 0}</span> streams
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
            <div className="space-y-6">
              {/* Teaching Streams */}
              <div>
                <h4 className="text-md font-medium text-slate-900 dark:text-white mb-3">Teaching Streams</h4>
                <div className="space-y-3">
                  {selectedTeacher?.teachingStreams && selectedTeacher.teachingStreams.length > 0 ? (
                    selectedTeacher.teachingStreams.map(stream => (
                      <div 
                        key={stream.id} 
                        className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white truncate">{stream.name}</p>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
                              {stream.classroom?.class_name || 'Unknown Classroom'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Capacity: {stream.capacity || 0} students
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{stream.capacity || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">
                        No teaching streams assigned.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Teacher Streams */}
              <div>
                <h4 className="text-md font-medium text-slate-900 dark:text-white mb-3">Class Teacher Streams</h4>
                <div className="space-y-3">
                  {selectedTeacher?.classTeacherStreams && selectedTeacher.classTeacherStreams.length > 0 ? (
                    selectedTeacher.classTeacherStreams.map(stream => (
                      <div 
                        key={stream.id} 
                        className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white truncate">{stream.name}</p>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                              Class Teacher
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
                              {stream.classroom?.class_name || 'Unknown Classroom'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Capacity: {stream.capacity || 0} students
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{stream.capacity || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <p className="text-slate-500 dark:text-slate-400">
                        No class teacher streams assigned.
                      </p>
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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has schoolId
  if (!user || !schoolId) {
    return (
      <div className="w-full py-8">
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
    <div className="w-full py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Teachers...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-subjects' && renderManageSubjectsView()}
      {view === 'classrooms' && renderClassroomsView()}
      {view === 'streams' && renderStreamsView()}
    </div>
  );
}

export default TeacherManager;
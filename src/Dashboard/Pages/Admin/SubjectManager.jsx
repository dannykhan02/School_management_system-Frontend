// src/Dashboard/Pages/Admin/SubjectManager.jsx
import React, { useEffect, useState } from 'react';
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
  Calendar,
  GraduationCap,
  Award,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from "react-toastify";

function SubjectManager() {
  const { schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'manage-assignments'
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCoreStatus, setFilterCoreStatus] = useState('all');
  const [school, setSchool] = useState(null); // New state for school information
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    curriculum_type: '', // Removed default value - will be set based on school's primary curriculum
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
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
      fetchSchoolInfo(); // Fetch school information
    }
  }, [schoolId]);

  const fetchSchoolInfo = async () => {
    try {
      const response = await apiRequest('schools', 'GET');
      setSchool(response.data || response);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsResponse, teachersResponse, streamsResponse, academicYearsResponse] = await Promise.all([
        apiRequest(`subjects`, 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest(`streams`, 'GET'),
        apiRequest(`academic-years`, 'GET')
      ]);
      setSubjects(subjectsResponse || []);
      setTeachers(teachersResponse?.teachers || []);
      setStreams(streamsResponse || []);
      setAcademicYears(academicYearsResponse || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (subjectId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`subject-assignments?subject_id=${subjectId}`, 'GET');
      setAssignments(response || []);
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
    
    // Set curriculum based on school's primary curriculum
    let defaultCurriculum = '';
    if (school) {
      if (school.primary_curriculum === 'CBC') {
        defaultCurriculum = 'CBC';
      } else if (school.primary_curriculum === '8-4-4') {
        defaultCurriculum = '8-4-4';
      }
      // If school has both, leave empty to allow user selection
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
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject? This will also remove all associated assignments.')) {
      try {
        await apiRequest(`subjects/${id}`, 'DELETE');
        toast.success('Subject deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error('Failed to delete subject.');
      }
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

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await apiRequest(`subject-assignments/${assignmentId}`, 'DELETE');
        toast.success('Assignment deleted successfully');
        await fetchAssignments(selectedSubject.id);
      } catch (error) {
        toast.error('Failed to delete assignment.');
      }
    }
  };

  // --- Filtering Logic ---
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurriculum = filterCurriculum === 'all' || subject.curriculum_type === filterCurriculum;
    const matchesCategory = filterCategory === 'all' || subject.category === filterCategory;
    const matchesCoreStatus = filterCoreStatus === 'all' || 
                             (filterCoreStatus === 'core' && subject.is_core) ||
                             (filterCoreStatus === 'elective' && !subject.is_core);
    
    return matchesSearch && matchesCurriculum && matchesCategory && matchesCoreStatus;
  });

  // Get unique categories from subjects
  const availableCategories = [...new Set(subjects.map(s => s.category))].filter(Boolean);

  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Subject Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">Manage subjects, create assignments, and oversee curriculum.</p>
          {school && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                School Primary Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                school.primary_curriculum === 'CBC' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
              }`}>
                {school.primary_curriculum}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={showCreateForm} 
          disabled={!school}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-5 h-5" />New Subject
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <select
            value={filterCurriculum}
            onChange={(e) => setFilterCurriculum(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Curriculums</option>
            <option value="CBC">CBC</option>
            <option value="8-4-4">8-4-4</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterCoreStatus}
            onChange={(e) => setFilterCoreStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">Core & Elective</option>
            <option value="core">Core Only</option>
            <option value="elective">Elective Only</option>
          </select>
        </div>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredSubjects.length} of {subjects.length} subjects
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Curriculum</th>
                  <th className="px-6 py-4 font-medium">Grade Level</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Assignments</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{subject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{subject.code}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subject.curriculum_type === 'CBC' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {subject.curriculum_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">{subject.grade_level}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {subject.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 text-xs ${
                          subject.is_core 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          <Award className="w-3 h-3" />
                          {subject.is_core ? 'Core' : 'Elective'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => showManageAssignmentsView(subject)} 
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Users className="w-4 h-4" />
                          <span>Manage</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => showEditForm(subject)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(subject.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
    </>
  );

  const renderFormView = () => {
    const gradeLevels = formData.curriculum_type === 'CBC' ? CBC_GRADE_LEVELS : LEGACY_GRADE_LEVELS;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {view === 'edit' ? 'Edit Subject' : 'Create New Subject'}
              </h3>
            </div>
            <button 
              onClick={backToList} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close form"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* School Curriculum Info */}
          {school && (
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-300">
                  School Primary Curriculum: <strong>{school.primary_curriculum}</strong>
                </span>
                {school.primary_curriculum === 'Both' && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full ml-2">
                    Select curriculum for this subject
                  </span>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject Name *</label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
                />
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject Code *</label>
                <input 
                  type="text" 
                  id="code"
                  name="code" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  required
                  placeholder="e.g., G7-MAT"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="curriculum_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Curriculum Type *</label>
                <select
                  id="curriculum_type"
                  name="curriculum_type"
                  value={formData.curriculum_type}
                  onChange={handleInputChange}
                  required
                  disabled={school && school.primary_curriculum !== 'Both'}
                  className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                    school && school.primary_curriculum !== 'Both' ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                  }`}
                >
                  {school && school.primary_curriculum !== 'Both' ? (
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
                {school && school.primary_curriculum !== 'Both' && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Curriculum type is fixed based on your school's primary curriculum.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="grade_level" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grade Level *</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.curriculum_type}
                  className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                    !formData.curriculum_type ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select grade level</option>
                  {gradeLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {!formData.curriculum_type && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select curriculum type first to see available grade levels.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_core"
                    name="is_core"
                    checked={formData.is_core}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Core/Compulsory Subject
                  </span>
                </label>
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
                disabled={loading} 
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Manage Assignments
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Subject: <span className="font-medium">{selectedSubject?.name}</span> ({selectedSubject?.code})
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
        <form onSubmit={handleCreateAssignment} className="p-6 border-b border-slate-200 dark:border-slate-700">
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
        <div className="p-6">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stream</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {assignment.stream?.classroom?.name} - {assignment.stream?.name}
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
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Subjects...</p>
        </div>
      )}
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-assignments' && renderManageAssignmentsView()}
    </div>
  );
}

export default SubjectManager;
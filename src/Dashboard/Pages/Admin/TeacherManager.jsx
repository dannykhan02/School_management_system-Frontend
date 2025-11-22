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
  MapPin,
  Crown,
  Search,
  AlertCircle,
  Filter,
  Download,
  ChevronDown,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
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
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={onClearFilters}
            className="col-span-1 md:col-span-4 px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Bulk Actions Component
const BulkActions = ({ selectedTeachers, onBulkAction, onSelectAll, allSelected, totalTeachers }) => {
  const [showActions, setShowActions] = useState(false);

  if (selectedTeachers.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-blue-700 dark:text-blue-300 font-medium">
            {selectedTeachers.length} teacher{selectedTeachers.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onSelectAll}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {allSelected ? 'Deselect all' : `Select all ${totalTeachers} teachers`}
          </button>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Bulk Actions
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-48">
              <button
                onClick={() => {
                  onBulkAction('activate');
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-green-600 dark:text-green-400"
              >
                Activate Selected
              </button>
              <button
                onClick={() => {
                  onBulkAction('deactivate');
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400"
              >
                Deactivate Selected
              </button>
              <button
                onClick={() => {
                  onBulkAction('export');
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400"
              >
                Export Selected
              </button>
              <hr className="border-slate-200 dark:border-slate-600" />
              <button
                onClick={() => {
                  onBulkAction('delete');
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Import Teachers Component
const ImportTeachers = ({ onImportComplete, onClose }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['email', 'full_name', 'qualification'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required headers: ${missingHeaders.join(', ')}`]);
        setPreview([]);
        return;
      }

      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setPreview(previewData);
      setErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest('teachers/import', 'POST', formData, true);
      
      if (response.success) {
        toast.success(`Successfully imported ${response.imported} teachers`);
        if (response.failed > 0) {
          toast.warning(`${response.failed} teachers failed to import`);
        }
        onImportComplete();
        onClose();
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import teachers');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Import Teachers
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
            >
              Choose CSV File
            </label>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              {file ? file.name : 'No file selected'}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
              Required columns: email, full_name, qualification. Optional: specialization, employment_type, tsc_number
            </p>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="text-red-800 dark:text-red-300 font-medium mb-2">Validation Errors:</h4>
              <ul className="text-red-700 dark:text-red-400 text-sm list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Preview (first 5 rows):</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {Object.keys(preview[0] || {}).map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-slate-600 dark:text-slate-400">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importing || errors.length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Teachers
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Teacher Statistics Component
const TeacherStatistics = ({ teachers, subjects, streams }) => {
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter(t => t.status !== 'inactive').length;
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
      activeTeachers,
      teachersWithSubjects,
      avgSubjectsPerTeacher,
      specializationCount,
      employmentStats
    };
  }, [teachers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Teachers</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalTeachers}</p>
          </div>
          <Users className="w-8 h-8 text-blue-500" />
        </div>
        <div className="mt-4 flex items-center text-sm">
          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-slate-600 dark:text-slate-400">{stats.activeTeachers} active</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
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
  const [classrooms, setClassrooms] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    curriculum_specialization: '',
    specialization: '',
    employment_type: '',
    status: ''
  });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    qualification: '',
    employment_type: '',
    tsc_number: '',
    specialization: '',
    curriculum_specialization: '', // Removed default value
    max_subjects: '',
    max_classes: '',
    status: 'active'
  });
  const [assignmentData, setAssignmentData] = useState({ 
    subject_ids: [], 
    stream_id: '' 
  });
  
  // Add school state
  const [school, setSchool] = useState(null);

  const curriculumOptions = ['CBC', '8-4-4', 'Both'];
  const specializationOptions = ['Sciences', 'Languages', 'Mathematics', 'Social Studies', 'Technical', 'Arts'];

  // Fetch school information to get primary curriculum
  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools', 'GET');
      setSchool(response.data || response);
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
  }, [schoolId, fetchSchoolInfo]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const teachersResponse = await apiRequest(`teachers/school/${schoolId}`, 'GET');
      const teachersData = teachersResponse?.data || teachersResponse?.teachers || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      
      const rolesResponse = await apiRequest('roles', 'GET');
      const teacherRole = Array.isArray(rolesResponse) 
        ? rolesResponse.find(role => role.name === 'Teacher' || role.name === 'teacher')
        : null;
      
      if (teacherRole) {
        const usersResponse = await apiRequest(`users?role_id=${teacherRole.id}`, 'GET');
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      }
      
      const [classroomsResponse, streamsResponse, subjectsResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest('streams', 'GET'),
        apiRequest(`subjects`, 'GET')
      ]);
      
      const classroomsData = Array.isArray(classroomsResponse) 
        ? classroomsResponse 
        : (classroomsResponse?.data || []);
      
      const streamsData = Array.isArray(streamsResponse) 
        ? streamsResponse 
        : (streamsResponse?.data || []);
        
      const subjectsData = Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []);
      
      const filteredClassrooms = classroomsData.filter(c => c.school_id === schoolId);
      const filteredStreams = streamsData.filter(s => s.school_id === schoolId);
      
      setClassrooms(filteredClassrooms);
      setStreams(filteredStreams);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

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
      
      const matchesStatus = !filters.status || 
        teacher.status === filters.status;
      
      return matchesSearch && matchesCurriculum && matchesSpecialization && matchesEmployment && matchesStatus;
    });
  }, [teachers, searchTerm, filters]);

  // --- Selection Management ---
  const toggleTeacherSelection = (teacherId) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(filteredTeachers.map(t => t.id));
    }
  };

  // --- Bulk Operations ---
  const handleBulkAction = async (action) => {
    if (selectedTeachers.length === 0) return;

    try {
      setLoading(true);
      
      switch (action) {
        case 'activate':
          await apiRequest('teachers/bulk-activate', 'PUT', { teacher_ids: selectedTeachers });
          toast.success(`Activated ${selectedTeachers.length} teachers`);
          break;
        case 'deactivate':
          await apiRequest('teachers/bulk-deactivate', 'PUT', { teacher_ids: selectedTeachers });
          toast.success(`Deactivated ${selectedTeachers.length} teachers`);
          break;
        case 'export':
          await handleExport(selectedTeachers);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedTeachers.length} teachers? This action cannot be undone.`)) {
            await apiRequest('teachers/bulk-delete', 'DELETE', { teacher_ids: selectedTeachers });
            toast.success(`Deleted ${selectedTeachers.length} teachers`);
          }
          break;
      }
      
      fetchInitialData();
      setSelectedTeachers([]);
    } catch (error) {
      toast.error(`Failed to perform bulk action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Export Functionality ---
  const handleExport = async (teacherIds = null) => {
    setExporting(true);
    try {
      const endpoint = teacherIds ? 'teachers/export-selected' : 'teachers/export';
      const payload = teacherIds ? { teacher_ids: teacherIds } : { school_id: schoolId };
      
      const response = await apiRequest(endpoint, 'POST', payload);
      
      if (response.download_url) {
        window.open(response.download_url, '_blank');
        toast.success('Export completed successfully');
      } else {
        throw new Error('No download URL received');
      }
    } catch (error) {
      toast.error('Failed to export teachers data');
    } finally {
      setExporting(false);
    }
  };

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedTeacher(null);
    
    // Set default curriculum based on school's primary curriculum
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
      max_classes: '',
      status: 'active'
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
      max_classes: teacher.max_classes || '',
      status: teacher.status || 'active'
    });
  };

  const showManageSubjectsView = (teacher) => {
    setView('manage-subjects');
    setSelectedTeacher(teacher);
    const subjectIds = teacher.subjects?.map(s => s.id) || [];
    setAssignmentData({ subject_ids: subjectIds, stream_id: '' });
  };

  const backToList = () => {
    setView('list');
    setSelectedTeacher(null);
    setSelectedTeachers([]);
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
      
      // Only include curriculum_specialization if it's needed
      if (school && school.primary_curriculum !== 'Both') {
        delete payload.curriculum_specialization;
      }
      
      if (view === 'edit') {
        await apiRequest(`teachers/${selectedTeacher.id}`, 'PUT', payload);
        toast.success('Teacher updated successfully');
      } else {
        await apiRequest('teachers', 'POST', payload);
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

  const handleSaveSubjectAssignments = async () => {
    setLoading(true);
    try {
      await apiRequest(`subject-assignments`, 'POST', {
        teacher_id: selectedTeacher.id,
        subject_ids: assignmentData.subject_ids
      });
      toast.success('Subject assignments updated successfully');
      backToList();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update subject assignments.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      curriculum_specialization: '',
      specialization: '',
      employment_type: '',
      status: ''
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
                School Primary Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>
                {school.primary_curriculum}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowImport(true)} 
            className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button 
            onClick={() => handleExport()} 
            disabled={exporting}
            className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600 flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </button>
          <button 
            onClick={showCreateForm} 
            disabled={!school}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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

      <BulkActions
        selectedTeachers={selectedTeachers}
        onBulkAction={handleBulkAction}
        onSelectAll={toggleSelectAll}
        allSelected={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
        totalTeachers={filteredTeachers.length}
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

      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
            Existing Teachers ({filteredTeachers.length})
          </h2>
          {selectedTeachers.length > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {selectedTeachers.length} selected
            </span>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium w-8">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Qualification</th>
                  <th className="px-6 py-4 font-medium">Specialization</th>
                  <th className="px-6 py-4 font-medium">Curriculum</th>
                  <th className="px-6 py-4 font-medium">Employment</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Max Load</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={() => toggleTeacherSelection(teacher.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          {teacher.user?.full_name || teacher.user?.name || 'Unknown'}
                          {teacher.status === 'inactive' && (
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs">
                              Inactive
                            </span>
                          )}
                        </div>
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
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        }`}>
                          {teacher.curriculum_specialization}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {teacher.employment_type || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          teacher.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                        }`}>
                          {teacher.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <span className="text-xs">
                          {teacher.max_subjects || '—'} / {teacher.max_classes || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => showManageSubjectsView(teacher)} 
                            className="p-2 text-slate-500 hover:text-green-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Manage Subjects"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => showEditForm(teacher)} 
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher.id)} 
                            className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                    <td colSpan="10" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select 
                id="status"
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/20">
              {subjects.length > 0 ? (
                subjects.map(subject => (
                  <label key={subject.id} className="flex items-center space-x-3 p-3 hover:bg-white dark:hover:bg-slate-800 rounded cursor-pointer transition-colors">
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
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No subjects available</p>
              )}
            </div>
          </div>
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
              disabled={loading} 
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
      {showImport && (
        <ImportTeachers 
          onImportComplete={fetchInitialData}
          onClose={() => setShowImport(false)}
        />
      )}
      
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Teachers...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-subjects' && renderManageSubjectsView()}
    </div>
  );
}

export default TeacherManager;
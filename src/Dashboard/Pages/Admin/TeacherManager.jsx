// src/Dashboard/Pages/Admin/TeacherManager.jsx
import React, { useEffect, useState, useMemo } from 'react';
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
  AlertCircle
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
      option.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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

function TeacherManager() {
  const { user, schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]); // Added to store available users
  const [classrooms, setClassrooms] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'manage-subjects', 'manage-assignments'
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    qualification: '',
    employment_type: '',
    tsc_number: '',
  });
  const [assignmentData, setAssignmentData] = useState({ 
    subject_ids: [], 
    classroom_id: '', 
    stream_id: '' 
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch teachers using the correct endpoint
      const teachersResponse = await apiRequest(`teachers/school/${schoolId}`, 'GET');
      const teachersData = teachersResponse?.teachers || teachersResponse?.data || [];
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      
      // Fetch users with teacher role specifically
      // We need to first get the teacher role ID
      const rolesResponse = await apiRequest('roles', 'GET');
      const teacherRole = Array.isArray(rolesResponse) 
        ? rolesResponse.find(role => role.name === 'Teacher' || role.name === 'teacher')
        : null;
      
      if (teacherRole) {
        // Fetch users with teacher role who aren't already teachers
        const usersResponse = await apiRequest(`users?role_id=${teacherRole.id}&exclude_teachers=1`, 'GET');
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      }
      
      // Fetch other data
      const [classroomsResponse, streamsResponse, subjectsResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest('streams', 'GET'),
        apiRequest(`subjects/school/${schoolId}`, 'GET')
      ]);
      
      // Handle different response structures
      const classroomsData = Array.isArray(classroomsResponse) 
        ? classroomsResponse 
        : (classroomsResponse?.data || []);
      
      const streamsData = Array.isArray(streamsResponse) 
        ? streamsResponse 
        : (streamsResponse?.data || []);
        
      const subjectsData = subjectsResponse?.subjects || [];
      
      // Filter classrooms and streams by school_id
      const filteredClassrooms = classroomsData.filter(c => c.school_id === schoolId);
      const filteredStreams = streamsData.filter(s => s.school_id === schoolId);
      
      setClassrooms(filteredClassrooms);
      setStreams(filteredStreams);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedTeacher(null);
    setFormData({ 
      user_id: '', 
      qualification: '', 
      employment_type: '', 
      tsc_number: '' 
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
    });
  };

  const showManageSubjectsView = (teacher) => {
    setView('manage-subjects');
    setSelectedTeacher(teacher);
    const subjectIds = teacher.subjects?.map(s => s.id) || [];
    setAssignmentData({ subject_ids: subjectIds, classroom_id: '', stream_id: '' });
  };

  const showManageAssignmentsView = (teacher) => {
    setView('manage-assignments');
    setSelectedTeacher(teacher);
    setAssignmentData({ 
      subject_ids: [], 
      classroom_id: '', 
      stream_id: '' 
    });
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
      const selectedIds = Array.from(options, option => Number(option.value));
      setAssignmentData(prev => ({ ...prev, subject_ids: selectedIds }));
    } else {
      setAssignmentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Don't include school_id in the payload as it's set from the authenticated user
      const payload = { ...formData };
      
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
        // Show specific validation errors
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
      await apiRequest(`teachers/${selectedTeacher.id}/assign-subjects`, 'POST', { 
        subject_ids: assignmentData.subject_ids 
      });
      toast.success('Subject assignments updated successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to update subject assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClassroom = async () => {
    if (!assignmentData.classroom_id) {
      toast.error('Please select a classroom');
      return;
    }
    try {
      await apiRequest(`teachers/${selectedTeacher.id}/assign-classroom`, 'POST', { 
        classroom_id: assignmentData.classroom_id 
      });
      toast.success('Teacher assigned to classroom successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to assign teacher to classroom.');
    }
  };

  const handleAssignToStream = async () => {
    if (!assignmentData.stream_id) {
      toast.error('Please select a stream');
      return;
    }
    try {
      await apiRequest(`teachers/${selectedTeacher.id}/assign-stream`, 'POST', { 
        stream_id: assignmentData.stream_id 
      });
      toast.success('Teacher assigned to stream successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to assign teacher to stream.');
    }
  };
  
  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Teacher Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">Manage teaching staff, their assignments, and qualifications.</p>
        </div>
        <button onClick={showCreateForm} className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          <Plus className="inline-block w-5 h-5 mr-2" />
          New Teacher
        </button>
      </div>

      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">Existing Teachers</h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Qualification</th>
                  <th className="px-6 py-4 font-medium">TSC Number</th>
                  <th className="px-6 py-4 font-medium">Assignments</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {teacher.user?.full_name || teacher.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {teacher.user?.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {teacher.qualification || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {teacher.tsc_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => showManageSubjectsView(teacher)} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <BookOpen className="w-4 h-4" />
                            <span>{teacher.subjects?.length || 0} Subjects</span>
                          </button>
                          <button onClick={() => showManageAssignmentsView(teacher)} className="flex items-center gap-1 text-green-600 hover:underline">
                            <GraduationCap className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => showEditForm(teacher)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No teachers found.</td>
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {view === 'edit' ? 'Edit Teacher' : 'Create New Teacher'}
        </h3>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            User
          </label>
          <SearchableDropdown
            options={users}
            value={formData.user_id}
            onChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
            placeholder="Select a user"
            disabled={view === 'edit'} // Disable user selection in edit mode
          />
          {view === 'edit' && (
            <p className="text-xs text-slate-500 mt-1">User cannot be changed after creation</p>
          )}
          {users.length === 0 && view === 'create' && (
            <p className="text-xs text-red-500 mt-1">No available users with teacher role found. Please create a user with teacher role first.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Qualification
          </label>
          <input 
            type="text" 
            name="qualification" 
            value={formData.qualification} 
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Employment Type
          </label>
          <select 
            name="employment_type" 
            value={formData.employment_type} 
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select employment type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            TSC Number
          </label>
          <input 
            type="text" 
            name="tsc_number" 
            value={formData.tsc_number} 
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={backToList} 
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || (view === 'create' && users.length === 0)} 
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : (view === 'edit' ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderManageSubjectsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />Manage Subjects
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            For Teacher: {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
          </p>
        </div>
        <button 
          onClick={backToList} 
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Assign Subjects to this Teacher
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg border-slate-300 dark:border-slate-600 p-3">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
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
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {subject.name}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={backToList} 
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveSubjectAssignments} 
            disabled={loading} 
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderManageAssignmentsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />Manage Assignments
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            For Teacher: {selectedTeacher?.user?.full_name || selectedTeacher?.user?.name}
          </p>
        </div>
        <button 
          onClick={backToList} 
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Assign as Class Teacher of Stream
          </label>
          <select 
            name="stream_id" 
            value={assignmentData.stream_id} 
            onChange={handleAssignmentChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select a stream</option>
            {streams.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Note: A teacher can only be a class teacher for one stream</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Add to Teaching Staff of Stream
          </label>
          <select 
            name="teaching_stream_id" 
            value={assignmentData.teaching_stream_id || ''} 
            onChange={handleAssignmentChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select a stream</option>
            {streams.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Add this teacher to the teaching staff of a stream</p>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={backToList} 
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (assignmentData.stream_id) {
                handleAssignToStream();
              } else if (assignmentData.teaching_stream_id) {
                handleAssignToTeachingStream();
              } else {
                toast.error('Please select an assignment option');
              }
            }} 
            disabled={loading} 
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">
            Unable to access teacher management
          </p>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg max-w-md">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Debug Info:</p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ 
                hasUser: !!user, 
                schoolId: schoolId,
                userKeys: user ? Object.keys(user) : []
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Teachers...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-subjects' && renderManageSubjectsView()}
      {view === 'manage-assignments' && renderManageAssignmentsView()}
    </div>
  );
}

export default TeacherManager;
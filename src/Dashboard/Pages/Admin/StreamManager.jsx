import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  Plus, 
  X, 
  UserPlus, 
  UserMinus,
  GraduationCap,
  Crown,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { toast } from "react-toastify";

function StreamManager() {
  const { user, loading: authLoading } = useAuth();
  
  const [streams, setStreams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allClassTeachers, setAllClassTeachers] = useState([]);
  const [streamDetails, setStreamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [schoolHasStreams, setSchoolHasStreams] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState(null);
  
  const [selectedStream, setSelectedStream] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    class_id: '', 
    class_teacher_id: '',
    capacity: '' 
  });

  // For managing teaching staff
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [availableTeachersForStream, setAvailableTeachersForStream] = useState([]);
  const [isSavingTeachers, setIsSavingTeachers] = useState(false);

  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;

  useEffect(() => {
    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId]);

  const fetchSchoolInfo = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`schools/${schoolId}`, 'GET');
      const schoolData = response?.data || response || {};
      setSchoolInfo(schoolData);
      setSchoolHasStreams(schoolData.has_streams || false);
      
      if (schoolData.has_streams) {
        fetchInitialData();
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load school information';
      toast.error(errorMessage);
      console.error('Fetch school info error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [streamsResponse, classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('streams', 'GET'),
        apiRequest('classrooms', 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET')
      ]);
      
      const streamsData = streamsResponse?.data || streamsResponse || [];
      const classroomsData = classroomsResponse?.data || classroomsResponse || [];
      const teachersData = teachersResponse?.teachers || teachersResponse?.data || teachersResponse || [];
      
      setStreams(streamsData);
      setClassrooms(classroomsData);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load data';
      toast.error(errorMessage);
      console.error('Fetch error:', error);
      
      setStreams([]);
      setClassrooms([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const showCreateForm = () => {
    setView('create');
    setSelectedStream(null);
    setFormData({ name: '', class_id: '', class_teacher_id: '', capacity: '' });
  };

  const showEditForm = (stream) => {
    setView('edit');
    setSelectedStream(stream);
    setFormData({
      name: stream.name,
      class_id: stream.class_id || '',
      class_teacher_id: stream.class_teacher_id || '',
      capacity: stream.capacity || ''
    });
  };

  const showManageTeachersView = async (stream) => {
    setView('manage-teachers');
    setSelectedStream(stream);
    setLoading(true);

    // Use stream object from list as base
    let detailedStream = { ...stream };

    try {
      // Fetch specific list of teachers assigned to this stream
      const response = await apiRequest(`streams/${stream.id}/teachers`, 'GET');
      const teachersFromApi = response?.teachers || response?.data?.teachers || [];

      // Update teachers list on our base stream object
      detailedStream.teachers = teachersFromApi;

      // Set selected teachers based on API response
      setSelectedTeachers(teachersFromApi.map(t => t.id));

    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not fetch teaching staff list';
      toast.error(errorMessage);
      setSelectedTeachers([]);
    } finally {
      setStreamDetails(detailedStream);
      setLoading(false);
    }
  };

  const showAllClassTeachersView = async () => {
    setView('all-class-teachers');
    setLoading(true);
    try {
      const response = await apiRequest('streams/class-teachers', 'GET');
      setAllClassTeachers(response?.data || response || []);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to fetch class teachers';
      toast.error(errorMessage);
      setAllClassTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedStream(null);
    setStreamDetails(null);
    setSelectedTeachers([]);
    setAvailableTeachersForStream([]);
    fetchInitialData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (view === 'edit') {
        const payload = { 
          name: formData.name.trim()
        };
        
        if (formData.class_id && formData.class_id !== selectedStream.class_id) {
          payload.class_id = parseInt(formData.class_id, 10);
        }
        
        if (formData.capacity) {
          payload.capacity = parseInt(formData.capacity, 10);
        }
        
        if (formData.class_teacher_id !== undefined) {
          payload.class_teacher_id = formData.class_teacher_id ? parseInt(formData.class_teacher_id, 10) : null;
        }
        
        await apiRequest(`streams/${selectedStream.id}`, 'PUT', payload);
        toast.success('Stream updated successfully');
      } else {
        if (!formData.name.trim()) {
          toast.error('Please enter a stream name');
          setLoading(false);
          return;
        }
        
        if (!formData.class_id) {
          toast.error('Please select a classroom');
          setLoading(false);
          return;
        }
        
        if (!formData.capacity) {
          toast.error('Please enter a capacity');
          setLoading(false);
          return;
        }
        
        if (parseInt(formData.capacity, 10) < 1) {
          toast.error('Capacity must be at least 1');
          setLoading(false);
          return;
        }
        
        const payload = { 
          name: formData.name.trim(),
          class_id: parseInt(formData.class_id, 10),
          capacity: parseInt(formData.capacity, 10)
        };

        if (formData.class_teacher_id) {
          payload.class_teacher_id = parseInt(formData.class_teacher_id, 10);
        }
        
        await apiRequest('streams', 'POST', payload);
        toast.success('Stream created successfully');
      }
      
      backToList();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      const validationErrors = error?.response?.data?.errors;
      const existingStream = error?.response?.data?.existing_stream;
      
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) 
            ? validationErrors[key].join(', ') 
            : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
        
        // Show existing stream info if available
        if (existingStream) {
          toast.info(`Teacher is already assigned to stream: ${existingStream}`);
        }
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} stream: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiRequest(`streams/${id}`, 'DELETE');
        toast.success('Stream deleted successfully');
        fetchInitialData();
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete stream';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignClassTeacher = async (streamId, teacherId) => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      await apiRequest(`streams/${streamId}/assign-class-teacher`, 'POST', { 
        teacher_id: parseInt(teacherId, 10)
      });
      toast.success('Class teacher assigned successfully');
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to assign class teacher';
      const validationErrors = error?.response?.data?.errors;
      const existingStream = error?.response?.data?.existing_stream;
      
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) 
            ? validationErrors[key].join(', ') 
            : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
        
        // Show existing stream info if available
        if (existingStream) {
          toast.info(`Teacher is already assigned to stream: ${existingStream}`);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClassTeacher = async (streamId) => {
    if (!window.confirm('Remove class teacher from this stream?')) return;
    
    setLoading(true);
    try {
      await apiRequest(`streams/${streamId}/remove-class-teacher`, 'DELETE');
      toast.success('Class teacher removed successfully');
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to remove class teacher';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning/removing teaching staff
  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const handleSaveTeachingStaff = async () => {
    if (!selectedStream) return;
    
    setIsSavingTeachers(true);
    try {
      await apiRequest(`streams/${selectedStream.id}/assign-teachers`, 'POST', {
        teacher_ids: selectedTeachers
      });
      toast.success('Teaching staff updated successfully');
      backToList();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to update teaching staff';
      const validationErrors = error?.response?.data?.errors;
      
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) 
            ? validationErrors[key].join(', ') 
            : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSavingTeachers(false);
    }
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unknown';
    
    // Try different possible structures for teacher data
    if (teacher.user) {
      if (teacher.user.full_name) return teacher.user.full_name;
      if (teacher.user.name) return teacher.user.name;
      if (teacher.user.first_name && teacher.user.last_name) {
        return `${teacher.user.first_name} ${teacher.user.last_name}`;
      }
      if (teacher.user.first_name) return teacher.user.first_name;
    }
    
    if (teacher.full_name) return teacher.full_name;
    if (teacher.name) return teacher.name;
    if (teacher.first_name && teacher.last_name) {
      return `${teacher.first_name} ${teacher.last_name}`;
    }
    if (teacher.first_name) return teacher.first_name;
    
    return `Teacher #${teacher.id}`;
  };

  const getAvailableTeachers = (currentStreamId = null) => {
    if (!Array.isArray(teachers)) return [];
    
    const assignedTeacherIds = streams
      .filter(s => s.class_teacher_id && s.id !== currentStreamId)
      .map(s => s.class_teacher_id);
    
    return teachers.filter(t => !assignedTeacherIds.includes(t.id));
  };

  const renderStreamsDisabledView = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 max-w-md text-center">
        <Settings className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Streams Not Enabled
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your school does not have streams enabled. Contact your administrator to enable this feature.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            What are streams?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Streams allow you to divide students in the same classroom into different groups 
            for better management and organization. This is commonly used in larger schools 
            to manage class sizes and provide specialized teaching approaches.
          </p>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Stream Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            Manage streams, assign class teachers, and manage teaching staff.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={showAllClassTeachersView} 
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Crown className="inline-block w-5 h-5 mr-2" />
            View Class Teachers
          </button>
          <button 
            onClick={showCreateForm} 
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="inline-block w-5 h-5 mr-2" />
            New Stream
          </button>
        </div>
      </div>

      {teachers.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            No teachers found for your school. Please add teachers first.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
          Existing Streams
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Stream Name</th>
                  <th className="px-6 py-4 font-medium">Classroom</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Class Teacher</th>
                  <th className="px-6 py-4 font-medium">Staff</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {streams.length > 0 ? (
                  streams.map((stream) => {
                    const availableTeachers = getAvailableTeachers(stream.id);
                    const classTeacher = stream.classTeacher || stream.class_teacher;
                    
                    return (
                      <tr key={stream.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {stream.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {stream.classroom?.class_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {stream.capacity || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {classTeacher ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{getTeacherName(classTeacher)}</span>
                              <button 
                                onClick={() => handleRemoveClassTeacher(stream.id)} 
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Remove class teacher"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <select 
                              onChange={(e) => handleAssignClassTeacher(stream.id, e.target.value)}
                              className="text-xs border border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                              defaultValue=""
                              disabled={availableTeachers.length === 0}
                            >
                              <option value="" disabled>
                                {availableTeachers.length === 0 ? 'No teachers available' : 'Assign Teacher'}
                              </option>
                              {availableTeachers.map(t => (
                                <option key={t.id} value={t.id}>
                                  {getTeacherName(t)}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          <button 
                            onClick={() => showManageTeachersView(stream)} 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span>Manage ({stream.teachers?.length || 0})</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => showEditForm(stream)} 
                              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Edit stream"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(stream.id)} 
                              className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Delete stream"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No streams found. Create one to get started.
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
    const availableTeachers = view === 'edit' 
      ? getAvailableTeachers(selectedStream?.id)
      : getAvailableTeachers();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {view === 'edit' ? 'Edit Stream' : 'Create New Stream'}
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
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stream Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                id="name"
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required
                placeholder="e.g., Stream A, Blue Stream"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
              />
            </div>
            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Classroom <span className="text-red-500">*</span>
              </label>
              <select
                id="class_id"
                name="class_id" 
                value={formData.class_id} 
                onChange={handleInputChange} 
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
              >
                <option value="">Select a classroom</option>
                {Array.isArray(classrooms) && classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input 
                type="number"
                id="capacity"
                name="capacity" 
                value={formData.capacity} 
                onChange={handleInputChange} 
                required
                min="1"
                placeholder="Maximum number of students"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
              />
            </div>
            <div>
              <label htmlFor="class_teacher_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Class Teacher
              </label>
              <select
                id="class_teacher_id"
                name="class_teacher_id" 
                value={formData.class_teacher_id} 
                onChange={handleInputChange}
                disabled={availableTeachers.length === 0}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option value="">
                  {availableTeachers.length === 0 ? 'No teachers available' : 'Select a teacher (optional)'}
                </option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {getTeacherName(teacher)}
                  </option>
                ))}
              </select>
              {availableTeachers.length === 0 && teachers.length > 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  All teachers are already assigned as class teachers
                </p>
              )}
              {teachers.length === 0 && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  No teachers found. Please add teachers first.
                </p>
              )}
              {formData.class_teacher_id && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  <CheckCircle className="inline-block w-3 h-3 mr-1" />
                  This teacher will be automatically added to teaching staff
                </p>
              )}
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
                  view === 'edit' ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderManageTeachersView = () => {
    const classTeacher = streamDetails?.classTeacher || streamDetails?.class_teacher;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5"/>
                Manage Teaching Staff
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedStream?.name} - {selectedStream?.classroom?.class_name}
              </p>
            </div>
            <button 
              onClick={backToList} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stream Information */}
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Stream Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Capacity:</span>
                      <p className="font-medium text-slate-900 dark:text-white">{streamDetails?.capacity || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Class Teacher:</span>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {classTeacher ? getTeacherName(classTeacher) : 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                  {classTeacher && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                      <CheckCircle className="inline-block w-3 h-3 mr-1" />
                      The class teacher is automatically included in teaching staff
                    </div>
                  )}
                </div>

                {/* Current Teaching Staff */}
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Current Teaching Staff ({streamDetails?.teachers?.length || 0})
                  </h4>
                  {streamDetails?.teachers && streamDetails.teachers.length > 0 ? (
                    <div className="space-y-2">
                      {streamDetails.teachers.map(teacher => {
                        const isClassTeacher = streamDetails?.class_teacher_id === teacher.id;
                        
                        return (
                          <div key={teacher.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                            <div className="flex items-center gap-3">
                              <GraduationCap className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="text-slate-900 dark:text-white font-medium">{getTeacherName(teacher)}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {teacher.qualification || 'Teacher'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isClassTeacher && (
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                  Class Teacher
                                </span>
                              )}
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                Teaching
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>No teachers assigned to this stream yet.</p>
                    </div>
                  )}
                </div>

                {/* Assign Teachers Section */}
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                    Assign Teachers to Stream
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Select teachers who will teach in this stream
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teachers.length > 0 ? (
                      teachers.map(teacher => {
                        const isSelected = selectedTeachers.includes(teacher.id);
                        const isClassTeacher = streamDetails?.class_teacher_id === teacher.id;
                        
                        return (
                          <div 
                            key={teacher.id} 
                            className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                                : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            } ${isClassTeacher ? 'opacity-75 cursor-not-allowed' : ''}`}
                            onClick={() => !isClassTeacher && handleTeacherToggle(teacher.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-slate-300 dark:border-slate-600'
                              } ${isClassTeacher ? 'bg-purple-600 border-purple-600' : ''}`}>
                                {(isSelected || isClassTeacher) && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div>
                                <p className="text-slate-900 dark:text-white font-medium">
                                  {getTeacherName(teacher)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {teacher.qualification || 'No qualification specified'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isClassTeacher && (
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                  Class Teacher
                                </span>
                              )}
                              {isSelected && !isClassTeacher && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  Teaching
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>No teachers available</p>
                      </div>
                    )}
                  </div>
                  {streamDetails?.class_teacher_id && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle className="inline-block w-3 h-3 mr-1" />
                      The class teacher cannot be removed from teaching staff
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={backToList} 
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleSaveTeachingStaff} 
                    disabled={isSavingTeachers}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {isSavingTeachers ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Save Teaching Staff
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAllClassTeachersView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5"/>
              All Class Teachers
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View all streams and their assigned class teachers.
            </p>
          </div>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {allClassTeachers.length > 0 ? (
                allClassTeachers.map(stream => {
                  const classTeacher = stream.classTeacher || stream.class_teacher;
                  
                  return (
                    <div 
                      key={stream.id} 
                      className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{stream.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Classroom: {stream.classroom?.class_name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {classTeacher ? getTeacherName(classTeacher) : 'Not Assigned'}
                        </p>
                        <p className="text-xs text-slate-500">Class Teacher</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No class teachers assigned yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user || !schoolId) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">
            Unable to access stream management
          </p>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
          </p>
        </div>
      </div>
    );
  }

  // Show streams disabled view if school doesn't have streams enabled
  if (!loading && !schoolHasStreams) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              Stream Management
            </h1>
            <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
              Manage streams, assign class teachers, and manage teaching staff.
            </p>
          </div>
        </div>
        {renderStreamsDisabledView()}
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Streams...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-teachers' && renderManageTeachersView()}
      {view === 'all-class-teachers' && renderAllClassTeachersView()}
    </div>
  );
}

export default StreamManager;
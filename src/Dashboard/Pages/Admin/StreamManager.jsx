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
  Settings,
  MapPin,
  ChevronRight,
  RefreshCw,
  UserCheck,
  UserX,
  Info,
  CheckSquare,
  Square
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

  // New state variables from design guide
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    streamId: null,
    streamName: ''
  });
  const [showClassTeacherModal, setShowClassTeacherModal] = useState(false);
  const [selectedStreamForClassTeacher, setSelectedStreamForClassTeacher] = useState(null);
  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    stream: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  // New state for remove class teacher modal
  const [removeClassTeacherModal, setRemoveClassTeacherModal] = useState({
    isOpen: false,
    streamId: null,
    streamName: '',
    teacherName: ''
  });

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

  // Mobile bottom sheet touch handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 100) {
      closeMobileSheet();
    }
    setDragOffset(0);
  };

  const openMobileSheet = (stream) => {
    setMobileSheet({ isOpen: true, stream });
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, stream: null });
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  const openClassTeacherModal = (stream) => {
    setSelectedStreamForClassTeacher(stream);
    setShowClassTeacherModal(true);
  };

  // Filter streams based on search term
  const filteredStreams = streams.filter(stream =>
    stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stream.classroom?.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (stream) => {
    if (mobileSheet.isOpen) {
      closeMobileSheet();
    }
    setDeleteModal({
      isOpen: true,
      streamId: stream.id,
      streamName: stream.name
    });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`streams/${deleteModal.streamId}`, 'DELETE');
      toast.success(`${deleteModal.streamName} deleted successfully`);
      setDeleteModal({ isOpen: false, streamId: null, streamName: '' });
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete stream';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
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

  const openRemoveClassTeacherModal = (stream) => {
    const classTeacher = stream.classTeacher || stream.class_teacher;
    setRemoveClassTeacherModal({
      isOpen: true,
      streamId: stream.id,
      streamName: stream.name,
      teacherName: getTeacherName(classTeacher)
    });
  };

  const handleRemoveClassTeacher = async (streamId) => {
    setLoading(true);
    try {
      await apiRequest(`streams/${streamId}/remove-class-teacher`, 'DELETE');
      toast.success('Class teacher removed successfully');
      setRemoveClassTeacherModal({ isOpen: false, streamId: null, streamName: '', teacherName: '' });
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
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
          <h3 className="font-medium text-cyan-900 dark:text-cyan-100 mb-2">
            What are streams?
          </h3>
          <p className="text-sm text-cyan-800 dark:text-cyan-200">
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
      {/* Header and Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Stream Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage streams, assign class teachers, and manage teaching staff
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
              Streams Enabled
            </span>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          {/* Desktop Buttons */}
          <button
            onClick={showAllClassTeachersView}
            className="hidden md:flex items-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-600 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            <Crown className="w-4 h-4" />
            View Class Teachers
          </button>
          <button
            onClick={showCreateForm}
            className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            New Stream
          </button>
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Buttons */}
      <div className="md:hidden mb-4 space-y-2">
        <button
          onClick={showCreateForm}
          className="w-full bg-black text-white px-3 py-2.5 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          New Stream
        </button>
        <button
          onClick={showAllClassTeachersView}
          className="w-full bg-slate-700 text-white px-3 py-2.5 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-600 flex items-center justify-center gap-2 text-sm dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          <Crown className="w-4 h-4" />
          View Class Teachers
        </button>
      </div>

      {!loading && teachers.length === 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> No teachers found for your school. Please add teachers first.
            </p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">
        {/* Mobile: Collapsible Filters */}
        <div className="block md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Filters
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({filteredStreams.length}/{streams.length})
              </span>
            </div>
            {showFilters ? (
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {showFilters && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by stream or classroom name..."
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
        {/* Desktop: Always Visible Filters */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex flex-col gap-1 sm:gap-2 sm:col-span-2 lg:col-span-1">
              <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by stream or classroom name..."
                className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="flex items-end col-span-1 lg:col-span-1">
              <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold">{filteredStreams.length}</span> of <span className="font-semibold">{streams.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
          Existing Streams
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Stream Name</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Classroom</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Capacity</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Class Teacher</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Staff</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStreams.length > 0 ? (
                  filteredStreams.map((stream) => {
                    const availableTeachers = getAvailableTeachers(stream.id);
                    const classTeacher = stream.classTeacher || stream.class_teacher;
                    const displayCapacity = stream.capacity || 0;
                    const studentCount = stream.student_count || 0;
                    const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
                    
                    return (
                      <tr key={stream.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-white">
                          {stream.name}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {stream.classroom?.class_name || 'N/A'}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-900 dark:text-white">
                                {studentCount} / {displayCapacity}
                              </span>
                              <span className="text-xs text-slate-500">
                                ({utilizationPercentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  utilizationPercentage >= 90 ? 'bg-red-500' :
                                  utilizationPercentage >= 75 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {classTeacher ? (
                            <div className="flex items-center gap-1">
                              <span>{getTeacherName(classTeacher)}</span>
                              <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                                Class Teacher
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {stream.teachers?.length > 0 ? (
                            <button 
                              onClick={() => showManageTeachersView(stream)} 
                              className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 hover:underline transition-colors"
                            >
                              <Users className="w-4 h-4" />
                              <span>{stream.teachers?.length || 0} Teacher(s)</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">No teachers</span>
                          )}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => showEditForm(stream)} 
                              className="p-1.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Edit stream"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => openClassTeacherModal(stream)} 
                              className="p-1.5 text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Manage class teacher"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(stream)} 
                              className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Delete stream"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                      {streams.length === 0
                        ? 'No streams found. Create one to get started.'
                        : 'No streams match current filters.'
                      }
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
        {filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => {
            const classTeacher = stream.classTeacher || stream.class_teacher;
            const displayCapacity = stream.capacity || 0;
            const studentCount = stream.student_count || 0;
            const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
            
            return (
              <button
                key={stream.id}
                onClick={() => openMobileSheet(stream)}
                className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {stream.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {stream.classroom?.class_name || 'No classroom'} • {stream.teachers?.length || 0} teachers
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Capacity</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {studentCount} / {displayCapacity}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        utilizationPercentage >= 90 ? 'bg-red-500' :
                        utilizationPercentage >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      {displayCapacity - studentCount} slots available
                    </span>
                    <span className={`font-medium ${
                      utilizationPercentage >= 90 ? 'text-red-600 dark:text-red-400' :
                      utilizationPercentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {utilizationPercentage}%
                    </span>
                  </div>
                </div>
                {classTeacher && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Class Teacher: <span className="font-medium text-slate-900 dark:text-white">
                          {getTeacherName(classTeacher)}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {streams.length === 0
                ? 'No streams found. Create one to get started.'
                : 'No streams match current filters.'
              }
            </p>
          </div>
        )}
      </div>
    </>
  );

  const renderFormView = () => {
    const availableTeachers = view === 'edit' 
      ? getAvailableTeachers(selectedStream?.id)
      : getAvailableTeachers();

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transform transition-all duration-200 scale-100">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              {view === 'edit' ? 'Edit Stream' : 'Create New Stream'}
            </h3>
            <button 
              onClick={backToList} 
              className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close form"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white transition-all"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-400">
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
                className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px] dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800/50 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5"/>
                Manage Teaching Staff
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedStream?.name} - {selectedStream?.classroom?.class_name}
              </p>
            </div>
            <button 
              onClick={backToList} 
              className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
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
                    <div className="mt-3 p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded text-xs text-cyan-700 dark:text-cyan-300">
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
                              <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
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
                                ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800' 
                                : 'bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            } ${isClassTeacher ? 'opacity-75 cursor-not-allowed' : ''}`}
                            onClick={() => !isClassTeacher && handleTeacherToggle(teacher.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-cyan-600 border-cyan-600' 
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
                                <span className="text-xs px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded">
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
                    className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800/50 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5"/>
              All Class Teachers
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              View all streams and their assigned class teachers.
            </p>
          </div>
          <button 
            onClick={backToList} 
            className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
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
                  Delete Stream
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.streamName}"</span>?
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
                  <strong>Warning:</strong> This will permanently delete all data associated with this stream including teacher assignments and student records.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setDeleteModal({ isOpen: false, streamId: null, streamName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Stream
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Stream
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRemoveClassTeacherModal = () => {
    if (!removeClassTeacherModal.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  Remove Class Teacher
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to remove{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {removeClassTeacherModal.teacherName}
                  </span>{' '}
                  as class teacher from{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    "{removeClassTeacherModal.streamName}"
                  </span>?
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Note:</strong> This teacher will remain in the teaching staff but will no longer be the designated class teacher.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setRemoveClassTeacherModal({ isOpen: false, streamId: null, streamName: '', teacherName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRemoveClassTeacher(removeClassTeacherModal.streamId)}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  Remove Class Teacher
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderClassTeacherModal = () => {
    if (!showClassTeacherModal || !selectedStreamForClassTeacher) return null;
    
    const availableTeachers = getAvailableTeachers(selectedStreamForClassTeacher.id);
    const currentClassTeacher = selectedStreamForClassTeacher.classTeacher || selectedStreamForClassTeacher.class_teacher;
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
              Manage Class Teacher
            </h3>
            <button 
              onClick={() => setShowClassTeacherModal(false)} 
              className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <p className="text-sm text-[#4c739a] dark:text-slate-400 mb-1">Stream:</p>
              <p className="font-medium text-[#0d141b] dark:text-white">{selectedStreamForClassTeacher.name}</p>
            </div>
            
            {currentClassTeacher && (
              <div className="mb-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-800 dark:text-cyan-300 mb-1">Current Class Teacher:</p>
                    <p className="font-medium text-[#0d141b] dark:text-white">{getTeacherName(currentClassTeacher)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowClassTeacherModal(false);
                      openRemoveClassTeacherModal(selectedStreamForClassTeacher);
                    }}
                    className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove class teacher"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                {currentClassTeacher ? 'Change Class Teacher' : 'Assign Class Teacher'}
              </label>
              {currentClassTeacher && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                  <Info className="inline-block w-3 h-3 mr-1" />
                  Selecting a new teacher will automatically replace the current class teacher
                </p>
              )}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignClassTeacher(selectedStreamForClassTeacher.id, e.target.value);
                    setShowClassTeacherModal(false);
                  }
                }}
                defaultValue=""
                disabled={availableTeachers.length === 0}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option value="">
                  {availableTeachers.length === 0 ? 'No teachers available' : 'Select a teacher'}
                </option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {getTeacherName(teacher)}
                  </option>
                ))}
              </select>
              {availableTeachers.length === 0 && teachers.length > 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  All teachers are already assigned as class teachers to other streams
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.stream) return null;
    const stream = mobileSheet.stream;
    const classTeacher = stream.classTeacher || stream.class_teacher;
    const displayCapacity = stream.capacity || 0;
    const studentCount = stream.student_count || 0;
    const remainingCapacity = displayCapacity - studentCount;
    const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
    
    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-2xl md:hidden transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${dragOffset}px)`,
            maxHeight: '85vh'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {stream.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {stream.classroom?.class_name || 'No classroom'} • {stream.teachers?.length || 0} teachers
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
            {/* Capacity Overview */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Capacity Overview
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {studentCount} / {displayCapacity}
                  </span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    utilizationPercentage >= 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    utilizationPercentage >= 75 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {utilizationPercentage}% Full
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      utilizationPercentage >= 90 ? 'bg-red-500' :
                      utilizationPercentage >= 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">{remainingCapacity}</span> slots remaining
                </p>
              </div>
            </div>
            
            {/* Teaching Staff */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Teaching Staff
                </h3>
              </div>
              {stream.teachers?.length > 0 ? (
                <button
                  onClick={() => {
                    closeMobileSheet();
                    showManageTeachersView(stream);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      View {stream.teachers?.length || 0} Teacher(s)
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No teachers assigned</p>
              )}
            </div>
            
            {/* Class Teacher */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Class Teacher
                </h3>
              </div>
              {classTeacher ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {getTeacherName(classTeacher)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Primary contact for this stream
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Not assigned yet</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => {
                closeMobileSheet();
                showEditForm(stream);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Stream
            </button>
            <button
              onClick={() => {
                closeMobileSheet();
                openClassTeacherModal(stream);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-[0.98] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Manage Class Teacher
            </button>
            <button
              onClick={() => handleDelete(stream)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Stream
            </button>
          </div>
        </div>
      </>
    );
  };

  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Initializing...</p>
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
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
              Stream Management
            </h1>
            <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
              Manage streams, assign class teachers, and manage teaching staff
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                Streams Enabled
              </span>
            </div>
          </div>
        </div>
        {renderStreamsDisabledView()}
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Loading Streams...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-teachers' && renderManageTeachersView()}
      {view === 'all-class-teachers' && renderAllClassTeachersView()}
      {renderClassTeacherModal()}
      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
      {renderRemoveClassTeacherModal()}
    </div>
  );
}

export default StreamManager;
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Edit,
  Trash2,
  Loader,
  MapPin,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  Users,
  RefreshCw,
  UserCheck,
  UserX,
  UserPlus,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { toast } from "react-toastify";

function ClassroomManager() {
  const { user, loading: authLoading } = useAuth();

  // --- State Management ---
  const [classrooms, setClassrooms] = useState([]);
  const [streams, setStreams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    capacity: '',
  });

  // State for teacher assignment modal
  const [showTeacherAssignmentModal, setShowTeacherAssignmentModal] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [classTeacherId, setClassTeacherId] = useState(null);
  const [teacherClassroomAssignments, setTeacherClassroomAssignments] = useState({});
  const [teacherMaxClasses, setTeacherMaxClasses] = useState({});
  const [availableClassroomsForTeacher, setAvailableClassroomsForTeacher] = useState([]);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    classroomId: null,
    classroomName: ''
  });

  // Teacher removal modal state
  const [teacherRemovalModal, setTeacherRemovalModal] = useState({
    isOpen: false,
    teacherId: null,
    teacherName: '',
    classroomName: ''
  });

  // Mobile-specific states
  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    classroom: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Get schoolId from user object
  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;

  // Check if school has streams enabled
  const [hasStreams, setHasStreams] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest('teachers', 'GET')
      ]);
      const classroomsData = classroomsResponse?.data || classroomsResponse || [];
      const teachersData = teachersResponse?.data || teachersResponse || [];
      const streamsEnabled = classroomsResponse?.has_streams || false;
      setHasStreams(streamsEnabled);
      setAllTeachers(teachersData);

      // Create a map of teacher to their max_classes
      const teacherMaxClassesMap = {};
      teachersData.forEach(teacher => {
        teacherMaxClassesMap[teacher.id] = teacher.max_classes || 10; // Default to 10 if not set
      });
      setTeacherMaxClasses(teacherMaxClassesMap);

      // Create a map of teacher to their classroom assignments (all assignments, not just class teacher)
      const teacherAssignments = {};
      
      if (streamsEnabled) {
        const streamsResponse = await apiRequest('streams', 'GET');
        const streamsData = streamsResponse?.data || streamsResponse || [];
        
        // Map teacher to stream if they're class teacher
        streamsData.forEach(stream => {
          if (stream.class_teacher_id) {
            if (!teacherAssignments[stream.class_teacher_id]) {
              teacherAssignments[stream.class_teacher_id] = [];
            }
            teacherAssignments[stream.class_teacher_id].push({
              type: 'stream',
              name: stream.name,
              id: stream.id,
              classroomId: stream.class_id
            });
          }
        });
        
        const classroomsWithCapacity = classroomsData.map(classroom => {
          const classroomStreams = streamsData.filter(stream => stream.class_id === classroom.id);
          const totalCapacity = classroomStreams.reduce((sum, stream) => sum + (stream.capacity || 0), 0);
          const totalStudents = classroomStreams.reduce((sum, stream) => sum + (stream.student_count || 0), 0);
          return {
            ...classroom,
            streams: classroomStreams,
            capacity: totalCapacity,
            student_count: totalStudents,
            streamCount: classroomStreams.length
          };
        });
        setClassrooms(classroomsWithCapacity);
        setStreams(streamsData);
      } else {
        // For non-stream schools, we need to fetch all teacher assignments
        const classroomsWithTeachers = await Promise.all(classroomsData.map(async (classroom) => {
          try {
            const teachersResponse = await apiRequest(`classrooms/${classroom.id}/teachers`, 'GET');
            const classroomTeachers = teachersResponse?.teachers || teachersResponse?.data || [];
            const classTeacher = classroomTeachers.find(teacher =>
              teacher.pivot && teacher.pivot.is_class_teacher
            );
            
            // Map ALL teacher assignments, not just class teacher assignments
            classroomTeachers.forEach(teacher => {
              if (!teacherAssignments[teacher.id]) {
                teacherAssignments[teacher.id] = [];
              }
              teacherAssignments[teacher.id].push({
                type: 'classroom',
                name: classroom.class_name,
                id: classroom.id,
                isClassTeacher: teacher.pivot ? teacher.pivot.is_class_teacher : false
              });
            });
            
            return {
              ...classroom,
              teachers: classroomTeachers,
              classTeacher: classTeacher,
              teacherCount: classroomTeachers.length,
              capacity: classroom.total_capacity || classroom.capacity || 0,
              student_count: classroom.student_count || 0
            };
          } catch (error) {
            console.error('Error fetching classroom data:', error);
            return {
              ...classroom,
              teachers: [],
              classTeacher: null,
              teacherCount: 0,
              capacity: classroom.total_capacity || classroom.capacity || 0,
              student_count: classroom.student_count || 0
            };
          }
        }));
        setClassrooms(classroomsWithTeachers);
        setTeachers(teachersData);
      }
      
      setTeacherClassroomAssignments(teacherAssignments);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load data';
      toast.error(errorMessage);
      setClassrooms([]);
      setStreams([]);
      setTeachers([]);
      setAllTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available classrooms for a specific teacher
  const fetchAvailableClassroomsForTeacher = async (teacherId) => {
    try {
      const response = await apiRequest(`teachers/${teacherId}/available-classrooms`, 'GET');
      setAvailableClassroomsForTeacher(response?.data?.available_classrooms || []);
      return response?.data || {};
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch available classrooms';
      toast.error(errorMessage);
      return {};
    }
  };

  // Fetch updated teacher data after assignment operations
  const fetchUpdatedTeacherData = async (teacherId) => {
    try {
      const response = await apiRequest(`teachers/${teacherId}/available-classrooms`, 'GET');
      const teacherData = response?.data || {};
      
      // Update teacher's class count in the state
      setTeacherClassroomAssignments(prev => ({
        ...prev,
        [teacherId]: teacherData.current_assignments || []
      }));
      
      return teacherData;
    } catch (error) {
      console.error('Error fetching updated teacher data:', error);
      return null;
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

  const openMobileSheet = (classroom) => {
    setMobileSheet({ isOpen: true, classroom });
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, classroom: null });
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedClassroom(null);
    setFormData({ 
      class_name: '', 
      capacity: hasStreams ? '' : '' // Keep empty for both, but it will be disabled for streams
    });
  };

  const showEditForm = (classroom) => {
    setView('edit');
    setSelectedClassroom(classroom);
    setFormData({
      class_name: classroom.class_name,
      capacity: classroom.capacity || '',
    });
  };

  const showStreamsView = async (classroom) => {
    setView('streams');
    setSelectedClassroom(classroom);
    setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/streams`, 'GET');
      const classroomStreams = response?.streams || response?.data || response || [];
      const totalCapacity = classroomStreams.reduce((sum, stream) => sum + (stream.capacity || 0), 0);
      const totalStudents = classroomStreams.reduce((sum, stream) => sum + (stream.student_count || 0), 0);
      setStreams(classroomStreams);
      setSelectedClassroom(prev => ({
        ...prev,
        capacity: totalCapacity,
        student_count: totalStudents,
        streamCount: classroomStreams.length
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not load streams';
      toast.error(errorMessage);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const showTeachersView = async (classroom) => {
    setView('teachers');
    setSelectedClassroom(classroom);
    setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/teachers`, 'GET');
      const classroomTeachers = response?.teachers || response?.data || response || [];
      const classTeacher = classroomTeachers.find(teacher =>
        teacher.pivot && teacher.pivot.is_class_teacher
      );
      setTeachers(classroomTeachers);
      setSelectedClassroom(prev => ({
        ...prev,
        classTeacher: classTeacher,
        teacherCount: classroomTeachers.length,
        capacity: prev.capacity || prev.total_capacity || 0,
        student_count: prev.student_count || 0
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not load teachers';
      toast.error(errorMessage);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const openTeacherAssignmentModal = async (classroom) => {
    setSelectedClassroom(classroom);
    
    // Pre-select teachers already assigned to this classroom
    const alreadyAssigned = classroom.teachers ? classroom.teachers.map(t => t.id) : [];
    const currentClassTeacher = classroom.classTeacher ? classroom.classTeacher.id : null;
    
    setSelectedTeachers(alreadyAssigned);
    setClassTeacherId(currentClassTeacher);
    
    // Fetch available classrooms for each teacher
    const teacherAvailability = {};
    for (const teacher of allTeachers) {
      const availability = await fetchAvailableClassroomsForTeacher(teacher.id);
      teacherAvailability[teacher.id] = availability;
    }
    
    setShowTeacherAssignmentModal(true);
  };

  const backToList = () => {
    setView('list');
    setSelectedClassroom(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        class_name: formData.class_name,
        school_id: schoolId
      };
      
      // Only include capacity for non-stream schools
      if (!hasStreams) {
        payload.capacity = formData.capacity;
      }
      
      if (hasStreams && selectedClassroom && selectedClassroom.streams) {
        payload.streams = selectedClassroom.streams.map(stream => ({
          id: stream.id,
          name: stream.name,
          capacity: stream.capacity,
          class_teacher_id: stream.class_teacher_id
        }));
      } else if (!hasStreams && selectedClassroom && selectedClassroom.teachers) {
        payload.teachers = selectedClassroom.teachers.map(teacher => ({
          teacher_id: teacher.id,
          is_class_teacher: teacher.pivot ? teacher.pivot.is_class_teacher : false
        }));
      }
      
      let response;
      if (view === 'edit') {
        response = await apiRequest(`classrooms/${selectedClassroom.id}`, 'PUT', payload);
        toast.success('Classroom updated successfully');
      } else {
        response = await apiRequest('classrooms', 'POST', payload);
        toast.success('Classroom created successfully');
      }
      backToList();
    } catch (error) {
      // Enhanced error handling for backend validation errors
      let errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      
      // Handle specific class teacher assignment errors
      if (error?.response?.data?.errors?.class_teacher_id) {
        errorMessage = error.response.data.errors.class_teacher_id[0];
      } else if (error?.response?.data?.errors?.is_class_teacher) {
        errorMessage = error.response.data.errors.is_class_teacher[0];
      }
      
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} classroom: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (classroom) => {
    if (mobileSheet.isOpen) {
      closeMobileSheet();
    }
    setDeleteModal({
      isOpen: true,
      classroomId: classroom.id,
      classroomName: classroom.class_name
    });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${deleteModal.classroomId}`, 'DELETE');
      toast.success(`${deleteModal.classroomName} deleted successfully`);
      setDeleteModal({ isOpen: false, classroomId: null, classroomName: '' });
      fetchInitialData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete classroom';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Teacher removal functions
  const handleRemoveTeacher = (teacher) => {
    // Open the removal confirmation modal
    setTeacherRemovalModal({
      isOpen: true,
      teacherId: teacher.id,
      teacherName: teacher.user?.full_name || teacher.user?.name || 'this teacher',
      classroomName: selectedClassroom?.class_name || 'the classroom'
    });
  };

  const confirmTeacherRemoval = async () => {
    if (!teacherRemovalModal.teacherId) return;
    
    setLoading(true);
    try {
      await apiRequest(`teachers/${teacherRemovalModal.teacherId}/classrooms/${selectedClassroom.id}`, 'DELETE');
      toast.success('Teacher removed successfully');
      
      // Close the modal
      setTeacherRemovalModal({
        isOpen: false,
        teacherId: null,
        teacherName: '',
        classroomName: ''
      });
      
      // Refresh all data to update counts everywhere
      await fetchInitialData();
      
      // Refresh the teachers view if still on it
      if (view === 'teachers' && selectedClassroom) {
        await showTeachersView(selectedClassroom);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to remove teacher';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClassTeacher = async (classroomId, teacherId) => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${classroomId}/class-teacher`, 'POST', { teacher_id: teacherId });
      toast.success('Class teacher assigned successfully');
      
      // Refresh all data to update counts
      await fetchInitialData();
      
      if (selectedClassroom && selectedClassroom.id === classroomId) {
        await showTeachersView(selectedClassroom);
      }
    } catch (error) {
      // Enhanced error handling for class teacher assignment
      let errorMessage = error?.response?.data?.message || 'Failed to assign class teacher';
      
      // Handle specific class teacher assignment errors
      if (error?.response?.data?.errors?.teacher_id) {
        errorMessage = error.response.data.errors.teacher_id[0];
      }
      
      // If teacher is already a class teacher elsewhere, show that information
      if (error?.response?.data?.existing_classroom) {
        errorMessage = `This teacher is already assigned as a class teacher to ${error.response.data.existing_classroom}.`;
      }
      
      // Handle max_classes constraint
      if (error?.response?.data?.errors?.teacher_id && 
          error.response.data.errors.teacher_id[0].includes('maximum number of classes')) {
        errorMessage = error.response.data.errors.teacher_id[0];
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClassTeacher = async (classroomId) => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${classroomId}/class-teacher`, 'DELETE');
      toast.success('Class teacher removed successfully');
      
      // Refresh all data to update counts
      await fetchInitialData();
      
      if (selectedClassroom && selectedClassroom.id === classroomId) {
        await showTeachersView(selectedClassroom);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to remove class teacher';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeachers = async () => {
    if (selectedTeachers.length === 0) {
      toast.error('Please select at least one teacher');
      return;
    }
    
    // Get already assigned teachers
    const alreadyAssignedTeachers = selectedClassroom?.teachers?.map(t => t.id) || [];
    
    // Filter out teachers who are already assigned
    const newTeachers = selectedTeachers.filter(tid => !alreadyAssignedTeachers.includes(tid));
    
    // If trying to assign teachers who are already assigned
    if (newTeachers.length === 0 && selectedTeachers.length > 0) {
      toast.info('All selected teachers are already assigned to this classroom');
      return;
    }
    
    setLoading(true);
    try {
      const teachersPayload = selectedTeachers.map(teacherId => ({
        teacher_id: teacherId,
        is_class_teacher: teacherId === classTeacherId
      }));
      await apiRequest(`classrooms/${selectedClassroom.id}/teachers`, 'POST', {
        teachers: teachersPayload
      });
      toast.success('Teachers assigned successfully');
      
      setShowTeacherAssignmentModal(false);
      
      // Refresh ALL data to update counts everywhere
      await fetchInitialData();
      
      // Then show the updated teachers view
      await showTeachersView(selectedClassroom);
    } catch (error) {
      // Enhanced error handling for teacher assignment
      let errorMessage = error?.response?.data?.message || 'Failed to assign teachers';
      
      // Handle specific teacher assignment errors
      if (error?.response?.data?.errors?.is_class_teacher) {
        errorMessage = error.response.data.errors.is_class_teacher[0];
      }
      
      // If teacher is already a class teacher elsewhere, show that information
      if (error?.response?.data?.existing_classroom) {
        errorMessage = `This teacher is already assigned as a class teacher to ${error.response.data.existing_classroom}.`;
      }
      
      // Handle max_classes constraint
      if (error?.response?.data?.errors?.teacher_id && 
          error.response.data.errors.teacher_id[0].includes('maximum number of classes')) {
        errorMessage = error.response.data.errors.teacher_id[0];
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacherSelection = (teacherId) => {
    // Check if teacher is already assigned to THIS classroom
    const isAlreadyAssigned = selectedClassroom?.teachers?.some(t => t.id === teacherId);
    
    if (isAlreadyAssigned) {
      toast.info('This teacher is already assigned to this classroom');
      return; // Exit early - don't allow selection
    }
    
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        if (classTeacherId === teacherId) {
          setClassTeacherId(null);
        }
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  const setAsClassTeacher = (teacherId) => {
    if (!selectedTeachers.includes(teacherId)) {
      setSelectedTeachers(prev => [...prev, teacherId]);
    }
    setClassTeacherId(teacherId);
  };

  // Check if teacher can be assigned to more classrooms based on max_classes
  const canAssignTeacherToClassroom = (teacherId) => {
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (!teacher) return false;
    
    const maxClasses = teacherMaxClasses[teacherId] || 10;
    
    // Get current assignments from teacherClassroomAssignments
    const currentAssignments = teacherClassroomAssignments[teacherId] || [];
    const currentClassCount = currentAssignments.length;
    
    // If teacher is already assigned to this classroom, it's okay
    const isAlreadyAssigned = selectedClassroom?.teachers?.some(t => t.id === teacherId);
    
    return isAlreadyAssigned || currentClassCount < maxClasses;
  };

  // Get teacher's remaining class slots
  const getTeacherRemainingSlots = (teacherId) => {
    const teacher = allTeachers.find(t => t.id === teacherId);
    if (!teacher) return 0;
    
    const maxClasses = teacherMaxClasses[teacherId] || 10;
    
    // Get current assignments from teacherClassroomAssignments
    const currentAssignments = teacherClassroomAssignments[teacherId] || [];
    const currentClassCount = currentAssignments.length;
    
    return maxClasses - currentClassCount;
  };

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Functions ---
  const renderListView = () => (
    <>
      {/* Header and Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Classroom Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage classrooms and their associated {hasStreams ? 'streams' : 'teachers'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              hasStreams
                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {hasStreams ? 'Streams Enabled' : 'Direct Teacher Assignment'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          {/* Desktop New Classroom Button */}
          <button
            onClick={showCreateForm}
            className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
            New Classroom
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
      {/* Mobile New Classroom Button - Smaller and better positioned */}
      <div className="md:hidden mb-4">
        <button
          onClick={showCreateForm}
          className="w-full bg-black text-white px-3 py-2.5 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          New Classroom
        </button>
      </div>
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
                ({filteredClassrooms.length}/{classrooms.length})
              </span>
            </div>
            {showFilters ? (
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  placeholder="Search by classroom name..."
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
                placeholder="Search by classroom name..."
                className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div className="flex items-end col-span-1 lg:col-span-1">
              <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold">{filteredClassrooms.length}</span> of <span className="font-semibold">{classrooms.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
          Existing Classrooms
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700 min-w-[700px] sm:min-w-full">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Class Name</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Capacity</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">{hasStreams ? 'Streams' : 'Teachers'}</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium">Class Teacher</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredClassrooms.length > 0 ? (
                  filteredClassrooms.map((classroom) => {
                    const displayCapacity = classroom.capacity || 0;
                    const studentCount = classroom.student_count || 0;
                    const remainingCapacity = displayCapacity - studentCount;
                    const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
                    return (
                      <tr key={classroom.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-white">
                          {classroom.class_name}
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
                            <div className="text-xs text-slate-400">
                              {remainingCapacity} slots available
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {hasStreams ? (
                            classroom.streamCount > 0 ? (
                              <button
                                onClick={() => showStreamsView(classroom)}
                                className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 hover:underline transition-colors"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>{classroom.streamCount} Stream(s)</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">No streams</span>
                            )
                          ) : (
                            classroom.teacherCount > 0 ? (
                              <button
                                onClick={() => showTeachersView(classroom)}
                                className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 hover:underline transition-colors"
                              >
                                <Users className="w-4 h-4" />
                                <span>{classroom.teacherCount} Teacher(s)</span>
                              </button>
                            ) : (
                              <span className="text-slate-400">No teachers</span>
                            )
                          )}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {hasStreams ? (
                            classroom.streams && classroom.streams.find(s => s.class_teacher_id) ? (
                              <div className="flex items-center gap-1">
                                <span>{classroom.streams.find(s => s.class_teacher_id)?.classTeacher?.user?.name || 'Assigned'}</span>
                                <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                                  Class Teacher
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Not assigned</span>
                            )
                          ) : (
                            classroom.classTeacher ? (
                              <div className="flex items-center gap-1">
                                <span>{classroom.classTeacher.user?.name || 'Assigned'}</span>
                                <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                                  Class Teacher
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Not assigned</span>
                            )
                          )}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => showEditForm(classroom)}
                              className="p-1.5 text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Edit classroom"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!hasStreams && (
                              <button
                                onClick={() => openTeacherAssignmentModal(classroom)}
                                className="p-1.5 text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Manage teachers and class teacher"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(classroom)}
                              className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Delete classroom"
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
                    <td colSpan="5" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                      {classrooms.length === 0
                        ? 'No classrooms found. Create one to get started.'
                        : 'No classrooms match current filters.'
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
        {/* Classroom Cards */}
        {filteredClassrooms.length > 0 ? (
          filteredClassrooms.map((classroom) => {
            const displayCapacity = classroom.capacity || 0;
            const studentCount = classroom.student_count || 0;
            const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
            return (
              <button
                key={classroom.id}
                onClick={() => openMobileSheet(classroom)}
                className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {classroom.class_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {hasStreams ? `${classroom.streamCount || 0} streams` : `${classroom.teacherCount || 0} teachers`}
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
                {!hasStreams && classroom.classTeacher && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        Class Teacher: <span className="font-medium text-slate-900 dark:text-white">
                          {classroom.classTeacher.user?.name || 'Assigned'}
                        </span>
                      </span>
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                        Class Teacher
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
              {classrooms.length === 0
                ? 'No classrooms found. Create one to get started.'
                : 'No classrooms match current filters.'
              }
            </p>
          </div>
        )}
      </div>
    </>
  );

  const renderFormView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800/50 z-10 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
            {view === 'edit' ? 'Edit Classroom' : 'Create New Classroom'}
          </h3>
          <button
            onClick={backToList}
            className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="class_name" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="class_name"
              name="class_name"
              value={formData.class_name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Form 1, Grade 5"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all"
            />
          </div>
          
          {/* Capacity field - only editable for non-stream schools */}
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Capacity {!hasStreams && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
              placeholder={hasStreams ? "Auto-calculated from streams" : "Maximum number of students"}
              disabled={hasStreams}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm transition-all ${
                hasStreams 
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                  : 'border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400'
              }`}
            />
            
            {/* Enhanced info message for streams-enabled schools */}
            {hasStreams ? (
              <div className="mt-2 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <div className="flex gap-2">
                  <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-cyan-800 dark:text-cyan-300">
                    <p className="font-semibold mb-1">Capacity is auto-calculated</p>
                    <p>For stream-enabled schools, classroom capacity is automatically calculated from the total capacity of all streams in this class. Please manage stream capacities to adjust the total classroom capacity.</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Maximum number of students this classroom can accommodate.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={backToList}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );

  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
              Streams for {selectedClassroom?.class_name}
            </h3>
            <p className="text-sm text-[#4c739a] dark:text-slate-400">
              Total Capacity: <span className="font-medium">{selectedClassroom?.capacity || 0} students</span>
              <span className="ml-2">({selectedClassroom?.streamCount || 0} streams)</span>
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
              <Loader className="w-8 h-8 animate-spin text-[#4c739a]" />
            </div>
          ) : (
            <div className="space-y-3">
              {streams.length > 0 ? (
                streams.map(stream => (
                  <div
                    key={stream.id}
                    className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0d141b] dark:text-white truncate">{stream.name}</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">
                        Capacity: {stream.capacity || 0} students
                      </p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400 truncate">
                        Class Teacher: {stream.classTeacher?.user?.name || stream.class_teacher?.name || 'Not Assigned'}
                      </p>
                      {stream.classTeacher && (
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                          Class Teacher
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="flex items-center gap-1 text-[#4c739a] dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{stream.capacity || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-[#4c739a] mx-auto mb-3" />
                  <p className="text-[#4c739a] dark:text-slate-400">
                    No streams found for this classroom.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTeachersView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
              Teachers for {selectedClassroom?.class_name}
            </h3>
            <p className="text-sm text-[#4c739a] dark:text-slate-400">
              Total Teachers: <span className="font-medium">{selectedClassroom?.teacherCount || 0}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openTeacherAssignmentModal(selectedClassroom)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1 leading-tight dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Manage </span>Teachers
            </button>
            <button
              onClick={backToList}
              className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-[#4c739a]" />
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.length > 0 ? (
                teachers.map(teacher => (
                  <div
                    key={teacher.id}
                    className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#0d141b] dark:text-white truncate">{teacher.user?.full_name || teacher.user?.name}</p>
                        {teacher.pivot?.is_class_teacher && (
                          <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                            Class Teacher
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">
                        {teacher.qualification || 'No qualification specified'}
                      </p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">
                        {teacher.specialization || 'No specialization specified'}
                      </p>
                      {/* Show teacher's class count and max_classes */}
                      <div className="flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-cyan-500" />
                        <span className="text-xs text-cyan-600 dark:text-cyan-400">
                          Assigned to {teacherClassroomAssignments[teacher.id]?.length || 0} of {teacherMaxClasses[teacher.id] || 10} classes
                        </span>
                      </div>
                      {/* Show if teacher is a class teacher elsewhere - FIXED: Only show when teacher is actually a class teacher */}
                      {teacherClassroomAssignments[teacher.id] && 
                       teacherClassroomAssignments[teacher.id].filter(a => a.isClassTeacher).length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Also class teacher for: {teacherClassroomAssignments[teacher.id]
                              .filter(a => a.isClassTeacher)
                              .map(a => a.name)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0 flex gap-2">
                      {teacher.pivot?.is_class_teacher ? (
                        <button
                          onClick={() => handleRemoveClassTeacher(selectedClassroom.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Remove class teacher"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignClassTeacher(selectedClassroom.id, teacher.id)}
                          className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-400 transition-colors duration-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Assign as class teacher"
                          disabled={!canAssignTeacherToClassroom(teacher.id)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveTeacher(teacher)}
                        className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remove teacher from classroom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-[#4c739a] mx-auto mb-3" />
                  <p className="text-[#4c739a] dark:text-slate-400 mb-4">
                    No teachers found for this classroom.
                  </p>
                  <button
                    onClick={() => openTeacherAssignmentModal(selectedClassroom)}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1 leading-tight dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Assign </span>Teachers
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTeacherAssignmentModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
            Manage Teachers for {selectedClassroom?.class_name}
          </h3>
          <button
            onClick={() => setShowTeacherAssignmentModal(false)}
            className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {allTeachers.length > 0 ? (
            <div className="space-y-3">
              <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <p className="text-sm text-cyan-800 dark:text-cyan-300">
                  <strong>Instructions:</strong> Select teachers to assign to this classroom.
                  You can also designate one of them as the class teacher, who can also teach subjects in this class.
                  Teachers have a maximum number of classes they can be assigned to.
                </p>
              </div>
              {allTeachers.map(teacher => {
                const isSelected = selectedTeachers.includes(teacher.id);
                const isClassTeacher = classTeacherId === teacher.id;
                const isAlreadyAssigned = selectedClassroom?.teachers?.some(t => t.id === teacher.id);
                const isCurrentClassTeacher = selectedClassroom?.classTeacher?.id === teacher.id;
                const isClassTeacherElsewhere = teacherClassroomAssignments[teacher.id] && 
                  teacherClassroomAssignments[teacher.id].some(a => a.isClassTeacher);
                const remainingSlots = getTeacherRemainingSlots(teacher.id);
                const canAssign = canAssignTeacherToClassroom(teacher.id);
                
                return (
                  <div
                    key={teacher.id}
                    className={`flex justify-between items-center p-4 border rounded-lg transition-colors cursor-pointer ${
                      isSelected || isAlreadyAssigned
                        ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    } ${!canAssign && !isAlreadyAssigned ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (!isAlreadyAssigned && canAssign) {
                        toggleTeacherSelection(teacher.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-cyan-600 dark:text-cyan-400">
                        {isSelected || isAlreadyAssigned ?
                          <CheckSquare className="w-5 h-5" /> :
                          <Square className="w-5 h-5" />
                        }
                      </button>
                      <div>
                        <p className="font-medium text-[#0d141b] dark:text-white">
                          {teacher.user?.full_name || teacher.user?.name}
                          {isAlreadyAssigned && (
                            <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400">
                              (Already assigned)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-[#4c739a] dark:text-slate-400">
                          {teacher.qualification || 'No qualification specified'}
                        </p>
                        {/* Show teacher's class count and max_classes */}
                        <div className="flex items-center gap-1 mt-1">
                          <Info className="w-3 h-3 text-cyan-500" />
                          <span className="text-xs text-cyan-600 dark:text-cyan-400">
                            Assigned to {teacherClassroomAssignments[teacher.id]?.length || 0} of {teacherMaxClasses[teacher.id] || 10} classes
                            {remainingSlots > 0 ? ` (${remainingSlots} slots remaining)` : ' (No slots remaining)'}
                          </span>
                        </div>
                        {/* Show if teacher is a class teacher elsewhere - FIXED: Only show when teacher is actually a class teacher */}
                        {isClassTeacherElsewhere && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Also class teacher for: {teacherClassroomAssignments[teacher.id]
                                .filter(a => a.isClassTeacher)
                                .map(a => a.name)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                        {/* Show warning if teacher has reached max_classes */}
                        {!canAssign && !isAlreadyAssigned && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">
                              This teacher has reached their maximum number of classes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isSelected || isAlreadyAssigned) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsClassTeacher(teacher.id);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isClassTeacher || isCurrentClassTeacher
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                          }`}
                          disabled={isClassTeacherElsewhere && !isClassTeacher}
                          title={isClassTeacherElsewhere && !isClassTeacher ? 
                            `This teacher is already a class teacher for ${teacherClassroomAssignments[teacher.id].filter(a => a.isClassTeacher).map(a => a.name).join(', ')}` : 
                            ''}
                        >
                          {isClassTeacher || isCurrentClassTeacher ? 'Class Teacher' : 'Set as Class Teacher'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-[#4c739a] mx-auto mb-3" />
              <p className="text-[#4c739a] dark:text-slate-400">
                No teachers available in your school.
              </p>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={() => setShowTeacherAssignmentModal(false)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssignTeachers}
            disabled={loading || (selectedTeachers.length === 0 && !classTeacherId)}
            className="px-3 py-2 sm:px-4 sm:py-2.5 bg-black text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Assigning...
              </span>
            ) : (
              `Save Changes`
            )}
          </button>
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
                  Delete Classroom
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.classroomName}"</span>?
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
                  <strong>Warning:</strong> This will permanently delete all data associated with this classroom including {hasStreams ? 'streams' : 'teacher assignments'} and student records.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setDeleteModal({ isOpen: false, classroomId: null, classroomName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Classroom
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
                  Delete Classroom
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherRemovalConfirmationModal = () => {
    if (!teacherRemovalModal.isOpen) return null;
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
                  Remove Teacher
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to remove <span className="font-semibold text-slate-900 dark:text-white">"{teacherRemovalModal.teacherName}"</span> from <span className="font-semibold text-slate-900 dark:text-white">"{teacherRemovalModal.classroomName}"</span>?
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">
                  <strong>Note:</strong> This will only remove the teacher from this classroom. The teacher will remain available for assignment to other classes.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setTeacherRemovalModal({ 
                isOpen: false, 
                teacherId: null, 
                teacherName: '', 
                classroomName: '' 
              })}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Teacher
            </button>
            <button
              onClick={confirmTeacherRemoval}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  Remove Teacher
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.classroom) return null;
    const classroom = mobileSheet.classroom;
    const displayCapacity = classroom.capacity || 0;
    const studentCount = classroom.student_count || 0;
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
                  {classroom.class_name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {hasStreams ? `${classroom.streamCount || 0} streams configured` : `${classroom.teacherCount || 0} teachers assigned`}
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
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                {hasStreams ? (
                  <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {hasStreams ? 'Streams' : 'Teachers'}
                </h3>
              </div>
              {hasStreams ? (
                classroom.streamCount > 0 ? (
                  <button
                    onClick={() => {
                      closeMobileSheet();
                      showStreamsView(classroom);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        View {classroom.streamCount} Stream(s)
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No streams configured</p>
                )
              ) : (
                classroom.teacherCount > 0 ? (
                  <button
                    onClick={() => {
                      closeMobileSheet();
                      showTeachersView(classroom);
                    }}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        View {classroom.teacherCount} Teacher(s)
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No teachers assigned</p>
                )
              )}
            </div>
            {!hasStreams && (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Class Teacher
                  </h3>
                </div>
                {classroom.classTeacher ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {classroom.classTeacher.user?.name || 'Assigned'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Primary contact for this class
                      </p>
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium">
                        Class Teacher
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Not assigned yet</p>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => {
                closeMobileSheet();
                showEditForm(classroom);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Classroom
            </button>
            {!hasStreams && (
              <button
                onClick={() => {
                  closeMobileSheet();
                  openTeacherAssignmentModal(classroom);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-[0.98] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Manage Teachers
              </button>
            )}
            <button
              onClick={() => handleDelete(classroom)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Classroom
            </button>
          </div>
        </div>
      </>
    );
  };

  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user || !schoolId) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-[#0d141b] dark:text-slate-100 text-lg font-semibold mb-2">
            Unable to access classroom management
          </p>
          <p className="text-[#4c739a] dark:text-slate-400 mb-4">
            {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg max-w-md">
            <p className="text-sm text-[#4c739a] dark:text-slate-400 mb-2">Debug Info:</p>
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
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Loading Classrooms...</p>
        </div>
      )}
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'streams' && renderStreamsView()}
      {view === 'teachers' && renderTeachersView()}
      {showTeacherAssignmentModal && renderTeacherAssignmentModal()}
      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
      {renderTeacherRemovalConfirmationModal()}
    </div>
  );
}

export default ClassroomManager;
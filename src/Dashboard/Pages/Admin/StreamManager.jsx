import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  Plus, 
  X, 
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
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL / GRADE MAPPING
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL_GRADE_MAP = {
  'Pre-Primary':      ['pp1', 'pp2'],
  'Primary':          ['grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6',
                       'standard 1', 'standard 2', 'standard 3', 'standard 4',
                       'standard 5', 'standard 6', 'standard 7', 'standard 8',
                       'std 1', 'std 2', 'std 3', 'std 4', 'std 5', 'std 6', 'std 7', 'std 8'],
  'Junior Secondary': ['grade 7', 'grade 8', 'grade 9'],
  'Senior Secondary': ['grade 10', 'grade 11', 'grade 12'],
  'Secondary':        ['form 1', 'form 2', 'form 3', 'form 4'],
};

function levelFromClassName(className) {
  if (!className) return null;
  const lower = className.toLowerCase().trim();
  const candidates = [];
  for (const [level, prefixes] of Object.entries(LEVEL_GRADE_MAP)) {
    for (const prefix of prefixes) {
      candidates.push([prefix, level]);
    }
  }
  candidates.sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, level] of candidates) {
    if (lower === prefix || lower.startsWith(prefix + ' ') || lower.startsWith(prefix + '-')) {
      return level;
    }
  }
  return null;
}

function levelFromStream(stream) {
  const className = stream?.classroom?.class_name || stream?.class_name || '';
  if (className) {
    const level = levelFromClassName(className);
    if (level) return level;
  }
  const streamName = stream?.name || '';
  if (streamName) {
    const level = levelFromClassName(streamName);
    if (level) return level;
  }
  return null;
}

function getTeacherLevels(teacher) {
  const raw = teacher?.assignments || teacher;
  return (
    raw?.teaching_levels ||
    raw?.teachingLevels ||
    teacher?.teaching_levels ||
    teacher?.teachingLevels ||
    []
  );
}

function teacherMatchesLevel(teacher, streamLevel) {
  if (!streamLevel) return true;
  const levels = getTeacherLevels(teacher);
  if (!levels || levels.length === 0) return true;
  return levels.includes(streamLevel);
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZATION PARSER
// ─────────────────────────────────────────────────────────────────────────────
function parseSpecializationSubjects(specialization) {
  if (!specialization) return [];
  const subjects = [];
  const segments = specialization.split('|').map(s => s.trim());
  for (const segment of segments) {
    const match = segment.match(/^[^(]+\(([^)]+)\)$/);
    if (match) {
      const items = match[1].split(',').map(s => s.trim()).filter(Boolean);
      subjects.push(...items);
    }
  }
  return subjects;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  modalBg:    'bg-white dark:bg-slate-800/50',
  card:       'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
  secondary:  'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  primary:    'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  cancelPill: 'px-5 py-2 rounded-full text-sm font-semibold bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  deletePill: 'px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
};

// ─────────────────────────────────────────────────────────────────────────────
// ROW ACTION DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function RowActionsMenu({ stream, onEdit, onManageStaff, onAssignClassTeacher, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handle = (fn) => { setOpen(false); fn(); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-100">
          <button onClick={() => handle(onEdit)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left">
            <Edit className="w-4 h-4 text-amber-400" />Edit Stream
          </button>
          <button onClick={() => handle(onManageStaff)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left">
            <Users className="w-4 h-4 text-cyan-400" />Manage Staff
          </button>
          <button onClick={() => handle(onAssignClassTeacher)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left">
            <Crown className="w-4 h-4 text-green-400" />Assign Class Teacher
          </button>
          <div className="my-1 border-t border-slate-700/60" />
          <button onClick={() => handle(onDelete)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left">
            <Trash2 className="w-4 h-4" />Delete Stream
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function StreamManager() {
  const { user, loading: authLoading } = useAuth();
  
  const [streams, setStreams]                   = useState([]);
  const [classrooms, setClassrooms]             = useState([]);
  const [teachers, setTeachers]                 = useState([]);
  const [allClassTeachers, setAllClassTeachers] = useState([]);
  const [streamDetails, setStreamDetails]       = useState(null);

  // ── Two separate loading flags ──────────────────────────────────────────
  // `initializing` stays true until the very first full data load completes,
  // preventing premature "No teachers" banners from flashing.
  const [initializing, setInitializing]         = useState(true);
  const [loading, setLoading]                   = useState(false);
  // ────────────────────────────────────────────────────────────────────────

  const [view, setView]                         = useState('list');
  const [schoolHasStreams, setSchoolHasStreams]  = useState(false);
  const [schoolInfo, setSchoolInfo]             = useState(null);
  
  const [selectedStream, setSelectedStream]     = useState(null);
  const [formData, setFormData]                 = useState({ 
    name: '', class_id: '', class_teacher_id: '', capacity: '' 
  });

  const [selectedTeachers, setSelectedTeachers]     = useState([]);
  const [isSavingTeachers, setIsSavingTeachers]     = useState(false);

  const [searchTerm, setSearchTerm]             = useState('');
  const [levelFilter, setLevelFilter]           = useState('all');
  const [showFilters, setShowFilters]           = useState(false);
  const [deleteModal, setDeleteModal]           = useState({ isOpen: false, streamId: null, streamName: '' });
  const [showClassTeacherModal, setShowClassTeacherModal]                 = useState(false);
  const [selectedStreamForClassTeacher, setSelectedStreamForClassTeacher] = useState(null);
  const [mobileSheet, setMobileSheet]           = useState({ isOpen: false, stream: null });
  const [isDragging, setIsDragging]             = useState(false);
  const [dragStartY, setDragStartY]             = useState(0);
  const [dragOffset, setDragOffset]             = useState(0);
  const [removeClassTeacherModal, setRemoveClassTeacherModal] = useState({
    isOpen: false, streamId: null, streamName: '', teacherName: ''
  });

  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;

  useEffect(() => { if (schoolId) fetchSchoolInfo(); }, [schoolId]);

  // ── fetchSchoolInfo: keeps initializing=true until everything is done ──
  const fetchSchoolInfo = async () => {
    setInitializing(true);
    setLoading(true);
    try {
      const response  = await apiRequest(`schools/${schoolId}`, 'GET');
      const schoolData = response?.data || response || {};
      setSchoolInfo(schoolData);
      setSchoolHasStreams(schoolData.has_streams || false);
      if (schoolData.has_streams) {
        await fetchInitialData(); // await so initializing waits for all data
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load school information');
    } finally {
      setLoading(false);
      setInitializing(false); // only clear AFTER everything has loaded
    }
  };

  // ── fetchInitialData: used both on boot and on manual refresh ───────────
  const fetchInitialData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [streamsResponse, classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('streams', 'GET'),
        apiRequest('classrooms', 'GET'),
        apiRequest(`teachers/with-assignments`, 'GET').catch(() =>
          apiRequest(`teachers/school/${schoolId}`, 'GET')
        )
      ]);
      const streamsData    = streamsResponse?.data    || streamsResponse    || [];
      const classroomsData = classroomsResponse?.data || classroomsResponse || [];
      const rawTeachers    = teachersResponse?.data   || teachersResponse?.teachers || teachersResponse || [];
      setStreams(streamsData);
      setClassrooms(classroomsData);
      setTeachers(Array.isArray(rawTeachers) ? rawTeachers.map(t => ({
        ...t,
        teaching_levels: t.teaching_levels || t.teachingLevels || t.assignments?.teaching_levels || [],
      })) : []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load data');
      setStreams([]); setClassrooms([]); setTeachers([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // ── Manual refresh button handler ───────────────────────────────────────
  const handleRefresh = () => fetchInitialData(true);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getTeachersForStream = (stream) => {
    if (!Array.isArray(teachers)) return [];
    const streamLevel = levelFromStream(stream);
    return teachers.filter(t => teacherMatchesLevel(t, streamLevel));
  };

  const getAvailableClassTeachersForStream = (stream) => {
    const compatible = getTeachersForStream(stream);
    const assignedToOther = streams
      .filter(s => s.class_teacher_id && s.id !== stream?.id)
      .map(s => s.class_teacher_id);
    return compatible.filter(t => !assignedToOther.includes(t.id));
  };

  // ── Views ────────────────────────────────────────────────────────────────

  const showCreateForm = () => {
    setView('create'); setSelectedStream(null);
    setFormData({ name: '', class_id: '', class_teacher_id: '', capacity: '' });
  };

  const showEditForm = (stream) => {
    setView('edit'); setSelectedStream(stream);
    setFormData({
      name: stream.name, class_id: stream.class_id || '',
      class_teacher_id: stream.class_teacher_id || '', capacity: stream.capacity || ''
    });
  };

  const showManageTeachersView = async (stream) => {
    setView('manage-teachers'); setSelectedStream(stream); setLoading(true);
    let detailedStream = { ...stream };
    try {
      const response = await apiRequest(`streams/${stream.id}/teachers`, 'GET');
      const teachersFromApi = response?.teachers || response?.data?.teachers || [];
      detailedStream.teachers = teachersFromApi;
      setSelectedTeachers(teachersFromApi.map(t => t.id));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not fetch teaching staff list');
      setSelectedTeachers([]);
    } finally {
      setStreamDetails(detailedStream); setLoading(false);
    }
  };

  const showAllClassTeachersView = async () => {
    setView('all-class-teachers'); setLoading(true);
    try {
      const response = await apiRequest('streams/class-teachers', 'GET');
      setAllClassTeachers(response?.data || response || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch class teachers');
      setAllClassTeachers([]);
    } finally { setLoading(false); }
  };

  const backToList = () => {
    setView('list'); setSelectedStream(null); setStreamDetails(null);
    setSelectedTeachers([]); fetchInitialData(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (view === 'edit') {
        const payload = { name: formData.name.trim() };
        if (formData.class_id && formData.class_id !== selectedStream.class_id) payload.class_id = parseInt(formData.class_id, 10);
        if (formData.capacity) payload.capacity = parseInt(formData.capacity, 10);
        if (formData.class_teacher_id !== undefined) payload.class_teacher_id = formData.class_teacher_id ? parseInt(formData.class_teacher_id, 10) : null;
        await apiRequest(`streams/${selectedStream.id}`, 'PUT', payload);
        toast.success('Stream updated successfully');
      } else {
        if (!formData.name.trim()) { toast.error('Please enter a stream name'); setLoading(false); return; }
        if (!formData.class_id)    { toast.error('Please select a classroom');  setLoading(false); return; }
        if (!formData.capacity)    { toast.error('Please enter a capacity');     setLoading(false); return; }
        if (parseInt(formData.capacity, 10) < 1) { toast.error('Capacity must be at least 1'); setLoading(false); return; }
        const payload = { name: formData.name.trim(), class_id: parseInt(formData.class_id, 10), capacity: parseInt(formData.capacity, 10) };
        if (formData.class_teacher_id) payload.class_teacher_id = parseInt(formData.class_teacher_id, 10);
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
          const messages = Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
        if (existingStream) toast.info(`Teacher is already assigned to stream: ${existingStream}`);
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} stream: ${errorMessage}`);
      }
    } finally { setLoading(false); }
  };

  const handleTouchStart = (e) => { setIsDragging(true); setDragStartY(e.touches[0].clientY); };
  const handleTouchMove  = (e) => { if (!isDragging) return; const delta = e.touches[0].clientY - dragStartY; if (delta > 0) setDragOffset(delta); };
  const handleTouchEnd   = () => { setIsDragging(false); if (dragOffset > 100) closeMobileSheet(); setDragOffset(0); };
  const openMobileSheet  = (stream) => { setMobileSheet({ isOpen: true, stream }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, stream: null }); document.body.style.overflow = ''; setDragOffset(0); };
  const openClassTeacherModal = (stream) => { setSelectedStreamForClassTeacher(stream); setShowClassTeacherModal(true); };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch =
      stream.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stream.classroom?.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const streamLevel = levelFromStream(stream);
    const matchesLevel = levelFilter === 'all' || streamLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleDelete = (stream) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, streamId: stream.id, streamName: stream.name });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`streams/${deleteModal.streamId}`, 'DELETE');
      toast.success(`${deleteModal.streamName} deleted successfully`);
      setDeleteModal({ isOpen: false, streamId: null, streamName: '' });
      fetchInitialData(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete stream');
    } finally { setLoading(false); }
  };

  const handleAssignClassTeacher = async (streamId, teacherId) => {
    if (!teacherId) return;
    setLoading(true);
    try {
      await apiRequest(`streams/${streamId}/assign-class-teacher`, 'POST', { teacher_id: parseInt(teacherId, 10) });
      toast.success('Class teacher assigned successfully');
      fetchInitialData(true);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to assign class teacher';
      const validationErrors = error?.response?.data?.errors;
      const existingStream = error?.response?.data?.existing_stream;
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
        if (existingStream) toast.info(`Teacher is already assigned to stream: ${existingStream}`);
      } else { toast.error(errorMessage); }
    } finally { setLoading(false); }
  };

  const openRemoveClassTeacherModal = (stream) => {
    const classTeacher = stream.classTeacher || stream.class_teacher;
    setRemoveClassTeacherModal({ isOpen: true, streamId: stream.id, streamName: stream.name, teacherName: getTeacherName(classTeacher) });
  };

  const handleRemoveClassTeacher = async (streamId) => {
    setLoading(true);
    try {
      await apiRequest(`streams/${streamId}/remove-class-teacher`, 'DELETE');
      toast.success('Class teacher removed successfully');
      setRemoveClassTeacherModal({ isOpen: false, streamId: null, streamName: '', teacherName: '' });
      fetchInitialData(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove class teacher');
    } finally { setLoading(false); }
  };

  const handleTeacherToggle = (teacherId) => {
    setSelectedTeachers(prev => prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]);
  };

  const handleSaveTeachingStaff = async () => {
    if (!selectedStream) return;
    setIsSavingTeachers(true);
    try {
      await apiRequest(`streams/${selectedStream.id}/assign-teachers`, 'POST', { teacher_ids: selectedTeachers });
      toast.success('Teaching staff updated successfully');
      backToList();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to update teaching staff';
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const messages = Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key];
          toast.error(`${key}: ${messages}`);
        });
      } else { toast.error(errorMessage); }
    } finally { setIsSavingTeachers(false); }
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unknown';
    if (teacher.user) {
      if (teacher.user.full_name) return teacher.user.full_name;
      if (teacher.user.name) return teacher.user.name;
      if (teacher.user.first_name && teacher.user.last_name) return `${teacher.user.first_name} ${teacher.user.last_name}`;
      if (teacher.user.first_name) return teacher.user.first_name;
    }
    if (teacher.full_name) return teacher.full_name;
    if (teacher.name) return teacher.name;
    if (teacher.first_name && teacher.last_name) return `${teacher.first_name} ${teacher.last_name}`;
    if (teacher.first_name) return teacher.first_name;
    return `Teacher #${teacher.id}`;
  };

  // ── Level badge / hint helpers ───────────────────────────────────────────

  const StreamLevelBadge = ({ stream }) => {
    const level = levelFromStream(stream);
    if (!level) return null;
    const colours = {
      'Pre-Primary':      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
      'Primary':          'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
      'Junior Secondary': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      'Senior Secondary': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      'Secondary':        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${colours[level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        <GraduationCap className="w-3 h-3" />{level}
      </span>
    );
  };

  const NoCompatibleTeachersHint = ({ stream }) => {
    const level = levelFromStream(stream);
    return (
      <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          {level
            ? <>No teachers with <strong>{level}</strong> coverage found. Add teachers with the correct teaching level first.</>
            : <>No teachers available. Please add teachers first.</>}
        </p>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderStreamsDisabledView = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 max-w-md text-center">
        <Settings className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Streams Not Enabled</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Your school does not have streams enabled. Contact your administrator to enable this feature.</p>
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4">
          <h3 className="font-medium text-cyan-900 dark:text-cyan-100 mb-2">What are streams?</h3>
          <p className="text-sm text-cyan-800 dark:text-cyan-200">Streams allow you to divide students in the same classroom into different groups for better management and organization.</p>
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">Stream Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">Manage streams, assign class teachers, and manage teaching staff</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">Streams Enabled</span>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
          <button onClick={showAllClassTeachersView} className="hidden md:flex items-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500">
            <UserCheck className="w-4 h-4" />View Class Teachers
          </button>
          <button onClick={showCreateForm} className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            <Plus className="w-4 h-4" />New Stream
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="md:hidden mb-4 grid grid-cols-2 gap-2">
        <button onClick={showCreateForm} className="bg-black text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black col-span-2"><Plus className="w-4 h-4" />New Stream</button>
        <button onClick={showAllClassTeachersView} className="bg-slate-700 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-slate-600 col-span-2"><UserCheck className="w-4 h-4" />View Class Teachers</button>
      </div>

      {/* ── "No teachers" warning — only shown AFTER initializing is done
           and teachers are genuinely empty, never during the first load ── */}
      {!initializing && !loading && teachers.length === 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200"><strong>Note:</strong> No teachers found for your school. Please add teachers first.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">
        <div className="block md:hidden">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
              <span className="text-xs text-slate-500">({filteredStreams.length}/{streams.length})</span>
              {levelFilter !== 'all' && <span className="px-1.5 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">1 active</span>}
            </div>
            {showFilters
              ? <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              : <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </button>
          {showFilters && (
            <div className="space-y-2">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by stream or classroom name..." className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="all">All Levels</option>
                {Object.keys(LEVEL_GRADE_MAP).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by stream or classroom name..." className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Class Level</label>
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="all">All Levels</option>
                {Object.keys(LEVEL_GRADE_MAP).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
            <div className="flex items-end col-span-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                <span className="text-xs text-slate-600 dark:text-slate-400">Showing <span className="font-semibold">{filteredStreams.length}</span> of <span className="font-semibold">{streams.length}</span></span>
                {levelFilter !== 'all' && <button onClick={() => setLevelFilter('all')} className="ml-auto text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Clear</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">Existing Streams</h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Stream Name</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Classroom / Level</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Capacity</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Class Teacher</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredStreams.length > 0 ? (
                  filteredStreams.map((stream) => {
                    const classTeacher = stream.classTeacher || stream.class_teacher;
                    const displayCapacity = stream.capacity || 0;
                    const studentCount = stream.student_count || 0;
                    const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
                    return (
                      <tr key={stream.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-white">{stream.name}</td>
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{stream.classroom?.class_name || 'N/A'}</span>
                            <StreamLevelBadge stream={stream} />
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" />
                              <span className="font-medium text-slate-900 dark:text-white">{studentCount} / {displayCapacity}</span>
                              <span className="text-xs text-slate-500">({utilizationPercentage}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${utilizationPercentage >= 90 ? 'bg-red-500' : utilizationPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilizationPercentage, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                          {classTeacher ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-900 dark:text-white font-medium">{getTeacherName(classTeacher)}</span>
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium flex items-center gap-1"><Crown className="w-2.5 h-2.5" />Class Teacher</span>
                                {stream.teachers?.length > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full text-xs">{stream.teachers.length} staff</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-400 italic text-xs">No class teacher</span>
                              {stream.teachers?.length > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full text-xs w-fit">{stream.teachers.length} staff</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                          <RowActionsMenu
                            stream={stream}
                            onEdit={() => showEditForm(stream)}
                            onManageStaff={() => showManageTeachersView(stream)}
                            onAssignClassTeacher={() => openClassTeacherModal(stream)}
                            onDelete={() => handleDelete(stream)}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">{streams.length === 0 ? 'No streams found. Create one to get started.' : 'No streams match current filters.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredStreams.length > 0 ? filteredStreams.map((stream) => {
          const classTeacher = stream.classTeacher || stream.class_teacher;
          const displayCapacity = stream.capacity || 0;
          const studentCount = stream.student_count || 0;
          const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
          return (
            <button key={stream.id} onClick={() => openMobileSheet(stream)} className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{stream.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stream.classroom?.class_name || 'No classroom'} • {stream.teachers?.length || 0} teachers</p>
                  <div className="mt-1"><StreamLevelBadge stream={stream} /></div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Capacity</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{studentCount} / {displayCapacity}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${utilizationPercentage >= 90 ? 'bg-red-500' : utilizationPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilizationPercentage, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{displayCapacity - studentCount} slots available</span>
                  <span className={`font-medium ${utilizationPercentage >= 90 ? 'text-red-600' : utilizationPercentage >= 75 ? 'text-yellow-600' : 'text-green-600'}`}>{utilizationPercentage}%</span>
                </div>
              </div>
              {classTeacher && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Class Teacher: <span className="font-medium text-slate-900 dark:text-white">{getTeacherName(classTeacher)}</span></span>
                  </div>
                </div>
              )}
            </button>
          );
        }) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">{streams.length === 0 ? 'No streams found. Create one to get started.' : 'No streams match current filters.'}</p>
          </div>
        )}
      </div>
    </>
  );

  // ── Create / Edit Form ───────────────────────────────────────────────────
  const renderFormView = () => {
    const selectedClassroom = classrooms.find(c => String(c.id) === String(formData.class_id));
    const formStreamLevel = selectedClassroom ? levelFromClassName(selectedClassroom.class_name) : null;
    const levelFilteredTeachers = formStreamLevel ? teachers.filter(t => teacherMatchesLevel(t, formStreamLevel)) : teachers;
    const assignedToOther = streams.filter(s => s.class_teacher_id && s.id !== selectedStream?.id).map(s => s.class_teacher_id);
    const availableTeachers = levelFilteredTeachers.filter(t => !assignedToOther.includes(t.id));

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${view === 'edit' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-cyan-50 dark:bg-cyan-900/30'}`}>
                {view === 'edit' ? <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{view === 'edit' ? 'Edit Stream' : 'New Stream'}</h3>
            </div>
            <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Stream Name <span className="text-red-500">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Stream A, Blue Stream"
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <div>
              <label htmlFor="class_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Classroom <span className="text-red-500">*</span></label>
              <select id="class_id" name="class_id" value={formData.class_id} onChange={handleInputChange} required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Select a classroom</option>
                {Array.isArray(classrooms) && classrooms.map(c => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
              </select>
              {formStreamLevel && (
                <div className="mt-2 flex items-center gap-1.5">
                  <StreamLevelBadge stream={{ classroom: { class_name: selectedClassroom?.class_name || '' } }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">— only {formStreamLevel} teachers shown below</span>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Capacity <span className="text-red-500">*</span></label>
              <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleInputChange} required min="1" placeholder="Maximum number of students"
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400" />
            </div>
            <div>
              <label htmlFor="class_teacher_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class Teacher <span className="text-xs font-normal text-slate-400">(optional)</span></label>
              <select id="class_teacher_id" name="class_teacher_id" value={formData.class_teacher_id} onChange={handleInputChange} disabled={availableTeachers.length === 0}
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{availableTeachers.length === 0 ? (formStreamLevel ? `No ${formStreamLevel} teachers available` : 'No teachers available') : 'Select a teacher (optional)'}</option>
                {availableTeachers.map(teacher => (<option key={teacher.id} value={teacher.id}>{getTeacherName(teacher)}</option>))}
              </select>
              {formData.class_id && availableTeachers.length === 0 && teachers.length > 0 && (
                <NoCompatibleTeachersHint stream={{ classroom: { class_name: selectedClassroom?.class_name || '' } }} />
              )}
              {teachers.length === 0 && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />No teachers found. Please add teachers first.</p>
              )}
              {formData.class_teacher_id && (
                <p className="mt-1.5 text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />This teacher will be automatically added to teaching staff</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={backToList} className={`px-4 py-2.5 rounded-xl text-sm ${CLS.secondary}`}>Cancel</button>
              <button type="submit" disabled={loading} className={`px-4 py-2.5 rounded-xl text-sm min-w-[90px] shadow-sm ${CLS.primary}`}>
                {loading ? (<span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" />Saving…</span>) : view === 'edit' ? 'Update' : 'Create Stream'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ── Manage Teachers ──────────────────────────────────────────────────────
  const renderManageTeachersView = () => {
    const classTeacher = streamDetails?.classTeacher || streamDetails?.class_teacher;
    const streamLevel = levelFromStream(selectedStream);
    const compatibleTeachers = streamLevel ? teachers.filter(t => teacherMatchesLevel(t, streamLevel)) : teachers;
    const incompatibleCount = teachers.length - compatibleTeachers.length;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto`}>
          <div className={`sticky top-0 ${CLS.modalBg} px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30"><Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Teaching Staff</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">{selectedStream?.name}<span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>{selectedStream?.classroom?.class_name}</p>
              {streamLevel && (
                <div className="flex items-center gap-2 mt-2 ml-9">
                  <StreamLevelBadge stream={selectedStream} />
                  {incompatibleCount > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">{incompatibleCount} teacher{incompatibleCount > 1 ? 's' : ''} from other levels hidden</span>}
                </div>
              )}
            </div>
            <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors mt-0.5"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-5 sm:px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 ${CLS.card} rounded-xl`}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Capacity</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">{streamDetails?.capacity || '—'}</p>
                  </div>
                  <div className={`p-3 ${CLS.card} rounded-xl`}>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Class Teacher</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                      {classTeacher ? getTeacherName(classTeacher) : <span className="text-slate-400 font-normal">Not Assigned</span>}
                    </p>
                  </div>
                </div>
                {classTeacher && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 rounded-xl text-xs text-cyan-700 dark:text-cyan-300">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />Class teacher is automatically included in teaching staff
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">{streamDetails?.teachers?.length || 0}</span>
                      Current Teaching Staff
                    </h4>
                  </div>
                  {streamDetails?.teachers && streamDetails.teachers.length > 0 ? (
                    <div className="space-y-2">
                      {streamDetails.teachers.map(teacher => {
                        const isClassTeacher = streamDetails?.class_teacher_id === teacher.id;
                        const initials = getTeacherName(teacher).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div key={teacher.id} className={`flex items-center gap-3 p-3 ${CLS.card} rounded-xl`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{getTeacherName(teacher)}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {parseSpecializationSubjects(teacher.specialization).length > 0
                                  ? parseSpecializationSubjects(teacher.specialization).map((subj, i) => (
                                      <span key={i} className="inline-block text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md leading-none">{subj}</span>
                                    ))
                                  : <span className="text-xs text-slate-400 dark:text-slate-500">No subjects listed</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isClassTeacher
                                ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full font-medium"><Crown className="w-3 h-3" />Class Teacher</span>
                                : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full font-medium"><GraduationCap className="w-3 h-3" />Teaching</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`text-center py-8 ${CLS.card} rounded-xl`} style={{borderStyle:'dashed'}}>
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No teachers assigned yet</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Assign Teachers</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Select teachers to assign to this stream.</p>
                  {streamLevel && (
                    <div className="mb-3 flex items-start gap-2 p-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 rounded-xl">
                      <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-cyan-800 dark:text-cyan-300">
                        Showing <strong>{compatibleTeachers.length}</strong> teacher{compatibleTeachers.length !== 1 ? 's' : ''} qualified for <strong>{streamLevel}</strong>.
                        {incompatibleCount > 0 && ` ${incompatibleCount} from other levels are hidden.`}
                      </p>
                    </div>
                  )}
                  {compatibleTeachers.length === 0 ? (
                    <NoCompatibleTeachersHint stream={selectedStream} />
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {compatibleTeachers.map(teacher => {
                        const isSelected = selectedTeachers.includes(teacher.id);
                        const isClassTeacher = streamDetails?.class_teacher_id === teacher.id;
                        const initials = getTeacherName(teacher).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div key={teacher.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                              isClassTeacher ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 cursor-not-allowed'
                              : isSelected ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 shadow-sm'
                              : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                            onClick={() => !isClassTeacher && handleTeacherToggle(teacher.id)}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isClassTeacher ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              {isClassTeacher ? <Crown className="w-4 h-4" /> : initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{getTeacherName(teacher)}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {parseSpecializationSubjects(teacher.specialization).length > 0
                                  ? parseSpecializationSubjects(teacher.specialization).map((subj, i) => (
                                      <span key={i} className="inline-block text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md leading-none">{subj}</span>
                                    ))
                                  : <span className="text-xs text-slate-400 dark:text-slate-500">No subjects listed</span>}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {isClassTeacher
                                ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full font-medium"><Crown className="w-3 h-3" />Class Teacher</span>
                                : <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                  </div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {streamDetails?.class_teacher_id && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />Class teacher cannot be removed from teaching staff
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={backToList} className={`px-4 py-2.5 rounded-xl text-sm ${CLS.secondary}`}>Close</button>
                  <button onClick={handleSaveTeachingStaff} disabled={isSavingTeachers} className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm ${CLS.primary}`}>
                    {isSavingTeachers ? (<><Loader className="w-4 h-4 animate-spin" />Saving...</>) : (<><CheckSquare className="w-4 h-4" />Save Staff</>)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── All Class Teachers ───────────────────────────────────────────────────
  const renderAllClassTeachersView = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className={`${CLS.modalBg} rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${CLS.modalBg} p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center`}>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2"><Crown className="w-5 h-5" />All Class Teachers</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">View all streams and their assigned class teachers.</p>
          </div>
          <button onClick={backToList} className="text-[#4c739a] hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-slate-500" /></div>
          ) : (
            <div className="space-y-3">
              {allClassTeachers.length > 0 ? allClassTeachers.map(stream => {
                const classTeacher = stream.classTeacher || stream.class_teacher;
                return (
                  <div key={stream.id} className={`flex justify-between items-center p-4 rounded-lg transition-colors ${CLS.card} hover:bg-slate-50 dark:hover:bg-slate-700/50`}>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{stream.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Classroom: {stream.classroom?.class_name || 'N/A'}</p>
                        <StreamLevelBadge stream={stream} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-700 dark:text-slate-300">{classTeacher ? getTeacherName(classTeacher) : 'Not Assigned'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Class Teacher</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No class teachers assigned yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Class Teacher Modal ──────────────────────────────────────────────────
  const renderClassTeacherModal = () => {
    if (!showClassTeacherModal || !selectedStreamForClassTeacher) return null;
    const stream = selectedStreamForClassTeacher;
    const streamLevel = levelFromStream(stream);
    const availableTeachers = getAvailableClassTeachersForStream(stream);
    const currentClassTeacher = stream.classTeacher || stream.class_teacher;
    const incompatibleCount = teachers.length - getTeachersForStream(stream).length;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/30"><Crown className="w-4 h-4 text-green-600 dark:text-green-400" /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Class Teacher</h3>
              </div>
              <div className="ml-9 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-slate-500 dark:text-slate-400">{stream.name}</span>
                <StreamLevelBadge stream={stream} />
              </div>
            </div>
            <button onClick={() => setShowClassTeacherModal(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors mt-0.5"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {streamLevel && incompatibleCount > 0 && (
              <div className="flex items-start gap-2 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 rounded-xl">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-800 dark:text-cyan-300">Only <strong>{streamLevel}</strong> teachers shown. {incompatibleCount} teacher{incompatibleCount > 1 ? 's' : ''} from other levels are hidden.</p>
              </div>
            )}
            {currentClassTeacher && (
              <div className="p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2 uppercase tracking-wide">Current Class Teacher</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-300">
                      {getTeacherName(currentClassTeacher).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{getTeacherName(currentClassTeacher)}</p>
                  </div>
                  <button onClick={() => { setShowClassTeacherModal(false); openRemoveClassTeacherModal(stream); }} className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove class teacher"><UserX className="w-4 h-4" /></button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{currentClassTeacher ? 'Replace Class Teacher' : 'Assign Class Teacher'}</label>
              {currentClassTeacher && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1"><Info className="w-3 h-3" />Selecting a new teacher will replace the current one</p>
              )}
              <select onChange={e => { if (e.target.value) { handleAssignClassTeacher(stream.id, e.target.value); setShowClassTeacherModal(false); } }} defaultValue="" disabled={availableTeachers.length === 0}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{availableTeachers.length === 0 ? (streamLevel ? `No ${streamLevel} teachers available` : 'No teachers available') : 'Select a teacher…'}</option>
                {availableTeachers.map(teacher => (<option key={teacher.id} value={teacher.id}>{getTeacherName(teacher)}</option>))}
              </select>
              {availableTeachers.length === 0 && <NoCompatibleTeachersHint stream={stream} />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Delete Stream Modal ──────────────────────────────────────────────────
  const renderDeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete Stream</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.streamName}"</span>?
                  {' '}This cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Warning:</strong> This will permanently delete all data including teacher assignments and student records.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, streamId: null, streamName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting…</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete Stream</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Remove Class Teacher Modal ───────────────────────────────────────────
  const renderRemoveClassTeacherModal = () => {
    if (!removeClassTeacherModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Remove Class Teacher</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Remove <span className="font-semibold text-slate-900 dark:text-white">{removeClassTeacherModal.teacherName}</span> as class teacher from{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{removeClassTeacherModal.streamName}"</span>?
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> This teacher will remain in the teaching staff but will no longer be the designated class teacher.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setRemoveClassTeacherModal({ isOpen: false, streamId: null, streamName: '', teacherName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={() => handleRemoveClassTeacher(removeClassTeacherModal.streamId)} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Removing…</>
                : <><UserX className="w-3.5 h-3.5" />Remove Class Teacher</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile Bottom Sheet ──────────────────────────────────────────────────
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div className={`fixed inset-x-0 bottom-0 z-[60] ${CLS.modalBg} rounded-t-3xl shadow-2xl md:hidden`}
          style={{ transform: `translateY(${dragOffset}px)`, maxHeight: '85vh' }}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{stream.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stream.classroom?.class_name || 'No classroom'} • {stream.teachers?.length || 0} teachers</p>
                  <StreamLevelBadge stream={stream} />
                </div>
              </div>
              <button onClick={closeMobileSheet} className="p-2 text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            <div className={`${CLS.card} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Capacity Overview</h3></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{studentCount} / {displayCapacity}</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${utilizationPercentage >= 90 ? 'bg-red-100 text-red-700' : utilizationPercentage >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{utilizationPercentage}% Full</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${utilizationPercentage >= 90 ? 'bg-red-500' : utilizationPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(utilizationPercentage, 100)}%` }} />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-900 dark:text-white">{remainingCapacity}</span> slots remaining</p>
              </div>
            </div>
            {stream.teachers?.length > 0 && (
              <div className={`${CLS.card} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Teaching Staff</h3></div>
                <button onClick={() => { closeMobileSheet(); showManageTeachersView(stream); }} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-cyan-500" /><span className="text-sm font-medium text-slate-900 dark:text-white">View {stream.teachers?.length || 0} Teacher(s)</span></div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            {classTeacher && (
              <div className={`${CLS.card} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3"><UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Class Teacher</h3></div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center"><UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{getTeacherName(classTeacher)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Primary contact for this stream</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={`border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 gap-2 ${CLS.modalBg}`}>
            <button onClick={() => { closeMobileSheet(); showManageTeachersView(stream); }} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 active:scale-[0.98] transition-all"><Users className="w-4 h-4" />Manage Staff</button>
            <button onClick={() => { closeMobileSheet(); openClassTeacherModal(stream); }} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-[0.98] transition-all"><Crown className="w-4 h-4" />Class Teacher</button>
            <button onClick={() => { closeMobileSheet(); showEditForm(stream); }} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"><Edit className="w-4 h-4" />Edit</button>
            <button onClick={() => handleDelete(stream)} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"><Trash2 className="w-4 h-4" />Delete</button>
          </div>
        </div>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Initializing...</p>
      </div>
    );
  }

  if (!user || !schoolId) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">Unable to access stream management</p>
        <p className="text-slate-500 dark:text-slate-400">{!user ? 'Please log in to continue.' : 'Your account is missing school information.'}</p>
      </div>
    );
  }

  // Show full-page spinner while the very first data load is in progress.
  // This replaces the old `loading && view === 'list'` partial spinner and
  // completely prevents any premature banners from appearing.
  if (initializing) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
        <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Loading Streams...</p>
      </div>
    );
  }

  if (!schoolHasStreams) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">Stream Management</h1>
            <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base">Manage streams, assign class teachers, and manage teaching staff</p>
          </div>
        </div>
        {renderStreamsDisabledView()}
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {!initializing && view === 'list'            && renderListView()}
      {(view === 'create' || view === 'edit')      && renderFormView()}
      {view === 'manage-teachers'                  && renderManageTeachersView()}
      {view === 'all-class-teachers'               && renderAllClassTeachersView()}

      {renderClassTeacherModal()}
      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
      {renderRemoveClassTeacherModal()}
    </div>
  );
}

export default StreamManager;
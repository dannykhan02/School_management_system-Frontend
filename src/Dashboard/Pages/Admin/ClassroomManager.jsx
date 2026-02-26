import React, { useEffect, useState, useRef } from 'react';
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
  Info,
  GraduationCap,
  Crown,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────────────────
// LEVEL / GRADE MAPPING  (mirrors StreamManager)
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

function levelFromClassroom(classroom) {
  const className = classroom?.class_name || '';
  return levelFromClassName(className);
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

function teacherMatchesLevel(teacher, classLevel) {
  if (!classLevel) return true;
  const levels = getTeacherLevels(teacher);
  if (!levels || levels.length === 0) return true;
  return levels.includes(classLevel);
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
// TOKEN CONTRACT  (mirrors StreamManager + SubjectManager pill buttons)
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  modalBg:    'bg-white dark:bg-slate-800/50',
  card:       'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
  secondary:  'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  primary:    'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  // Pill buttons — matching SubjectManager delete modal screenshot
  cancelPill: 'px-5 py-2 rounded-full text-sm font-semibold bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  deletePill: 'px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
};

// ─────────────────────────────────────────────────────────────────────────────
// ROW ACTION DROPDOWN  (mirrors StreamManager)
// ─────────────────────────────────────────────────────────────────────────────
function RowActionsMenu({ classroom, hasStreams, onEdit, onManageTeachers, onDelete }) {
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
          <button
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-amber-400" />
            Edit Classroom
          </button>
          {!hasStreams && (
            <button
              onClick={() => handle(onManageTeachers)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Manage Teachers
            </button>
          )}
          <div className="my-1 border-t border-slate-700/60" />
          <button
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />
            Delete Classroom
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ClassroomManager() {
  const { user, loading: authLoading } = useAuth();

  const [classrooms, setClassrooms]     = useState([]);
  const [streams, setStreams]           = useState([]);
  const [teachers, setTeachers]         = useState([]);
  const [allTeachers, setAllTeachers]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [view, setView]                 = useState('list');
  const [searchTerm, setSearchTerm]     = useState('');
  const [levelFilter, setLevelFilter]   = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData]         = useState({ class_name: '', capacity: '' });
  const [hasStreams, setHasStreams]      = useState(false);

  // Teacher assignment modal
  const [showTeacherAssignmentModal, setShowTeacherAssignmentModal] = useState(false);
  const [selectedTeachers, setSelectedTeachers]     = useState([]);
  const [classTeacherId, setClassTeacherId]         = useState(null);
  const [teacherClassroomAssignments, setTeacherClassroomAssignments] = useState({});
  const [teacherMaxClasses, setTeacherMaxClasses]   = useState({});

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, classroomId: null, classroomName: '' });

  // Teacher removal modal
  const [teacherRemovalModal, setTeacherRemovalModal] = useState({
    isOpen: false, teacherId: null, teacherName: '', classroomName: ''
  });

  // Remove class teacher modal
  const [removeClassTeacherModal, setRemoveClassTeacherModal] = useState({
    isOpen: false, classroomId: null, classroomName: '', teacherName: ''
  });

  // Mobile bottom sheet
  const [mobileSheet, setMobileSheet] = useState({ isOpen: false, classroom: null });
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStartY, setDragStartY]   = useState(0);
  const [dragOffset, setDragOffset]   = useState(0);

  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;

  useEffect(() => { if (schoolId) fetchInitialData(); }, [schoolId]);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest('teachers/with-assignments', 'GET').catch(() =>
          apiRequest('teachers', 'GET')
        )
      ]);

      const classroomsData = classroomsResponse?.data || classroomsResponse || [];
      const teachersData   = teachersResponse?.data  || teachersResponse?.teachers || teachersResponse || [];
      const streamsEnabled = classroomsResponse?.has_streams || false;

      setHasStreams(streamsEnabled);

      // Normalise teacher objects, ensuring teaching_levels is present
      const normTeachers = Array.isArray(teachersData) ? teachersData.map(t => ({
        ...t,
        teaching_levels: t.teaching_levels || t.teachingLevels || t.assignments?.teaching_levels || [],
      })) : [];

      setAllTeachers(normTeachers);

      const teacherMaxClassesMap = {};
      normTeachers.forEach(t => { teacherMaxClassesMap[t.id] = t.max_classes || 10; });
      setTeacherMaxClasses(teacherMaxClassesMap);

      const teacherAssignments = {};

      if (streamsEnabled) {
        const streamsResponse = await apiRequest('streams', 'GET');
        const streamsData = streamsResponse?.data || streamsResponse || [];

        streamsData.forEach(stream => {
          if (stream.class_teacher_id) {
            if (!teacherAssignments[stream.class_teacher_id]) teacherAssignments[stream.class_teacher_id] = [];
            teacherAssignments[stream.class_teacher_id].push({
              type: 'stream', name: stream.name, id: stream.id, classroomId: stream.class_id
            });
          }
        });

        const classroomsWithCapacity = classroomsData.map(classroom => {
          const classroomStreams = streamsData.filter(s => s.class_id === classroom.id);
          return {
            ...classroom,
            streams: classroomStreams,
            capacity: classroomStreams.reduce((sum, s) => sum + (s.capacity || 0), 0),
            student_count: classroomStreams.reduce((sum, s) => sum + (s.student_count || 0), 0),
            streamCount: classroomStreams.length,
          };
        });
        setClassrooms(classroomsWithCapacity);
        setStreams(streamsData);
      } else {
        const classroomsWithTeachers = await Promise.all(classroomsData.map(async (classroom) => {
          try {
            const res = await apiRequest(`classrooms/${classroom.id}/teachers`, 'GET');
            const classroomTeachers = res?.teachers || res?.data || [];
            const classTeacher = classroomTeachers.find(t => t.pivot?.is_class_teacher);
            classroomTeachers.forEach(t => {
              if (!teacherAssignments[t.id]) teacherAssignments[t.id] = [];
              teacherAssignments[t.id].push({
                type: 'classroom', name: classroom.class_name, id: classroom.id,
                isClassTeacher: t.pivot?.is_class_teacher || false,
              });
            });
            return {
              ...classroom,
              teachers: classroomTeachers,
              classTeacher,
              teacherCount: classroomTeachers.length,
              capacity: classroom.total_capacity || classroom.capacity || 0,
              student_count: classroom.student_count || 0,
            };
          } catch {
            return {
              ...classroom, teachers: [], classTeacher: null, teacherCount: 0,
              capacity: classroom.total_capacity || classroom.capacity || 0,
              student_count: classroom.student_count || 0,
            };
          }
        }));
        setClassrooms(classroomsWithTeachers);
        setTeachers(normTeachers);
      }

      setTeacherClassroomAssignments(teacherAssignments);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load data');
      setClassrooms([]); setStreams([]); setTeachers([]); setAllTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getTeachersForClassroom = (classroom) => {
    if (!Array.isArray(allTeachers)) return [];
    const level = levelFromClassroom(classroom);
    return allTeachers.filter(t => teacherMatchesLevel(t, level));
  };

  const getAvailableTeachersForClassroom = (classroom) => {
    const compatible = getTeachersForClassroom(classroom);
    const assignedToOther = classrooms
      .filter(c => c.classTeacher && c.id !== classroom?.id)
      .map(c => c.classTeacher?.id);
    return compatible.filter(t => !assignedToOther.includes(t.id));
  };

  const canAssignTeacherToClassroom = (teacherId, classroom) => {
    const maxClasses = teacherMaxClasses[teacherId] || 10;
    const currentAssignments = teacherClassroomAssignments[teacherId] || [];
    const isAlreadyAssigned = classroom?.teachers?.some(t => t.id === teacherId);
    return isAlreadyAssigned || currentAssignments.length < maxClasses;
  };

  const getTeacherRemainingSlots = (teacherId) => {
    const maxClasses = teacherMaxClasses[teacherId] || 10;
    const currentAssignments = teacherClassroomAssignments[teacherId] || [];
    return maxClasses - currentAssignments.length;
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

  // ── Badge / Hint Components ────────────────────────────────────────────────

  const ClassroomLevelBadge = ({ classroom }) => {
    const level = levelFromClassroom(classroom);
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

  const NoCompatibleTeachersHint = ({ classroom }) => {
    const level = levelFromClassroom(classroom);
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

  // ── Mobile touch handlers ──────────────────────────────────────────────────

  const handleTouchStart = (e) => { setIsDragging(true); setDragStartY(e.touches[0].clientY); };
  const handleTouchMove  = (e) => { if (!isDragging) return; const delta = e.touches[0].clientY - dragStartY; if (delta > 0) setDragOffset(delta); };
  const handleTouchEnd   = () => { setIsDragging(false); if (dragOffset > 100) closeMobileSheet(); setDragOffset(0); };
  const openMobileSheet  = (classroom) => { setMobileSheet({ isOpen: true, classroom }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, classroom: null }); document.body.style.overflow = ''; setDragOffset(0); };

  // ── View Handlers ──────────────────────────────────────────────────────────

  const showCreateForm = () => {
    setView('create'); setSelectedClassroom(null);
    setFormData({ class_name: '', capacity: '' });
  };

  const showEditForm = (classroom) => {
    setView('edit'); setSelectedClassroom(classroom);
    setFormData({ class_name: classroom.class_name, capacity: classroom.capacity || '' });
  };

  const showStreamsView = async (classroom) => {
    setView('streams'); setSelectedClassroom(classroom); setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/streams`, 'GET');
      const classroomStreams = response?.streams || response?.data || response || [];
      setStreams(classroomStreams);
      setSelectedClassroom(prev => ({
        ...prev,
        capacity: classroomStreams.reduce((sum, s) => sum + (s.capacity || 0), 0),
        student_count: classroomStreams.reduce((sum, s) => sum + (s.student_count || 0), 0),
        streamCount: classroomStreams.length,
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load streams');
      setStreams([]);
    } finally { setLoading(false); }
  };

  const showTeachersView = async (classroom) => {
    setView('teachers'); setSelectedClassroom(classroom); setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/teachers`, 'GET');
      const classroomTeachers = response?.teachers || response?.data || response || [];
      const classTeacher = classroomTeachers.find(t => t.pivot?.is_class_teacher);
      setTeachers(classroomTeachers);
      setSelectedClassroom(prev => ({
        ...prev, classTeacher, teacherCount: classroomTeachers.length,
        capacity: prev.capacity || prev.total_capacity || 0, student_count: prev.student_count || 0,
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load teachers');
      setTeachers([]);
    } finally { setLoading(false); }
  };

  const openTeacherAssignmentModal = async (classroom) => {
    setSelectedClassroom(classroom);
    const alreadyAssigned = classroom.teachers ? classroom.teachers.map(t => t.id) : [];
    const currentClassTeacher = classroom.classTeacher ? classroom.classTeacher.id : null;
    setSelectedTeachers(alreadyAssigned);
    setClassTeacherId(currentClassTeacher);
    setShowTeacherAssignmentModal(true);
  };

  const backToList = () => {
    setView('list'); setSelectedClassroom(null);
    setTeachers([]); setStreams([]);
    fetchInitialData();
  };

  // ── Filtered data ──────────────────────────────────────────────────────────

  const filteredClassrooms = classrooms.filter(classroom => {
    const matchesSearch = classroom.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    const classLevel = levelFromClassroom(classroom);
    const matchesLevel = levelFilter === 'all' || classLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { class_name: formData.class_name, school_id: schoolId };
      if (!hasStreams) payload.capacity = formData.capacity;

      if (view === 'edit') {
        await apiRequest(`classrooms/${selectedClassroom.id}`, 'PUT', payload);
        toast.success('Classroom updated successfully');
      } else {
        await apiRequest('classrooms', 'POST', payload);
        toast.success('Classroom created successfully');
      }
      backToList();
    } catch (error) {
      let errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      if (error?.response?.data?.errors?.class_teacher_id) errorMessage = error.response.data.errors.class_teacher_id[0];
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} classroom: ${errorMessage}`);
    } finally { setLoading(false); }
  };

  const handleDelete = (classroom) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, classroomId: classroom.id, classroomName: classroom.class_name });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${deleteModal.classroomId}`, 'DELETE');
      toast.success(`${deleteModal.classroomName} deleted successfully`);
      setDeleteModal({ isOpen: false, classroomId: null, classroomName: '' });
      fetchInitialData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete classroom');
    } finally { setLoading(false); }
  };

  const handleRemoveTeacher = (teacher) => {
    setTeacherRemovalModal({
      isOpen: true, teacherId: teacher.id,
      teacherName: getTeacherName(teacher),
      classroomName: selectedClassroom?.class_name || 'the classroom',
    });
  };

  const confirmTeacherRemoval = async () => {
    setLoading(true);
    try {
      await apiRequest(`teachers/${teacherRemovalModal.teacherId}/classrooms/${selectedClassroom.id}`, 'DELETE');
      toast.success('Teacher removed successfully');
      setTeacherRemovalModal({ isOpen: false, teacherId: null, teacherName: '', classroomName: '' });
      await fetchInitialData();
      if (view === 'teachers' && selectedClassroom) await showTeachersView(selectedClassroom);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove teacher');
    } finally { setLoading(false); }
  };

  const handleAssignClassTeacher = async (classroomId, teacherId) => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${classroomId}/class-teacher`, 'POST', { teacher_id: teacherId });
      toast.success('Class teacher assigned successfully');
      await fetchInitialData();
      if (selectedClassroom?.id === classroomId) await showTeachersView(selectedClassroom);
    } catch (error) {
      let errorMessage = error?.response?.data?.message || 'Failed to assign class teacher';
      if (error?.response?.data?.existing_classroom) errorMessage = `This teacher is already class teacher for ${error.response.data.existing_classroom}.`;
      toast.error(errorMessage);
    } finally { setLoading(false); }
  };

  const openRemoveClassTeacherModal = (classroom) => {
    const ct = classroom.classTeacher || classroom.class_teacher;
    setRemoveClassTeacherModal({ isOpen: true, classroomId: classroom.id, classroomName: classroom.class_name, teacherName: getTeacherName(ct) });
  };

  const handleRemoveClassTeacher = async (classroomId) => {
    setLoading(true);
    try {
      await apiRequest(`classrooms/${classroomId}/class-teacher`, 'DELETE');
      toast.success('Class teacher removed successfully');
      setRemoveClassTeacherModal({ isOpen: false, classroomId: null, classroomName: '', teacherName: '' });
      await fetchInitialData();
      if (selectedClassroom?.id === classroomId) await showTeachersView(selectedClassroom);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove class teacher');
    } finally { setLoading(false); }
  };

  const handleAssignTeachers = async () => {
    if (selectedTeachers.length === 0) { toast.error('Please select at least one teacher'); return; }
    const alreadyAssigned = selectedClassroom?.teachers?.map(t => t.id) || [];
    const newTeachers = selectedTeachers.filter(tid => !alreadyAssigned.includes(tid));
    if (newTeachers.length === 0) { toast.info('All selected teachers are already assigned'); return; }

    setLoading(true);
    try {
      const teachersPayload = selectedTeachers.map(tid => ({
        teacher_id: tid, is_class_teacher: tid === classTeacherId
      }));
      await apiRequest(`classrooms/${selectedClassroom.id}/teachers`, 'POST', { teachers: teachersPayload });
      toast.success('Teachers assigned successfully');
      setShowTeacherAssignmentModal(false);
      await fetchInitialData();
      await showTeachersView(selectedClassroom);
    } catch (error) {
      let errorMessage = error?.response?.data?.message || 'Failed to assign teachers';
      if (error?.response?.data?.existing_classroom) errorMessage = `Teacher already class teacher for ${error.response.data.existing_classroom}.`;
      toast.error(errorMessage);
    } finally { setLoading(false); }
  };

  const toggleTeacherSelection = (teacherId, classroom) => {
    const isAlreadyAssigned = selectedClassroom?.teachers?.some(t => t.id === teacherId);
    if (isAlreadyAssigned) { toast.info('This teacher is already assigned to this classroom'); return; }
    if (!canAssignTeacherToClassroom(teacherId, classroom)) { toast.error('Teacher has reached maximum number of classes'); return; }
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        if (classTeacherId === teacherId) setClassTeacherId(null);
        return prev.filter(id => id !== teacherId);
      }
      return [...prev, teacherId];
    });
  };

  const setAsClassTeacher = (teacherId) => {
    if (!selectedTeachers.includes(teacherId)) setSelectedTeachers(prev => [...prev, teacherId]);
    setClassTeacherId(teacherId);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderListView = () => (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

        {/* Desktop header actions */}
        <div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={showCreateForm}
            className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />New Classroom
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

      {/* Mobile header actions */}
      <div className="md:hidden mb-4">
        <button
          onClick={showCreateForm}
          className="w-full bg-black text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black"
        >
          <Plus className="w-4 h-4" />New Classroom
        </button>
      </div>

      {!loading && allTeachers.length === 0 && !hasStreams && (
        <div className="mb-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200"><strong>Note:</strong> No teachers found. Please add teachers first.</p>
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">
        {/* Mobile */}
        <div className="block md:hidden">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
              <span className="text-xs text-slate-500">({filteredClassrooms.length}/{classrooms.length})</span>
              {levelFilter !== 'all' && <span className="px-1.5 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">1 active</span>}
            </div>
            {showFilters
              ? <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              : <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </button>
          {showFilters && (
            <div className="space-y-2">
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by classroom name..." className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="all">All Levels</option>
                {Object.keys(LEVEL_GRADE_MAP).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          )}
        </div>
        {/* Desktop */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by classroom name..." className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
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
                <span className="text-xs text-slate-600 dark:text-slate-400">Showing <span className="font-semibold">{filteredClassrooms.length}</span> of <span className="font-semibold">{classrooms.length}</span></span>
                {levelFilter !== 'all' && (
                  <button onClick={() => setLevelFilter('all')} className="ml-auto text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Clear</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Table ────────────────────────────────────────────────────── */}
      <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">Existing Classrooms</h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Class Name</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Level</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Capacity</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">{hasStreams ? 'Streams' : 'Teachers'}</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Class Teacher</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredClassrooms.length > 0 ? filteredClassrooms.map((classroom) => {
                  const displayCapacity = classroom.capacity || 0;
                  const studentCount = classroom.student_count || 0;
                  const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
                  const classTeacher = classroom.classTeacher || classroom.class_teacher;
                  return (
                    <tr key={classroom.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-white">{classroom.class_name}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <ClassroomLevelBadge classroom={classroom} />
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
                        {hasStreams ? (
                          classroom.streamCount > 0 ? (
                            <button onClick={() => showStreamsView(classroom)} className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 hover:underline transition-colors">
                              <MapPin className="w-4 h-4" /><span>{classroom.streamCount} Stream(s)</span>
                            </button>
                          ) : <span className="text-slate-400 italic text-xs">No streams</span>
                        ) : (
                          classroom.teacherCount > 0 ? (
                            <button onClick={() => showTeachersView(classroom)} className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 hover:underline transition-colors">
                              <Users className="w-4 h-4" /><span>{classroom.teacherCount} Teacher(s)</span>
                            </button>
                          ) : <span className="text-slate-400 italic text-xs">No teachers</span>
                        )}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                        {classTeacher ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-900 dark:text-white font-medium">{getTeacherName(classTeacher)}</span>
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                              <Crown className="w-2.5 h-2.5" />Class Teacher
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                        <RowActionsMenu
                          classroom={classroom}
                          hasStreams={hasStreams}
                          onEdit={() => showEditForm(classroom)}
                          onManageTeachers={() => openTeacherAssignmentModal(classroom)}
                          onDelete={() => handleDelete(classroom)}
                        />
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">{classrooms.length === 0 ? 'No classrooms found. Create one to get started.' : 'No classrooms match current filters.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Mobile Cards ─────────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {filteredClassrooms.length > 0 ? filteredClassrooms.map((classroom) => {
          const displayCapacity = classroom.capacity || 0;
          const studentCount = classroom.student_count || 0;
          const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
          const classTeacher = classroom.classTeacher || classroom.class_teacher;
          return (
            <button key={classroom.id} onClick={() => openMobileSheet(classroom)} className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{classroom.class_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hasStreams ? `${classroom.streamCount || 0} streams` : `${classroom.teacherCount || 0} teachers`}</p>
                  <div className="mt-1"><ClassroomLevelBadge classroom={classroom} /></div>
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
            <p className="text-slate-500 dark:text-slate-400 text-sm">{classrooms.length === 0 ? 'No classrooms found. Create one to get started.' : 'No classrooms match current filters.'}</p>
          </div>
        )}
      </div>
    </>
  );

  // ── Create / Edit Form ─────────────────────────────────────────────────────
  const renderFormView = () => {
    const classLevel = levelFromClassName(formData.class_name);
    const levelFilteredTeachers = classLevel ? allTeachers.filter(t => teacherMatchesLevel(t, classLevel)) : allTeachers;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${view === 'edit' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-cyan-50 dark:bg-cyan-900/30'}`}>
                {view === 'edit' ? <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{view === 'edit' ? 'Edit Classroom' : 'New Classroom'}</h3>
            </div>
            <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
            <div>
              <label htmlFor="class_name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Class Name <span className="text-red-500">*</span></label>
              <input type="text" id="class_name" name="class_name" value={formData.class_name} onChange={handleInputChange} required placeholder="e.g., Grade 5, Form 1"
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400" />
              {classLevel && (
                <div className="mt-2 flex items-center gap-1.5">
                  <ClassroomLevelBadge classroom={{ class_name: formData.class_name }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">detected level</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Capacity {!hasStreams && <span className="text-red-500">*</span>}
              </label>
              <input type="number" id="capacity" name="capacity" value={formData.capacity} onChange={handleInputChange} min="1"
                placeholder={hasStreams ? 'Auto-calculated from streams' : 'Maximum number of students'}
                disabled={hasStreams}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm shadow-sm transition-all ${hasStreams ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400'}`}
              />
              {hasStreams && (
                <div className="mt-2 p-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-cyan-800 dark:text-cyan-300">Capacity is auto-calculated from the total capacity of all streams in this classroom.</p>
                </div>
              )}
            </div>

            {!hasStreams && classLevel && levelFilteredTeachers.length < allTeachers.length && (
              <div className="flex items-start gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-400">{allTeachers.length - levelFilteredTeachers.length} teacher(s) not qualified for <strong>{classLevel}</strong> will be hidden when assigning teachers.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={backToList} className={`px-4 py-2.5 rounded-xl text-sm ${CLS.secondary}`}>Cancel</button>
              <button type="submit" disabled={loading} className={`px-4 py-2.5 rounded-xl text-sm min-w-[90px] shadow-sm ${CLS.primary}`}>
                {loading ? (<span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" />Saving…</span>) : view === 'edit' ? 'Update' : 'Create Classroom'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ── Streams View ───────────────────────────────────────────────────────────
  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${CLS.modalBg} px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30"><MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Streams</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">
              {selectedClassroom?.class_name}<span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>{selectedClassroom?.streamCount || 0} streams · Total capacity {selectedClassroom?.capacity || 0}
            </p>
            <div className="ml-9 mt-1"><ClassroomLevelBadge classroom={selectedClassroom} /></div>
          </div>
          <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 sm:px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : (
            <div className="space-y-3">
              {streams.length > 0 ? streams.map(stream => {
                const ct = stream.classTeacher || stream.class_teacher;
                const sp = stream.capacity || 0;
                const sc = stream.student_count || 0;
                const util = sp > 0 ? Math.round((sc / sp) * 100) : 0;
                return (
                  <div key={stream.id} className={`p-4 rounded-xl ${CLS.card} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{stream.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">Capacity: {sc} / {sp}</span>
                          {ct && (
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5" />{getTeacherName(ct)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${util >= 90 ? 'bg-red-500' : util >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(util, 100)}%` }} />
                        </div>
                      </div>
                      <span className={`ml-4 text-xs font-semibold px-2 py-1 rounded-full ${util >= 90 ? 'bg-red-100 text-red-700' : util >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{util}%</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No streams configured for this classroom.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Teachers View ──────────────────────────────────────────────────────────
  const renderTeachersView = () => {
    const classLevel = levelFromClassroom(selectedClassroom);
    const compatibleAll = classLevel ? allTeachers.filter(t => teacherMatchesLevel(t, classLevel)) : allTeachers;
    const incompatibleCount = allTeachers.length - compatibleAll.length;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto`}>
          <div className={`sticky top-0 ${CLS.modalBg} px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30"><Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Teaching Staff</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">{selectedClassroom?.class_name}</p>
              {classLevel && (
                <div className="flex items-center gap-2 mt-2 ml-9">
                  <ClassroomLevelBadge classroom={selectedClassroom} />
                  {incompatibleCount > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">{incompatibleCount} teacher{incompatibleCount > 1 ? 's' : ''} from other levels hidden</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <button onClick={() => openTeacherAssignmentModal(selectedClassroom)} className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                <UserPlus className="w-3.5 h-3.5" />Manage
              </button>
              <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-8"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-3">
                {teachers.length > 0 ? teachers.map(teacher => {
                  const isClassTeacher = teacher.pivot?.is_class_teacher;
                  const initials = getTeacherName(teacher).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  const classesCount = teacherClassroomAssignments[teacher.id]?.length || 0;
                  const maxClasses = teacherMaxClasses[teacher.id] || 10;
                  const isClassTeacherElsewhere = (teacherClassroomAssignments[teacher.id] || []).some(a => a.isClassTeacher);

                  return (
                    <div key={teacher.id} className={`flex items-center gap-3 p-3 rounded-xl ${CLS.card}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isClassTeacher ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{getTeacherName(teacher)}</p>
                          {isClassTeacher && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full font-medium"><Crown className="w-3 h-3" />Class Teacher</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {parseSpecializationSubjects(teacher.specialization).length > 0
                            ? parseSpecializationSubjects(teacher.specialization).map((subj, i) => (
                                <span key={i} className="inline-block text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md leading-none">{subj}</span>
                              ))
                            : <span className="text-xs text-slate-400">No subjects listed</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Info className="w-3 h-3 text-cyan-500" />
                          <span className="text-xs text-cyan-600 dark:text-cyan-400">{classesCount} of {maxClasses} classes assigned</span>
                        </div>
                        {isClassTeacherElsewhere && !isClassTeacher && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">Class teacher elsewhere: {(teacherClassroomAssignments[teacher.id] || []).filter(a => a.isClassTeacher).map(a => a.name).join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isClassTeacher ? (
                          <button onClick={() => openRemoveClassTeacherModal(selectedClassroom)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove class teacher"><UserX className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => handleAssignClassTeacher(selectedClassroom.id, teacher.id)} className="p-1.5 text-green-500 hover:text-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Assign as class teacher"><UserCheck className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleRemoveTeacher(teacher)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove from classroom"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className={`text-center py-8 ${CLS.card} rounded-xl`} style={{ borderStyle: 'dashed' }}>
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No teachers assigned yet</p>
                    <button onClick={() => openTeacherAssignmentModal(selectedClassroom)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                      <UserPlus className="w-3.5 h-3.5" />Assign Teachers
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Teacher Assignment Modal ────────────────────────────────────────────────
  const renderTeacherAssignmentModal = () => {
    const classLevel = levelFromClassroom(selectedClassroom);
    const compatibleTeachers = classLevel ? allTeachers.filter(t => teacherMatchesLevel(t, classLevel)) : allTeachers;
    const incompatibleCount = allTeachers.length - compatibleTeachers.length;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col`}>
          <div className={`sticky top-0 ${CLS.modalBg} px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30"><UserPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Manage Teachers</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 ml-9">{selectedClassroom?.class_name}</p>
              {classLevel && (
                <div className="flex items-center gap-2 mt-2 ml-9">
                  <ClassroomLevelBadge classroom={selectedClassroom} />
                  {incompatibleCount > 0 && <span className="text-xs text-slate-400 dark:text-slate-500">{incompatibleCount} teacher{incompatibleCount > 1 ? 's' : ''} from other levels hidden</span>}
                </div>
              )}
            </div>
            <button onClick={() => setShowTeacherAssignmentModal(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors mt-0.5"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
            {classLevel && (
              <div className="mb-4 flex items-start gap-2 p-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/50 rounded-xl">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-800 dark:text-cyan-300">
                  Showing <strong>{compatibleTeachers.length}</strong> teacher{compatibleTeachers.length !== 1 ? 's' : ''} qualified for <strong>{classLevel}</strong>.
                  {incompatibleCount > 0 && ` ${incompatibleCount} from other levels are hidden.`}
                </p>
              </div>
            )}
            {compatibleTeachers.length === 0 ? (
              <NoCompatibleTeachersHint classroom={selectedClassroom} />
            ) : (
              <div className="space-y-2">
                {compatibleTeachers.map(teacher => {
                  const isSelected = selectedTeachers.includes(teacher.id);
                  const isClassTeacher = classTeacherId === teacher.id;
                  const isAlreadyAssigned = selectedClassroom?.teachers?.some(t => t.id === teacher.id);
                  const isCurrentClassTeacher = selectedClassroom?.classTeacher?.id === teacher.id;
                  const isClassTeacherElsewhere = (teacherClassroomAssignments[teacher.id] || []).some(a => a.isClassTeacher);
                  const remainingSlots = getTeacherRemainingSlots(teacher.id);
                  const canAssign = canAssignTeacherToClassroom(teacher.id, selectedClassroom);
                  const initials = getTeacherName(teacher).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div key={teacher.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                        isAlreadyAssigned ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 cursor-not-allowed'
                        : !canAssign ? 'opacity-60 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 cursor-not-allowed'
                        : isSelected ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700 shadow-sm'
                        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                      onClick={() => { if (!isAlreadyAssigned && canAssign) toggleTeacherSelection(teacher.id, selectedClassroom); }}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAlreadyAssigned ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' : isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {isAlreadyAssigned ? <CheckCircle className="w-4 h-4" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {getTeacherName(teacher)}
                          {isAlreadyAssigned && <span className="ml-2 text-xs text-cyan-600 dark:text-cyan-400 font-normal">(Already assigned)</span>}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {parseSpecializationSubjects(teacher.specialization).length > 0
                            ? parseSpecializationSubjects(teacher.specialization).map((subj, i) => (
                                <span key={i} className="inline-block text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md leading-none">{subj}</span>
                              ))
                            : <span className="text-xs text-slate-400">No subjects listed</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Info className="w-3 h-3 text-cyan-500" />
                          <span className="text-xs text-cyan-600 dark:text-cyan-400">
                            {teacherClassroomAssignments[teacher.id]?.length || 0} of {teacherMaxClasses[teacher.id] || 10} classes
                            {remainingSlots > 0 ? ` · ${remainingSlots} slots remaining` : ' · No slots remaining'}
                          </span>
                        </div>
                        {isClassTeacherElsewhere && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">Class teacher elsewhere: {(teacherClassroomAssignments[teacher.id] || []).filter(a => a.isClassTeacher).map(a => a.name).join(', ')}</span>
                          </div>
                        )}
                        {!canAssign && !isAlreadyAssigned && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            <span className="text-xs text-red-600 dark:text-red-400">Maximum classes reached</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {(isSelected || isAlreadyAssigned) ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (!isClassTeacherElsewhere || isClassTeacher || isCurrentClassTeacher) setAsClassTeacher(teacher.id); }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isClassTeacher || isCurrentClassTeacher ? 'bg-cyan-600 text-white' : isClassTeacherElsewhere ? 'bg-slate-200 text-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            disabled={isClassTeacherElsewhere && !isClassTeacher && !isCurrentClassTeacher}
                            title={isClassTeacherElsewhere && !isClassTeacher ? 'Already class teacher elsewhere' : ''}
                          >
                            {isClassTeacher || isCurrentClassTeacher ? <span className="flex items-center gap-1"><Crown className="w-3 h-3" />Class Teacher</span> : 'Set as Class Teacher'}
                          </button>
                        ) : (
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${!canAssign ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 opacity-50' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={() => setShowTeacherAssignmentModal(false)} className={`px-4 py-2.5 rounded-xl text-sm ${CLS.secondary}`} disabled={loading}>Cancel</button>
            <button onClick={handleAssignTeachers} disabled={loading || selectedTeachers.length === 0} className={`px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-sm ${CLS.primary}`}>
              {loading ? (<><Loader className="w-4 h-4 animate-spin" />Saving...</>) : (<><CheckSquare className="w-4 h-4" />Save Staff</>)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Delete Confirmation ────────────────────────────────────────────────────
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
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete Classroom</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.classroomName}"</span>?
                  {' '}This cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Warning:</strong> This will permanently delete all data including {hasStreams ? 'streams' : 'teacher assignments'} and student records.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, classroomId: null, classroomName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting…</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete Classroom</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Teacher Removal Modal ──────────────────────────────────────────────────
  const renderTeacherRemovalModal = () => {
    if (!teacherRemovalModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Remove Teacher</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Remove <span className="font-semibold text-slate-900 dark:text-white">{teacherRemovalModal.teacherName}</span> from{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{teacherRemovalModal.classroomName}"</span>?
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> This only removes the teacher from this classroom. They remain available for other classes.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setTeacherRemovalModal({ isOpen: false, teacherId: null, teacherName: '', classroomName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={confirmTeacherRemoval} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Removing…</>
                : <><UserX className="w-3.5 h-3.5" />Remove Teacher</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Remove Class Teacher Modal ─────────────────────────────────────────────
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
                  <span className="font-semibold text-slate-900 dark:text-white">"{removeClassTeacherModal.classroomName}"</span>?
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
              onClick={() => setRemoveClassTeacherModal({ isOpen: false, classroomId: null, classroomName: '', teacherName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={() => handleRemoveClassTeacher(removeClassTeacherModal.classroomId)} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Removing…</>
                : <><UserX className="w-3.5 h-3.5" />Remove Class Teacher</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile Bottom Sheet ────────────────────────────────────────────────────
  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.classroom) return null;
    const classroom = mobileSheet.classroom;
    const displayCapacity = classroom.capacity || 0;
    const studentCount = classroom.student_count || 0;
    const remainingCapacity = displayCapacity - studentCount;
    const utilizationPercentage = displayCapacity > 0 ? Math.round((studentCount / displayCapacity) * 100) : 0;
    const classTeacher = classroom.classTeacher || classroom.class_teacher;

    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div
          className={`fixed inset-x-0 bottom-0 z-[60] ${CLS.modalBg} rounded-t-3xl shadow-2xl md:hidden`}
          style={{ transform: `translateY(${dragOffset}px)`, maxHeight: '85vh' }}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{classroom.class_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{hasStreams ? `${classroom.streamCount || 0} streams` : `${classroom.teacherCount || 0} teachers`}</p>
                  <ClassroomLevelBadge classroom={classroom} />
                </div>
              </div>
              <button onClick={closeMobileSheet} className="p-2 text-slate-500 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            {/* Capacity */}
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
            {/* Streams / Teachers */}
            {hasStreams && classroom.streamCount > 0 && (
              <div className={`${CLS.card} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3"><MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Streams</h3></div>
                <button onClick={() => { closeMobileSheet(); showStreamsView(classroom); }} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-500" /><span className="text-sm font-medium text-slate-900 dark:text-white">View {classroom.streamCount} Stream(s)</span></div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            {!hasStreams && classroom.teacherCount > 0 && (
              <div className={`${CLS.card} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Teaching Staff</h3></div>
                <button onClick={() => { closeMobileSheet(); showTeachersView(classroom); }} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-cyan-500" /><span className="text-sm font-medium text-slate-900 dark:text-white">View {classroom.teacherCount} Teacher(s)</span></div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            {/* Class Teacher */}
            {classTeacher && (
              <div className={`${CLS.card} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3"><UserCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" /><h3 className="text-sm font-semibold text-slate-900 dark:text-white">Class Teacher</h3></div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center"><UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{getTeacherName(classTeacher)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Primary contact for this class</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Mobile sheet actions */}
          <div className={`border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 gap-2 ${CLS.modalBg}`}>
            {!hasStreams && (
              <button onClick={() => { closeMobileSheet(); showTeachersView(classroom); }} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 active:scale-[0.98] transition-all">
                <Users className="w-4 h-4" />Manage Staff
              </button>
            )}
            {!hasStreams && (
              <button onClick={() => { closeMobileSheet(); openTeacherAssignmentModal(classroom); }} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-[0.98] transition-all">
                <UserPlus className="w-4 h-4" />Assign
              </button>
            )}
            <button onClick={() => { closeMobileSheet(); showEditForm(classroom); }} className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all ${hasStreams ? 'col-span-1' : ''}`}>
              <Edit className="w-4 h-4" />Edit
            </button>
            <button onClick={() => handleDelete(classroom)} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all">
              <Trash2 className="w-4 h-4" />Delete
            </button>
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
        <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">Unable to access classroom management</p>
        <p className="text-slate-500 dark:text-slate-400">{!user ? 'Please log in to continue.' : 'Your account is missing school information.'}</p>
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

      {!loading && view === 'list'              && renderListView()}
      {(view === 'create' || view === 'edit')   && renderFormView()}
      {view === 'streams'                       && renderStreamsView()}
      {view === 'teachers'                      && renderTeachersView()}
      {showTeacherAssignmentModal               && renderTeacherAssignmentModal()}

      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
      {renderTeacherRemovalModal()}
      {renderRemoveClassTeacherModal()}
    </div>
  );
}

export default ClassroomManager;
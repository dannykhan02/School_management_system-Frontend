import React, { useEffect, useState, useCallback } from 'react';
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
  ChevronUp,
  ChevronRight,
  Award,
  AlertCircle,
  RefreshCw,
  XCircle,
  CheckCircle,
  Building,
  Layers,
  GraduationCap,
  FlaskConical,
  Palette,
  Globe
} from 'lucide-react';
import { toast } from "react-toastify";
import ManageAssignments from '../../../components/ManageAssignments';
import BulkAssignmentModal from '../../../components/BulkAssignmentModal';

// ─── Helper: derive level from grade_level ────────────────────────────────────
const LEVEL_GRADE_MAP = {
  'Pre-Primary':      ['PP1-PP2'],
  'Primary':          ['Grade 1-3', 'Grade 4-6', 'Standard 1-4', 'Standard 5-8'],
  'Junior Secondary': ['Grade 7-9'],
  'Senior Secondary': ['Grade 10-12'],
  'Secondary':        ['Form 1-4'],
};

function levelFromGrade(gradeLevel) {
  for (const [level, grades] of Object.entries(LEVEL_GRADE_MAP)) {
    if (grades.includes(gradeLevel)) return level;
  }
  return null;
}

const SENIOR_SECONDARY_PATHWAYS = ['STEM', 'Arts', 'Social Sciences'];

// ─── Badge colour helpers ─────────────────────────────────────────────────────
const getCurriculumBadgeColor = (type) =>
  type === 'CBC'
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    : type === '8-4-4'
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';

const getCategoryBadgeColor = (category) => {
  const map = {
    Languages:    'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    Mathematics:  'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    Sciences:     'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    Humanities:   'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    Technical:    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    'Creative Arts': 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300',
    'Physical Ed':'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300',
  };
  return map[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
};

const getPathwayBadgeColor = (pathway) => {
  const map = {
    STEM:             'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    Arts:             'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    'Social Sciences':'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  };
  return map[pathway] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
};

const getPathwayIcon = (pathway) => {
  if (pathway === 'STEM')             return <FlaskConical className="w-3 h-3" />;
  if (pathway === 'Arts')             return <Palette className="w-3 h-3" />;
  if (pathway === 'Social Sciences')  return <Globe className="w-3 h-3" />;
  return null;
};

const getGradeLevelBadgeColor = () =>
  'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300';

// ─── Empty form state ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  code: '',
  category: '',
  is_core: false,
  grade_level: '',
  pathway: '',
};

// ─────────────────────────────────────────────────────────────────────────────
function SubjectManager() {
  const { schoolId, loading: authLoading } = useAuth();

  // ── Core data ──────────────────────────────────────────────────────────────
  const [subjects,          setSubjects]          = useState([]);
  const [filteredSubjects,  setFilteredSubjects]  = useState([]);
  const [teachers,          setTeachers]          = useState([]);
  const [streams,           setStreams]            = useState([]);
  const [academicYears,     setAcademicYears]      = useState([]);
  const [assignments,       setAssignments]        = useState([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [view,       setView]       = useState('list');

  // ── School / config ────────────────────────────────────────────────────────
  const [school,       setSchool]       = useState(null);
  const [hasStreams,   setHasStreams]   = useState(false);
  const [schoolLevels, setSchoolLevels] = useState([]);
  const [constants,    setConstants]    = useState({
    curriculum_types: [], educational_levels: [], level_grade_map: {},
    cbc_grade_levels: [], legacy_grade_levels: [],
    senior_secondary_pathways: [], categories: [],
  });
  const [constantsLoading, setConstantsLoading] = useState(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchTerm,       setSearchTerm]       = useState('');
  const [filterCategory,   setFilterCategory]   = useState('all');
  const [filterCoreStatus, setFilterCoreStatus] = useState('all');
  const [filterGradeLevel, setFilterGradeLevel] = useState('all');
  const [filterPathway,    setFilterPathway]    = useState('all');
  const [showFilters,      setShowFilters]      = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // ── Subject form ───────────────────────────────────────────────────────────
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData,        setFormData]        = useState(EMPTY_FORM);

  // ── Subject name autofill ──────────────────────────────────────────────────
  const [subjectSearchResults,   setSubjectSearchResults]   = useState([]);
  const [searchLoading,          setSearchLoading]          = useState(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [subjectExists,          setSubjectExists]          = useState(false);

  // ── Assignment state ───────────────────────────────────────────────────────
  const [selectedAcademicYear,     setSelectedAcademicYear]     = useState(null);
  const [selectedAcademicYearInfo, setSelectedAcademicYearInfo] = useState(null);
  const [selectedTeacher,          setSelectedTeacher]          = useState(null);
  const [teacherClassrooms,        setTeacherClassrooms]        = useState([]);
  const [teacherStreams,            setTeacherStreams]            = useState([]);
  const [assignmentFormData, setAssignmentFormData] = useState({
    teacher_id: '', classroom_id: '', stream_id: '',
    academic_year_id: '', term_id: '', weekly_periods: 5, assignment_type: 'main_teacher',
  });

  // ── Modal state ────────────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, subjectId: null, subjectName: '' });
  const [deleteAssignmentModal, setDeleteAssignmentModal] = useState({ isOpen: false, assignmentId: null, assignmentInfo: '' });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [mobileSheet,   setMobileSheet]   = useState({ isOpen: false, subject: null });

  // ─── Available grade levels for the current school ────────────────────────
  const availableGradeLevels = React.useMemo(() => {
    const grades = [];
    for (const level of schoolLevels) {
      const gradeList = LEVEL_GRADE_MAP[level] || [];
      // Only push grades that exist in the seeded subjects
      gradeList.forEach(g => {
        if (!grades.includes(g)) grades.push(g);
      });
    }
    return grades;
  }, [schoolLevels]);

  // ─── Grade levels available for the form (filtered by school) ────────────
  const formGradeLevels = React.useMemo(() => {
    // Combine cbc + legacy based on what the school has
    const isCBC = school?.primary_curriculum === 'CBC' || school?.primary_curriculum === 'Both';
    const is844 = school?.primary_curriculum === '8-4-4' || school?.primary_curriculum === 'Both';
    let all = [];
    if (isCBC) all = [...all, ...constants.cbc_grade_levels];
    if (is844) all = [...all, ...constants.legacy_grade_levels];
    // Filter further to only levels the school offers
    return all.filter(g => {
      const level = levelFromGrade(g);
      return level && schoolLevels.includes(level);
    });
  }, [school, constants, schoolLevels]);

  // Whether the current form grade_level is Senior Secondary
  const isSeniorSecondary = levelFromGrade(formData.grade_level) === 'Senior Secondary';

  // ─── Teachers compatible with the currently selected subject ──────────────
  const compatibleTeachers = React.useMemo(() => {
    if (!selectedSubject) return teachers;

    const subjectLevel = levelFromGrade(selectedSubject.grade_level);
    const subjectPathway = selectedSubject.pathway;

    return teachers.filter(teacher => {
      const tData = teacher.assignments; // raw teacher object is stored here
      const teachingLevels = tData?.teaching_levels || [];
      const teachingPathways = tData?.teaching_pathways || [];

      // If teacher has no teaching_levels set, allow (backwards compat)
      if (teachingLevels.length === 0) return true;

      // Must teach this level
      if (subjectLevel && !teachingLevels.includes(subjectLevel)) return false;

      // If subject has pathway, teacher must teach that pathway
      if (subjectPathway && teachingPathways.length > 0 && !teachingPathways.includes(subjectPathway)) return false;

      return true;
    });
  }, [teachers, selectedSubject]);

  const allTeachersCount = teachers.length;
  const incompatibleCount = teachers.length - compatibleTeachers.length;

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchConstants = useCallback(async () => {
    try {
      const response = await apiRequest('subjects/constants', 'GET');
      setConstants(response.data || {});
    } catch (error) {
      console.error('Failed to fetch constants:', error);
      toast.error('Failed to fetch constants');
    } finally {
      setConstantsLoading(false);
    }
  }, []);

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET');
      const s = response.data || response;
      setSchool(s);
      setHasStreams(s?.has_streams || false);

      const levels = [];
      if (s?.has_pre_primary)    levels.push('Pre-Primary');
      if (s?.has_primary)        levels.push('Primary');
      if (s?.has_junior_secondary) levels.push('Junior Secondary');
      if (s?.has_senior_secondary) levels.push('Senior Secondary');
      if (s?.has_secondary && !s?.has_junior_secondary && !s?.has_senior_secondary)
        levels.push('Secondary');
      setSchoolLevels(levels);
      setFiltersInitialized(true);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const response = await apiRequest('academic-years', 'GET');
      const years = Array.isArray(response) ? response : (response?.data || []);
      const transformed = years.map(y => ({
        id: y.id, name: `${y.year} - ${y.term}`, year: y.year, term: y.term,
        is_current: y.is_active === 1 || y.is_active === true || y.is_current,
        curriculum_type: y.curriculum_type,
      }));
      setAcademicYears(transformed);
      const current = transformed.find(y => y.is_current);
      if (current) {
        setSelectedAcademicYear(current.id);
        setSelectedAcademicYearInfo(current);
        setAssignmentFormData(prev => ({ ...prev, academic_year_id: current.id, term_id: current.term_id || '' }));
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  }, []);

  const fetchTeachersWithAssignments = useCallback(async () => {
    try {
      const response = await apiRequest('teachers/with-assignments', 'GET');
      const data = response.data || [];
      setTeachers(data.map(t => ({
        id: t.id,
        name: t.name || t.user?.name || 'N/A',
        email: t.email || t.user?.email || 'N/A',
        is_class_teacher: hasStreams
          ? (t.class_teacher_streams?.length > 0)
          : (t.class_teacher_classrooms?.length > 0),
        curriculum_specialization: t.curriculum_specialization || 'N/A',
        specialization: t.specialization || 'N/A',
        assignments: t,
      })));
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  }, [hasStreams]);

  const fetchStreams = useCallback(async () => {
    try {
      const response = await apiRequest('streams', 'GET');
      setStreams(Array.isArray(response) ? response : (response?.data || []));
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    const response = await apiRequest('subjects', 'GET');
    setSubjects(Array.isArray(response) ? response : (response?.data || []));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [fetchSubjects(), fetchTeachersWithAssignments(), fetchAcademicYears()];
      if (hasStreams) calls.push(fetchStreams());
      await Promise.all(calls);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, hasStreams, fetchSubjects, fetchTeachersWithAssignments, fetchAcademicYears, fetchStreams]);

  // ─── Subject name search / autofill ──────────────────────────────────────
  const searchSubjectsByName = useCallback(async (name) => {
    if (name.length < 2) {
      setSubjectSearchResults([]);
      setShowSubjectSuggestions(false);
      setSubjectExists(false);
      return;
    }
    setSearchLoading(true);
    try {
      let url = `subjects/search?name=${encodeURIComponent(name)}`;
      if (school?.primary_curriculum) url += `&curriculum_type=${encodeURIComponent(school.primary_curriculum)}`;
      if (formData.grade_level) url += `&grade_level=${encodeURIComponent(formData.grade_level)}`;
      if (formData.pathway) url += `&pathway=${encodeURIComponent(formData.pathway)}`;

      const response = await apiRequest(url, 'GET');
      const results = response.data || [];
      setSubjectSearchResults(results);
      setShowSubjectSuggestions(results.length > 0);
      setSubjectExists(results.length > 0);
    } catch (error) {
      console.error('Failed to search subjects:', error);
      setSubjectSearchResults([]);
      setShowSubjectSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  }, [school?.primary_curriculum, formData.grade_level, formData.pathway]);

  const selectSubjectSuggestion = useCallback((subject) => {
    setFormData(prev => ({
      ...prev,
      name: subject.name,
      code: subject.codes?.[0] || prev.code,
      category: subject.categories?.[0] || prev.category,
    }));
    setShowSubjectSuggestions(false);
    setSubjectExists(true);
  }, []);

  // ─── Teacher/classroom selection ──────────────────────────────────────────
  const handleTeacherSelection = async (teacherId) => {
    setAssignmentFormData(prev => ({ ...prev, teacher_id: teacherId, classroom_id: '', stream_id: '' }));
    if (!teacherId) { setSelectedTeacher(null); setTeacherStreams([]); setTeacherClassrooms([]); return; }

    const teacher = teachers.find(t => t.id === parseInt(teacherId));
    if (!teacher) return;
    setSelectedTeacher(teacher);

    if (hasStreams) {
      try {
        const response = await apiRequest(`teachers/${teacher.id}`, 'GET');
        const data = response?.data || response;
        const ctStreams = data.classTeacherStreams || data.class_teacher_streams || [];
        const ctIds = new Set(ctStreams.map(s => s.id || s.stream_id));

        const allStreams = streams
          .map(s => ({
            id: s.id,
            name: s.classroom?.class_name ? `${s.classroom.class_name} - ${s.name || `Stream ${s.id}`}` : (s.name || `Stream ${s.id}`),
            is_class_teacher: ctIds.has(s.id),
          }))
          .sort((a, b) => (a.is_class_teacher === b.is_class_teacher ? a.name.localeCompare(b.name) : a.is_class_teacher ? -1 : 1));

        setTeacherStreams(allStreams);
        setTeacherClassrooms([]);
      } catch {
        setTeacherStreams(streams.map(s => ({ id: s.id, name: s.classroom?.class_name ? `${s.classroom.class_name} - ${s.name}` : s.name, is_class_teacher: false })));
        setTeacherClassrooms([]);
      }
    } else {
      try {
        const response = await apiRequest('classrooms', 'GET');
        const all = Array.isArray(response) ? response : (response?.data || []);
        setTeacherClassrooms(all.map(c => ({ id: c.id, name: c.class_name || c.name || `Class ${c.id}`, is_class_teacher: false })));
      } catch { setTeacherClassrooms([]); }
      setTeacherStreams([]);
    }
  };

  const handleAcademicYearChange = (yearId) => {
    const year = academicYears.find(ay => ay.id === parseInt(yearId));
    setSelectedAcademicYear(yearId);
    setSelectedAcademicYearInfo(year || null);
    setAssignmentFormData(prev => ({ ...prev, academic_year_id: yearId, term_id: year?.term_id || '' }));
  };

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchConstants(); }, [fetchConstants]);
  useEffect(() => { if (schoolId) fetchSchoolInfo(); }, [schoolId, fetchSchoolInfo]);
  useEffect(() => { if (school !== null) fetchInitialData(); }, [school, fetchInitialData]);

  // Auto-clear pathway when grade_level changes away from Senior Secondary
  useEffect(() => {
    if (!isSeniorSecondary && formData.pathway) {
      setFormData(prev => ({ ...prev, pathway: '' }));
    }
  }, [formData.grade_level]);

  // ─── Filter subjects ──────────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...subjects];

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.name?.toLowerCase().includes(t) || s.code?.toLowerCase().includes(t));
    }
    if (school?.primary_curriculum) {
      filtered = filtered.filter(s => s.curriculum_type === school.primary_curriculum);
    }
    if (schoolLevels.length > 0) {
      filtered = filtered.filter(s => schoolLevels.includes(s.level));
    }
    if (school?.senior_secondary_pathways?.length > 0) {
      filtered = filtered.filter(s => {
        if (s.level === 'Senior Secondary') return school.senior_secondary_pathways.includes(s.pathway);
        return true;
      });
    }
    if (filterGradeLevel !== 'all') {
      filtered = filtered.filter(s => s.grade_level === filterGradeLevel);
    }
    if (filterPathway !== 'all') {
      filtered = filtered.filter(s => s.pathway === filterPathway);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.category === filterCategory);
    }
    if (filterCoreStatus !== 'all') {
      filtered = filtered.filter(s =>
        filterCoreStatus === 'core' ? s.is_core : !s.is_core
      );
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, filterCategory, filterCoreStatus, filterGradeLevel, filterPathway, school, schoolLevels]);

  // ─── Assignment helpers ───────────────────────────────────────────────────
  const fetchAssignments = async (subjectId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`subject-assignments?subject_id=${subjectId}`, 'GET');
      setAssignments(Array.isArray(response) ? response : (response?.data || []));
    } catch { toast.error('Could not fetch assignments.'); setAssignments([]); }
    finally { setLoading(false); }
  };

  // ─── View handlers ────────────────────────────────────────────────────────
  const showCreateForm = () => {
    setView('create');
    setSelectedSubject(null);
    setFormData(EMPTY_FORM);
    setSubjectExists(false);
    setShowSubjectSuggestions(false);
  };

  const showEditForm = (subject) => {
    setView('edit');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      is_core: subject.is_core,
      grade_level: subject.grade_level || '',
      pathway: subject.pathway || '',
    });
    setSubjectExists(false);
    setShowSubjectSuggestions(false);
  };

  const showManageAssignmentsView = async (subject) => {
    setView('manage-assignments');
    setSelectedSubject(subject);
    await fetchAssignments(subject.id);
    setSelectedTeacher(null);
    setTeacherClassrooms([]);
    setTeacherStreams([]);
    const current = academicYears.find(ay => ay.is_current);
    setSelectedAcademicYear(current?.id || null);
    setSelectedAcademicYearInfo(current || null);
    setAssignmentFormData({
      teacher_id: '', classroom_id: '', stream_id: '',
      academic_year_id: current?.id || '', term_id: current?.term_id || '',
      weekly_periods: 5, assignment_type: 'main_teacher',
    });
  };

  const backToList = () => {
    setView('list');
    setSelectedSubject(null);
    fetchInitialData();
  };

  // ─── Form input handler ───────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name === 'name') searchSubjectsByName(value);
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.grade_level) {
      toast.error('Please select a grade level.');
      return;
    }
    if (isSeniorSecondary && !formData.pathway) {
      toast.error('A pathway is required for Senior Secondary subjects.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        school_id: schoolId,
        curriculum_type: school.primary_curriculum,
        // Only send pathway for Senior Secondary
        pathway: isSeniorSecondary ? formData.pathway : null,
      };

      if (view === 'edit') {
        await apiRequest(`subjects/${selectedSubject.id}`, 'PUT', payload);
        toast.success('Subject updated successfully');
      } else {
        await apiRequest('subjects', 'POST', payload);
        toast.success('Subject created successfully');
      }
      backToList();
    } catch (error) {
      if (error.response?.status === 422) {
        const msgs = error.response.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : (error.response.data?.message || 'Validation failed.');
        toast.error(msgs);
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} subject.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, subjectId: id, subjectName: `${subject.name} (${subject.code})` });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`subjects/${deleteModal.subjectId}`, 'DELETE');
      toast.success('Subject deleted successfully');
      setDeleteModal({ isOpen: false, subjectId: null, subjectName: '' });
      fetchInitialData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete subject');
    } finally { setLoading(false); }
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentFormData.academic_year_id) { toast.error('Please select an academic year'); return; }
    if (!assignmentFormData.teacher_id)        { toast.error('Please select a teacher'); return; }
    if (hasStreams  && !assignmentFormData.stream_id)    { toast.error('Please select a stream'); return; }
    if (!hasStreams && !assignmentFormData.classroom_id) { toast.error('Please select a classroom'); return; }

    setLoading(true);
    try {
      await apiRequest('subject-assignments', 'POST', { ...assignmentFormData, subject_id: selectedSubject.id });
      toast.success('Assignment created successfully');
      await fetchAssignments(selectedSubject.id);
      setSelectedTeacher(null); setTeacherClassrooms([]); setTeacherStreams([]);
      setAssignmentFormData(prev => ({
        teacher_id: '', classroom_id: '', stream_id: '',
        academic_year_id: prev.academic_year_id, term_id: selectedAcademicYearInfo?.term_id || '',
        weekly_periods: 5, assignment_type: 'main_teacher',
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assignment.');
    } finally { setLoading(false); }
  };

  const handleDeleteAssignment = (assignmentId) => {
    const a = assignments.find(x => x.id === assignmentId);
    if (!a) return;
    setDeleteAssignmentModal({
      isOpen: true, assignmentId,
      assignmentInfo: `${a.teacher?.user?.name || 'Unknown Teacher'} - ${selectedSubject?.name}`,
    });
  };

  const confirmDeleteAssignment = async () => {
    setLoading(true);
    try {
      await apiRequest(`subject-assignments/${deleteAssignmentModal.assignmentId}`, 'DELETE');
      toast.success('Assignment deleted');
      setDeleteAssignmentModal({ isOpen: false, assignmentId: null, assignmentInfo: '' });
      await fetchAssignments(selectedSubject.id);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete assignment');
    } finally { setLoading(false); }
  };

  // ─── Mobile sheet ─────────────────────────────────────────────────────────
  const openMobileSheet = (subject) => { setMobileSheet({ isOpen: true, subject }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, subject: null }); document.body.style.overflow = ''; };

  // ─── Canonical grade order (lowest → highest) ────────────────────────────
  const GRADE_ORDER = [
    'PP1-PP2',
    'Grade 1-3',
    'Grade 4-6',
    'Grade 7-9',
    'Grade 10-12',
    'Standard 1-4',
    'Standard 5-8',
    'Form 1-4',
    'Unknown',
  ];

  const PATHWAY_ORDER = ['All', 'STEM', 'Arts', 'Social Sciences'];

  /**
   * Normalises legacy grade_level strings like
   * "Grade 10-12 (Senior Secondary - STEM Pathway)" -> "Grade 10-12"
   * Clean values like "Grade 7-9" pass through unchanged.
   */
  const normalizeGradeLevel = (raw) => {
    if (!raw) return 'Unknown';
    return raw.replace(/\s*\(.*?\)\s*/g, '').trim() || raw;
  };

  const gradeSort = (a, b) => {
    const na = normalizeGradeLevel(a);
    const nb = normalizeGradeLevel(b);
    const ai = GRADE_ORDER.indexOf(na);
    const bi = GRADE_ORDER.indexOf(nb);
    if (ai === -1 && bi === -1) return na.localeCompare(nb);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };

  // ─── Subjects grouped by NORMALISED grade then pathway (sorted) ──────────
  const groupedSubjects = React.useMemo(() => {
    const groups = {};
    for (const s of filteredSubjects) {
      const grade   = normalizeGradeLevel(s.grade_level);
      const pathway = s.pathway || 'All';
      if (!groups[grade]) groups[grade] = {};
      if (!groups[grade][pathway]) groups[grade][pathway] = [];
      groups[grade][pathway].push(s);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => gradeSort(a, b))
      .map(([grade, pathwayGroups]) => ({
        grade,
        pathwayGroups: Object.entries(pathwayGroups)
          .sort(([a], [b]) => {
            const ai = PATHWAY_ORDER.indexOf(a);
            const bi = PATHWAY_ORDER.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          })
          .map(([pathway, subs]) => ({ pathway, subs })),
      }));
  }, [filteredSubjects]);

  // ─── Grade levels for the filter dropdown (normalised + sorted) ──────────
  const existingGradeLevels = React.useMemo(() =>
    [...new Set(subjects.map(s => normalizeGradeLevel(s.grade_level)).filter(g => g !== 'Unknown'))]
      .sort(gradeSort),
    [subjects]
  );

  const existingPathways = React.useMemo(() =>
    [...new Set(subjects.map(s => s.pathway).filter(Boolean))],
    [subjects]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete Subject</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.subjectName}"</span>? This cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Warning:</strong> All associated assignments, grading and scheduling data will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button onClick={() => setDeleteModal({ isOpen: false, subjectId: null, subjectName: '' })} disabled={loading}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 font-medium transition-all disabled:opacity-50">
              Keep Subject
            </button>
            <button onClick={confirmDelete} disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              {loading ? <><svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Deleting...</>
              : <><Trash2 className="w-3.5 h-3.5" />Delete Subject</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteAssignmentModal = () => {
    if (!deleteAssignmentModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-red-50 dark:bg-red-900/20 flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete Assignment</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Are you sure you want to delete this assignment? This cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button onClick={() => setDeleteAssignmentModal({ isOpen: false, assignmentId: null, assignmentInfo: '' })} disabled={loading}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 font-medium transition-all disabled:opacity-50">
              Keep Assignment
            </button>
            <button onClick={confirmDeleteAssignment} disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
              {loading ? 'Deleting...' : <><Trash2 className="w-3.5 h-3.5" />Delete</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.subject) return null;
    const s = mobileSheet.subject;
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-2xl md:hidden" style={{ maxHeight: '85vh' }}>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{s.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5 font-mono">{s.code}</p>
            </div>
            <button onClick={closeMobileSheet} className="p-2 text-slate-500 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            {/* Grade + Pathway row */}
            <div className="flex flex-wrap gap-2">
              {s.grade_level && (
                <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getGradeLevelBadgeColor()}`}>
                  <GraduationCap className="w-3 h-3" />{s.grade_level}
                </span>
              )}
              {s.pathway && (
                <span className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getPathwayBadgeColor(s.pathway)}`}>
                  {getPathwayIcon(s.pathway)}{s.pathway}
                </span>
              )}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(s.curriculum_type)}`}>{s.curriculum_type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(s.category)}`}>{s.category}</span>
              {s.is_core
                ? <span className="flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3.5 h-3.5" />Core Subject</span>
                : <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><XCircle className="w-3.5 h-3.5" />Elective</span>}
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <button onClick={() => { closeMobileSheet(); showEditForm(s); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all">
              <Edit className="w-4 h-4" />Edit Subject
            </button>
            <button onClick={() => { closeMobileSheet(); showManageAssignmentsView(s); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 active:scale-[0.98] transition-all">
              <Users className="w-4 h-4" />Manage Assignments
            </button>
            <button onClick={() => handleDelete(s.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-all">
              <Trash2 className="w-4 h-4" />Delete Subject
            </button>
          </div>
        </div>
      </>
    );
  };

  // ─── List view ────────────────────────────────────────────────────────────
  const renderListView = () => (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Subject Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base">
            Manage subjects, create assignments, and oversee curriculum.
          </p>
          {school && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{school.name}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>
                {school.primary_curriculum}
              </span>
              {schoolLevels.map((level, i) => (
                <span key={i} className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{level}</span>
              ))}
              {school.senior_secondary_pathways?.map((p, i) => (
                <span key={i} className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getPathwayBadgeColor(p)}`}>
                  {getPathwayIcon(p)}{p}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={fetchInitialData} disabled={loading} title="Refresh"
            className="bg-black text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowBulkModal(true)} disabled={!school || teachers.length === 0}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm">
            <Layers className="w-4 h-4" /><span className="hidden sm:inline">Bulk Assign</span>
          </button>
          <button onClick={showCreateForm} disabled={!school}
            className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />New Subject
          </button>
        </div>
      </div>

      {/* Filters */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
          {/* Mobile toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
              <span className="text-xs text-slate-500">({filteredSubjects.length}/{subjects.length})</span>
            </div>
            {showFilters ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </button>

          <div className={`${showFilters ? '' : 'hidden'} md:block`}>
            {/* Desktop header */}
            <div className="hidden md:flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              {filtersInitialized && <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Auto-configured from school settings</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="col-span-2 md:col-span-3 lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search subjects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              {/* Grade Level filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Grade Level</label>
                <select value={filterGradeLevel} onChange={e => setFilterGradeLevel(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="all">All Grades</option>
                  {existingGradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Pathway filter — only show if school has Senior Secondary */}
              {(schoolLevels.includes('Senior Secondary') || existingPathways.length > 0) && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pathway</label>
                  <select value={filterPathway} onChange={e => setFilterPathway(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="all">All Pathways</option>
                    {existingPathways.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="all">All Categories</option>
                  {constants.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Core/Elective */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select value={filterCoreStatus} onChange={e => setFilterCoreStatus(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="all">Core & Elective</option>
                  <option value="core">Core Only</option>
                  <option value="elective">Elective Only</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {(filterGradeLevel !== 'all' || filterPathway !== 'all' || filterCategory !== 'all' || filterCoreStatus !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Active filters:</span>
                {filterGradeLevel !== 'all' && (
                  <button onClick={() => setFilterGradeLevel('all')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full text-xs font-medium hover:bg-teal-200 transition-colors">
                    <GraduationCap className="w-3 h-3" />{filterGradeLevel}<X className="w-3 h-3" />
                  </button>
                )}
                {filterPathway !== 'all' && (
                  <button onClick={() => setFilterPathway('all')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-colors ${getPathwayBadgeColor(filterPathway)}`}>
                    {getPathwayIcon(filterPathway)}{filterPathway}<X className="w-3 h-3" />
                  </button>
                )}
                {filterCategory !== 'all' && (
                  <button onClick={() => setFilterCategory('all')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-colors ${getCategoryBadgeColor(filterCategory)}`}>
                    {filterCategory}<X className="w-3 h-3" />
                  </button>
                )}
                {filterCoreStatus !== 'all' && (
                  <button onClick={() => setFilterCoreStatus('all')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-slate-300 transition-colors">
                    {filterCoreStatus === 'core' ? 'Core' : 'Elective'}<X className="w-3 h-3" />
                  </button>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 self-center ml-auto">
                  {filteredSubjects.length} of {subjects.length} subjects
                </span>
              </div>
            )}
            {filterGradeLevel === 'all' && filterPathway === 'all' && filterCategory === 'all' && filterCoreStatus === 'all' && (
              <div className="mt-2 text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredSubjects.length} of {subjects.length} subjects
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-10 h-10 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading subjects...</p>
        </div>
      )}

      {/* ── Desktop: Grouped table (by grade → pathway) ── */}
      {!loading && (
        <>
          <div className="hidden md:block space-y-6">
            {filteredSubjects.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  {searchTerm || filterCategory !== 'all' || filterCoreStatus !== 'all' || filterGradeLevel !== 'all' || filterPathway !== 'all'
                    ? 'No subjects match your filters.'
                    : 'No subjects found. Create your first subject.'}
                </p>
              </div>
            ) : (
              groupedSubjects.map(({ grade: gradeLevel, pathwayGroups }) => (
                <div key={gradeLevel} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Grade level header */}
                  <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{gradeLevel}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      — {levelFromGrade(gradeLevel) || 'N/A'}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {pathwayGroups.reduce((sum, { subs }) => sum + subs.length, 0)} subject{pathwayGroups.reduce((sum, { subs }) => sum + subs.length, 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Pathway sub-groups */}
                  {pathwayGroups.map(({ pathway, subs }, pi) => (
                    <div key={pathway}>
                      {/* Pathway header (only when more than one pathway or not 'All') */}
                      {(pathwayGroups.length > 1 || pathway !== 'All') && (
                        <div className={`flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-700/50 ${pi > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}>
                          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${pathway === 'All' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : getPathwayBadgeColor(pathway)}`}>
                            {getPathwayIcon(pathway)}{pathway === 'All' ? 'All Pathways' : pathway + ' Pathway'}
                          </span>
                          <span className="text-xs text-slate-400">{subs.length} subject{subs.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {/* Subjects table */}
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-700/20 text-slate-500 dark:text-slate-400 text-xs">
                          <tr>
                            <th className="px-6 py-2.5 font-medium">Subject</th>
                            <th className="px-4 py-2.5 font-medium">Code</th>
                            <th className="px-4 py-2.5 font-medium">Category</th>
                            <th className="px-4 py-2.5 font-medium">Type</th>
                            <th className="px-4 py-2.5 font-medium">Assignments</th>
                            <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {subs.map(subject => (
                            <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                  <span className="font-medium text-slate-900 dark:text-white">{subject.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{subject.code}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>{subject.category}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`flex items-center gap-1 text-xs font-medium ${subject.is_core ? 'text-green-600 dark:text-green-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                  <Award className="w-3 h-3" />{subject.is_core ? 'Core' : 'Elective'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button onClick={() => showManageAssignmentsView(subject)}
                                  className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 text-xs font-medium transition-colors">
                                  <Users className="w-3.5 h-3.5" />Manage
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => showEditForm(subject)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDelete(subject.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* ── Mobile: Card list ── */}
          <div className="md:hidden space-y-3">
            {filteredSubjects.length > 0 ? filteredSubjects.map(subject => (
              <button key={subject.id} onClick={() => openMobileSheet(subject)}
                className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{subject.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{subject.code}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                </div>
                {/* Grade + Pathway chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {subject.grade_level && (
                    <span className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full ${getGradeLevelBadgeColor()}`}>
                      <GraduationCap className="w-3 h-3" />{subject.grade_level}
                    </span>
                  )}
                  {subject.pathway && (
                    <span className={`flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full ${getPathwayBadgeColor(subject.pathway)}`}>
                      {getPathwayIcon(subject.pathway)}{subject.pathway}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(subject.category)}`}>{subject.category}</span>
                  {subject.is_core
                    ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5" />Core</span>
                    : <span className="flex items-center gap-1 text-xs text-orange-500"><XCircle className="w-3.5 h-3.5" />Elective</span>}
                </div>
              </button>
            )) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {searchTerm || filterCategory !== 'all' || filterCoreStatus !== 'all' || filterGradeLevel !== 'all' || filterPathway !== 'all'
                    ? 'No subjects match your filters.' : 'No subjects found. Create one to get started.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  // ─── Form view ────────────────────────────────────────────────────────────
  const renderFormView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[92vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800/50 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
            {view === 'edit' ? 'Edit Subject' : 'Create New Subject'}
          </h2>
          <button onClick={backToList} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* ── Step 1: Grade Level ── */}
          <div className="space-y-1.5">
            <label htmlFor="grade_level" className="block text-sm font-semibold text-[#0d141b] dark:text-slate-300">
              Grade Level <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select id="grade_level" name="grade_level" value={formData.grade_level} onChange={handleInputChange} required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-all">
                <option value="">Select grade level</option>
                {formGradeLevels.length > 0 ? (
                  formGradeLevels.map(g => (
                    <option key={g} value={g}>{g} — {levelFromGrade(g)}</option>
                  ))
                ) : (
                  availableGradeLevels.map(g => (
                    <option key={g} value={g}>{g} — {levelFromGrade(g)}</option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {formData.grade_level && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Level: <span className="font-medium text-slate-700 dark:text-slate-300">{levelFromGrade(formData.grade_level)}</span>
              </p>
            )}
          </div>

          {/* ── Step 2: Pathway (only for Senior Secondary) ── */}
          {isSeniorSecondary && (
            <div className="space-y-1.5">
              <label htmlFor="pathway" className="block text-sm font-semibold text-[#0d141b] dark:text-slate-300">
                Pathway <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-slate-500 ml-1">(required for Senior Secondary)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SENIOR_SECONDARY_PATHWAYS
                  .filter(p => !school?.senior_secondary_pathways || school.senior_secondary_pathways.includes(p))
                  .map(p => (
                    <button key={p} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pathway: p }))}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${formData.pathway === p
                        ? `border-current ${getPathwayBadgeColor(p)} ring-2 ring-offset-1 ring-current`
                        : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}>
                      {getPathwayIcon(p)}{p}
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── Step 3: Name + Code ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label htmlFor="name" className="block text-sm font-semibold text-[#0d141b] dark:text-slate-300">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                {searchLoading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
              </div>

              {/* Suggestions dropdown */}
              {showSubjectSuggestions && subjectSearchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Suggestions — click to autofill</p>
                  </div>
                  {subjectSearchResults.map((s, i) => (
                    <div key={i} onClick={() => selectSubjectSuggestion(s)}
                      className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                      <div className="font-medium text-sm text-slate-900 dark:text-white">{s.name}</div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {s.codes?.[0] && <span className="text-xs text-slate-500 font-mono">{s.codes[0]}</span>}
                        {s.grade_levels?.map(g => (
                          <span key={g} className={`text-xs px-1 rounded ${getGradeLevelBadgeColor()}`}>{g}</span>
                        ))}
                        {s.pathways?.map(p => (
                          <span key={p} className={`text-xs px-1 rounded ${getPathwayBadgeColor(p)}`}>{p}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowSubjectSuggestions(false)}
                    className="w-full px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 text-center">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Already exists warning */}
              {subjectExists && !showSubjectSuggestions && (
                <div className="mt-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Subject already exists</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">This subject is already in the database.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="code" className="block text-sm font-semibold text-[#0d141b] dark:text-slate-300">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input type="text" id="code" name="code" value={formData.code} onChange={handleInputChange} required
                placeholder="e.g., CBC-G79-MAT"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono" />
            </div>
          </div>

          {/* ── Step 4: Category + is_core ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="category" className="block text-sm font-semibold text-[#0d141b] dark:text-slate-300">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} required
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-all">
                  <option value="">Select category</option>
                  {constants.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {formData.category && (
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(formData.category)}`}>
                  {formData.category}
                </span>
              )}
            </div>

            <div className="flex items-center md:items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" id="is_core" name="is_core" checked={formData.is_core} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600 group-hover:border-slate-400 transition-all">
                    {formData.is_core && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#0d141b] dark:text-slate-300">Core / Compulsory Subject</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Required for all students at this level</p>
                </div>
              </label>
            </div>
          </div>

          {/* School config summary */}
          {school && (
            <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg p-3.5">
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Auto-configured from school settings:</p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span><strong>Curriculum:</strong> {school.primary_curriculum}</span>
                    {formData.grade_level && <span><strong>Level:</strong> {levelFromGrade(formData.grade_level)}</span>}
                    {isSeniorSecondary && formData.pathway && <span><strong>Pathway:</strong> {formData.pathway}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={backToList} disabled={submitting}
              className="px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[100px]">
              {submitting
                ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Saving...</>
                : view === 'edit' ? 'Update Subject' : 'Create Subject'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Subjects...</p>
        </div>
      )}
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}

      <ManageAssignments
        isOpen={view === 'manage-assignments'}
        onClose={backToList}
        selectedSubject={selectedSubject}
        hasStreams={hasStreams}
        academicYears={academicYears}
        teachers={compatibleTeachers}               
        allTeachersCount={allTeachersCount}         
        incompatibleCount={incompatibleCount}       
        assignments={assignments}
        loading={loading}
        assignmentFormData={assignmentFormData}
        selectedTeacher={selectedTeacher}
        teacherClassrooms={teacherClassrooms}
        teacherStreams={teacherStreams}
        selectedAcademicYearInfo={selectedAcademicYearInfo}
        onAcademicYearChange={e => handleAcademicYearChange(e.target.value)}
        onTeacherSelection={e => handleTeacherSelection(e.target.value)}
        onAssignmentInputChange={handleAssignmentInputChange}
        onCreateAssignment={handleCreateAssignment}
        onDeleteAssignment={handleDeleteAssignment}
      />

      {renderDeleteConfirmationModal()}
      {renderDeleteAssignmentModal()}
      {renderMobileBottomSheet()}

      <BulkAssignmentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        academicYears={academicYears}
        teachers={teachers}
        subjects={subjects}
        hasStreams={hasStreams}
        onSuccess={() => {
          setShowBulkModal(false);
          fetchInitialData();
          toast.success('Bulk assignment completed! Refreshing data...');
        }}
      />
    </div>
  );
}

export default SubjectManager;
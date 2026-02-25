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
  BarChart3,
  RefreshCw,
  Building,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FlaskConical,
  Palette,
  Globe
} from 'lucide-react';
import { toast } from "react-toastify";
import TeacherForm from '../../../components/TeacherForm';
import WorkloadMeter from '../../../components/WorkloadMeter';

// ─── Pathway badge helper ─────────────────────────────────────────────────────
const PathwayBadge = ({ pathway }) => {
  const config = {
    STEM:             { icon: FlaskConical, cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    Arts:             { icon: Palette,      cls: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
    'Social Sciences':{ icon: Globe,        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };
  const { icon: Icon, cls } = config[pathway] || { icon: null, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${cls}`}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {pathway}
    </span>
  );
};

// ─── Statistics ───────────────────────────────────────────────────────────────
const TeacherStatistics = ({ teachers }) => {
  const stats = useMemo(() => {
    const specializationCount = teachers.reduce((acc, t) => {
      const spec = t.specialization || 'General';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});
    const employmentStats = teachers.reduce((acc, t) => {
      const type = t.employment_type || 'Not specified';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const pathwayStats = teachers.reduce((acc, t) => {
      (t.teaching_pathways || []).forEach(p => { acc[p] = (acc[p] || 0) + 1; });
      return acc;
    }, {});
    return { specializationCount, employmentStats, pathwayStats };
  }, [teachers]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total */}
      <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Total</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{teachers.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Teachers</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-cyan-500" />
        </div>
      </div>
      {/* Specializations */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Specs</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{Object.keys(stats.specializationCount).length}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[90px]">
            {Object.entries(stats.specializationCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-purple-500" />
        </div>
      </div>
      {/* Full-time */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Full-time</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.employmentStats['Full-time'] || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.employmentStats['Part-time'] || 0} part-time</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-orange-500" />
        </div>
      </div>
      {/* Pathways */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">SS Pathways</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {['STEM','Arts','Social Sciences'].map(p => (
              <span key={p} className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                {stats.pathwayStats[p] || 0} {p === 'Social Sciences' ? 'Soc' : p}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Senior Secondary</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <FlaskConical className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
function TeacherManager() {
  const { user, schoolId, loading: authLoading } = useAuth();
  
  const [teachers, setTeachers]                   = useState([]);
  const [users, setUsers]                         = useState([]);
  const [subjects, setSubjects]                   = useState([]);
  const [academicYears, setAcademicYears]         = useState([]);
  const [filteredAcademicYears, setFilteredAcademicYears] = useState([]);
  const [streams, setStreams]                     = useState([]);
  const [loading, setLoading]                     = useState(false);
  const [view, setView]                           = useState('list');
  const [searchTerm, setSearchTerm]               = useState('');
  const [filters, setFilters]                     = useState({
    curriculum_specialization: '',
    specialization: '',
    employment_type: '',
    pathway: ''
  });
  const [selectedTeacher, setSelectedTeacher]     = useState(null);
  const [showForm, setShowForm]                   = useState(false);
  const [school, setSchool]                       = useState(null);
  const [hasStreams, setHasStreams]               = useState(false);
  const [gradeLevels, setGradeLevels]             = useState([]);
  const [showFilters, setShowFilters]             = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [deleteModal, setDeleteModal]             = useState({ isOpen: false, teacherId: null, teacherName: '' });
  const [mobileSheet, setMobileSheet]             = useState({ isOpen: false, teacher: null });

  const emptyForm = {
    user_id: '', qualification: '', employment_type: '', employment_status: 'active',
    tsc_number: '', tsc_status: '', specialization: '', curriculum_specialization: '',
    teaching_levels: [], teaching_pathways: [], subject_ids: [], subject_pivot_meta: {},
    max_subjects: '', max_classes: '', max_weekly_lessons: '', min_weekly_lessons: '',
    combination_id: '', bed_graduation_year: '', bed_institution_type: '',
    bed_awarding_institution: '', resync_subjects: false
  };
  const [formData, setFormData] = useState(emptyForm);

  const curriculumOptions = ['CBC', '8-4-4', 'Both'];
  const specializationOptions = useMemo(() => {
    return [...new Set(teachers.map(t => t.specialization).filter(Boolean))].sort();
  }, [teachers]);

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET');
      const schoolData = response?.data || response;
      setSchool(schoolData);
      setGradeLevels(schoolData?.grade_levels || []);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [teachersResponse, rolesResponse, subjectsResponse, academicYearsResponse] = await Promise.all([
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest('roles', 'GET'),
        apiRequest(`subjects`, 'GET'),
        apiRequest(`academic-years`, 'GET')
      ]);

      const teachersData    = teachersResponse?.data || [];
      const hasStreamsFromAPI = teachersResponse?.has_streams || false;
      
      setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []));
      setAcademicYears(Array.isArray(academicYearsResponse) ? academicYearsResponse : (academicYearsResponse?.data || []));
      setFilteredAcademicYears(Array.isArray(academicYearsResponse) ? academicYearsResponse : (academicYearsResponse?.data || []));
      setHasStreams(hasStreamsFromAPI);
      
      const teacherRole = Array.isArray(rolesResponse)
        ? rolesResponse.find(r => r.name === 'Teacher' || r.name === 'teacher') : null;
      if (teacherRole) {
        const usersResponse = await apiRequest(`users?role_id=${teacherRole.id}`, 'GET');
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      }
      
      let enrichedTeachers = Array.isArray(teachersData) ? teachersData : [];
      if (hasStreamsFromAPI) {
        enrichedTeachers = enrichedTeachers.map(t => ({
          ...t, streamCount: t.teaching_streams?.length || 0,
          classTeacherStreamCount: t.class_teacher_streams?.length || 0
        }));
      } else {
        enrichedTeachers = enrichedTeachers.map(t => {
          const classrooms = t.classrooms || [];
          return { ...t, classroomCount: classrooms.length, classTeacherClassroom: classrooms.find(c => c.pivot?.is_class_teacher) };
        });
      }
      setTeachers(enrichedTeachers);
      
      if (hasStreamsFromAPI) {
        try {
          const streamsResponse = await apiRequest('streams', 'GET');
          setStreams(Array.isArray(streamsResponse) ? streamsResponse : (streamsResponse?.data || []));
        } catch {}
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh page.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) { fetchInitialData(); fetchSchoolInfo(); }
  }, [schoolId, fetchInitialData, fetchSchoolInfo]);

  useEffect(() => {
    if (!schoolId) return;
    const fetchCurrentAcademicYear = async () => {
      try {
        const response = await apiRequest('academic-years', 'GET');
        const years = Array.isArray(response) ? response : (response?.data || []);
        const current = years.find(y => y.is_active === 1 || y.is_active === true || y.is_current);
        if (current) setSelectedAcademicYear(current.id);
      } catch {}
    };
    fetchCurrentAcademicYear();
  }, [schoolId]);

  const handleArrayChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = !searchTerm ||
        t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tsc_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCurriculum   = !filters.curriculum_specialization || t.curriculum_specialization === filters.curriculum_specialization;
      const matchesSpec         = !filters.specialization || t.specialization === filters.specialization;
      const matchesEmployment   = !filters.employment_type || t.employment_type === filters.employment_type;
      const matchesPathway      = !filters.pathway || (Array.isArray(t.teaching_pathways) && t.teaching_pathways.includes(filters.pathway));
      return matchesSearch && matchesCurriculum && matchesSpec && matchesEmployment && matchesPathway;
    });
  }, [teachers, searchTerm, filters]);

  const showCreateForm = () => {
    const defaultCurriculum = school?.primary_curriculum !== 'Both' ? school?.primary_curriculum || '' : '';
    setShowForm(true);
    setSelectedTeacher(null);
    setFormData({ ...emptyForm, curriculum_specialization: defaultCurriculum });
  };

  const showEditForm = (teacher) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setShowForm(true);
    setSelectedTeacher(teacher);
    const pivotMeta = (teacher.qualified_subjects || []).reduce((acc, s) => {
      if (s.pivot?.combination_label || s.pivot?.years_experience) {
        acc[s.id] = { combination_label: s.pivot.combination_label || '', years_experience: s.pivot.years_experience || null, is_primary_subject: s.pivot.is_primary_subject || false };
      }
      return acc;
    }, {});
    setFormData({
      user_id: teacher.user_id,
      qualification: teacher.qualification || '',
      employment_type: teacher.employment_type || '',
      employment_status: teacher.employment_status || 'active',
      tsc_number: teacher.tsc_number || '',
      tsc_status: teacher.tsc_status || '',
      specialization: teacher.specialization || '',
      curriculum_specialization: teacher.curriculum_specialization || '',
      teaching_levels: teacher.teaching_levels || [],
      teaching_pathways: teacher.teaching_pathways || [],
      subject_ids: teacher.qualified_subjects?.map(s => s.id) || [],
      subject_pivot_meta: pivotMeta,
      max_subjects: teacher.max_subjects || '',
      max_classes: teacher.max_classes || '',
      max_weekly_lessons: teacher.max_weekly_lessons || '',
      min_weekly_lessons: teacher.min_weekly_lessons || '',
      combination_id: teacher.combination_id || '',
      bed_graduation_year: teacher.bed_graduation_year || '',
      bed_institution_type: teacher.bed_institution_type || '',
      bed_awarding_institution: teacher.bed_awarding_institution || '',
      resync_subjects: false
    });
  };

  const showClassroomsView = async (teacher) => {
    setView('classrooms'); setSelectedTeacher(teacher); setLoading(true);
    try {
      const response = await apiRequest(`teachers/${teacher.id}/classrooms`, 'GET');
      const teacherClassrooms = response?.data || [];
      setSelectedTeacher(prev => ({ ...prev, classrooms: teacherClassrooms, classroomCount: teacherClassrooms.length }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load classrooms');
    } finally { setLoading(false); }
  };

  const showStreamsView = async (teacher) => {
    setView('streams'); setSelectedTeacher(teacher); setLoading(true);
    try {
      const response = await apiRequest(`teachers/${teacher.id}`, 'GET');
      const teacherData = response?.data || response;
      setSelectedTeacher(prev => ({
        ...prev,
        classTeacherStreams: teacherData.class_teacher_streams || [],
        teachingStreams: teacherData.teaching_streams || [],
        streamCount: teacherData.teaching_streams?.length || 0,
        classTeacherStreamCount: teacherData.class_teacher_streams?.length || 0
      }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not load streams');
    } finally { setLoading(false); }
  };

  const backToList = () => { setView('list'); setShowForm(false); setSelectedTeacher(null); fetchInitialData(); };
  const closeForm  = () => { setShowForm(false); setSelectedTeacher(null); };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.teaching_levels?.length > 0 && (!formData.subject_ids || formData.subject_ids.length === 0)) {
      toast.error('Please select at least one qualified subject for the selected teaching levels.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        user_id: formData.user_id,
        qualification: formData.qualification || null,
        employment_type: formData.employment_type || null,
        employment_status: formData.employment_status || 'active',
        tsc_number: formData.tsc_number || null,
        tsc_status: formData.tsc_status || null,
        curriculum_specialization: formData.curriculum_specialization || null,
        teaching_levels: formData.teaching_levels?.length > 0 ? formData.teaching_levels : null,
        teaching_pathways: (formData.teaching_levels?.includes('Senior Secondary') && formData.teaching_pathways?.length > 0) ? formData.teaching_pathways : [],
        subject_ids: formData.subject_ids?.length > 0 ? formData.subject_ids : undefined,
        subject_pivot_meta: formData.subject_pivot_meta || undefined,
        max_subjects: formData.max_subjects ? parseInt(formData.max_subjects) : null,
        max_classes: formData.max_classes ? parseInt(formData.max_classes) : null,
        max_weekly_lessons: formData.max_weekly_lessons ? parseInt(formData.max_weekly_lessons) : null,
        min_weekly_lessons: formData.min_weekly_lessons ? parseInt(formData.min_weekly_lessons) : null,
        combination_id: formData.combination_id ? parseInt(formData.combination_id) : null,
        bed_graduation_year: formData.bed_graduation_year ? parseInt(formData.bed_graduation_year) : null,
        bed_institution_type: formData.bed_institution_type || null,
        bed_awarding_institution: formData.bed_awarding_institution || null,
        resync_subjects: formData.resync_subjects || false,
      };
      delete payload.specialization;
      if (school?.primary_curriculum !== 'Both') payload.curriculum_specialization = school?.primary_curriculum;

      if (selectedTeacher) {
        await apiRequest(`teachers/${selectedTeacher.id}`, 'PUT', payload);
        toast.success('Teacher updated successfully');
      } else {
        await apiRequest('teachers', 'POST', payload);
        toast.success('Teacher created successfully');
      }
      backToList();
    } catch (error) {
      const validationErrors = error?.response?.data?.errors;
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          toast.error(`${key}: ${Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key]}`);
        });
      } else {
        toast.error(`Failed to ${selectedTeacher ? 'update' : 'create'} teacher: ${error?.response?.data?.message || error?.message || 'An error occurred'}`);
      }
    } finally { setLoading(false); }
  };

  const handleDeleteClick = (teacher) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, teacherId: teacher.id, teacherName: teacher.user?.full_name || teacher.user?.name || 'Unknown' });
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`teachers/${deleteModal.teacherId}`, 'DELETE');
      toast.success('Teacher deleted successfully');
      setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' });
      fetchInitialData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete teacher.');
    } finally { setLoading(false); }
  };

  const clearAllFilters = () => {
    setFilters({ curriculum_specialization: '', specialization: '', employment_type: '', pathway: '' });
    setSearchTerm('');
  };

  const getCurriculumBadgeColor = (type) =>
    type === 'CBC'   ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
    type === '8-4-4' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                       'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

  const openMobileSheet = (teacher) => { setMobileSheet({ isOpen: true, teacher }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, teacher: null }); document.body.style.overflow = ''; };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);

  // ── Delete Modal ─────────────────────────────────────────────────────────────
  const renderDeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Teacher</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.teacherName}"</span>? This cannot be undone.
              </p>
            </div>
          </div>
          <div className="p-5 flex gap-2 justify-end">
            <button onClick={() => setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' })} disabled={loading}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
              {loading ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Trash2 className="w-3.5 h-3.5" />}
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Mobile Bottom Sheet ───────────────────────────────────────────────────────
  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.teacher) return null;
    const teacher = mobileSheet.teacher;
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl md:hidden" style={{ maxHeight: '88vh' }}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" /></div>
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 dark:text-white truncate">{teacher.user?.full_name || teacher.user?.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{teacher.user?.email}</p>
            </div>
            <button onClick={closeMobileSheet} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"><X className="w-5 h-5" /></button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: 'calc(88vh - 200px)' }}>
            {/* Info card */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>
                  {teacher.curriculum_specialization}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                  {teacher.specialization || 'General'}
                </span>
                {teacher.combination?.name && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 truncate max-w-[160px]">
                    {teacher.combination.name}
                  </span>
                )}
              </div>
              {teacher.teaching_pathways?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {teacher.teaching_pathways.map(p => <PathwayBadge key={p} pathway={p} />)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Qualification</span><p className="font-medium text-slate-700 dark:text-slate-300 truncate">{teacher.qualification || '—'}</p></div>
                <div><span className="text-slate-400">TSC</span><p className="font-medium text-slate-700 dark:text-slate-300">{teacher.tsc_number || '—'}</p></div>
                <div><span className="text-slate-400">{hasStreams ? 'Streams' : 'Classrooms'}</span><p className="font-medium text-slate-700 dark:text-slate-300">{hasStreams ? (teacher.streamCount || 0) : (teacher.classroomCount || 0)}</p></div>
                <div><span className="text-slate-400">Class Teacher</span><p className="font-medium text-slate-700 dark:text-slate-300">{hasStreams ? (teacher.classTeacherStreamCount > 0 ? 'Yes' : 'No') : (teacher.classTeacherClassroom ? 'Yes' : 'No')}</p></div>
              </div>
            </div>
            {selectedAcademicYear && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Workload</p>
                <WorkloadMeter teacherId={teacher.id} academicYearId={selectedAcademicYear} compact={false} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 p-4 grid grid-cols-3 gap-2">
            <button onClick={() => { closeMobileSheet(); showEditForm(teacher); }}
              className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <Edit className="w-4 h-4" />Edit
            </button>
            <button onClick={() => { closeMobileSheet(); hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher); }}
              className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all">
              <Users className="w-4 h-4" />{hasStreams ? 'Streams' : 'Classes'}
            </button>
            <button onClick={() => handleDeleteClick(teacher)}
              className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
              <Trash2 className="w-4 h-4" />Delete
            </button>
          </div>
        </div>
      </>
    );
  };

  // ── List View ─────────────────────────────────────────────────────────────────
  const renderListView = () => (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Teacher Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base">
            Manage teaching staff, their assignments, and qualifications.
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
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hasStreams ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                {hasStreams ? 'Streams Enabled' : 'Direct Assignment'}
              </span>
              {gradeLevels.slice(0, 3).map((l, i) => (
                <span key={i} className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{l}</span>
              ))}
              {gradeLevels.length > 3 && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">+{gradeLevels.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={fetchInitialData} disabled={loading} title="Refresh"
            className="bg-black text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={showCreateForm} disabled={!school}
            className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />New Teacher
          </button>
        </div>
      </div>

      <TeacherStatistics teachers={teachers} />

      {/* Filters */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
          {/* Mobile toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500 text-white rounded-full">{activeFilterCount}</span>
              )}
              <span className="text-xs text-slate-500">({filteredTeachers.length}/{teachers.length})</span>
            </div>
            {showFilters ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </button>

          <div className={`${showFilters ? '' : 'hidden'} md:block`}>
            {/* Desktop header */}
            <div className="hidden md:flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500 text-white rounded-full">{activeFilterCount} active</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Search — spans 2 cols on lg */}
              <div className="col-span-2 md:col-span-3 lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search by name, email, or TSC number..." value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              {/* Curriculum */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Curriculum</label>
                <select value={filters.curriculum_specialization} onChange={e => setFilters({...filters, curriculum_specialization: e.target.value})}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">All Curricula</option>
                  {curriculumOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Specialization */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Specialization</label>
                <select value={filters.specialization} onChange={e => setFilters({...filters, specialization: e.target.value})}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">All Specializations</option>
                  {specializationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Pathway */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pathway</label>
                <select value={filters.pathway} onChange={e => setFilters({...filters, pathway: e.target.value})}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">All Pathways</option>
                  <option value="STEM">STEM</option>
                  <option value="Arts">Arts</option>
                  <option value="Social Sciences">Social Sciences</option>
                </select>
              </div>

              {/* Employment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Employment</label>
                <select value={filters.employment_type} onChange={e => setFilters({...filters, employment_type: e.target.value})}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Active filters:</span>
                {filters.curriculum_specialization && (
                  <button onClick={() => setFilters({...filters, curriculum_specialization: ''})}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors">
                    {filters.curriculum_specialization}<X className="w-3 h-3" />
                  </button>
                )}
                {filters.specialization && (
                  <button onClick={() => setFilters({...filters, specialization: ''})}
                    className="flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium hover:bg-cyan-200 transition-colors">
                    {filters.specialization}<X className="w-3 h-3" />
                  </button>
                )}
                {filters.pathway && (
                  <button onClick={() => setFilters({...filters, pathway: ''})}
                    className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors">
                    {filters.pathway}<X className="w-3 h-3" />
                  </button>
                )}
                {filters.employment_type && (
                  <button onClick={() => setFilters({...filters, employment_type: ''})}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium hover:bg-slate-300 transition-colors">
                    {filters.employment_type}<X className="w-3 h-3" />
                  </button>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 self-center ml-auto">
                  {filteredTeachers.length} of {teachers.length} teachers
                </span>
                <button onClick={clearAllFilters} className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium self-center">
                  Clear all
                </button>
              </div>
            )}
            {activeFilterCount === 0 && (
              <div className="mt-2 text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {filteredTeachers.length} of {teachers.length} teachers
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-10 h-10 text-slate-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading teachers…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Teachers <span className="ml-1 text-slate-400 font-normal">({filteredTeachers.length})</span></h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" style={{ minWidth: '900px' }}>
                <thead className="bg-slate-50 dark:bg-slate-700/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 lg:px-5">Teacher</th>
                    <th className="px-4 py-3 lg:px-5">Combination / Spec</th>
                    <th className="px-4 py-3 lg:px-5">Curriculum</th>
                    <th className="px-4 py-3 lg:px-5">Pathways</th>
                    <th className="px-4 py-3 lg:px-5">Employment</th>
                    <th className="px-4 py-3 lg:px-5">Workload</th>
                    <th className="px-4 py-3 lg:px-5">{hasStreams ? 'Streams' : 'Classrooms'}</th>
                    <th className="px-4 py-3 lg:px-5">Class T.</th>
                    <th className="px-4 py-3 lg:px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group">
                      {/* Teacher name + email */}
                      <td className="px-4 py-3 lg:px-5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{teacher.user?.full_name || teacher.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{teacher.user?.email || '—'}</div>
                        {teacher.tsc_number && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{teacher.tsc_number}</div>}
                      </td>
                      {/* Combo / spec */}
                      <td className="px-4 py-3 lg:px-5">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                          {teacher.specialization || 'General'}
                        </span>
                        {teacher.combination?.name && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">{teacher.combination.name}</p>
                        )}
                      </td>
                      {/* Curriculum */}
                      <td className="px-4 py-3 lg:px-5">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>
                          {teacher.curriculum_specialization || '—'}
                        </span>
                      </td>
                      {/* Pathways */}
                      <td className="px-4 py-3 lg:px-5">
                        {teacher.teaching_pathways?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacher.teaching_pathways.map(p => <PathwayBadge key={p} pathway={p} />)}
                          </div>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      {/* Employment */}
                      <td className="px-4 py-3 lg:px-5 text-xs text-slate-500 dark:text-slate-400">
                        {teacher.employment_type || '—'}
                      </td>
                      {/* Workload */}
                      <td className="px-4 py-3 lg:px-5">
                        {selectedAcademicYear
                          ? <WorkloadMeter teacherId={teacher.id} academicYearId={selectedAcademicYear} compact={true} />
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      {/* Streams / Classrooms */}
                      <td className="px-4 py-3 lg:px-5 text-sm text-slate-600 dark:text-slate-400">
                        {hasStreams ? (teacher.streamCount || 0) : (teacher.classroomCount || 0)}
                      </td>
                      {/* Class teacher */}
                      <td className="px-4 py-3 lg:px-5">
                        {(hasStreams ? teacher.classTeacherStreamCount > 0 : !!teacher.classTeacherClassroom) ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">Yes</span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">No</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 lg:px-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher)}
                            className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-all" title={hasStreams ? 'View Streams' : 'View Classrooms'}>
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => showEditForm(teacher)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(teacher)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Always-visible fallback on small desktops */}
                        <div className="flex justify-end gap-1 md:hidden group-hover:hidden">
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="9" className="px-5 py-10 text-center text-slate-400 text-sm">
                        {activeFilterCount > 0 ? 'No teachers match your filters.' : 'No teachers found. Create one to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-cyan-600 dark:text-cyan-400">Clear filters</button>
              )}
            </div>
            {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
              <button key={teacher.id} onClick={() => openMobileSheet(teacher)}
                className="w-full bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-left active:scale-[0.99] transition-all shadow-sm hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{teacher.user?.full_name || teacher.user?.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{teacher.user?.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>
                    {teacher.curriculum_specialization}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                    {teacher.specialization || 'General'}
                  </span>
                  {teacher.teaching_pathways?.map(p => <PathwayBadge key={p} pathway={p} />)}
                </div>
                <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{hasStreams ? `${teacher.streamCount||0} streams` : `${teacher.classroomCount||0} classes`}</span>
                  {(hasStreams ? teacher.classTeacherStreamCount > 0 : !!teacher.classTeacherClassroom) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Class Teacher</span>
                  )}
                </div>
              </button>
            )) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  {activeFilterCount > 0 ? 'No teachers match your filters.' : 'No teachers yet. Create one above.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );

  // ── Classrooms View ───────────────────────────────────────────────────────────
  const renderClassroomsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Classrooms</h3>
            <p className="text-sm text-slate-400">{selectedTeacher?.user?.full_name} · {selectedTeacher?.classroomCount || 0} total</p>
          </div>
          <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {loading ? <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-slate-400" /></div>
            : selectedTeacher?.classrooms?.length > 0 ? (
              <div className="space-y-2">
                {selectedTeacher.classrooms.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{c.class_name}</p>
                        {c.pivot?.is_class_teacher && <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">Class Teacher</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Capacity: {c.capacity || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-slate-400 py-8">No classrooms assigned.</p>}
        </div>
      </div>
    </div>
  );

  // ── Streams View (enhanced) ───────────────────────────────────────────────────
  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col overflow-hidden">

        {/* ── Decorative header with gradient accent strip ── */}
        <div className="relative flex-shrink-0">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
            <div className="flex items-start gap-3">
              {/* Icon badge */}
              <div className="mt-0.5 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/10 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Streams</h3>
                <p className="text-sm text-slate-400 mt-0.5">{selectedTeacher?.user?.full_name}</p>
                {/* Count chips */}
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <BookOpen className="w-3 h-3" />
                    {selectedTeacher?.streamCount || 0} Teaching
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <GraduationCap className="w-3 h-3" />
                    {selectedTeacher?.classTeacherStreamCount || 0} Class Teacher
                  </span>
                </div>
              </div>
            </div>
            <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-slate-400" /></div>
          ) : (
            <>
              {['teachingStreams', 'classTeacherStreams'].map((key) => {
                const isClassTeacher = key === 'classTeacherStreams';
                const label = isClassTeacher ? 'Class Teacher Streams' : 'Teaching Streams';
                const items = selectedTeacher?.[key] || [];
                const accentColor = isClassTeacher
                  ? 'from-emerald-500 to-teal-500'
                  : 'from-cyan-500 to-blue-500';
                const dotColor = isClassTeacher ? 'bg-emerald-400' : 'bg-cyan-400';

                return (
                  <div key={key}>
                    {/* Section label with decorative line */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                      {items.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">{items.length}</span>
                      )}
                    </div>

                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((s, i) => (
                          <div key={s.id}
                            className="group relative flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-700/20 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm transition-all"
                          >
                            {/* Left accent stripe on hover */}
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-gradient-to-b ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

                            {/* Stream index badge */}
                            <div className="w-7 h-7 rounded-lg bg-white/10 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">{String(i + 1).padStart(2, '0')}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-md font-semibold border border-purple-200 dark:border-purple-800">
                                  {s.classroom?.class_name || 'Unknown'}
                                </span>
                                {isClassTeacher && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800">
                                    Class Teacher
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">Capacity: {s.capacity || 0}</p>
                            </div>

                            {/* Capacity mini bar */}
                            {s.capacity > 0 && (
                              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${accentColor}`}
                                    style={{ width: `${Math.min(100, ((s.student_count || 0) / s.capacity) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium">{s.student_count || 0}/{s.capacity}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/10 border border-dashed border-slate-200 dark:border-slate-700/50">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-400">None assigned.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (authLoading) return (
    <div className="w-full p-6 flex items-center justify-center py-20">
      <Loader className="w-10 h-10 text-slate-400 animate-spin" />
    </div>
  );

  if (!user || !schoolId) return (
    <div className="w-full p-6 flex flex-col items-center justify-center py-20">
      <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-slate-700 dark:text-slate-300 font-semibold">
        {!user ? 'Please log in to continue.' : 'Account missing school information.'}
      </p>
    </div>
  );

  return (
    <div className="w-full p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 max-w-screen-2xl mx-auto">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-10 h-10 text-slate-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        </div>
      )}
      {!loading && view === 'list' && renderListView()}
      {view === 'classrooms' && renderClassroomsView()}
      {view === 'streams'    && renderStreamsView()}

      {showForm && (
        <TeacherForm
          formData={formData}
          editingTeacher={selectedTeacher}
          onInputChange={handleInputChange}
          onArrayChange={handleArrayChange}
          onSubmit={handleSubmit}
          onClose={closeForm}
          isSubmitting={loading}
          users={users}
          school={school}
          specializationOptions={specializationOptions}
        />
      )}
      {renderDeleteConfirmationModal()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default TeacherManager;
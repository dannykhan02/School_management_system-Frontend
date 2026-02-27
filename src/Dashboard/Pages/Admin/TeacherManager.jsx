// src/Dashboard/Pages/Admin/TeacherManager.jsx
// ─────────────────────────────────────────────────────────────────────────────
// v4 — Pagination moved to top (mirroring CreateUser)
// CHANGES FROM v3:
// 1. Desktop table now has pagination bar at the top inside the table card,
//    identical to CreateUser's renderPagination.
// 2. Bottom pagination removed from desktop.
// 3. Added PER_PAGE_OPTIONS constant.
// 4. Page number generation logic copied from CreateUser.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Edit, Trash2, Loader, Users, BookOpen, Plus, X, GraduationCap,
  Search, AlertCircle, Filter, BarChart3, RefreshCw, Building,
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, FlaskConical,
  Palette, Globe, MoreHorizontal, Zap, Database, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { toast } from "react-toastify";
import TeacherForm from '../../../components/TeacherForm';
import WorkloadMeter from '../../../components/WorkloadMeter';

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

// ─── Cache indicator ──────────────────────────────────────────────────────────
const CacheIndicator = ({ cacheStatus }) => {
  if (!cacheStatus) return null;
  const isHit = cacheStatus === 'hit';
  return (
    <span
      title={isHit ? 'Served from Redis cache (~5ms)' : 'Served from MySQL (~800ms)'}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border
        ${isHit
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
        }`}
    >
      {isHit ? <Zap className="w-2.5 h-2.5" /> : <Database className="w-2.5 h-2.5" />}
      {isHit ? 'Redis HIT' : 'DB MISS'}
    </span>
  );
};

// ─── Pathway badge ────────────────────────────────────────────────────────────
const PathwayBadge = ({ pathway }) => {
  const config = {
    STEM:              { icon: FlaskConical, cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    Arts:              { icon: Palette,      cls: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800' },
    'Social Sciences': { icon: Globe,        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };
  const { icon: Icon, cls } = config[pathway] || { icon: null, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${cls}`}>
      {Icon && <Icon className="w-2.5 h-2.5" />}{pathway}
    </span>
  );
};

// ─── Pagination Bar (used only for mobile now) ────────────────────────────────
const PaginationBar = ({ meta, onPageChange, loading }) => {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page, last_page, total, from, to } = meta;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(1, current_page - delta);
    const right = Math.min(last_page, current_page + delta);

    if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < last_page) { if (right < last_page - 1) pages.push('...'); pages.push(last_page); }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 border-t border-slate-200 dark:border-slate-700 mt-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
        Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{from}–{to}</span> of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> teachers
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1 || loading}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />Prev
        </button>
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-400 text-xs select-none">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors disabled:cursor-not-allowed
                ${page === current_page
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white'
                  : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page || loading}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next<ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2 order-3">
        <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Per page</label>
        <select
          onChange={(e) => onPageChange(1, parseInt(e.target.value))}
          defaultValue={meta.per_page}
          disabled={loading}
          className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </div>
  );
};

// ─── Row Actions ──────────────────────────────────────────────────────────────
function TeacherRowActions({ teacher, hasStreams, onEdit, onViewAssignments, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const handle = (fn) => { setOpen(false); fn(); };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="More actions">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-52 bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl shadow-2xl py-1.5">
          <button onClick={() => handle(onEdit)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left"><Edit className="w-4 h-4 text-amber-400" />Edit Teacher</button>
          <button onClick={() => handle(onViewAssignments)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left"><Users className="w-4 h-4 text-cyan-400" />{hasStreams ? 'View Streams' : 'View Classrooms'}</button>
          <div className="my-1 border-t border-slate-700/60" />
          <button onClick={() => handle(onDelete)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left"><Trash2 className="w-4 h-4" />Delete Teacher</button>
        </div>
      )}
    </div>
  );
}

// ─── Statistics ───────────────────────────────────────────────────────────────
const TeacherStatistics = ({ teachers, paginationMeta }) => {
  const stats = useMemo(() => {
    const specializationCount = teachers.reduce((acc, t) => { const spec = t.specialization || 'General'; acc[spec] = (acc[spec] || 0) + 1; return acc; }, {});
    const employmentStats     = teachers.reduce((acc, t) => { const type = t.employment_type || 'Not specified'; acc[type] = (acc[type] || 0) + 1; return acc; }, {});
    const pathwayStats        = teachers.reduce((acc, t) => { (t.teaching_pathways || []).forEach(p => { acc[p] = (acc[p] || 0) + 1; }); return acc; }, {});
    return { specializationCount, employmentStats, pathwayStats };
  }, [teachers]);

  const totalTeachers = paginationMeta?.total ?? teachers.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Total</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{totalTeachers}</p>
          <p className="text-xs text-slate-400 mt-0.5">Teachers</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center"><Users className="w-6 h-6 text-cyan-500" /></div>
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Specs</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{Object.keys(stats.specializationCount).length}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[90px]">{Object.entries(stats.specializationCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-purple-500" /></div>
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">Full-time</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.employmentStats['Full-time'] || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">{stats.employmentStats['Part-time'] || 0} part-time</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-orange-500" /></div>
      </div>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">SS Pathways</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {['STEM', 'Arts', 'Social Sciences'].map(p => (
              <span key={p} className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                {stats.pathwayStats[p] || 0} {p === 'Social Sciences' ? 'Soc' : p}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Senior Secondary</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><FlaskConical className="w-6 h-6 text-blue-500" /></div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function TeacherManager() {
  const { user, schoolId, loading: authLoading } = useAuth();

  const [teachers, setTeachers]               = useState([]);
  const [combinations, setCombinations]       = useState({});
  const [users, setUsers]                     = useState([]);
  const [subjects, setSubjects]               = useState([]);
  const [academicYears, setAcademicYears]     = useState([]);
  const [streams, setStreams]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [view, setView]                       = useState('list');
  const [searchTerm, setSearchTerm]           = useState('');
  const [filters, setFilters]                 = useState({ curriculum_specialization: '', specialization: '', employment_type: '', pathway: '' });
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showForm, setShowForm]               = useState(false);
  const [school, setSchool]                   = useState(null);
  const [hasStreams, setHasStreams]           = useState(false);
  const [gradeLevels, setGradeLevels]         = useState([]);
  const [showFilters, setShowFilters]         = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [deleteModal, setDeleteModal]         = useState({ isOpen: false, teacherId: null, teacherName: '' });
  const [mobileSheet, setMobileSheet]         = useState({ isOpen: false, teacher: null });
  const [lastCacheStatus, setLastCacheStatus] = useState(null);

  const [currentPage, setCurrentPage]         = useState(1);
  const [perPage, setPerPage]                 = useState(25);
  const [paginationMeta, setPaginationMeta]   = useState(null);

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

  const getCombo = useCallback((teacher) => {
    if (!teacher.combination_id) return null;
    return combinations[teacher.combination_id] ?? null;
  }, [combinations]);

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET');
      const schoolData = response?.data || response;
      setSchool(schoolData);
      setGradeLevels(schoolData?.grade_levels || []);
    } catch (error) {
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchTeachers = useCallback(async (page = 1, pp = perPage) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: pp });
      const teachersResponse = await apiRequest(`teachers/school/${schoolId}?${params}`, 'GET');

      const teachersData     = teachersResponse?.data        ?? [];
      const hasStreamsFromAPI = teachersResponse?.has_streams ?? false;
      const schoolFromResp   = teachersResponse?.school      ?? null;
      const combosFromResp   = teachersResponse?.combinations ?? {};

      setLastCacheStatus(teachersResponse?._cache ?? null);
      setPaginationMeta(teachersResponse?.meta ?? null);

      setCombinations(prev => ({ ...prev, ...combosFromResp }));

      if (schoolFromResp) {
        setSchool(prev => prev ?? schoolFromResp);
        setGradeLevels(prev => prev.length > 0 ? prev : (schoolFromResp.grade_levels || []));
      }

      setHasStreams(hasStreamsFromAPI);

      let enriched = Array.isArray(teachersData) ? teachersData : [];
      if (hasStreamsFromAPI) {
        enriched = enriched.map(t => ({
          ...t,
          streamCount: t.teaching_streams?.length || 0,
          classTeacherStreamCount: t.class_teacher_streams?.length || 0
        }));
      } else {
        enriched = enriched.map(t => {
          const classrooms = t.classrooms || [];
          return { ...t, classroomCount: classrooms.length, classTeacherClassroom: classrooms.find(c => c.pivot?.is_class_teacher) };
        });
      }
      setTeachers(enriched);

    } catch (error) {
      toast.error('Failed to load teachers. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, perPage]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesResponse, subjectsResponse, academicYearsResponse] = await Promise.all([
        apiRequest('roles', 'GET'),
        apiRequest('subjects', 'GET'),
        apiRequest('academic-years', 'GET')
      ]);

      setSubjects(Array.isArray(subjectsResponse) ? subjectsResponse : (subjectsResponse?.data || []));
      setAcademicYears(Array.isArray(academicYearsResponse) ? academicYearsResponse : (academicYearsResponse?.data || []));

      const teacherRole = Array.isArray(rolesResponse)
        ? rolesResponse.find(r => r.name === 'Teacher' || r.name === 'teacher') : null;
      if (teacherRole) {
        const usersResponse = await apiRequest(`users?role_id=${teacherRole.id}`, 'GET');
        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      }

      if (hasStreams) {
        try {
          const streamsResponse = await apiRequest('streams', 'GET');
          setStreams(Array.isArray(streamsResponse) ? streamsResponse : (streamsResponse?.data || []));
        } catch { /* non-critical */ }
      }
    } catch (error) {
      toast.error('Failed to load supporting data.');
    } finally {
      setLoading(false);
    }
  }, [hasStreams]);

  useEffect(() => {
    if (schoolId) {
      fetchTeachers(1, perPage);
      fetchInitialData();
      fetchSchoolInfo();
    }
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    const fetchCurrentAcademicYear = async () => {
      try {
        const response = await apiRequest('academic-years', 'GET');
        const years = Array.isArray(response) ? response : (response?.data || []);
        const current = years.find(y => y.is_active === 1 || y.is_active === true || y.is_current);
        if (current) setSelectedAcademicYear(current.id);
      } catch { /* non-critical */ }
    };
    fetchCurrentAcademicYear();
  }, [schoolId]);

  const handlePageChange = useCallback((newPage, newPerPage = perPage) => {
    setCurrentPage(newPage);
    setPerPage(newPerPage);
    fetchTeachers(newPage, newPerPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [perPage, fetchTeachers]);

  const handleArrayChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const combo = getCombo(t);
      const matchesSearch = !searchTerm ||
        t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tsc_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCurriculum = !filters.curriculum_specialization || t.curriculum_specialization === filters.curriculum_specialization;
      const matchesSpec       = !filters.specialization || t.specialization === filters.specialization;
      const matchesEmployment = !filters.employment_type || t.employment_type === filters.employment_type;
      const matchesPathway    = !filters.pathway || (Array.isArray(t.teaching_pathways) && t.teaching_pathways.includes(filters.pathway));
      return matchesSearch && matchesCurriculum && matchesSpec && matchesEmployment && matchesPathway;
    });
  }, [teachers, searchTerm, filters, getCombo]);

  const showCreateForm = () => {
    const defaultCurriculum = school?.primary_curriculum !== 'Both' ? school?.primary_curriculum || '' : '';
    setShowForm(true); setSelectedTeacher(null);
    setFormData({ ...emptyForm, curriculum_specialization: defaultCurriculum });
  };

  const showEditForm = (teacher) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setShowForm(true); setSelectedTeacher(teacher);
    const pivotMeta = (teacher.qualified_subjects || []).reduce((acc, s) => {
      if (s.pivot?.years_experience) acc[s.id] = { years_experience: s.pivot.years_experience || null, is_primary_subject: s.pivot.is_primary_subject || false };
      return acc;
    }, {});
    setFormData({
      user_id: teacher.user_id, qualification: teacher.qualification || '',
      employment_type: teacher.employment_type || '', employment_status: teacher.employment_status || 'active',
      tsc_number: teacher.tsc_number || '', tsc_status: teacher.tsc_status || '',
      specialization: teacher.specialization || '', curriculum_specialization: teacher.curriculum_specialization || '',
      teaching_levels: teacher.teaching_levels || [], teaching_pathways: teacher.teaching_pathways || [],
      subject_ids: teacher.qualified_subjects?.map(s => s.id) || [],
      subject_pivot_meta: pivotMeta, max_subjects: teacher.max_subjects || '',
      max_classes: teacher.max_classes || '', max_weekly_lessons: teacher.max_weekly_lessons || '',
      min_weekly_lessons: teacher.min_weekly_lessons || '', combination_id: teacher.combination_id || '',
      bed_graduation_year: teacher.bed_graduation_year || '', bed_institution_type: teacher.bed_institution_type || '',
      bed_awarding_institution: teacher.bed_awarding_institution || '', resync_subjects: false
    });
  };

  const showClassroomsView = async (teacher) => {
    setView('classrooms'); setSelectedTeacher(teacher); setLoading(true);
    try {
      const response = await apiRequest(`teachers/${teacher.id}/classrooms`, 'GET');
      const teacherClassrooms = response?.data || [];
      setSelectedTeacher(prev => ({ ...prev, classrooms: teacherClassrooms, classroomCount: teacherClassrooms.length }));
    } catch (error) { toast.error('Could not load classrooms'); }
    finally { setLoading(false); }
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
    } catch (error) { toast.error('Could not load streams'); }
    finally { setLoading(false); }
  };

  const backToList = () => {
    setView('list'); setShowForm(false); setSelectedTeacher(null);
    fetchTeachers(currentPage, perPage);
  };
  const closeForm = () => { setShowForm(false); setSelectedTeacher(null); };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.teaching_levels?.length > 0 && (!formData.subject_ids || formData.subject_ids.length === 0)) {
      toast.error('Please select at least one qualified subject for the selected teaching levels.'); return;
    }
    setLoading(true);
    try {
      const payload = {
        user_id: formData.user_id, qualification: formData.qualification || null,
        employment_type: formData.employment_type || null, employment_status: formData.employment_status || 'active',
        tsc_number: formData.tsc_number || null, tsc_status: formData.tsc_status || null,
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
        setCurrentPage(1);
      }
      backToList();
    } catch (error) {
      const ve = error?.response?.data?.errors;
      if (ve) {
        Object.keys(ve).forEach(key => toast.error(`${key}: ${Array.isArray(ve[key]) ? ve[key].join(', ') : ve[key]}`));
      } else {
        toast.error(`Failed to ${selectedTeacher ? 'update' : 'create'} teacher: ${error?.response?.data?.message || error?.message || 'An error occurred'}`);
      }
    } finally { setLoading(false); }
  };

  const handleDeleteClick = (teacher) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, teacherId: teacher.id, teacherName: teacher.user?.full_name || 'Unknown' });
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`teachers/${deleteModal.teacherId}`, 'DELETE');
      toast.success('Teacher deleted successfully');
      setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' });
      const isLastOnPage = teachers.length === 1 && currentPage > 1;
      fetchTeachers(isLastOnPage ? currentPage - 1 : currentPage, perPage);
      if (isLastOnPage) setCurrentPage(p => p - 1);
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

  const openMobileSheet  = (teacher) => { setMobileSheet({ isOpen: true, teacher }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, teacher: null }); document.body.style.overflow = ''; };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);

  const renderDeleteConfirmationModal = () => {
    if (!deleteModal.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 flex-shrink-0"><AlertCircle className="w-6 h-6 text-red-500" /></div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Teacher</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.teacherName}"</span>? This cannot be undone.</p>
            </div>
          </div>
          <div className="p-5 flex gap-2 justify-end">
            <button onClick={() => setDeleteModal({ isOpen: false, teacherId: null, teacherName: '' })} disabled={loading} className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50">Cancel</button>
            <button onClick={handleDelete} disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
              {loading ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Trash2 className="w-3.5 h-3.5" />}
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.teacher) return null;
    const teacher = mobileSheet.teacher;
    const combo   = getCombo(teacher);
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
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>{teacher.curriculum_specialization}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{teacher.specialization || 'General'}</span>
                {combo?.name && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 truncate max-w-[160px]">{combo.name}</span>}
              </div>
              {teacher.teaching_pathways?.length > 0 && <div className="flex flex-wrap gap-1">{teacher.teaching_pathways.map(p => <PathwayBadge key={p} pathway={p} />)}</div>}
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
            <button onClick={() => { closeMobileSheet(); showEditForm(teacher); }} className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><Edit className="w-4 h-4" />Edit</button>
            <button onClick={() => { closeMobileSheet(); hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher); }} className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all"><Users className="w-4 h-4" />{hasStreams ? 'Streams' : 'Classes'}</button>
            <button onClick={() => handleDeleteClick(teacher)} className="flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"><Trash2 className="w-4 h-4" />Delete</button>
          </div>
        </div>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGINATION (top bar) – exact copy from CreateUser's renderPagination
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTopPagination = () => {
    if (!paginationMeta || paginationMeta.total === 0) return null;

    const { total, per_page, current_page, last_page, from, to } = paginationMeta;
    const ws = 2;
    let start = Math.max(1, current_page - ws);
    let end   = Math.min(last_page, current_page + ws);
    if (end - start < 4) {
      if (start === 1) end   = Math.min(last_page, start + 4);
      else             start = Math.max(1, end - 4);
    }
    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const btnBase     = 'h-9 min-w-[36px] px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed';
    const btnGhost    = `${btnBase} text-[#4c739a] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700`;
    const btnActive   = `${btnBase} bg-black dark:bg-white text-white dark:text-black shadow-sm`;
    const btnInactive = `${btnBase} text-[#0d141b] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700`;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm text-[#4c739a] dark:text-slate-400">
          <span>
            {from}–{to} of{' '}
            <strong className="text-[#0d141b] dark:text-white">{total.toLocaleString()}</strong> teachers
          </span>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline text-xs">Rows:</span>
            <select
              value={per_page}
              onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1); fetchTeachers(1, Number(e.target.value)); }}
              className="h-8 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handlePageChange(1)}           disabled={current_page === 1}           className={btnGhost}><ChevronsLeft  className="w-4 h-4" /></button>
          <button onClick={() => handlePageChange(current_page - 1)} disabled={current_page === 1}           className={btnGhost}><ChevronLeft   className="w-4 h-4" /></button>
          {start > 1       && <span className="px-1 text-[#4c739a] text-sm">…</span>}
          {pages.map(p => <button key={p} onClick={() => handlePageChange(p)} className={p === current_page ? btnActive : btnInactive}>{p}</button>)}
          {end < last_page && <span className="px-1 text-[#4c739a] text-sm">…</span>}
          <button onClick={() => handlePageChange(current_page + 1)} disabled={current_page === last_page} className={btnGhost}><ChevronRight  className="w-4 h-4" /></button>
          <button onClick={() => handlePageChange(last_page)}  disabled={current_page === last_page} className={btnGhost}><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  // ── List View ─────────────────────────────────────────────────────────────────
  const renderListView = () => (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">Teacher Management</h1>
            <CacheIndicator cacheStatus={lastCacheStatus} />
          </div>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base">Manage teaching staff, their assignments, and qualifications.</p>
          {school && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
                <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">{school.name}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>{school.primary_curriculum}</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hasStreams ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>{hasStreams ? 'Streams Enabled' : 'Direct Assignment'}</span>
              {gradeLevels.slice(0, 3).map((l, i) => (<span key={i} className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{l}</span>))}
              {gradeLevels.length > 3 && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">+{gradeLevels.length - 3} more</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={() => fetchTeachers(currentPage, perPage)} disabled={loading} title="Refresh" className="bg-black text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={showCreateForm} disabled={!school} className="bg-black text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />New Teacher
          </button>
        </div>
      </div>

      <TeacherStatistics teachers={teachers} paginationMeta={paginationMeta} />

      {/* Filters */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
              {activeFilterCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500 text-white rounded-full">{activeFilterCount}</span>}
            </div>
            {showFilters ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </button>

          <div className={`${showFilters ? '' : 'hidden'} md:block`}>
            <div className="hidden md:flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              {activeFilterCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500 text-white rounded-full">{activeFilterCount} active</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 md:col-span-3 lg:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Name, email, or TSC number…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              {[
                { label: 'Curriculum', key: 'curriculum_specialization', options: curriculumOptions.map(o => ({ value: o, label: o })), placeholder: 'All Curricula' },
                { label: 'Specialization', key: 'specialization', options: specializationOptions.map(o => ({ value: o, label: o })), placeholder: 'All Specializations' },
                { label: 'Pathway', key: 'pathway', options: ['STEM','Arts','Social Sciences'].map(o => ({ value: o, label: o })), placeholder: 'All Pathways' },
                { label: 'Employment', key: 'employment_type', options: ['Full-time','Part-time','Contract','Temporary'].map(o => ({ value: o, label: o })), placeholder: 'All Types' },
              ].map(({ label, key, options, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>
                  <select value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 self-center">Active filters:</span>
                {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => (
                  <button key={k} onClick={() => setFilters({ ...filters, [k]: '' })} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs font-medium hover:bg-cyan-200 transition-colors">{v}<X className="w-3 h-3" /></button>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium self-center ml-auto">Clear all</button>
              </div>
            )}
            <div className="mt-2 text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing {filteredTeachers.length} on this page
                {paginationMeta && ` · ${paginationMeta.total} total`}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-10 h-10 text-slate-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading teachers…</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Teachers
                <span className="ml-1 text-slate-400 font-normal">
                  ({filteredTeachers.length}{paginationMeta && ` / ${paginationMeta.total} total`})
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700">
                {/* Pagination top - mirrored from CreateUser */}
                {renderTopPagination()}
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
                    {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => {
                      const combo = getCombo(teacher);
                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors group">
                          <td className="px-4 py-3 lg:px-5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{teacher.user?.full_name || teacher.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{teacher.user?.email || '—'}</div>
                            {teacher.tsc_number && <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{teacher.tsc_number}</div>}
                          </td>
                          <td className="px-4 py-3 lg:px-5">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{teacher.specialization || 'General'}</span>
                            {combo?.name && <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[140px]">{combo.name}</p>}
                          </td>
                          <td className="px-4 py-3 lg:px-5">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>{teacher.curriculum_specialization || '—'}</span>
                          </td>
                          <td className="px-4 py-3 lg:px-5">
                            {teacher.teaching_pathways?.length > 0
                              ? <div className="flex flex-wrap gap-1">{teacher.teaching_pathways.map(p => <PathwayBadge key={p} pathway={p} />)}</div>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3 lg:px-5 text-xs text-slate-500 dark:text-slate-400">{teacher.employment_type || '—'}</td>
                          <td className="px-4 py-3 lg:px-5">
                            {selectedAcademicYear
                              ? <WorkloadMeter teacherId={teacher.id} academicYearId={selectedAcademicYear} compact={true} />
                              : <span className="text-xs text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 lg:px-5 text-sm text-slate-600 dark:text-slate-400">{hasStreams ? (teacher.streamCount || 0) : (teacher.classroomCount || 0)}</td>
                          <td className="px-4 py-3 lg:px-5">
                            {(hasStreams ? teacher.classTeacherStreamCount > 0 : !!teacher.classTeacherClassroom)
                              ? <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">Yes</span>
                              : <span className="text-xs text-slate-300 dark:text-slate-600">No</span>}
                          </td>
                          <td className="px-4 py-3 lg:px-5 text-right">
                            <TeacherRowActions teacher={teacher} hasStreams={hasStreams} onEdit={() => showEditForm(teacher)} onViewAssignments={() => hasStreams ? showStreamsView(teacher) : showClassroomsView(teacher)} onDelete={() => handleDeleteClick(teacher)} />
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="9" className="px-5 py-10 text-center text-slate-400 text-sm">
                        {activeFilterCount > 0 ? 'No teachers match your filters.' : 'No teachers found. Create one to get started.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Bottom pagination removed */}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2.5">
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} on this page</span>
              {activeFilterCount > 0 && <button onClick={clearAllFilters} className="text-xs text-cyan-600 dark:text-cyan-400">Clear filters</button>}
            </div>
            {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => {
              const combo = getCombo(teacher);
              return (
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
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getCurriculumBadgeColor(teacher.curriculum_specialization)}`}>{teacher.curriculum_specialization}</span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">{teacher.specialization || 'General'}</span>
                    {teacher.teaching_pathways?.map(p => <PathwayBadge key={p} pathway={p} />)}
                  </div>
                  <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{hasStreams ? `${teacher.streamCount || 0} streams` : `${teacher.classroomCount || 0} classes`}</span>
                    {(hasStreams ? teacher.classTeacherStreamCount > 0 : !!teacher.classTeacherClassroom) && <span className="text-emerald-600 dark:text-emerald-400 font-medium">Class Teacher</span>}
                  </div>
                </button>
              );
            }) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{activeFilterCount > 0 ? 'No teachers match your filters.' : 'No teachers yet.'}</p>
              </div>
            )}
            {/* Mobile pagination (unchanged) */}
            <PaginationBar meta={paginationMeta} onPageChange={handlePageChange} loading={loading} />
          </div>
        </>
      )}
    </>
  );

  // ── Classroom / Stream views ──────────────────────────────────────────────
  const renderClassroomsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <div><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Classrooms</h3><p className="text-sm text-slate-400">{selectedTeacher?.user?.full_name}</p></div>
          <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {loading ? <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-slate-400" /></div>
            : selectedTeacher?.classrooms?.length > 0 ? (
              <div className="space-y-2">
                {selectedTeacher.classrooms.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2"><p className="font-medium text-slate-900 dark:text-white">{c.class_name}</p>{c.pivot?.is_class_teacher && <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">Class Teacher</span>}</div>
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

  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="relative flex-shrink-0">
          <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/10 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center flex-shrink-0"><Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Streams</h3>
                <p className="text-sm text-slate-400 mt-0.5">{selectedTeacher?.user?.full_name}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><BookOpen className="w-3 h-3" />{selectedTeacher?.streamCount || 0} Teaching</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><GraduationCap className="w-3 h-3" />{selectedTeacher?.classTeacherStreamCount || 0} Class Teacher</span>
                </div>
              </div>
            </div>
            <button onClick={backToList} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto space-y-5">
          {loading ? <div className="flex justify-center py-8"><Loader className="w-7 h-7 animate-spin text-slate-400" /></div> : (
            <>
              {['teachingStreams', 'classTeacherStreams'].map((key) => {
                const isClassTeacher = key === 'classTeacherStreams';
                const label = isClassTeacher ? 'Class Teacher Streams' : 'Teaching Streams';
                const items = selectedTeacher?.[key] || [];
                const accentColor = isClassTeacher ? 'from-emerald-500 to-teal-500' : 'from-cyan-500 to-blue-500';
                const dotColor = isClassTeacher ? 'bg-emerald-400' : 'bg-cyan-400';
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-3"><span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span><div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />{items.length > 0 && <span className="text-[10px] font-bold text-slate-400">{items.length}</span>}</div>
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((s, i) => (
                          <div key={s.id} className="group relative flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-700/20 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm transition-all">
                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-gradient-to-b ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            <div className="w-7 h-7 rounded-lg bg-white/10 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 flex items-center justify-center flex-shrink-0 shadow-sm"><span className="text-[10px] font-black text-slate-500 dark:text-slate-300">{String(i + 1).padStart(2, '0')}</span></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-slate-900 dark:text-white">{s.name}</p><span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-md font-semibold border border-purple-200 dark:border-purple-800">{s.classroom?.class_name || 'Unknown'}</span>{isClassTeacher && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-md font-semibold border border-emerald-200 dark:border-emerald-800">Class Teacher</span>}</div>
                              <p className="text-xs text-slate-400 mt-0.5">Capacity: {s.capacity || 0}</p>
                            </div>
                            {s.capacity > 0 && (
                              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${accentColor}`} style={{ width: `${Math.min(100, ((s.student_count || 0) / s.capacity) * 100)}%` }} /></div>
                                <span className="text-[9px] text-slate-400 font-medium">{s.student_count || 0}/{s.capacity}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/10 border border-dashed border-slate-200 dark:border-slate-700/50"><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-slate-300 dark:text-slate-500" /></div><p className="text-sm text-slate-400">None assigned.</p></div>
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

  if (authLoading) return <div className="w-full p-6 flex items-center justify-center py-20"><Loader className="w-10 h-10 text-slate-400 animate-spin" /></div>;
  if (!user || !schoolId) return (
    <div className="w-full p-6 flex flex-col items-center justify-center py-20">
      <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
      <p className="text-slate-700 dark:text-slate-300 font-semibold">{!user ? 'Please log in to continue.' : 'Account missing school information.'}</p>
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
      {!loading && view === 'list'    && renderListView()}
      {view === 'classrooms'          && renderClassroomsView()}
      {view === 'streams'             && renderStreamsView()}

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
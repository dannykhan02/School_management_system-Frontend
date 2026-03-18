// AcademicYearSetup.jsx — Grouped year view + full mobile responsiveness
import React, { useEffect, useState, useCallback, useRef } from 'react';
import AcademicYearForm from '../../../components/AcademicYearForm';
import { apiRequest } from '../../../utils/api';
import {
  Edit,
  Trash2,
  Loader,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  ChevronRight,
  Calendar,
  BookOpen,
  X,
  Layers,
  MoreHorizontal,
  ArrowUpDown,
  MapPin,
} from 'lucide-react';
import DisplayDate from '../../../utils/DisplayDate';
import { toast } from 'react-toastify';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT  (mirrors StreamManager + ClassroomManager)
// ─────────────────────────────────────────────────────────────────────────────
const CLS = {
  modalBg:    'bg-white dark:bg-slate-800/50',
  card:       'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700',
  secondary:  'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium',
  primary:    'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold',
  cancelPill: 'px-5 py-2 rounded-full text-sm font-semibold bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  deletePill: 'px-5 py-2 rounded-full text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5',
};

// ─── Row Action Dropdown (mirrors StreamManager/ClassroomManager) ─────────────
function RowActionsMenu({ onEdit, onDelete }) {
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
        <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xl dark:shadow-2xl py-1.5">
          <button
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Edit Term
          </button>
          <div className="my-1 border-t border-slate-200 dark:border-slate-700/60" />
          <button
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />
            Delete Term
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'year', label: 'Year' },
  { value: 'term', label: 'Term' },
  { value: 'curriculum_type', label: 'Curriculum' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'end_date', label: 'End Date' },
];

// ─── Helper: group flat academic year records into year groups ────────────────
function groupAcademicYears(flatYears) {
  const map = new Map();

  for (const record of flatYears) {
    const key = `${record.year}||${record.curriculum_type}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        year: record.year.toString(),
        curriculum_type: record.curriculum_type,
        terms: [],
        hasActive: false,
      });
    }
    const group = map.get(key);
    group.terms.push(record);
    if (record.is_active) group.hasActive = true;
  }

  for (const group of map.values()) {
    group.terms.sort((a, b) => {
      const an = a.term?.toLowerCase() ?? '';
      const bn = b.term?.toLowerCase() ?? '';
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const yearDiff = parseInt(b.year) - parseInt(a.year);
    if (yearDiff !== 0) return yearDiff;
    return (a.curriculum_type ?? '').localeCompare(b.curriculum_type ?? '');
  });
}

// ─── Desktop Grouped Year Row (table rows) ────────────────────────────────────
function GroupedYearRow({
  group,
  showCurriculumColumn,
  getCurriculumBadgeColor,
  onEdit,
  onDelete,
  onToggleActive,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer select-none group bg-slate-50 dark:bg-slate-700/25 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors"
      >
        <td
          colSpan={showCurriculumColumn ? 7 : 6}
          className="px-4 py-3 md:px-6 border-t border-slate-200 dark:border-slate-700/40"
        >
          <div className="flex items-center gap-3">
            <span
              className="flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200"
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <ChevronDown className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white w-10 flex-shrink-0">{group.year}</span>
            {showCurriculumColumn && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getCurriculumBadgeColor(group.curriculum_type)}`}>
                {group.curriculum_type}
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {group.terms.length} term{group.terms.length !== 1 ? 's' : ''}
            </span>
            {group.hasActive && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                Active
              </span>
            )}
            {!open && (
              <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                {group.terms.map(t => (
                  <span key={t.id} className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                    t.is_active
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                      : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-700/60'
                  }`}>{t.term}</span>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>
      {open && group.terms.map(term => (
        <tr key={term.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/10 transition-colors duration-100">
          <td className="pl-8 md:pl-10 pr-2 py-3 w-10">
            <div className="flex items-center justify-end h-full">
              <div className="w-px h-full min-h-[20px] bg-slate-300 dark:bg-slate-700/50" />
            </div>
          </td>
          <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
              {term.term}
            </div>
          </td>
          {showCurriculumColumn && (
            <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-600">—</td>
          )}
          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
            {term.start_date ? DisplayDate(term.start_date) : <span className="text-slate-400 dark:text-slate-700">—</span>}
          </td>
          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden xl:table-cell">
            {term.end_date ? DisplayDate(term.end_date) : <span className="text-slate-400 dark:text-slate-700">—</span>}
          </td>
          <td className="px-4 py-3">
            <button
              onClick={() => onToggleActive(term)}
              title={term.is_active ? 'Click to deactivate' : 'Click to activate'}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-all ${
                term.is_active
                  ? 'text-green-700 bg-green-100 border-green-200 hover:bg-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20 dark:hover:bg-green-500/15'
                  : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-700/30 dark:border-slate-600/40 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'
              }`}
            >
              <CheckCircle className={`w-3.5 h-3.5 ${term.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-600'}`} />
              {term.is_active ? 'Active' : 'Inactive'}
            </button>
          </td>
          <td className="px-4 py-3 text-right">
            <RowActionsMenu onEdit={() => onEdit(term.id)} onDelete={() => onDelete(term.id)} />
          </td>
        </tr>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function AcademicYearSetup() {
  const [academicYears, setAcademicYears] = useState([]);
  const [filteredYears, setFilteredYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formInitialMode, setFormInitialMode] = useState('single');
  const [editingYear, setEditingYear] = useState(null);
  const [curriculumFilter, setCurriculumFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'desc' });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [school, setSchool] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false, yearId: null, yearName: '',
  });

  // Mobile bottom sheet — mirrors StreamManager/ClassroomManager
  const [mobileSheet, setMobileSheet] = useState({ isOpen: false, year: null });
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStartY, setDragStartY]   = useState(0);
  const [dragOffset, setDragOffset]   = useState(0);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    term: '', start_date: '', end_date: '', curriculum_type: '', is_active: false,
  });

  // ─── Data fetching ────────────────────────────────────────────────────────

  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET');
      const schoolData = response.data || response;
      setSchool(schoolData);
      if (schoolData.primary_curriculum !== 'Both') {
        setCurriculumFilter(schoolData.primary_curriculum);
      }
    } catch (err) {
      console.error('Failed to fetch school information:', err);
      toast.error('Failed to fetch school information');
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiRequest('academic-years', 'GET');
      const rawYears = response.data || response || [];
      const currentYear = new Date().getFullYear();
      const years = (Array.isArray(rawYears) ? rawYears : []).map(t => ({
        ...t,
        is_active: parseInt(t.year) < currentYear ? false : t.is_active,
      }));
      setAcademicYears(years);
    } catch (err) {
      console.error('Failed to fetch academic years:', err);
      setError('Failed to fetch academic years. Please try again.');
      setAcademicYears([]);
      toast.error('Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchoolInfo(); }, [fetchSchoolInfo]);
  useEffect(() => { if (school) fetchAcademicYears(); }, [school, fetchAcademicYears]);

  // ─── Filtering / sorting ──────────────────────────────────────────────────

  const applyFilters = useCallback(() => {
    let filtered = [...academicYears];
    if (school && school.primary_curriculum === 'Both' && curriculumFilter !== 'all') {
      filtered = filtered.filter(y => y.curriculum_type === curriculumFilter);
    }
    if (yearFilter !== 'all') {
      filtered = filtered.filter(y => y.year.toString() === yearFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        y => y.term?.toLowerCase().includes(q) || y.year.toString().includes(q)
      );
    }
    filtered.sort((a, b) => {
      let aVal = String(a[sortConfig.key] ?? '').toLowerCase();
      let bVal = String(b[sortConfig.key] ?? '').toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredYears(filtered);
  }, [academicYears, yearFilter, searchTerm, sortConfig, curriculumFilter, school]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const getUniqueYears = () => {
    const years = [...new Set(academicYears.map(y => y.year.toString()))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const groupedYears = groupAcademicYears(filteredYears);

  // ─── Sort helpers ─────────────────────────────────────────────────────────

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // ─── Mobile bottom sheet (mirrors StreamManager exactly) ──────────────────

  const handleTouchStart = e => { setIsDragging(true); setDragStartY(e.touches[0].clientY); };
  const handleTouchMove  = e => { if (!isDragging) return; const delta = e.touches[0].clientY - dragStartY; if (delta > 0) setDragOffset(delta); };
  const handleTouchEnd   = () => { setIsDragging(false); if (dragOffset > 100) closeMobileSheet(); setDragOffset(0); };

  const openMobileSheet = year => {
    setMobileSheet({ isOpen: true, year });
    document.body.style.overflow = 'hidden';
  };
  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, year: null });
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const getDefaultFormData = () => {
    const curriculumType =
      school && school.primary_curriculum !== 'Both' ? school.primary_curriculum : '';
    return {
      year: new Date().getFullYear().toString(),
      term: '', start_date: '', end_date: '',
      curriculum_type: curriculumType, is_active: false,
    };
  };

  const handleAddNew = () => {
    setEditingYear(null);
    setFormData(getDefaultFormData());
    setFormInitialMode('single');
    setShowForm(true);
  };

  const handleBulkCreateOpen = () => {
    setEditingYear(null);
    setFormData(getDefaultFormData());
    setFormInitialMode('bulk');
    setShowForm(true);
  };

  const handleEdit = id => {
    const yearToEdit = academicYears.find(y => y.id === id);
    if (yearToEdit) {
      setEditingYear(yearToEdit);
      setFormData({
        year: yearToEdit.year.toString(),
        term: yearToEdit.term || '',
        start_date: yearToEdit.start_date || '',
        end_date: yearToEdit.end_date || '',
        curriculum_type: yearToEdit.curriculum_type || '',
        is_active: yearToEdit.is_active || false,
      });
      setFormInitialMode('single');
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingYear(null);
    setFormInitialMode('single');
    setFormData({
      year: new Date().getFullYear().toString(),
      term: '', start_date: '', end_date: '', curriculum_type: '', is_active: false,
    });
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ─── Submit (single) ──────────────────────────────────────────────────────

  const handleSubmit = async e => {
    e.preventDefault();
    if (school && school.primary_curriculum === 'Both' && !formData.curriculum_type) {
      toast.error('Please select a curriculum type'); return;
    }
    if (!formData.year || !formData.term) {
      toast.error('Please fill in all required fields'); return;
    }
    try {
      setSubmitting(true);
      const submitData = { year: formData.year.toString(), term: formData.term, is_active: formData.is_active };
      if (formData.start_date) submitData.start_date = formData.start_date;
      if (formData.end_date)   submitData.end_date   = formData.end_date;
      if (school && school.primary_curriculum === 'Both' && formData.curriculum_type)
        submitData.curriculum_type = formData.curriculum_type;

      if (editingYear) {
        const response = await apiRequest(`academic-years/${editingYear.id}`, 'PUT', submitData);
        const updatedYear = response.data || response;
        toast.success('Academic year updated successfully');
        setAcademicYears(prev => prev.map(y => (y.id === editingYear.id ? { ...y, ...updatedYear } : y)));
      } else {
        const response = await apiRequest('academic-years', 'POST', submitData);
        const newYear = response.data || response;
        toast.success('Academic year created successfully');
        if (newYear && newYear.id) setAcademicYears(prev => [...prev, newYear]);
      }
      handleCloseForm();
    } catch (err) {
      console.error('Failed to save academic year:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.year?.[0] ||
        `Failed to ${editingYear ? 'update' : 'create'} academic year`;
      toast.error(errorMessage);
    } finally { setSubmitting(false); }
  };

  // ─── Submit (bulk) ────────────────────────────────────────────────────────

  const handleBulkSubmit = async ({ year, curriculum_type, terms }) => {
    try {
      setSubmitting(true);
      const payload = { year: year.toString(), terms };
      if (school && school.primary_curriculum === 'Both' && curriculum_type)
        payload.curriculum_type = curriculum_type;

      const response = await apiRequest('academic-years/bulk', 'POST', payload);
      const unwrapped = response?.data ?? response;
      const created = Array.isArray(unwrapped?.data) ? unwrapped.data : Array.isArray(unwrapped) ? unwrapped : [];
      const successMsg = unwrapped?.message ?? `${created.length} term${created.length !== 1 ? 's' : ''} created successfully`;
      toast.success(successMsg);
      if (created.length > 0) setAcademicYears(prev => [...prev, ...created]);
      handleCloseForm();
    } catch (err) {
      console.error('Failed to bulk create academic years:', err);
      const existingTerms = err?.response?.data?.existing_terms;
      if (existingTerms && existingTerms.length > 0) {
        toast.error(`Some terms already exist: ${existingTerms.join(', ')}. Please remove them and try again.`);
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create academic years in bulk');
      }
    } finally { setSubmitting(false); }
  };

  // ─── Toggle active ────────────────────────────────────────────────────────

  const handleToggleActive = async term => {
    try {
      const response = await apiRequest(`academic-years/${term.id}`, 'PUT', { is_active: !term.is_active });
      const updatedYear = response.data || response;
      toast.success(`Term ${!term.is_active ? 'activated' : 'deactivated'} successfully`);
      setAcademicYears(prev => prev.map(y => (y.id === term.id ? { ...y, ...updatedYear } : y)));
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      toast.error('Failed to update active status');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = id => {
    const yearToDelete = academicYears.find(y => y.id === id);
    if (yearToDelete) {
      if (mobileSheet.isOpen) closeMobileSheet();
      setDeleteModal({ isOpen: true, yearId: id, yearName: `${yearToDelete.year} — ${yearToDelete.term}` });
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`academic-years/${deleteModal.yearId}`, 'DELETE');
      toast.success('Term deleted successfully');
      setAcademicYears(prev => prev.filter(y => y.id !== deleteModal.yearId));
      setDeleteModal({ isOpen: false, yearId: null, yearName: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete academic year');
    } finally { setLoading(false); }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const getCurriculumBadgeColor = type =>
    type === 'CBC'
      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="text-slate-300 dark:text-slate-500">↕</span>;
    return <span className="text-cyan-500">{sortConfig.direction === 'desc' ? '↓' : '↑'}</span>;
  };

  const shouldShowCurriculumFilter = school && school.primary_curriculum === 'Both';
  const shouldShowCurriculumField  = school && school.primary_curriculum === 'Both';
  const shouldShowCurriculumColumn = shouldShowCurriculumFilter;

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE CONFIRMATION MODAL  (pill-button style, mirrors ClassroomManager)
  // ═══════════════════════════════════════════════════════════════════════════

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
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete Academic Term</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.yearName}"</span>?
                  {' '}This cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Warning:</strong> This will permanently delete all data associated with this term including scheduling information.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, yearId: null, yearName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting…</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete Term</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE BOTTOM SHEET  (exact pattern from StreamManager/ClassroomManager)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.year) return null;
    const term = mobileSheet.year;

    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div
          className={`fixed inset-x-0 bottom-0 z-[60] ${CLS.modalBg} rounded-t-3xl shadow-2xl md:hidden`}
          style={{ transform: `translateY(${dragOffset}px)`, maxHeight: '85vh' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>

          {/* Sheet header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {term.year} — {term.term}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Term Details</p>
                  {term.curriculum_type && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(term.curriculum_type)}`}>
                      {term.curriculum_type}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={closeMobileSheet} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sheet body */}
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 280px)' }}>

            {/* Dates card */}
            <div className={`${CLS.card} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Term Dates</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {term.start_date ? DisplayDate(term.start_date) : <span className="text-slate-400 font-normal">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Date</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {term.end_date ? DisplayDate(term.end_date) : <span className="text-slate-400 font-normal">Not set</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Status card */}
            <div className={`${CLS.card} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                {term.is_active
                  ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Status</h3>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-base font-semibold ${term.is_active ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {term.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => { handleToggleActive(term); closeMobileSheet(); }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    term.is_active
                      ? 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                      : 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                  }`}
                >
                  {term.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Year info card */}
            <div className={`${CLS.card} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Academic Year</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{term.year}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{term.term}</p>
                </div>
                {term.curriculum_type && (
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getCurriculumBadgeColor(term.curriculum_type)}`}>
                    {term.curriculum_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sheet action buttons — mirrors ClassroomManager pattern */}
          <div className={`border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 gap-2 ${CLS.modalBg}`}>
            <button
              onClick={() => { closeMobileSheet(); handleEdit(term.id); }}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => handleDelete(term.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE YEAR CARD  (replaces old card — now tappable like StreamManager)
  // ═══════════════════════════════════════════════════════════════════════════

  const renderMobileYearCard = (group, idx) => {
    return (
      <div key={group.key} className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* Year group header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-black text-slate-900 dark:text-white">{group.year}</span>
            {shouldShowCurriculumColumn && group.curriculum_type && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getCurriculumBadgeColor(group.curriculum_type)}`}>
                {group.curriculum_type}
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {group.terms.length} term{group.terms.length !== 1 ? 's' : ''}
            </span>
            {group.hasActive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block" />
                Active
              </span>
            )}
          </div>
        </div>

        {/* Term rows — each tappable to open bottom sheet */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
          {group.terms.map(term => (
            <button
              key={term.id}
              onClick={() => openMobileSheet(term)}
              className="w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 active:bg-slate-100 dark:active:bg-slate-700/40 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0 mt-1.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{term.term}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                      term.is_active
                        ? 'text-green-700 bg-green-100 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20'
                        : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-700/30 dark:border-slate-600/40 dark:text-slate-400'
                    }`}>
                      {term.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {(term.start_date || term.end_date) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {term.start_date ? DisplayDate(term.start_date) : '—'}
                      {' → '}
                      {term.end_date ? DisplayDate(term.end_date) : '—'}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">

      {/* ── Header — mirrors StreamManager/ClassroomManager exactly ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Academic Year Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage academic years, terms, and curriculum types for your school
          </p>
          {school && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                {school.primary_curriculum === 'Both' ? 'CBC & 8-4-4' : school.primary_curriculum}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {school.primary_curriculum !== 'Both' ? '(Auto-applied to all years)' : '(Select per year)'}
              </span>
            </div>
          )}
        </div>

        {/* Desktop header actions */}
        <div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={handleBulkCreateOpen}
            disabled={!school}
            className="hidden md:flex items-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />Bulk Create
          </button>
          <button
            onClick={handleAddNew}
            disabled={!school}
            className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />New Year
          </button>
          <button
            onClick={fetchAcademicYears}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile header actions — mirrors ClassroomManager */}
      <div className="md:hidden mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleAddNew}
          disabled={!school}
          className="bg-black text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black col-span-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />New Academic Year
        </button>
        <button
          onClick={handleBulkCreateOpen}
          disabled={!school}
          className="bg-slate-700 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-slate-600 col-span-2 disabled:opacity-50"
        >
          <Layers className="w-4 h-4" />Bulk Create
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* ── Filters — matches StreamManager/ClassroomManager panel ── */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">

          {/* Mobile collapsible */}
          <div className="block md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters & Sort</h3>
                <span className="text-xs text-slate-500">
                  ({groupedYears.length} yr{groupedYears.length !== 1 ? 's' : ''} · {filteredYears.length} term{filteredYears.length !== 1 ? 's' : ''})
                </span>
                {(yearFilter !== 'all' || (shouldShowCurriculumFilter && curriculumFilter !== 'all')) && (
                  <span className="px-1.5 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">active</span>
                )}
              </div>
              {showFilters
                ? <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                : <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
            </button>

            {showFilters && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by term or year..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                {shouldShowCurriculumFilter && (
                  <select
                    value={curriculumFilter}
                    onChange={e => setCurriculumFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Curricula</option>
                    <option value="CBC">CBC</option>
                    <option value="8-4-4">8-4-4</option>
                  </select>
                )}
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="flex gap-2">
                  <select
                    value={sortConfig.key}
                    onChange={e => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium whitespace-nowrap"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop filters */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters & Sort</h3>
            </div>
            <div className={`grid gap-3 ${shouldShowCurriculumFilter ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
              <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by term or year..."
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              {shouldShowCurriculumFilter && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Curriculum</label>
                  <select
                    value={curriculumFilter}
                    onChange={e => setCurriculumFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Curricula</option>
                    <option value="CBC">CBC</option>
                    <option value="8-4-4">8-4-4</option>
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Year</label>
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortConfig.key}
                    onChange={e => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium whitespace-nowrap"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>
              <div className="flex items-end col-span-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{groupedYears.length}</span> yr{groupedYears.length !== 1 ? 's' : ''}{' '}
                    · <span className="font-semibold">{filteredYears.length}</span> term{filteredYears.length !== 1 ? 's' : ''}
                  </span>
                  {(yearFilter !== 'all' || (shouldShowCurriculumFilter && curriculumFilter !== 'all')) && (
                    <button
                      onClick={() => { setYearFilter('all'); if (shouldShowCurriculumFilter) setCurriculumFilter('all'); }}
                      className="ml-auto text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Loading Academic Years...</p>
        </div>
      )}

      {/* ── Academic Years section ── */}
      {!loading && (
        <>
          {/* Desktop table — matches StreamManager/ClassroomManager */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
              Academic Years
            </h2>
            {groupedYears.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="border rounded-lg border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="w-10 px-4 py-3 md:px-6 md:py-4" />
                        <th
                          className="px-4 py-3 md:px-6 md:py-4 font-medium cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                          onClick={() => handleSort('term')}
                        >
                          <div className="flex items-center gap-1">Term <SortIcon column="term" /></div>
                        </th>
                        {shouldShowCurriculumColumn && (
                          <th
                            className="px-4 py-3 md:px-6 md:py-4 font-medium cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                            onClick={() => handleSort('curriculum_type')}
                          >
                            <div className="flex items-center gap-1">Curriculum <SortIcon column="curriculum_type" /></div>
                          </th>
                        )}
                        <th
                          className="px-4 py-3 md:px-6 md:py-4 font-medium cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                          onClick={() => handleSort('start_date')}
                        >
                          <div className="flex items-center gap-1">Start Date <SortIcon column="start_date" /></div>
                        </th>
                        <th
                          className="px-4 py-3 md:px-6 md:py-4 font-medium cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors hidden xl:table-cell"
                          onClick={() => handleSort('end_date')}
                        >
                          <div className="flex items-center gap-1">End Date <SortIcon column="end_date" /></div>
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Status</th>
                        <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {groupedYears.map((group, idx) => (
                        <GroupedYearRow
                          key={group.key}
                          group={group}
                          showCurriculumColumn={shouldShowCurriculumColumn}
                          getCurriculumBadgeColor={getCurriculumBadgeColor}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={handleToggleActive}
                          defaultOpen={idx === 0}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {academicYears.length === 0
                    ? 'No academic years found. Create one to get started.'
                    : 'No academic years match current filters.'}
                </p>
                {academicYears.length === 0 && (
                  <button
                    onClick={handleAddNew}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
                  >
                    <Plus className="w-4 h-4" />Create Academic Year
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile cards — tappable rows, bottom sheet on tap */}
          <div className="md:hidden space-y-3">
            {groupedYears.length > 0 ? (
              groupedYears.map((group, idx) => renderMobileYearCard(group, idx))
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {academicYears.length === 0
                    ? 'No academic years found. Create one to get started.'
                    : 'No academic years match current filters.'}
                </p>
                {academicYears.length === 0 && (
                  <button
                    onClick={handleAddNew}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
                  >
                    <Plus className="w-4 h-4" />Create Academic Year
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Form modal */}
      {showForm && school && (
        <AcademicYearForm
          formData={formData}
          editingYear={editingYear}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          isSubmitting={submitting}
          schoolPrimaryCurriculum={school.primary_curriculum}
          showCurriculumField={shouldShowCurriculumField}
          onBulkSubmit={handleBulkSubmit}
          initialMode={formInitialMode}
        />
      )}

      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
    </div>
  );
}

export default AcademicYearSetup;
// AcademicYearSetup.jsx — Grouped year view + full audit fixes
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

} from 'lucide-react';
import DisplayDate from '../../../utils/DisplayDate';
import { toast } from 'react-toastify';

// ─── Row Action Dropdown ──────────────────────────────────────────────────────
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
        <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-slate-800/95 backdrop-blur-sm border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xl dark:shadow-2xl py-1.5">
          <button
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-amber-400" />
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
/**
 * Groups a flat array of academic year term records by (year, curriculum_type).
 * Returns an array of group objects sorted by year descending:
 * [
 *   {
 *     key: '2026-CBC',
 *     year: '2026',
 *     curriculum_type: 'CBC',
 *     terms: [ { id, term, start_date, end_date, is_active, ... }, ... ],
 *     hasActive: true,
 *   },
 *   ...
 * ]
 */
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

  // Sort terms within each group by term name
  for (const group of map.values()) {
    group.terms.sort((a, b) => {
      const an = a.term?.toLowerCase() ?? '';
      const bn = b.term?.toLowerCase() ?? '';
      return an < bn ? -1 : an > bn ? 1 : 0;
    });
  }

  // Sort groups by year desc, then curriculum asc
  return Array.from(map.values()).sort((a, b) => {
    const yearDiff = parseInt(b.year) - parseInt(a.year);
    if (yearDiff !== 0) return yearDiff;
    return (a.curriculum_type ?? '').localeCompare(b.curriculum_type ?? '');
  });
}

// ─── Grouped Year Row — clean table approach ─────────────────────────────────
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
      {/* ── Year header row ── */}
      <tr
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer select-none group bg-slate-50 dark:bg-slate-700/25 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors"
      >
        <td
          colSpan={showCurriculumColumn ? 7 : 6}
          className="px-4 py-3 md:px-6 border-t border-slate-200 dark:border-slate-700/40"
        >
          <div className="flex items-center gap-3">
            {/* Chevron */}
            <span
              className="flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200"
              style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <ChevronDown className="w-4 h-4" />
            </span>

            {/* Year number */}
            <span className="text-sm font-bold text-slate-900 dark:text-white w-10 flex-shrink-0">{group.year}</span>

            {/* Curriculum badge */}
            {showCurriculumColumn && (
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${getCurriculumBadgeColor(group.curriculum_type)}`}>
                {group.curriculum_type}
              </span>
            )}

            {/* Term count */}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {group.terms.length} term{group.terms.length !== 1 ? 's' : ''}
            </span>

            {/* Active indicator */}
            {group.hasActive && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                Active
              </span>
            )}

            {/* Collapsed: show term name pills inline */}
            {!open && (
              <div className="flex items-center gap-1.5 ml-1">
                {group.terms.map(t => (
                  <span
                    key={t.id}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                      t.is_active
                        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                        : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-700/60'
                    }`}
                  >
                    {t.term}
                  </span>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* ── Term rows ── */}
      {open && group.terms.map((term, idx) => (
        <tr
          key={term.id}
          className="hover:bg-slate-50 dark:hover:bg-slate-700/10 transition-colors duration-100"
        >
          {/* Indent + connector */}
          <td className="pl-8 md:pl-10 pr-2 py-3 w-10">
            <div className="flex items-center justify-end h-full">
              <div className="w-px h-full min-h-[20px] bg-slate-300 dark:bg-slate-700/50 mr-0" />
            </div>
          </td>

          {/* Term name */}
          <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
              {term.term}
            </div>
          </td>

          {/* Curriculum — dash since shown on header */}
          {showCurriculumColumn && (
            <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-600">—</td>
          )}

          {/* Start date */}
          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
            {term.start_date ? DisplayDate(term.start_date) : <span className="text-slate-400 dark:text-slate-700">—</span>}
          </td>

          {/* End date */}
          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 hidden xl:table-cell">
            {term.end_date ? DisplayDate(term.end_date) : <span className="text-slate-400 dark:text-slate-700">—</span>}
          </td>

          {/* Status toggle */}
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

          {/* Actions */}
          <td className="px-4 py-3 text-right">
            <RowActionsMenu
              onEdit={() => onEdit(term.id)}
              onDelete={() => onDelete(term.id)}
            />
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

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    yearId: null,
    yearName: '',
  });

  // Mobile bottom sheet state
  const [mobileSheet, setMobileSheet] = useState({ isOpen: false, year: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Single-term form state
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    term: '',
    start_date: '',
    end_date: '',
    curriculum_type: '',
    is_active: false,
  });

  // ─── Data fetching ──────────────────────────────────────────────────────────

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
      // Visually mark terms from past years as inactive regardless of DB value
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

  useEffect(() => {
    fetchSchoolInfo();
  }, [fetchSchoolInfo]);

  useEffect(() => {
    if (school) fetchAcademicYears();
  }, [school, fetchAcademicYears]);

  // ─── Filtering / sorting ────────────────────────────────────────────────────

  const applyFilters = useCallback(() => {
    let filtered = [...academicYears];

    // Only filter by curriculum when school supports both curricula
    if (school && school.primary_curriculum === 'Both' && curriculumFilter !== 'all') {
      filtered = filtered.filter(y => y.curriculum_type === curriculumFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(y => y.year.toString() === yearFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        y =>
          y.term?.toLowerCase().includes(q) ||
          y.year.toString().includes(q)
      );
    }

    // Sort the flat list before grouping so within-group order can respect sortConfig
    filtered.sort((a, b) => {
      let aVal = String(a[sortConfig.key] ?? '').toLowerCase();
      let bVal = String(b[sortConfig.key] ?? '').toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredYears(filtered);
  }, [academicYears, yearFilter, searchTerm, sortConfig, curriculumFilter, school]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getUniqueYears = () => {
    const years = [...new Set(academicYears.map(y => y.year.toString()))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  };

  // Grouped view derived from filtered flat list
  const groupedYears = groupAcademicYears(filteredYears);

  // ─── Sort helpers ───────────────────────────────────────────────────────────

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleSortKeyChange = e => {
    setSortConfig(prev => ({ ...prev, key: e.target.value }));
  };

  // ─── Mobile bottom sheet ────────────────────────────────────────────────────

  const handleTouchStart = e => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };
  const handleTouchMove = e => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY;
    if (delta > 0) setDragOffset(delta);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 100) closeMobileSheet();
    setDragOffset(0);
  };
  const openMobileSheet = year => {
    setMobileSheet({ isOpen: true, year });
    document.body.style.overflow = 'hidden';
  };
  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, year: null });
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  // ─── Form helpers ───────────────────────────────────────────────────────────

  const getDefaultFormData = () => {
    const curriculumType =
      school && school.primary_curriculum !== 'Both' ? school.primary_curriculum : '';
    return {
      year: new Date().getFullYear().toString(),
      term: '',
      start_date: '',
      end_date: '',
      curriculum_type: curriculumType,
      is_active: false,
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
      term: '',
      start_date: '',
      end_date: '',
      curriculum_type: '',
      is_active: false,
    });
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ─── Single-term submit ─────────────────────────────────────────────────────

  const handleSubmit = async e => {
    e.preventDefault();

    if (school && school.primary_curriculum === 'Both' && !formData.curriculum_type) {
      toast.error('Please select a curriculum type');
      return;
    }
    if (!formData.year || !formData.term) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = {
        year: formData.year.toString(),
        term: formData.term,
        is_active: formData.is_active,
      };

      if (formData.start_date) submitData.start_date = formData.start_date;
      if (formData.end_date) submitData.end_date = formData.end_date;

      // Only send curriculum_type when school has both — backend enforces this
      if (school && school.primary_curriculum === 'Both' && formData.curriculum_type) {
        submitData.curriculum_type = formData.curriculum_type;
      }

      if (editingYear) {
        const response = await apiRequest(`academic-years/${editingYear.id}`, 'PUT', submitData);
        const updatedYear = response.data || response;
        toast.success('Academic year updated successfully');
        // Optimistic update in local state
        setAcademicYears(prev =>
          prev.map(y => (y.id === editingYear.id ? { ...y, ...updatedYear } : y))
        );
      } else {
        const response = await apiRequest('academic-years', 'POST', submitData);
        const newYear = response.data || response;
        toast.success('Academic year created successfully');
        if (newYear && newYear.id) {
          setAcademicYears(prev => [...prev, newYear]);
        }
      }

      handleCloseForm();
    } catch (err) {
      console.error('Failed to save academic year:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.year?.[0] ||
        `Failed to ${editingYear ? 'update' : 'create'} academic year`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Bulk submit ────────────────────────────────────────────────────────────

  const handleBulkSubmit = async ({ year, curriculum_type, terms }) => {
    try {
      setSubmitting(true);

      const payload = {
        year: year.toString(),
        terms,
      };

      // Only include curriculum_type for 'Both' curriculum schools — backend requires it then
      if (school && school.primary_curriculum === 'Both' && curriculum_type) {
        payload.curriculum_type = curriculum_type;
      }

      const response = await apiRequest('academic-years/bulk', 'POST', payload);

      // apiRequest may return the raw axios response OR already-unwrapped data.
      // Backend shape: { message: "N term(s) created successfully.", data: [...records] }
      const unwrapped = response?.data ?? response;
      const created = Array.isArray(unwrapped?.data)
        ? unwrapped.data
        : Array.isArray(unwrapped)
          ? unwrapped
          : [];
      const successMsg = unwrapped?.message
        ?? `${created.length} term${created.length !== 1 ? 's' : ''} created successfully`;

      toast.success(successMsg);

      if (created.length > 0) {
        setAcademicYears(prev => [...prev, ...created]);
      }

      handleCloseForm();
    } catch (err) {
      console.error('Failed to bulk create academic years:', err);

      const existingTerms = err?.response?.data?.existing_terms;
      if (existingTerms && existingTerms.length > 0) {
        toast.error(
          `Some terms already exist: ${existingTerms.join(', ')}. Please remove them and try again.`
        );
      } else {
        const errorMessage =
          err?.response?.data?.message || 'Failed to create academic years in bulk';
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle active ──────────────────────────────────────────────────────────

  const handleToggleActive = async term => {
    try {
      const response = await apiRequest(`academic-years/${term.id}`, 'PUT', {
        is_active: !term.is_active,
      });
      const updatedYear = response.data || response;
      toast.success(`Term ${!term.is_active ? 'activated' : 'deactivated'} successfully`);
      setAcademicYears(prev =>
        prev.map(y => (y.id === term.id ? { ...y, ...updatedYear } : y))
      );
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      toast.error('Failed to update active status');
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = id => {
    const yearToDelete = academicYears.find(y => y.id === id);
    if (yearToDelete) {
      if (mobileSheet.isOpen) closeMobileSheet();
      setDeleteModal({
        isOpen: true,
        yearId: id,
        yearName: `${yearToDelete.year} — ${yearToDelete.term}`,
      });
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`academic-years/${deleteModal.yearId}`, 'DELETE');
      toast.success('Term deleted successfully');
      // Optimistic removal — avoids a full re-fetch
      setAcademicYears(prev => prev.filter(y => y.id !== deleteModal.yearId));
      setDeleteModal({ isOpen: false, yearId: null, yearName: '' });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to delete academic year';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ─── UI helpers ─────────────────────────────────────────────────────────────

  const getCurriculumBadgeColor = type =>
    type === 'CBC'
      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column)
      return <span className="text-slate-300 dark:text-slate-500">↕</span>;
    return (
      <span className="text-cyan-500">
        {sortConfig.direction === 'desc' ? '↓' : '↑'}
      </span>
    );
  };

  const shouldShowCurriculumFilter = school && school.primary_curriculum === 'Both';
  const shouldShowCurriculumField = school && school.primary_curriculum === 'Both';
  const shouldShowCurriculumColumn = shouldShowCurriculumFilter;

  // ─── Delete confirmation modal ──────────────────────────────────────────────

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
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                  Delete Academic Term
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    "{deleteModal.yearName}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 pt-4">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-300">
                  <strong>Warning:</strong> This will permanently delete all data associated with
                  this term including scheduling information.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <button
              onClick={() => setDeleteModal({ isOpen: false, yearId: null, yearName: '' })}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all disabled:opacity-50"
            >
              Keep Term
            </button>
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Term
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Mobile bottom sheet ────────────────────────────────────────────────────

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.year) return null;
    const term = mobileSheet.year;

    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-2xl md:hidden transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${dragOffset}px)`, maxHeight: '85vh' }}
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
                  {term.year} — {term.term}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Term Details</p>
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
                <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Academic Year Information</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{term.year}</span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getCurriculumBadgeColor(term.curriculum_type)}`}>
                    {term.curriculum_type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">{term.term}</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Term Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{DisplayDate(term.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Date</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">{DisplayDate(term.end_date)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                {term.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                )}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Status</h3>
              </div>
              {term.is_active ? (
                <span className="text-base font-medium text-green-600 dark:text-green-400">Active</span>
              ) : (
                <span className="text-base font-medium text-slate-500 dark:text-slate-400">Inactive</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => { closeMobileSheet(); handleEdit(term.id); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Term
            </button>
            <button
              onClick={() => { closeMobileSheet(); handleToggleActive(term); }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl active:scale-[0.98] transition-all ${
                term.is_active
                  ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                  : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              {term.is_active ? (
                <><XCircle className="w-4 h-4" />Deactivate</>
              ) : (
                <><CheckCircle className="w-4 h-4" />Activate</>
              )}
            </button>
            <button
              onClick={() => handleDelete(term.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Term
            </button>
          </div>
        </div>
      </>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Academic Year Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage academic years, terms, and curriculum types for your school.
          </p>
          {school && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">School Curriculum:</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  school.primary_curriculum === 'Both'
                    ? 'bg-gradient-to-r from-cyan-100 to-purple-100 text-slate-800 dark:from-cyan-900/30 dark:to-purple-900/30 dark:text-slate-300'
                    : getCurriculumBadgeColor(school.primary_curriculum)
                }`}
              >
                {school.primary_curriculum}
              </span>
              {school.primary_curriculum !== 'Both' ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">(Auto-applied to all years)</span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">(Select curriculum when creating years)</span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={fetchAcademicYears}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleBulkCreateOpen}
            disabled={!school}
            className="bg-slate-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-600 dark:hover:bg-slate-500 text-sm flex items-center gap-1.5"
            title={!school ? 'Loading school information...' : 'Create multiple terms at once'}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Create</span>
          </button>

          <button
            onClick={handleAddNew}
            disabled={!school}
            className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap"
            title={!school ? 'Loading school information...' : 'Create new academic year'}
          >
            <Plus className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            New Year
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Filters Panel ── */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">

          {/* Mobile collapsible */}
          <div className="block md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters & Sort</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({filteredYears.length}/{academicYears.length})
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-full">
                  <ArrowUpDown className="w-3 h-3" />
                  {SORT_OPTIONS.find(o => o.value === sortConfig.key)?.label}
                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                </span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              )}
            </button>

            {showFilters && (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by term or year..."
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className={`grid ${shouldShowCurriculumFilter ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  {shouldShowCurriculumFilter && (
                    <div className="flex flex-col gap-1.5">
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Year</label>
                    <select
                      value={yearFilter}
                      onChange={e => setYearFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">All Years</option>
                      {getUniqueYears().map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      value={sortConfig.key}
                      onChange={handleSortKeyChange}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setSortConfig(prev => ({
                          ...prev,
                          direction: prev.direction === 'asc' ? 'desc' : 'asc',
                        }))
                      }
                      className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium whitespace-nowrap"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop filters */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Filters & Sort</h3>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-full">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sorted by: <strong>{SORT_OPTIONS.find(o => o.value === sortConfig.key)?.label}</strong>
                &nbsp;{sortConfig.direction === 'asc' ? '(A → Z)' : '(Z → A)'}
              </span>
            </div>

            <div
              className={`grid gap-3 sm:gap-4 ${
                shouldShowCurriculumFilter
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {/* Search */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by term or year..."
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Curriculum (only for Both schools) */}
              {shouldShowCurriculumFilter && (
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Curriculum</label>
                  <select
                    value={curriculumFilter}
                    onChange={e => setCurriculumFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Curricula</option>
                    <option value="CBC">CBC</option>
                    <option value="8-4-4">8-4-4</option>
                  </select>
                </div>
              )}

              {/* Year */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={sortConfig.key}
                    onChange={handleSortKeyChange}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setSortConfig(prev => ({
                        ...prev,
                        direction: prev.direction === 'asc' ? 'desc' : 'asc',
                      }))
                    }
                    title={`Currently ${sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'} — click to toggle`}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors font-medium whitespace-nowrap"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortConfig.direction === 'asc' ? 'Asc' : 'Desc'}
                  </button>
                </div>
              </div>

              {/* Count */}
              <div className="flex items-end">
                <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{groupedYears.length}</span> year{groupedYears.length !== 1 ? 's' : ''}{' '}
                    (<span className="font-semibold">{filteredYears.length}</span> term{filteredYears.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading academic years...</p>
        </div>
      )}

      {/* ── Academic Years Table ── */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden mb-4 md:mb-6">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60">
            <h2 className="text-base font-bold text-[#0d141b] dark:text-white">
              Academic Years
            </h2>
            {groupedYears.length > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                {groupedYears.length} year{groupedYears.length !== 1 ? 's' : ''} &middot; {filteredYears.length} term{filteredYears.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {groupedYears.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/40 bg-slate-100 dark:bg-slate-800/60">
                    {/* indent spacer */}
                    <th className="w-10 px-4 py-3" />
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
                      onClick={() => handleSort('term')}
                    >
                      <div className="flex items-center gap-1">Term <SortIcon column="term" /></div>
                    </th>
                    {shouldShowCurriculumColumn && (
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none"
                        onClick={() => handleSort('curriculum_type')}
                      >
                        <div className="flex items-center gap-1">Curriculum <SortIcon column="curriculum_type" /></div>
                      </th>
                    )}
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none hidden lg:table-cell"
                      onClick={() => handleSort('start_date')}
                    >
                      <div className="flex items-center gap-1">Start Date <SortIcon column="start_date" /></div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors select-none hidden xl:table-cell"
                      onClick={() => handleSort('end_date')}
                    >
                      <div className="flex items-center gap-1">End Date <SortIcon column="end_date" /></div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
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
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-700/40 border border-slate-700/60 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-400 mb-1">
                {academicYears.length === 0 ? 'No academic years yet' : 'No results match your filters'}
              </p>
              <p className="text-xs text-slate-600">
                {academicYears.length === 0
                  ? 'Create your first academic year to get started.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {academicYears.length === 0 && (
                <button
                  onClick={handleAddNew}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-sm font-medium text-slate-200 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Academic Year
                </button>
              )}
            </div>
          )}
        </div>
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
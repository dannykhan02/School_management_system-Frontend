// src/Dashboard/Pages/Admin/CreateUser.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  User, Mail, Phone, Save, Plus, X, Edit, Trash2, Loader,
  AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, RefreshCw, Users, MoreHorizontal, ChevronRight as ChevronRightIcon,
  MapPin, Filter
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';

const PER_PAGE_OPTIONS = [10, 20, 50, 100];

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN CONTRACT — exact copy of StreamManager's CLS object
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
// COLOR HELPERS — mirrored from SchoolProfile / SubjectManager
// ─────────────────────────────────────────────────────────────────────────────
const getRoleBadgeColor = (roleName = '') => {
  const n = roleName.toLowerCase();
  if (n.includes('super'))   return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/10 dark:text-cyan-300';
  if (n.includes('admin'))   return 'bg-amber-100 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300';
  if (n.includes('teacher')) return 'bg-pink-100 text-pink-800 dark:bg-pink-900/10 dark:text-pink-300';
  if (n.includes('student')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/10 dark:text-orange-300';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
};

// Gender pill — mirrors StreamLevelBadge border-pill style from StreamManager
const GenderBadge = ({ gender }) => {
  if (!gender) return <span className="text-slate-400 dark:text-slate-500 text-xs italic">N/A</span>;
  const isMale = gender.toLowerCase() === 'male';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border capitalize
      ${isMale
        ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800'
        : 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
      }`}
    >
      {gender}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROW ACTIONS DROPDOWN — exact copy of StreamManager's RowActionsMenu
// ─────────────────────────────────────────────────────────────────────────────
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
        <div className="absolute right-0 top-8 z-50 w-44 bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl shadow-2xl py-1.5">
          <button
            onClick={() => handle(onEdit)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-amber-400" />Edit User
          </button>
          <div className="my-1 border-t border-slate-700/60" />
          <button
            onClick={() => handle(onDelete)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4" />Delete User
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBOUNCE HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function CreateUser() {
  const { user: authUser, loading: authLoading } = useAuth();

  // ── data ──────────────────────────────────────────────────────────────────
  const [roles, setRoles]   = useState([]);
  const [users, setUsers]   = useState([]);
  const [meta,  setMeta]    = useState({
    total: 0, per_page: 20, current_page: 1, last_page: 1, from: 0, to: 0,
  });

  // ── filters ───────────────────────────────────────────────────────────────
  const [searchInput,  setSearchInput]  = useState('');
  const [filterRoleId, setFilterRoleId] = useState('');
  const [perPage,      setPerPage]      = useState(20);
  const [currentPage,  setCurrentPage]  = useState(1);
  const debouncedSearch = useDebounce(searchInput, 450);

  // ── UI state — mirrors StreamManager flags exactly ─────────────────────
  const [initializing, setInitializing] = useState(true);   // full-page spinner on first load
  const [loading,      setLoading]      = useState(false);   // subsequent ops
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);   // mobile filter toggle

  const [view,         setView]         = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModal,  setDeleteModal]  = useState({ isOpen: false, userId: null, userName: '' });

  // Mobile bottom sheet state — identical to StreamManager's mobileSheet
  const [mobileSheet,  setMobileSheet]  = useState({ isOpen: false, user: null });
  const [isDragging,   setIsDragging]   = useState(false);
  const [dragStartY,   setDragStartY]   = useState(0);
  const [dragOffset,   setDragOffset]   = useState(0);

  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', role_id: '', gender: '',
  });

  // ── fetch roles once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const res  = await apiRequest('roles', 'GET');
        const data = res?.data || res || [];
        setRoles(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load roles.');
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, [authLoading]);

  // ── fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (opts = {}) => {
    const page   = opts.page    ?? currentPage;
    const pp     = opts.perPage ?? perPage;
    const roleId = opts.roleId  !== undefined ? opts.roleId  : filterRoleId;
    const search = opts.search  !== undefined ? opts.search  : debouncedSearch;

    // First load uses initializing, subsequent use loading
    if (opts.initialLoad) setInitializing(true);
    else                  setLoading(true);

    try {
      const params = new URLSearchParams({ page, per_page: pp });
      if (roleId) params.append('role_id', roleId);
      if (search) params.append('search',  search);

      const res = await apiRequest(`users?${params.toString()}`, 'GET');
      if (res?.data && res?.total !== undefined) {
        setUsers(res.data);
        setMeta({
          total:        res.total,
          per_page:     res.per_page,
          current_page: res.current_page,
          last_page:    res.last_page,
          from:         res.from ?? 0,
          to:           res.to   ?? 0,
        });
      } else {
        const list = res?.data || res || [];
        setUsers(Array.isArray(list) ? list : []);
        setMeta(m => ({ ...m, total: list.length, last_page: 1 }));
      }
    } catch {
      toast.error('Failed to load users.');
      setUsers([]);
    } finally {
      if (opts.initialLoad) setInitializing(false);
      else                  setLoading(false);
    }
  }, [currentPage, perPage, filterRoleId, debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!authLoading) fetchUsers({ initialLoad: true });
  }, [authLoading]);

  // Subsequent filter/page changes
  useEffect(() => {
    if (!authLoading && !initializing) fetchUsers();
  }, [debouncedSearch, filterRoleId, currentPage, perPage]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterRoleId]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const getRoleName    = (roleId) => roles.find(r => r.id === roleId)?.name ?? 'Unknown Role';

  const handleChange   = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetForm      = () => setFormData({ full_name: '', email: '', phone: '', role_id: '', gender: '' });
  const backToList     = () => { resetForm(); setSelectedUser(null); setView('list'); };

  const showCreateForm = () => { resetForm(); setSelectedUser(null); setView('create'); };
  const showEditForm   = (u) => {
    setSelectedUser(u);
    setFormData({ full_name: u.full_name, email: u.email, phone: u.phone || '', role_id: u.role_id, gender: u.gender || '' });
    setView('edit');
  };

  // Mobile sheet — exact mirror of StreamManager openMobileSheet / closeMobileSheet
  const openMobileSheet  = (u) => { setMobileSheet({ isOpen: true, user: u }); document.body.style.overflow = 'hidden'; };
  const closeMobileSheet = () => { setMobileSheet({ isOpen: false, user: null }); document.body.style.overflow = ''; setDragOffset(0); };

  const handleTouchStart = (e) => { setIsDragging(true); setDragStartY(e.touches[0].clientY); };
  const handleTouchMove  = (e) => { if (!isDragging) return; const d = e.touches[0].clientY - dragStartY; if (d > 0) setDragOffset(d); };
  const handleTouchEnd   = () => { setIsDragging(false); if (dragOffset > 100) closeMobileSheet(); setDragOffset(0); };

  const openDeleteModal  = (u) => {
    if (mobileSheet.isOpen) closeMobileSheet();
    setDeleteModal({ isOpen: true, userId: u.id, userName: u.full_name });
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email:     formData.email.trim(),
        phone:     formData.phone.trim() || null,
        role_id:   parseInt(formData.role_id, 10),
        gender:    formData.gender || null,
      };
      if (view === 'edit') {
        await apiRequest(`users/${selectedUser.id}`, 'PUT', payload);
        toast.success('User updated successfully');
      } else {
        await apiRequest('users', 'POST', payload);
        toast.success('User created successfully');
      }
      backToList();
      fetchUsers({ page: view === 'create' ? meta.last_page : currentPage });
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        Object.keys(validationErrors).forEach(key => {
          const msg = Array.isArray(validationErrors[key]) ? validationErrors[key].join(', ') : validationErrors[key];
          toast.error(`${key}: ${msg}`);
        });
      } else {
        toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} user: ${err?.response?.data?.message || 'An error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`users/${deleteModal.userId}`, 'DELETE');
      toast.success(`${deleteModal.userName} deleted successfully`);
      setDeleteModal({ isOpen: false, userId: null, userName: '' });
      const newPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchUsers({ page: newPage });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINATION — mirrors StreamManager's numbered page buttons
  // ═══════════════════════════════════════════════════════════════════════════
  const renderPagination = () => {
    const { total, per_page, current_page, last_page, from, to } = meta;
    if (total === 0) return null;

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
            <strong className="text-[#0d141b] dark:text-white">{total.toLocaleString()}</strong> users
          </span>
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline text-xs">Rows:</span>
            <select
              value={per_page}
              onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="h-8 px-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentPage(1)}           disabled={current_page === 1}           className={btnGhost}><ChevronsLeft  className="w-4 h-4" /></button>
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={current_page === 1}           className={btnGhost}><ChevronLeft   className="w-4 h-4" /></button>
          {start > 1       && <span className="px-1 text-[#4c739a] text-sm">…</span>}
          {pages.map(p => <button key={p} onClick={() => setCurrentPage(p)} className={p === current_page ? btnActive : btnInactive}>{p}</button>)}
          {end < last_page && <span className="px-1 text-[#4c739a] text-sm">…</span>}
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={current_page === last_page} className={btnGhost}><ChevronRight  className="w-4 h-4" /></button>
          <button onClick={() => setCurrentPage(last_page)}  disabled={current_page === last_page} className={btnGhost}><ChevronsRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETE MODAL — exact structure from StreamManager's renderDeleteConfirmationModal
  // ═══════════════════════════════════════════════════════════════════════════
  const renderDeleteModal = () => {
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
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delete User</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.userName}"</span>?
                  {' '}This cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 sm:px-6 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <strong>Warning:</strong> This will permanently delete the user and all associated data.
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
              disabled={loading}
              className={CLS.cancelPill}
            >
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={loading} className={CLS.deletePill}>
              {loading
                ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Deleting…</>
                : <><Trash2 className="w-3.5 h-3.5" />Delete User</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE / EDIT FORM — exact structure from StreamManager's renderFormView
  // ═══════════════════════════════════════════════════════════════════════════
  const renderFormView = () => {
    const isEdit = view === 'edit';
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className={`${CLS.modalBg} rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700`}>

          {/* Header — cyan for create, amber for edit (same as StreamManager) */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isEdit ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-cyan-50 dark:bg-cyan-900/30'}`}>
                {isEdit
                  ? <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  : <Plus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit User' : 'New User'}
              </h3>
            </div>
            <button
              onClick={backToList}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" name="full_name" value={formData.full_name}
                onChange={handleChange} placeholder="e.g., Jane Doe" required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c739a]" />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="e.g., jane@school.edu" required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4c739a]" />
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="e.g., (123) 456-7890"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender" value={formData.gender} onChange={handleChange} required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role_id" value={formData.role_id} onChange={handleChange} required
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none"
              >
                <option value="">Select a role</option>
                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={backToList} className={`px-4 py-2.5 rounded-xl text-sm ${CLS.secondary}`}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={`px-4 py-2.5 rounded-xl text-sm min-w-[90px] shadow-sm ${CLS.primary}`}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Loader className="w-4 h-4 animate-spin" />Saving…</span>
                  : isEdit ? 'Update' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE BOTTOM SHEET — exact structure from StreamManager's renderMobileBottomSheet
  // ═══════════════════════════════════════════════════════════════════════════
  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.user) return null;
    const u = mobileSheet.user;
    const roleName = u.role ? u.role.name : getRoleName(u.role_id);

    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={closeMobileSheet} />
        <div
          className={`fixed inset-x-0 bottom-0 z-[60] ${CLS.modalBg} rounded-t-3xl shadow-2xl md:hidden`}
          style={{ transform: `translateY(${dragOffset}px)`, maxHeight: '85vh' }}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Initials avatar — cyan, same as SuperAdminContactCard */}
                <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-sm font-bold text-cyan-700 dark:text-cyan-300 flex-shrink-0">
                  {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">{u.full_name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{u.email}</p>
                </div>
              </div>
              <button onClick={closeMobileSheet} className="p-2 text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Detail cards */}
          <div className="overflow-y-auto px-6 py-4 space-y-4" style={{ maxHeight: 'calc(85vh - 280px)' }}>
            <div className={`${CLS.card} rounded-xl p-4`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Role</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(roleName)}`}>{roleName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Gender</span>
                  <GenderBadge gender={u.gender} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Phone</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{u.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons — 2-col grid, same as StreamManager sheet footer */}
          <div className={`border-t border-slate-200 dark:border-slate-700 p-4 grid grid-cols-2 gap-2 ${CLS.modalBg}`}>
            <button
              onClick={() => { closeMobileSheet(); showEditForm(u); }}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />Edit
            </button>
            <button
              onClick={() => openDeleteModal(u)}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />Delete
            </button>
          </div>
        </div>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST VIEW — mirrors StreamManager's renderListView structure exactly
  // ═══════════════════════════════════════════════════════════════════════════
  const renderListView = () => (
    <>
      {/* ── Page header — same layout as StreamManager ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            User Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage users, roles and permissions in your school
          </p>
          {meta.total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                {meta.total.toLocaleString()} Users
              </span>
            </div>
          )}
        </div>

        {/* Desktop buttons — mirrors StreamManager */}
        <div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap justify-end">
          <button
            onClick={showCreateForm}
            className="hidden md:flex items-center gap-2 bg-black text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />New User
          </button>
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="bg-black text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 text-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile action buttons — full-width, same as StreamManager */}
      <div className="md:hidden mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={showCreateForm}
          className="bg-black text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm dark:bg-white dark:text-black col-span-2"
        >
          <Plus className="w-4 h-4" />New User
        </button>
      </div>

      {/* ── Filters — StreamManager's filter card structure exactly ── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-4 md:mb-6">

        {/* Mobile: collapsible */}
        <div className="block md:hidden">
          <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h3>
              <span className="text-xs text-slate-500">({meta.total} users)</span>
              {filterRoleId && (
                <span className="px-1.5 py-0.5 text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full">1 active</span>
              )}
            </div>
            {showFilters
              ? <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              : <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>}
          </button>
          {showFilters && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <select
                value={filterRoleId} onChange={e => setFilterRoleId(e.target.value)} disabled={rolesLoading}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              >
                <option value="">All Roles</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Desktop: always visible */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search by name or email…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select
                value={filterRoleId} onChange={e => setFilterRoleId(e.target.value)} disabled={rolesLoading}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              >
                <option value="">All Roles</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex items-end col-span-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold">{meta.from}–{meta.to}</span> of <span className="font-semibold">{meta.total.toLocaleString()}</span>
                </span>
                {(searchInput || filterRoleId) && (
                  <button onClick={() => { setSearchInput(''); setFilterRoleId(''); }} className="ml-auto text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Clear</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP TABLE — matches StreamManager's table card exactly ── */}
      <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
          All Users
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">

            {/* Pagination top */}
            {renderPagination()}

            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Name</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Email</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium">Role</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium hidden lg:table-cell">Gender</th>
                  <th className="px-4 py-3 md:px-6 md:py-4 font-medium text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin text-cyan-500 dark:text-cyan-400" />
                        <span className="text-slate-500 dark:text-slate-400">Loading users…</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map(u => {
                    const roleName = u.role ? u.role.name : getRoleName(u.role_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">

                        {/* Name + initials avatar — cyan, mirrors StreamManager's teacher initials */}
                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xs font-bold text-cyan-700 dark:text-cyan-300 flex-shrink-0">
                              {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{u.full_name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">{u.email}</td>

                        <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                          {u.phone || 'N/A'}
                        </td>

                        <td className="px-4 py-3 md:px-6 md:py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(roleName)}`}>
                            {roleName}
                          </span>
                        </td>

                        <td className="px-4 py-3 md:px-6 md:py-4 hidden lg:table-cell">
                          <GenderBadge gender={u.gender} />
                        </td>

                        {/* Three-dot menu — RowActionsMenu, identical to StreamManager */}
                        <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                          <RowActionsMenu
                            onEdit={() => showEditForm(u)}
                            onDelete={() => openDeleteModal(u)}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      {users.length === 0 && !searchInput && !filterRoleId
                        ? 'No users found. Create one to get started.'
                        : 'No users match current filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MOBILE CARDS — tap-to-open bottom sheet, same as StreamManager ── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-8 flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-cyan-500 dark:text-cyan-400" />
          </div>
        ) : users.length > 0 ? (
          users.map(u => {
            const roleName = u.role ? u.role.name : getRoleName(u.role_id);
            return (
              <button
                key={u.id}
                onClick={() => openMobileSheet(u)}
                className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-sm font-bold text-cyan-700 dark:text-cyan-300 flex-shrink-0">
                      {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{u.full_name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{u.email}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(roleName)}`}>{roleName}</span>
                  <GenderBadge gender={u.gender} />
                  {u.phone && <span className="text-xs text-slate-500 dark:text-slate-400">{u.phone}</span>}
                </div>
              </button>
            );
          })
        ) : (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {users.length === 0 && !searchInput && !filterRoleId
                ? 'No users found. Create one to get started.'
                : 'No users match current filters.'}
            </p>
          </div>
        )}
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOT RENDER — mirrors StreamManager's conditional rendering chain
  // ═══════════════════════════════════════════════════════════════════════════

  // Auth spinner
  if (authLoading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Initializing...</p>
      </div>
    );
  }

  // First-load full-page spinner — matches StreamManager's initializing block
  if (initializing) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center py-16">
        <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-[#4c739a] animate-spin" />
        <p className="mt-4 text-sm sm:text-base text-[#4c739a] dark:text-slate-400">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}

      {renderDeleteModal()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default CreateUser;
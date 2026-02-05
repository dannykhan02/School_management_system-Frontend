// AcademicYearSetup.jsx - Enhanced with mobile-aligned text elements
import React, { useEffect, useState, useCallback } from 'react';
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
  X
} from 'lucide-react';
import DisplayDate from '../../../utils/DisplayDate';
import { toast } from "react-toastify";

function AcademicYearSetup() {
  const [academicYears, setAcademicYears] = useState([]);
  const [filteredYears, setFilteredYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [curriculumFilter, setCurriculumFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'desc' });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [school, setSchool] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    yearId: null,
    yearName: ''
  });
  
  // Mobile-specific states
  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    year: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    term: '',
    start_date: '',
    end_date: '',
    curriculum_type: '',
    is_active: false,
  });

  // Fetch school information to get primary curriculum
  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools/my-school', 'GET'); // Changed from 'schools' to 'schools/my-school'
      const schoolData = response.data || response;
      setSchool(schoolData);
      
      // Set initial curriculum filter based on school's primary curriculum
      if (schoolData.primary_curriculum !== 'Both') {
        setCurriculumFilter(schoolData.primary_curriculum);
      }
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  // Fetch academic years
  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('academic-years', 'GET');
      const years = response.data || response || [];
      
      setAcademicYears(years);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      setError('Failed to fetch academic years. Please try again.');
      setAcademicYears([]);
      toast.error('Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSchoolInfo();
  }, [fetchSchoolInfo]);

  useEffect(() => {
    if (school) {
      fetchAcademicYears();
    }
  }, [school, fetchAcademicYears]);

  // Apply client-side filters and sorting
  const applyFilters = useCallback(() => {
    let filtered = [...academicYears];

    // Filter by curriculum (only if school has 'Both')
    if (school && school.primary_curriculum === 'Both' && curriculumFilter !== 'all') {
      filtered = filtered.filter(year => year.curriculum_type === curriculumFilter);
    }

    // Filter by year
    if (yearFilter !== 'all') {
      filtered = filtered.filter(year => year.year.toString() === yearFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(year =>
        year.term?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        year.year.toString().includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      // Convert both values to strings for comparison
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredYears(filtered);
  }, [academicYears, yearFilter, searchTerm, sortConfig, curriculumFilter, school]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getUniqueYears = () => {
    const years = [...new Set(academicYears.map(year => year.year.toString()))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
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

  const openMobileSheet = (year) => {
    setMobileSheet({ isOpen: true, year });
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, year: null });
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  const handleAddNew = () => {
    setEditingYear(null);
    
    // Auto-set curriculum based on school - user cannot change this for single curriculum schools
    let curriculumType = '';
    if (school) {
      if (school.primary_curriculum === 'Both') {
        // For "Both" schools, curriculum_type is required but user must select
        curriculumType = '';
      } else {
        // For single curriculum schools, auto-set it and user cannot change
        curriculumType = school.primary_curriculum;
      }
    }
    
    setFormData({
      year: new Date().getFullYear().toString(),
      term: '',
      start_date: '',
      end_date: '',
      curriculum_type: curriculumType, // Auto-set based on school
      is_active: false,
    });
    setShowForm(true);
  };

  const handleEdit = (id) => {
    const yearToEdit = academicYears.find(year => year.id === id);
    if (yearToEdit) {
      setEditingYear(yearToEdit);
      setFormData({
        year: yearToEdit.year.toString(),
        term: yearToEdit.term || '',
        start_date: yearToEdit.start_date || '',
        end_date: yearToEdit.end_date || '',
        curriculum_type: yearToEdit.curriculum_type, // Keep existing curriculum
        is_active: yearToEdit.is_active || false,
      });
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingYear(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      term: '',
      start_date: '',
      end_date: '',
      curriculum_type: '',
      is_active: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleActive = async (year) => {
    try {
      const response = await apiRequest(`academic-years/${year.id}`, 'PUT', {
        is_active: !year.is_active
      });
      
      const updatedYear = response.data || response;
      toast.success(`Academic year ${!year.is_active ? 'activated' : 'deactivated'} successfully`);
      
      setAcademicYears(prevYears =>
        prevYears.map(y =>
          y.id === year.id ? updatedYear : y
        )
      );
    } catch (error) {
      console.error('Failed to toggle active status:', error);
      toast.error('Failed to update active status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For "Both" curriculum schools, curriculum selection is required
    if (school && school.primary_curriculum === 'Both' && !formData.curriculum_type) {
      toast.error('Please select a curriculum type');
      return;
    }

    // Basic validation
    if (!formData.year || !formData.term) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare data - curriculum_type handling is now backend responsibility
      const submitData = {
        year: formData.year.toString(),
        term: formData.term,
      };
      
      // Add optional fields only if they have values
      if (formData.start_date) submitData.start_date = formData.start_date;
      if (formData.end_date) submitData.end_date = formData.end_date;
      if (formData.is_active !== undefined) submitData.is_active = formData.is_active;
      
      // For "Both" curriculum schools, send the selected curriculum_type
      // For single curriculum schools, don't send curriculum_type at all (backend auto-sets it)
      if (school && school.primary_curriculum === 'Both' && formData.curriculum_type) {
        submitData.curriculum_type = formData.curriculum_type;
      }
      // For single curriculum schools: DO NOT send curriculum_type - backend will auto-set it
      
      if (editingYear) {
        const response = await apiRequest(`academic-years/${editingYear.id}`, 'PUT', submitData);
        const updatedYear = response.data || response;
        toast.success('Academic year updated successfully');
        setAcademicYears(prevYears =>
          prevYears.map(year =>
            year.id === editingYear.id ? updatedYear : year
          )
        );
      } else {
        const response = await apiRequest('academic-years', 'POST', submitData);
        const newYear = response.data || response;
        toast.success('Academic year created successfully');
        if (newYear && newYear.id) {
          setAcademicYears(prevYears => [...prevYears, newYear]);
        }
      }
      handleCloseForm();
    } catch (error) {
      console.error('Failed to save academic year:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.errors?.year?.[0] || 
                          `Failed to ${editingYear ? 'update' : 'create'} academic year`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    const yearToDelete = academicYears.find(year => year.id === id);
    if (yearToDelete) {
      if (mobileSheet.isOpen) {
        closeMobileSheet();
      }
      setDeleteModal({
        isOpen: true,
        yearId: id,
        yearName: `${yearToDelete.year} - ${yearToDelete.term}`
      });
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await apiRequest(`academic-years/${deleteModal.yearId}`, 'DELETE');
      toast.success('Academic year deleted successfully');
      setDeleteModal({ isOpen: false, yearId: null, yearName: '' });
      fetchAcademicYears();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to delete academic year';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getCurriculumBadgeColor = (type) => {
    return type === 'CBC' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="text-slate-300">↕</span>;
    return sortConfig.direction === 'desc' ? '↓' : '↑';
  };

  // Show curriculum filter only if school has 'Both'
  const shouldShowCurriculumFilter = school && school.primary_curriculum === 'Both';
  
  // Determine if curriculum field should be shown in the form
  const shouldShowCurriculumField = school && school.primary_curriculum === 'Both';

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
                  Delete Academic Year
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteModal.yearName}"</span>?
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
                  <strong>Warning:</strong> This will permanently delete all data associated with this academic year including term records and scheduling information.
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
              Keep Academic Year
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
                  Delete Academic Year
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen || !mobileSheet.year) return null;
    const year = mobileSheet.year;
    
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
                  {year.year} - {year.term}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Academic Year Details
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
                <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Academic Year Information
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {year.year}
                  </span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                    {year.curriculum_type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">{year.term}</span>
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Term Details
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Start Date</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">
                    {DisplayDate(year.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">End Date</p>
                  <p className="text-base font-medium text-slate-900 dark:text-white">
                    {DisplayDate(year.end_date)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                {year.is_active ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                )}
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Status
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {year.is_active ? (
                  <span className="text-base font-medium text-green-600 dark:text-green-400">
                    Active
                  </span>
                ) : (
                  <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-white dark:bg-slate-800/50">
            <button
              onClick={() => {
                closeMobileSheet();
                handleEdit(year.id);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <Edit className="w-4 h-4" />
              Edit Academic Year
            </button>
            <button
              onClick={() => {
                closeMobileSheet();
                handleToggleActive(year);
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl active:scale-[0.98] transition-all ${
                year.is_active 
                  ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                  : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              {year.is_active ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={() => handleDelete(year.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-[0.98] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Academic Year
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            Academic Year Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-xs sm:text-sm md:text-base font-normal leading-normal">
            Manage academic years, terms, and curriculum types for your school.
          </p>
          {school && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                School Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                school.primary_curriculum === 'Both' 
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-slate-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-slate-300'
                  : getCurriculumBadgeColor(school.primary_curriculum)
              }`}>
                {school.primary_curriculum}
              </span>
              {school.primary_curriculum !== 'Both' ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Auto-applied to all years)
                </span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Select curriculum when creating years)
                </span>
              )}
            </div>
          )}
        </div>
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
            onClick={handleAddNew}
            disabled={!school}
            className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base whitespace-nowrap"
            title={!school ? "Loading school information..." : "Create new academic year"}
          >
            <Plus className="inline-block w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            New Academic Year
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Filters Section */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 mb-4 md:mb-6">
          {/* Mobile: Collapsible Filters */}
          <div className="block md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Filters
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({filteredYears.length}/{academicYears.length})
                </span>
              </div>
              {showFilters ? (
                <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>
            {showFilters && (
              <div className="space-y-3">
                {/* Search */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by term or year..."
                    className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className={`grid ${shouldShowCurriculumFilter ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  {/* Curriculum Filter - Only show for 'Both' schools */}
                  {shouldShowCurriculumFilter && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Curriculum
                      </label>
                      <select
                        value={curriculumFilter}
                        onChange={(e) => setCurriculumFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Curricula</option>
                        <option value="CBC">CBC</option>
                        <option value="8-4-4">8-4-4</option>
                      </select>
                    </div>
                  )}
                  {/* Year Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Year
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Years</option>
                      {getUniqueYears().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Desktop: Always Visible Filters */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${shouldShowCurriculumFilter ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
              {/* Search */}
              <div className="flex flex-col gap-1 sm:gap-2 sm:col-span-2 lg:col-span-1"> 
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by term or year..."
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Curriculum Filter - Only show for 'Both' schools */}
              {shouldShowCurriculumFilter && (
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Curriculum
                  </label>
                  <select
                    value={curriculumFilter}
                    onChange={(e) => setCurriculumFilter(e.target.value)}
                    className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Curricula</option>
                    <option value="CBC">CBC</option>
                    <option value="8-4-4">8-4-4</option>
                  </select>
                </div>
              )}
              {/* Year Filter */}
              <div className="flex flex-col gap-1 sm:gap-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Year
                </label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-3 sm:px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {/* Results Count */}
              <div className="flex items-end col-span-1 lg:col-span-1">
                <div className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-semibold">{filteredYears.length}</span> of <span className="font-semibold">{academicYears.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">Loading academic years...</p>
        </div>
      )}

      {/* Table Section - Desktop and Tablet */}
      {!loading && (
        <>
          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-[#0d141b] dark:text-white text-xl sm:text-2xl font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6">
              Academic Years
            </h2>
            <div className="overflow-x-auto">
              <div className="border rounded-lg border-slate-200 dark:border-slate-700 min-w-[700px] sm:min-w-full">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th 
                        className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort('year')}
                      >
                        <div className="flex items-center gap-1">
                          Year
                          <SortIcon column="year" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort('term')}
                      >
                        <div className="flex items-center gap-1">
                          Term
                          <SortIcon column="term" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        onClick={() => handleSort('curriculum_type')}
                      >
                        <div className="flex items-center gap-1">
                          Curriculum
                          <SortIcon column="curriculum_type" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden lg:table-cell"
                        onClick={() => handleSort('start_date')}
                      >
                        <div className="flex items-center gap-1">
                          Start Date
                          <SortIcon column="start_date" />
                        </div>
                      </th>
                      <th 
                        className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors hidden xl:table-cell"
                        onClick={() => handleSort('end_date')}
                      >
                        <div className="flex items-center gap-1">
                          End Date
                          <SortIcon column="end_date" />
                        </div>
                      </th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium" scope="col">Status</th>
                      <th className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-right" scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredYears.length > 0 ? (
                      filteredYears.map((year) => (
                        <tr 
                          key={year.id} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                        >
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 font-medium text-slate-900 dark:text-white">
                            {year.year}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400">
                            {year.term}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                              {year.curriculum_type}
                            </span>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                            {DisplayDate(year.start_date)}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                            {DisplayDate(year.end_date)}
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
                            <button
                              onClick={() => handleToggleActive(year)}
                              className="flex items-center gap-1 transition-colors group"
                              title={year.is_active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              {year.is_active ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 group-hover:text-green-700" />
                                  <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 hidden sm:inline">Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400" />
                                  <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">Inactive</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => handleEdit(year.id)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label={`Edit ${year.year} ${year.term}`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(year.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                aria-label={`Delete ${year.year} ${year.term}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-3 sm:px-4 md:px-6 py-6 sm:py-8 text-center text-slate-500 dark:text-slate-400">
                          {academicYears.length === 0 
                            ? 'No academic years found. Create your first academic year to get started.'
                            : 'No academic years match current filters.'
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
            {/* Academic Year Cards */}
            {filteredYears.length > 0 ? (
              filteredYears.map((year) => (
                <button
                  key={year.id}
                  onClick={() => openMobileSheet(year)}
                  className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left min-h-[120px] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {year.year}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {year.term}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Curriculum</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                        {year.curriculum_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                      {year.is_active ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Inactive</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {academicYears.length === 0
                    ? 'No academic years found. Create one to get started.'
                    : 'No academic years match current filters.'
                  }
                </p>
              </div>
            )}
          </div>
        </>
      )}

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
        />
      )}
      
      {renderMobileBottomSheet()}
      {renderDeleteConfirmationModal()}
    </div>
  );
}

export default AcademicYearSetup;
// AcademicYearSetup.jsx - Updated to match StreamManager color scheme
import React, { useEffect, useState, useCallback } from 'react';
import AcademicYearForm from '../../../components/AcademicYearForm';
import { apiRequest } from '../../../utils/api';
import { Edit, Trash2, Loader, CheckCircle, XCircle, Filter, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Plus, ChevronRight } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    term: '',
    start_date: '',
    end_date: '',
    curriculum_type: '',
    is_active: false,
  });

  // Fetch school information to get primary curriculum
  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await apiRequest('schools', 'GET');
      setSchool(response.data || response);
    } catch (error) {
      console.error('Failed to fetch school information:', error);
      toast.error('Failed to fetch school information');
    }
  }, []);

  // Fetch academic years with backend filtering
  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = 'academic-years';
      const params = new URLSearchParams();
      
      if (curriculumFilter !== 'all') {
        params.append('curriculum', curriculumFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await apiRequest(url, 'GET');
      setAcademicYears(response || []);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      setError('Failed to fetch academic years. Please try again.');
      setAcademicYears([]);
      toast.error('Failed to fetch academic years');
    } finally {
      setLoading(false);
    }
  }, [curriculumFilter]);

  // Initial fetch
  useEffect(() => {
    fetchSchoolInfo();
    fetchAcademicYears();
  }, [fetchSchoolInfo, fetchAcademicYears]);

  // Apply client-side filters and sorting
  const applyFilters = useCallback(() => {
    let filtered = [...academicYears];

    if (yearFilter !== 'all') {
      filtered = filtered.filter(year => year.year === parseInt(yearFilter));
    }

    if (searchTerm) {
      filtered = filtered.filter(year =>
        year.term?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        year.year.toString().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredYears(filtered);
  }, [academicYears, yearFilter, searchTerm, sortConfig]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getUniqueYears = () => {
    const years = [...new Set(academicYears.map(year => year.year))];
    return years.sort((a, b) => b - a);
  };

  const handleAddNew = () => {
    setEditingYear(null);
    
    let defaultCurriculum = '';
    if (school && school.primary_curriculum !== 'Both') {
      defaultCurriculum = school.primary_curriculum;
    }
    
    setFormData({
      year: new Date().getFullYear(),
      term: '',
      start_date: '',
      end_date: '',
      curriculum_type: defaultCurriculum,
      is_active: false,
    });
    setShowForm(true);
  };

  const handleEdit = (id) => {
    const yearToEdit = academicYears.find(year => year.id === id);
    if (yearToEdit) {
      setEditingYear(yearToEdit);
      setFormData({
        year: yearToEdit.year,
        term: yearToEdit.term,
        start_date: yearToEdit.start_date,
        end_date: yearToEdit.end_date,
        curriculum_type: yearToEdit.curriculum_type,
        is_active: yearToEdit.is_active,
      });
      setShowForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingYear(null);
    setFormData({
      year: new Date().getFullYear(),
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

    try {
      setSubmitting(true);
      
      const submitData = { ...formData };
      
      if (school && school.primary_curriculum !== 'Both') {
        delete submitData.curriculum_type;
      }
      
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
      toast.error(`Failed to ${editingYear ? 'update' : 'create'} academic year. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) {
      return;
    }

    try {
      await apiRequest(`academic-years/${id}`, 'DELETE');
      setAcademicYears(academicYears.filter(year => year.id !== id));
      toast.success('Academic year deleted successfully');
    } catch (error) {
      console.error('Failed to delete academic year:', error);
      toast.error('Failed to delete academic year');
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
                School Primary Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>
                {school.primary_curriculum}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button 
            onClick={fetchAcademicYears}
            disabled={loading}
            className="bg-slate-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-600 disabled:opacity-50 text-sm"
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

                <div className="grid grid-cols-2 gap-3">
                  {/* Curriculum Filter */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

              {/* Curriculum Filter */}
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

          {/* Mobile List/Detail View */}
          <div className="md:hidden min-h-screen bg-white dark:bg-slate-800">
            {filteredYears.length > 0 ? (
              <>
                {/* List View */}
                {selectedId === null && (
                  <div className="space-y-2 p-4">
                    {filteredYears.map((year) => (
                      <button
                        key={year.id}
                        onClick={() => setSelectedId(year.id)}
                        className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-[#0d141b] dark:text-white">
                              {year.year}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                              {year.curriculum_type}
                            </span>
                          </div>
                          <p className="text-sm text-[#4c739a] dark:text-slate-400">
                            {DisplayDate(year.start_date)} to {DisplayDate(year.end_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {year.is_active ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                          )}
                          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Detail View */}
                {selectedId !== null && (() => {
                  const year = filteredYears.find(y => y.id === selectedId);
                  return (
                    <div className="h-screen flex flex-col">
                      {/* Header */}
                      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0">
                        <button
                          onClick={() => setSelectedId(null)}
                          className="mb-4 text-[#4c739a] dark:text-slate-400 text-sm font-medium flex items-center gap-1"
                        >
                          ← Back
                        </button>
                        <h2 className="text-2xl font-bold text-[#0d141b] dark:text-white">
                          {year.year}
                        </h2>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Curriculum Type */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                          <p className="text-xs text-[#4c739a] dark:text-slate-400 font-medium mb-2">
                            CURRICULUM TYPE
                          </p>
                          <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                            {year.curriculum_type}
                          </span>
                        </div>

                        {/* Term */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                          <p className="text-xs text-[#4c739a] dark:text-slate-400 font-medium mb-2">
                            TERM
                          </p>
                          <p className="text-base font-semibold text-[#0d141b] dark:text-white">
                            {year.term}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                          <p className="text-xs text-[#4c739a] dark:text-slate-400 font-medium mb-2">
                            STATUS
                          </p>
                          <div className="flex items-center gap-2">
                            {year.is_active ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-base font-semibold text-green-600 dark:text-green-400">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <span className="text-base font-semibold text-slate-500 dark:text-slate-400">
                                  Inactive
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-3">
                          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                            <p className="text-xs text-[#4c739a] dark:text-slate-400 font-medium mb-2">
                              START DATE
                            </p>
                            <p className="text-base font-semibold text-[#0d141b] dark:text-white">
                              {DisplayDate(year.start_date)}
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                            <p className="text-xs text-[#4c739a] dark:text-slate-400 font-medium mb-2">
                              END DATE
                            </p>
                            <p className="text-base font-semibold text-[#0d141b] dark:text-white">
                              {DisplayDate(year.end_date)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-4 space-y-2 sticky bottom-0">
                        <button 
                          onClick={() => handleEdit(year.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Year
                        </button>
                        <button 
                          onClick={() => handleDelete(year.id)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Year
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center m-4">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {academicYears.length === 0 
                    ? 'No academic years found. Create your first academic year to get started.'
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
        />
      )}
    </div>
  );
}

export default AcademicYearSetup;
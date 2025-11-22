// AcademicYearSetup.jsx
import React, { useEffect, useState, useCallback } from 'react';
import AcademicYearForm from '../../../components/AcademicYearForm';
import { apiRequest } from '../../../utils/api';
import { Edit, Trash2, Loader, CheckCircle, XCircle, Filter, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    term: '',
    start_date: '',
    end_date: '',
    curriculum_type: '', // Removed default value
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
      
      // Build query string for backend filtering
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

    // Filter by year
    if (yearFilter !== 'all') {
      filtered = filtered.filter(year => year.year === parseInt(yearFilter));
    }

    // Filter by search term
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

      // Handle null/undefined values
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
    
    // Set default curriculum based on school's primary curriculum
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
      
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Only include curriculum_type if it's needed
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
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Academic Year Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            Manage academic years, terms, and curriculum types for your school.
          </p>
          {school && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                School Primary Curriculum:
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(school.primary_curriculum)}`}>
                {school.primary_curriculum}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchAcademicYears}
            disabled={loading}
            className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 inline-block ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleAddNew}
            disabled={!school}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!school ? "Loading school information..." : "Create new academic year"}
          >
            New Academic Year
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      {!loading && academicYears.length > 0 && (
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by term or year..."
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Curriculum Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Curriculum
              </label>
              <select
                value={curriculumFilter}
                onChange={(e) => setCurriculumFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Curricula</option>
                <option value="CBC">CBC</option>
                <option value="8-4-4">8-4-4</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Year
              </label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-semibold">{filteredYears.length}</span> of <span className="font-semibold">{academicYears.length}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading academic years...</p>
        </div>
      )}

      {/* Table Section */}
      {!loading && (
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
            Academic Years
          </h2>

          <div className="overflow-x-auto">
            <div className="border rounded-lg border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('year')}
                    >
                      <div className="flex items-center gap-2">
                        Year
                        <SortIcon column="year" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('term')}
                    >
                      <div className="flex items-center gap-2">
                        Term
                        <SortIcon column="term" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('curriculum_type')}
                    >
                      <div className="flex items-center gap-2">
                        Curriculum
                        <SortIcon column="curriculum_type" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('start_date')}
                    >
                      <div className="flex items-center gap-2">
                        Start Date
                        <SortIcon column="start_date" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => handleSort('end_date')}
                    >
                      <div className="flex items-center gap-2">
                        End Date
                        <SortIcon column="end_date" />
                      </div>
                    </th>
                    <th className="px-6 py-4 font-medium" scope="col">Status</th>
                    <th className="px-6 py-4 font-medium text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredYears.length > 0 ? (
                    filteredYears.map((year) => (
                      <tr 
                        key={year.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {year.year}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {year.term}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(year.curriculum_type)}`}>
                            {year.curriculum_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {DisplayDate(year.start_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {DisplayDate(year.end_date)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(year)}
                            className="flex items-center gap-1 transition-colors"
                            title={year.is_active ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {year.is_active ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(year.id)}
                              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              aria-label={`Edit ${year.year} ${year.term}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(year.id)}
                              className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              aria-label={`Delete ${year.year} ${year.term}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        {academicYears.length === 0 
                          ? 'No academic years found. Create your first academic year to get started.'
                          : 'No academic years match the current filters.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Year Form Modal */}
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
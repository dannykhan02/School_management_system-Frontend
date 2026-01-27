import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api'
import { 
  Loader, 
  Users, 
  Building2, 
  X,
  Eye,
  Edit,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  School,
  Code,
  BookOpen,
  CheckSquare,
  Square,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  GraduationCap,
  BookUser,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { toast } from "react-toastify";

function SchoolManagerComponent() {
  const navigate = useNavigate();
  
  // Kenyan Counties (47 counties)
  const KENYAN_COUNTIES = [
    "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", "Wajir", "Mandera", "Marsabit",
    "Isiolo", "Meru", "Tharaka Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
    "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet",
    "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga",
    "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
  ];
  
  // --- State Management ---
  const [schools, setSchools] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'view-details'
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
    from: 0,
    to: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    school_type: '',
    curriculum: '',
    city: '',
    has_streams: null,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const [showFilters, setShowFilters] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Mobile states
  const [mobileSheet, setMobileSheet] = useState({
    isOpen: false,
    school: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // --- Data Fetching ---
  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [pagination.currentPage, pagination.perPage]);

  // Effect for filters - apply automatically
  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchSchools();
    } else {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [
    filters.search,
    filters.school_type,
    filters.curriculum,
    filters.city,
    filters.has_streams,
    filters.sort_by,
    filters.sort_order
  ]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.currentPage,
        per_page: pagination.perPage,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
        include_students: 'true',
        include_teachers: 'true',
      });

      // Add filters if they exist
      if (filters.search) params.append('search', filters.search);
      if (filters.school_type) params.append('school_type', filters.school_type);
      if (filters.curriculum) params.append('curriculum', filters.curriculum);
      if (filters.city) params.append('city', filters.city);
      if (filters.has_streams !== null) params.append('has_streams', filters.has_streams);

      const response = await apiRequest(`schools/all?${params.toString()}`, 'GET');
      
      setSchools(response?.data || []);
      
      if (response?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          lastPage: response.pagination.last_page,
          currentPage: response.pagination.current_page,
          from: response.pagination.from,
          to: response.pagination.to,
        }));
      }
    } catch (error) {
      toast.error('Failed to load schools. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await apiRequest('schools/statistics', 'GET');
      setStatistics(response?.data || null);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // --- Mobile Bottom Sheet Handlers ---
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

  const openMobileSheet = async (school) => {
    setMobileSheet({ isOpen: true, school });
    setLoading(true);
    
    try {
      const detailsResponse = await apiRequest(`schools/${school.id}`, 'GET');
      const breakdownResponse = await apiRequest(`schools/${school.id}/user-breakdown`, 'GET');
      
      setSchoolDetails(detailsResponse?.data || null);
      setUserBreakdown(breakdownResponse?.data || null);
    } catch (error) {
      toast.error('Could not fetch school details.');
    } finally {
      setLoading(false);
    }
    
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSheet = () => {
    setMobileSheet({ isOpen: false, school: null });
    setSchoolDetails(null);
    setUserBreakdown(null);
    document.body.style.overflow = '';
    setDragOffset(0);
  };

  // --- View Handlers ---
  const showSchoolDetails = async (school) => {
    if (window.innerWidth < 768) {
      openMobileSheet(school);
    } else {
      setView('view-details');
      setSelectedSchool(school);
      setLoading(true);
      setUserBreakdown(null);
      
      try {
        const detailsResponse = await apiRequest(`schools/${school.id}`, 'GET');
        setSchoolDetails(detailsResponse?.data || null);

        const breakdownResponse = await apiRequest(`schools/${school.id}/user-breakdown`, 'GET');
        setUserBreakdown(breakdownResponse?.data || null);
      } catch (error) {
        toast.error('Could not fetch school details.');
        setSchoolDetails(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSchool = (school) => {
    navigate(`/super_admin/schools/edit/${school.id}`);
  };

  const backToList = () => {
    setView('list');
    setSelectedSchool(null);
    setSchoolDetails(null);
    setUserBreakdown(null);
  };

  // --- Filter Handlers ---
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      school_type: '',
      curriculum: '',
      city: '',
      has_streams: null,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // --- Pagination Handlers ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPagination(prev => ({ 
      ...prev, 
      perPage: newPerPage,
      currentPage: 1 
    }));
  };

  // --- Render Functions ---
  const renderStatisticsCards = () => {
    if (statsLoading || !statistics) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 animate-pulse">
              <div className="h-16 sm:h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Total Schools</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                {statistics.total_schools}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                {statistics.total_students?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Total Teachers</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                {statistics.total_teachers?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
              <BookUser className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Active Users</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1 sm:mt-2">
                {statistics.active_users?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                of {statistics.total_users?.toLocaleString() || 0} total
              </p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-2 sm:p-3 rounded-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchAndFilters = () => (
    <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, city, or email..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filters.school_type || filters.curriculum || filters.city || filters.has_streams !== null) && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm sm:text-base"
          title="Reset all filters"
        >
          <X className="w-4 h-4" />
          Reset
        </button>

        {/* Refresh Button - Black in light mode, White in dark mode */}
        <button
          onClick={() => { fetchSchools(); fetchStatistics(); }}
          className="px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                School Type
              </label>
              <select
                value={filters.school_type}
                onChange={(e) => handleFilterChange('school_type', e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                Curriculum
              </label>
              <select
                value={filters.curriculum}
                onChange={(e) => handleFilterChange('curriculum', e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Curriculums</option>
                <option value="CBC">CBC</option>
                <option value="8-4-4">8-4-4</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                City/County
              </label>
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Cities/Counties</option>
                {KENYAN_COUNTIES.map(county => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                Streams
              </label>
              <select
                value={filters.has_streams === null ? '' : filters.has_streams.toString()}
                onChange={(e) => handleFilterChange('has_streams', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">All Schools</option>
                <option value="true">With Streams</option>
                <option value="false">Without Streams</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="created_at">Date Created</option>
                <option value="name">School Name</option>
                <option value="city">City</option>
                <option value="school_type">School Type</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2">
                Sort Order
              </label>
              <select
                value={filters.sort_order}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPagination = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total} schools
        </span>
        <select
          value={pagination.perPage}
          onChange={handlePerPageChange}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="10">10 per page</option>
          <option value="15">15 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className="p-1.5 sm:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        
        <span className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Page {pagination.currentPage} of {pagination.lastPage}
        </span>

        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.lastPage}
          className="p-1.5 sm:p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );

  const renderMobileCards = () => (
    <div className="md:hidden space-y-3">
      {schools.length > 0 ? (
        schools.map((school) => (
          <div
            key={school.id}
            className="w-full bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
          >
            {/* Header with Edit Button */}
            <div className="flex items-start justify-between mb-3">
              <button
                onClick={() => showSchoolDetails(school)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {school.logo ? (
                  <img 
                    src={school.logo} 
                    alt={school.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {school.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    {school.code}
                  </p>
                </div>
              </button>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEditSchool(school)}
                  className="p-2 bg-white dark:bg-black text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
                  title="Edit School"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => showSchoolDetails(school)}
                  className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  title="View Details"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Rest of the card content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {school.school_type}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  {school.primary_curriculum || 'Not Set'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{school.city || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {school.has_streams ? (
                    <>
                      <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Streams</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">No Streams</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300">
                    <GraduationCap className="w-4 h-4" />
                    <span className="font-medium">{school.students_count?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300">
                    <BookUser className="w-4 h-4" />
                    <span className="font-medium">{school.teachers_count?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Teachers</p>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6 text-center">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {schools.length === 0
              ? 'No schools found. Try adjusting your filters.'
              : 'No schools match current filters.'
            }
          </p>
        </div>
      )}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="hidden md:block bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em]">
          All Schools
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {schools.length} schools found
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="border rounded-lg border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium">School Info</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Curriculum</th>
                <th className="px-6 py-4 font-medium">Streams</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Students</th>
                <th className="px-6 py-4 font-medium">Teachers</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {school.logo ? (
                          <img 
                            src={school.logo} 
                            alt={school.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{school.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            {school.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {school.school_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {school.primary_curriculum || 'Not Set'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {school.has_streams ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Yes</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">No</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                        {school.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{school.city}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <GraduationCap className="w-4 h-4" />
                        <span className="font-medium">{school.students_count?.toLocaleString() || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <BookUser className="w-4 h-4" />
                        <span className="font-medium">{school.teachers_count?.toLocaleString() || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => showSchoolDetails(school)} 
                          className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditSchool(school)} 
                          className="p-2 text-slate-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit School"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-lg font-medium text-slate-400 dark:text-slate-500">
                        No schools found
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMobileBottomSheet = () => {
    if (!mobileSheet.isOpen) return null;

    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300"
          onClick={closeMobileSheet}
        />
        <div
          className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-slate-800/50 rounded-t-3xl shadow-2xl md:hidden transition-transform duration-300 ease-out max-h-[90vh] overflow-hidden flex flex-col"
          style={{
            transform: `translateY(${dragOffset}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {schoolDetails?.logo ? (
                  <img 
                    src={schoolDetails.logo} 
                    alt={schoolDetails.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {schoolDetails?.name || 'Loading...'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {schoolDetails?.code || 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Edit Button - White in dark mode, Black in light mode */}
                <button
                  onClick={() => {
                    handleEditSchool(schoolDetails);
                    closeMobileSheet();
                  }}
                  disabled={!schoolDetails}
                  className="p-2 bg-white dark:bg-black text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  title="Edit School"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {/* Close Button */}
                <button
                  onClick={closeMobileSheet}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {/* Contact Information */}
                <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {schoolDetails?.email && (
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.email}</p>
                        </div>
                      </div>
                    )}
                    {schoolDetails?.phone && (
                      <div className="flex items-start gap-2">
                        <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.phone}</p>
                        </div>
                      </div>
                    )}
                    {schoolDetails?.city && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.city}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* School Information */}
                <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">School Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Type</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{schoolDetails?.school_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Curriculum</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{schoolDetails?.primary_curriculum || 'Not Set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Streams</span>
                      <div className="flex items-center gap-1">
                        {schoolDetails?.has_streams ? (
                          <>
                            <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Enabled</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Disabled</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* User Statistics */}
                {userBreakdown && (
                  <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">User Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-400">Total Users</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{userBreakdown.total_users}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-xs text-green-600 dark:text-green-400">Students</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{userBreakdown.total_students}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <p className="text-xs text-purple-600 dark:text-purple-400">Teachers</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{userBreakdown.total_teachers}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {userBreakdown.by_status?.active || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderDetailsView = () => {
    if (!schoolDetails) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading school details...</p>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={backToList}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-4 transition-colors"
            >
              <X className="w-4 h-4" />
              Back to Schools List
            </button>
            <button
              onClick={() => handleEditSchool(schoolDetails)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors mb-4"
            >
              <Edit className="w-4 h-4" />
              Edit School
            </button>
          </div>
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            School Details
          </h1>
        </div>

        {/* Main Info Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {schoolDetails.logo ? (
                <img 
                  src={schoolDetails.logo} 
                  alt={schoolDetails.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
                  <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{schoolDetails.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    <School className="w-3 h-3" />
                    {schoolDetails.school_type}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Code className="w-3 h-3" />
                    {schoolDetails.code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                {schoolDetails.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.email}</p>
                    </div>
                  </div>
                )}
                {schoolDetails.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.phone}</p>
                    </div>
                  </div>
                )}
                {schoolDetails.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.address}</p>
                      {schoolDetails.city && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{schoolDetails.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* System Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Information</h3>
              <div className="space-y-3">
                {schoolDetails.created_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Registered On</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(schoolDetails.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {schoolDetails.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {new Date(schoolDetails.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">School ID</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Primary Curriculum</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{schoolDetails.primary_curriculum || 'Not Set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Breakdown Section */}
        {userBreakdown && (
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              User Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Users</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                      {userBreakdown.total_users}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400">Students</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                      {userBreakdown.total_students}
                    </p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Teachers</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                      {userBreakdown.total_teachers}
                    </p>
                  </div>
                  <BookUser className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Users by Role */}
            {userBreakdown.by_role && userBreakdown.by_role.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Users by Role</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {userBreakdown.by_role.map((role, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{role.role}</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{role.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users by Status */}
            {userBreakdown.by_status && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Users by Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(userBreakdown.by_status).map(([status, count]) => (
                    <div key={status} className={`p-3 rounded-lg border ${
                      status === 'active' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <p className={`text-xs capitalize ${
                        status === 'active' 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>{status}</p>
                      <p className={`text-lg font-bold mt-1 ${
                        status === 'active' 
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stream Configuration Section */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Stream Configuration
          </h3>
          <div className="flex items-start gap-3">
            <div className="pt-1">
              {schoolDetails.has_streams ? (
                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Square className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-slate-900 dark:text-white">
                Streams are {schoolDetails.has_streams ? 'enabled' : 'disabled'} for this school
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {schoolDetails.has_streams 
                  ? "This school can create and manage streams for classrooms." 
                  : "This school does not use stream-based organization."}
              </p>
              {schoolDetails.has_streams && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Stream functionality is enabled for this school
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-[-0.033em]">
            School Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-sm sm:text-base font-normal leading-normal">
            View and manage all registered schools in system.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatisticsCards()}

      {/* Search and Filters */}
      {renderSearchAndFilters()}

      {/* Pagination at the TOP */}
      {renderPagination()}

      {/* Mobile Cards View */}
      {renderMobileCards()}

      {/* Desktop Table View */}
      {renderDesktopTable()}
    </>
  );

  return (
    <div className="w-full py-4 sm:py-6 md:py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <Loader className="w-10 sm:w-12 h-10 sm:h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Schools...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {view === 'view-details' && renderDetailsView()}
      {renderMobileBottomSheet()}
    </div>
  );
}

export default SchoolManagerComponent;
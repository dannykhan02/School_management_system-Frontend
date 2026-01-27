import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../../utils/api';
import { toast } from 'react-toastify';
import { 
  Save, 
  ArrowLeft, 
  Loader,
  School,
  Upload,
  X,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Award,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

// Grade levels for CBC
const cbcGradeLevels = [
  { id: 'PP1', name: 'PP1', curriculum: 'CBC', level: 'Pre-Primary' },
  { id: 'PP2', name: 'PP2', curriculum: 'CBC', level: 'Pre-Primary' },
  { id: 'Grade 1', name: 'Grade 1', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 2', name: 'Grade 2', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 3', name: 'Grade 3', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 4', name: 'Grade 4', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 5', name: 'Grade 5', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 6', name: 'Grade 6', curriculum: 'CBC', level: 'Primary' },
  { id: 'Grade 7', name: 'Grade 7', curriculum: 'CBC', level: 'Junior Secondary' },
  { id: 'Grade 8', name: 'Grade 8', curriculum: 'CBC', level: 'Junior Secondary' },
  { id: 'Grade 9', name: 'Grade 9', curriculum: 'CBC', level: 'Junior Secondary' },
  { id: 'Grade 10', name: 'Grade 10', curriculum: 'CBC', level: 'Senior Secondary' },
  { id: 'Grade 11', name: 'Grade 11', curriculum: 'CBC', level: 'Senior Secondary' },
  { id: 'Grade 12', name: 'Grade 12', curriculum: 'CBC', level: 'Senior Secondary' },
];

// Class levels for 8-4-4
const classLevels = [
  { id: 'Standard 1', name: 'Standard 1', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 2', name: 'Standard 2', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 3', name: 'Standard 3', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 4', name: 'Standard 4', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 5', name: 'Standard 5', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 6', name: 'Standard 6', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 7', name: 'Standard 7', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Standard 8', name: 'Standard 8', curriculum: '8-4-4', level: 'Primary' },
  { id: 'Form 1', name: 'Form 1', curriculum: '8-4-4', level: 'Secondary' },
  { id: 'Form 2', name: 'Form 2', curriculum: '8-4-4', level: 'Secondary' },
  { id: 'Form 3', name: 'Form 3', curriculum: '8-4-4', level: 'Secondary' },
  { id: 'Form 4', name: 'Form 4', curriculum: '8-4-4', level: 'Secondary' },
];

function EditSchool() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    school_type: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    code: '',
    primary_curriculum: 'Both',
    secondary_curriculum: 'Both',
    has_streams: false,
    has_pre_primary: false,
    has_primary: false,
    has_junior_secondary: false,
    has_senior_secondary: false,
    has_secondary: false,
    senior_secondary_pathways: [],
    grade_levels: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);

  const pathwayOptions = [
    { value: 'STEM', label: 'STEM (Science, Technology, Engineering, Mathematics)' },
    { value: 'Arts', label: 'Arts & Sports Science' },
    { value: 'Social Sciences', label: 'Social Sciences' }
  ];

  const curriculumOptions = [
    { value: 'CBC', label: 'CBC (Competency-Based Curriculum)' },
    { value: '8-4-4', label: '8-4-4 System' },
    { value: 'Both', label: 'Both Systems' }
  ];

  useEffect(() => {
    fetchSchoolData();
  }, [id]);

  const fetchSchoolData = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest(`schools/${id}`, 'GET');
      
      if (response.data) {
        const school = response.data;
        
        const formattedData = {
          name: school.name || '',
          school_type: school.school_type || '',
          address: school.address || '',
          city: school.city || '',
          phone: school.phone || '',
          email: school.email || '',
          code: school.code || '',
          primary_curriculum: school.primary_curriculum || 'Both',
          secondary_curriculum: school.secondary_curriculum || 'Both',
          has_streams: school.has_streams || false,
          has_pre_primary: school.has_pre_primary || false,
          has_primary: school.has_primary || false,
          has_junior_secondary: school.has_junior_secondary || false,
          has_senior_secondary: school.has_senior_secondary || false,
          has_secondary: school.has_secondary || false,
          senior_secondary_pathways: school.senior_secondary_pathways || [],
          grade_levels: school.grade_levels || [],
        };

        setFormData(formattedData);
        setOriginalData(formattedData);

        if (school.logo) {
          setLogoPreview(school.logo);
        }
      }
    } catch (error) {
      toast.error('Failed to load school data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Auto-update secondary curriculum when primary changes
    if (name === 'primary_curriculum') {
      if (value === 'Both') {
        setFormData(prev => ({ ...prev, secondary_curriculum: 'Both' }));
      } else if (value === 'CBC' || value === '8-4-4') {
        setFormData(prev => ({ 
          ...prev, 
          secondary_curriculum: prev.secondary_curriculum || value 
        }));
      }
    }

    // Update school type restrictions
    if (name === 'school_type') {
      if (value === 'Primary') {
        setFormData(prev => ({
          ...prev,
          primary_curriculum: 'CBC',
          secondary_curriculum: '',
          has_senior_secondary: false,
          has_secondary: false
        }));
      } else if (value === 'Secondary') {
        setFormData(prev => ({
          ...prev,
          primary_curriculum: '',
          has_pre_primary: false,
          has_primary: false,
          has_junior_secondary: false
        }));
      } else if (value === 'Mixed') {
        setFormData(prev => ({
          ...prev,
          primary_curriculum: 'CBC',
          secondary_curriculum: prev.secondary_curriculum || ''
        }));
      }
    }

    // Update level checkboxes based on curriculum
    if (name === 'primary_curriculum') {
      if (value === 'CBC') {
        setFormData(prev => ({
          ...prev,
          has_secondary: false
        }));
      } else if (value === '8-4-4') {
        setFormData(prev => ({
          ...prev,
          has_pre_primary: false,
          has_junior_secondary: false,
          has_senior_secondary: false,
        }));
      }
    }
  };

  const handleGradeLevelChange = (levelId) => {
    setFormData(prev => {
      const gradeLevels = [...prev.grade_levels];
      if (gradeLevels.includes(levelId)) {
        return { ...prev, grade_levels: gradeLevels.filter(id => id !== levelId) };
      } else {
        return { ...prev, grade_levels: [...gradeLevels, levelId] };
      }
    });
  };

  const handlePathwayChange = (pathway) => {
    setFormData(prev => {
      const pathways = [...prev.senior_secondary_pathways];
      if (pathways.includes(pathway)) {
        return { ...prev, senior_secondary_pathways: pathways.filter(p => p !== pathway) };
      } else {
        return { ...prev, senior_secondary_pathways: [...pathways, pathway] };
      }
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size should not exceed 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      
      // Tell Laravel this is a PUT request
      formDataToSend.append('_method', 'PUT');
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'grade_levels' || key === 'senior_secondary_pathways') {
          // Handle arrays
          if (formData[key] && formData[key].length > 0) {
            formData[key].forEach(item => {
              formDataToSend.append(`${key}[]`, item);
            });
          }
        } else if (key === 'name') {
          // Use 'name' field for school name
          formDataToSend.append('name', formData[key]);
        } else {
          // Proper boolean handling
          const value = formData[key];
          if (typeof value === 'boolean') {
            // Send as '1' or '0' string
            formDataToSend.append(key, value ? '1' : '0');
          } else if (value !== null && value !== undefined && value !== '') {
            // Only send non-empty values
            formDataToSend.append(key, value);
          } else if (value === '') {
            // Send empty strings as empty
            formDataToSend.append(key, '');
          }
        }
      });

      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      // Use POST with method spoofing
      const response = await apiRequest(`schools/${id}`, 'POST', formDataToSend);
      
      toast.success('School updated successfully');
      navigate('/super_admin/schools');
    } catch (error) {
      if (error.status === 422) {
        setErrors(error.data.errors || {});
        toast.error('Validation failed. Please check the form.');
      } else {
        toast.error('Failed to update school. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Get appropriate grade levels based on curriculum
  const getGradeLevels = () => {
    if (formData.primary_curriculum === 'CBC') return cbcGradeLevels;
    if (formData.primary_curriculum === '8-4-4') return classLevels;
    if (formData.primary_curriculum === 'Both') return [...cbcGradeLevels, ...classLevels];
    return [];
  };

  // Check if 8-4-4 levels should be shown
  const shouldShow844Secondary = () => {
    if (formData.school_type === 'Primary') return false;
    
    return (
      formData.primary_curriculum === '8-4-4' ||
      formData.primary_curriculum === 'Both' ||
      formData.secondary_curriculum === '8-4-4' ||
      formData.secondary_curriculum === 'Both'
    );
  };

  // Check if CBC levels should be shown
  const shouldShowCBCLevels = () => {
    if (formData.school_type === 'Primary') return true;
    
    return (
      formData.primary_curriculum === 'CBC' ||
      formData.primary_curriculum === 'Both' ||
      formData.secondary_curriculum === 'CBC' ||
      formData.secondary_curriculum === 'Both'
    );
  };

  // Get filtered curriculum options based on school type
  const getFilteredCurriculumOptions = (isPrimary) => {
    if (formData.school_type === 'Primary') {
      return isPrimary 
        ? curriculumOptions.filter(option => option.value === 'CBC')
        : [{ value: '', label: 'Not applicable for primary schools' }];
    } else if (formData.school_type === 'Secondary') {
      return isPrimary 
        ? [{ value: '', label: 'Not applicable for secondary schools' }]
        : curriculumOptions;
    } else if (formData.school_type === 'Mixed') {
      if (isPrimary) {
        return curriculumOptions.filter(option => option.value === 'CBC');
      } else {
        return curriculumOptions;
      }
    } else {
      return curriculumOptions;
    }
  };

  if (loading) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-7 md:h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4 sm:mb-6"></div>
          <div className="h-48 sm:h-56 md:h-64 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl mb-4 sm:mb-6"></div>
          <div className="h-40 sm:h-44 md:h-48 bg-slate-200 dark:bg-slate-800 rounded-lg sm:rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg w-fit">
          <School className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-[#0d141b] dark:text-white">
            Edit School (Super Admin)
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#4c739a] dark:text-slate-400 font-normal leading-normal mt-1">
            Update school information with full administrative access
          </p>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Please fix the following errors:
            </h3>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
            {Object.entries(errors).map(([field, messages]) => (
              <li key={field}>
                <strong>{field}:</strong>{" "}
                {Array.isArray(messages) ? messages.join(", ") : messages}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
          {/* Header Card */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="relative mx-auto sm:mx-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-2 sm:p-3 bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 flex items-center justify-center">
                      <School className="w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <label className="absolute -bottom-2 -right-2 z-10">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="p-2.5 bg-slate-700 dark:bg-slate-600 text-white rounded-full cursor-pointer hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors shadow-lg">
                    <Upload className="w-4 h-4" />
                  </div>
                </label>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#0d141b] dark:text-white mb-2 tracking-tight">
                  {formData.name || "School Name"}
                </h1>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <School className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">{formData.school_type || 'School Type'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">{formData.city || 'City'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* School Information Section */}
          <div className="mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1 border-b border-slate-200 dark:border-slate-700 pb-3">
              School Information
            </h2>
            <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 mb-4">
              Basic details and contact information
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Column 1 */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    School Type *
                  </label>
                  <select
                    name="school_type"
                    value={formData.school_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Primary">Primary School</option>
                    <option value="Secondary">Secondary School</option>
                    <option value="Mixed">Mixed (Primary & Secondary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    Primary Curriculum *
                  </label>
                  <select
                    name="primary_curriculum"
                    value={formData.primary_curriculum}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                    disabled={formData.school_type === 'Secondary' || formData.school_type === 'Mixed'}
                  >
                    <option value="">Select curriculum</option>
                    {getFilteredCurriculumOptions(true).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    Stream Configuration
                  </label>
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_streams"
                          name="has_streams"
                          checked={formData.has_streams}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_streams" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Enable Streams for this School
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Check this box if your school uses stream-based organization (e.g., Class A, Class B, etc.). This will allow you to create streams and assign teachers and students to them.
                        </p>
                        {formData.has_streams && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                            <p className="text-xs text-green-700 dark:text-green-300">
                              ✓ Stream functionality is enabled for this school
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter street address"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    School Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter school code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter city"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    Secondary Curriculum *
                  </label>
                  <select
                    name="secondary_curriculum"
                    value={formData.secondary_curriculum}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                    disabled={formData.school_type === 'Primary'}
                  >
                    <option value="">Select curriculum</option>
                    {getFilteredCurriculumOptions(false).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Levels Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white">Curriculum Levels</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CBC Levels */}
              {shouldShowCBCLevels() && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">CBC Levels</h3>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_pre_primary"
                          name="has_pre_primary"
                          checked={formData.has_pre_primary}
                          onChange={handleChange}
                          disabled={formData.primary_curriculum === '8-4-4' || formData.school_type === 'Secondary'}
                          className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_pre_primary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Pre-Primary (PP1-PP2)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Early childhood education for ages 4-6
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_primary"
                          name="has_primary"
                          checked={formData.has_primary}
                          onChange={handleChange}
                          disabled={formData.school_type === 'Secondary'}
                          className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_primary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Primary (Grade 1-6)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Primary education for ages 6-12
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_junior_secondary"
                          name="has_junior_secondary"
                          checked={formData.has_junior_secondary}
                          onChange={handleChange}
                          disabled={formData.primary_curriculum === '8-4-4' || formData.school_type === 'Secondary'}
                          className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_junior_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                          Junior Secondary (Grade 7-9)
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Lower secondary education for ages 12-15
                        </p>
                      </div>
                    </div>
                  </div>

                  {(formData.school_type === 'Secondary' || formData.school_type === 'Mixed') && (
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_senior_secondary"
                            name="has_senior_secondary"
                            checked={formData.has_senior_secondary}
                            onChange={handleChange}
                            disabled={formData.primary_curriculum === '8-4-4' || 
                              (formData.secondary_curriculum === '8-4-4' && formData.primary_curriculum !== 'Both')}
                            className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_senior_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Senior Secondary (Grade 10-12)
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Upper secondary education for ages 15-18 with STEM pathways
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.has_senior_secondary && (
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Senior Secondary Pathways
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Select the pathways your school offers for Senior Secondary students
                      </p>
                      <div className="space-y-2">
                        {pathwayOptions.map(option => (
                          <div key={option.value} className="flex items-start gap-3">
                            <div className="pt-1">
                              <input
                                type="checkbox"
                                id={`pathway_${option.value}`}
                                checked={formData.senior_secondary_pathways.includes(option.value)}
                                onChange={() => handlePathwayChange(option.value)}
                                className="w-5 h-5 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1">
                              <label htmlFor={`pathway_${option.value}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 8-4-4 Levels */}
              {shouldShow844Secondary() && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">8-4-4 Levels</h3>
                  
                  {/* Only show Primary level for Primary or Mixed schools */}
                  {(formData.school_type === 'Primary' || formData.school_type === 'Mixed') && (
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_primary_844"
                            name="has_primary"
                            checked={formData.has_primary}
                            onChange={handleChange}
                            disabled={formData.primary_curriculum === 'CBC' || formData.school_type === 'Secondary'}
                            className="w-5 h-5 text-green-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_primary_844" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Primary (Standard 1-8)
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Primary education for ages 6-13
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show Secondary level for Secondary or Mixed schools */}
                  {(formData.school_type === 'Secondary' || formData.school_type === 'Mixed') && (
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_secondary"
                            name="has_secondary"
                            checked={formData.has_secondary}
                            onChange={handleChange}
                            disabled={formData.primary_curriculum === 'CBC' || 
                              (formData.secondary_curriculum === 'CBC' && formData.primary_curriculum !== 'Both')}
                            className="w-5 h-5 text-green-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_secondary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Secondary (Form 1-4)
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Secondary education for ages 13-17
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grade Levels Section - Responsive update */}
          {formData.primary_curriculum && (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg w-fit">
                  <Award className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-[#0d141b] dark:text-white">
                    {formData.primary_curriculum === '8-4-4' ? 'Class Levels' : 'Grade Levels'}
                  </h3>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {formData.primary_curriculum === 'CBC' && (
                  <div className="space-y-3 sm:space-y-4">
                    {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                      const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                      if (levelGrades.length === 0) return null;
                      
                      const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                            level === 'Primary' ? formData.has_primary :
                                            formData.has_junior_secondary;
                      
                      return (
                        <div key={level} className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                            {levelGrades.map(grade => (
                              <div key={grade.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`grade_${grade.id}`}
                                  checked={formData.grade_levels.includes(grade.id)}
                                  onChange={() => handleGradeLevelChange(grade.id)}
                                  disabled={!isLevelSelected}
                                  className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                                />
                                <label htmlFor={`grade_${grade.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                  {grade.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Senior Secondary section with responsive grid */}
                    {(formData.school_type === 'Secondary' || formData.school_type === 'Mixed') && formData.has_senior_secondary && (
                      <div className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Senior Secondary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {cbcGradeLevels.filter(g => g.level === 'Senior Secondary').map(grade => (
                            <div key={grade.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`grade_${grade.id}`}
                                checked={formData.grade_levels.includes(grade.id)}
                                onChange={() => handleGradeLevelChange(grade.id)}
                                className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                              />
                              <label htmlFor={`grade_${grade.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                {grade.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.primary_curriculum === '8-4-4' && (
                  <div className="space-y-3 sm:space-y-4">
                    {['Primary', 'Secondary'].map(level => {
                      const levelClasses = classLevels.filter(c => c.level === level);
                      if (levelClasses.length === 0) return null;
                      
                      const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                            formData.has_secondary;
                      
                      if (level === 'Primary' && formData.school_type === 'Secondary') return null;
                      
                      return (
                        <div key={level} className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                            {levelClasses.map(cls => (
                              <div key={cls.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`class_${cls.id}`}
                                  checked={formData.grade_levels.includes(cls.id)}
                                  onChange={() => handleGradeLevelChange(cls.id)}
                                  disabled={!isLevelSelected}
                                  className="w-4 h-4 text-green-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
                                />
                                <label htmlFor={`class_${cls.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                  {cls.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {formData.primary_curriculum === 'Both' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        You have selected to offer both CBC and 8-4-4 curricula. Please select grade levels for CBC and class levels for 8-4-4 that your school offers.
                      </p>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-300">CBC Grade Levels</h3>
                      {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                        const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                        if (levelGrades.length === 0) return null;
                        
                        const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                              level === 'Primary' ? formData.has_primary :
                                              formData.has_junior_secondary;
                        
                        return (
                          <div key={`cbc_${level}`} className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                              {levelGrades.map(grade => (
                                <div key={grade.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`cbc_grade_${grade.id}`}
                                    checked={formData.grade_levels.includes(grade.id)}
                                    onChange={() => handleGradeLevelChange(grade.id)}
                                    disabled={!isLevelSelected}
                                    className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                                  />
                                  <label htmlFor={`cbc_grade_${grade.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                    {grade.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {(formData.school_type === 'Secondary' || formData.school_type === 'Mixed') && formData.has_senior_secondary && (
                        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-700 rounded-lg">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Senior Secondary</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                            {cbcGradeLevels.filter(g => g.level === 'Senior Secondary').map(grade => (
                              <div key={grade.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`cbc_grade_${grade.id}`}
                                  checked={formData.grade_levels.includes(grade.id)}
                                  onChange={() => handleGradeLevelChange(grade.id)}
                                  className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2"
                                />
                                <label htmlFor={`cbc_grade_${grade.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                  {grade.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium text-green-700 dark:text-green-300">8-4-4 Class Levels</h3>
                      {['Primary', 'Secondary'].map(level => {
                        const levelClasses = classLevels.filter(c => c.level === level);
                        if (levelClasses.length === 0) return null;
                        
                        const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                              formData.has_secondary;
                        
                        if (level === 'Primary' && formData.school_type === 'Secondary') return null;
                        
                        return (
                          <div key={`844_${level}`} className="p-3 sm:p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                              {levelClasses.map(cls => (
                                <div key={cls.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`844_class_${cls.id}`}
                                    checked={formData.grade_levels.includes(cls.id)}
                                    onChange={() => handleGradeLevelChange(cls.id)}
                                    disabled={!isLevelSelected}
                                    className="w-4 h-4 text-green-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2"
                                  />
                                  <label htmlFor={`844_class_${cls.id}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                    {cls.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Responsive update */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg sm:rounded-b-xl">
          <button
            type="button"
            onClick={() => navigate('/super_admin/schools')}
            disabled={saving}
            className="w-full sm:w-auto order-2 sm:order-1 px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditSchool;
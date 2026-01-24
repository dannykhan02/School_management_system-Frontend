import React, { useState, useEffect } from 'react';
import { School, User, MapPin, Phone, Mail, ArrowLeft, Save, X, Lock, Upload, Image, AlertCircle, CheckSquare, Square, ChevronDown, ChevronUp, GraduationCap, Award, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';

function SchoolRegistration({ onClose, onSave, isEditMode = false, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    // School Information
    schoolName: '',
    schoolType: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    code: '',
    primaryCurriculum: '',
    secondaryCurriculum: '',
    hasStreams: false,
    
    // Curriculum Levels
    has_pre_primary: false,
    has_primary: false,
    has_junior_secondary: false,
    has_senior_secondary: false,
    has_secondary: false,
    
    // Grade Levels and Class Levels
    grade_levels: [],
    
    // Senior Secondary Pathways
    senior_secondary_pathways: [],
    
    // Admin Information
    adminName: '',
    gender: '',
    adminEmail: '',
    adminPhone: '',
    password: ''
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(initialData?.logoUrl || null);
  const [errors, setErrors] = useState({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isLocked, setIsLocked] = useState(isEditMode); // Lock fields if editing existing school
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if form has been submitted
  const navigate = useNavigate();
  
  // Define grade levels for CBC
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
  
  // Define class levels for 8-4-4
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
  
  // NEW FEATURE 1: Disable streams checkbox when curriculum levels are selected
  // Check if streams should be disabled
  const shouldDisableStreams = () => {
    // If in edit mode and school is already saved, streams cannot be changed
    if (isLocked || isSubmitted) {
      return true;
    }
    
    // If any curriculum level is selected, streams cannot be enabled
    const hasAnyLevelSelected = 
      formData.has_pre_primary || 
      formData.has_primary || 
      formData.has_junior_secondary || 
      formData.has_senior_secondary || 
      formData.has_secondary;
    
    return hasAnyLevelSelected;
  };
  
  // NEW FEATURE 2: Lock fields that cannot be edited after saving
  // Check if field should be locked (uneditable)
  const isFieldLocked = (fieldName) => {
    // If school is already saved (edit mode or submitted), certain fields are locked
    if (isLocked || isSubmitted) {
      const lockedFields = [
        'schoolType',
        'primaryCurriculum', 
        'secondaryCurriculum',
        'has_pre_primary',
        'has_primary',
        'has_junior_secondary',
        'has_senior_secondary',
        'has_secondary',
        'grade_levels',
        'senior_secondary_pathways',
        'hasStreams'
      ];
      
      // Check if this field should be locked
      if (lockedFields.includes(fieldName)) {
        return true;
      }
    }
    
    return false;
  };
  
  // Update secondary curriculum when primary curriculum changes
  useEffect(() => {
    if (formData.primaryCurriculum === 'Both') {
      setFormData(prev => ({ ...prev, secondaryCurriculum: 'Both' }));
    } else if (formData.primaryCurriculum === 'CBC' || formData.primaryCurriculum === '8-4-4') {
      setFormData(prev => ({ ...prev, secondaryCurriculum: prev.secondaryCurriculum || formData.primaryCurriculum }));
    }
    
    // Reset grade levels when curriculum changes
    setFormData(prev => ({ ...prev, grade_levels: [] }));
  }, [formData.primaryCurriculum]);
  
  // Update level checkboxes based on curriculum
  useEffect(() => {
    if (formData.primaryCurriculum === 'CBC') {
      setFormData(prev => ({
        ...prev,
        has_secondary: false // Reset 8-4-4 secondary when CBC is selected
      }));
    } else if (formData.primaryCurriculum === '8-4-4') {
      setFormData(prev => ({
        ...prev,
        has_pre_primary: false, // Reset CBC pre-primary when 8-4-4 is selected
        has_junior_secondary: false, // Reset CBC junior secondary when 8-4-4 is selected
        has_senior_secondary: false, // Reset CBC senior secondary when 8-4-4 is selected
      }));
    }
  }, [formData.primaryCurriculum]);
  
  // Update pathways based on senior secondary selection
  useEffect(() => {
    if (!formData.has_senior_secondary) {
      setFormData(prev => ({ ...prev, senior_secondary_pathways: [] }));
    }
  }, [formData.has_senior_secondary]);
  
  // Auto-select grade levels for all levels
  useEffect(() => {
    let selectedLevels = [];
    
    if (formData.primaryCurriculum === 'CBC') {
      if (formData.has_pre_primary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Pre-Primary').map(level => level.id));
      }
      if (formData.has_primary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Primary').map(level => level.id));
      }
      if (formData.has_junior_secondary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Junior Secondary').map(level => level.id));
      }
      if (formData.has_senior_secondary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Senior Secondary').map(level => level.id));
      }
    } else if (formData.primaryCurriculum === '8-4-4') {
      if (formData.has_primary) {
        selectedLevels.push(...classLevels.filter(level => level.level === 'Primary').map(level => level.id));
      }
      if (formData.has_secondary) {
        selectedLevels.push(...classLevels.filter(level => level.level === 'Secondary').map(level => level.id));
      }
    } else if (formData.primaryCurriculum === 'Both') {
      if (formData.has_pre_primary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Pre-Primary').map(level => level.id));
      }
      if (formData.has_primary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Primary').map(level => level.id));
        selectedLevels.push(...classLevels.filter(level => level.level === 'Primary').map(level => level.id));
      }
      if (formData.has_junior_secondary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Junior Secondary').map(level => level.id));
      }
      if (formData.has_senior_secondary) {
        selectedLevels.push(...cbcGradeLevels.filter(level => level.level === 'Senior Secondary').map(level => level.id));
      }
      if (formData.has_secondary) {
        selectedLevels.push(...classLevels.filter(level => level.level === 'Secondary').map(level => level.id));
      }
    }
    
    // Remove duplicates
    selectedLevels = [...new Set(selectedLevels)];
    
    setFormData(prev => ({ ...prev, grade_levels: selectedLevels }));
  }, [
    formData.has_pre_primary,
    formData.has_primary,
    formData.has_junior_secondary,
    formData.has_senior_secondary,
    formData.has_secondary,
    formData.primaryCurriculum
  ]);
  
  // Update curriculum options based on school type
  useEffect(() => {
    if (formData.schoolType === 'Primary') {
      setFormData(prev => ({
        ...prev,
        primaryCurriculum: 'CBC', // Force CBC for primary schools
        secondaryCurriculum: '', // Clear secondary curriculum
        has_senior_secondary: false, // Primary schools don't have senior secondary
        has_secondary: false
      }));
    } else if (formData.schoolType === 'Secondary') {
      setFormData(prev => ({
        ...prev,
        primaryCurriculum: '', // Clear primary curriculum
        has_pre_primary: false,
        has_primary: false,
        has_junior_secondary: false
      }));
    } else if (formData.schoolType === 'Mixed') {
      setFormData(prev => ({
        ...prev,
        primaryCurriculum: 'CBC', // Mixed schools primary curriculum should only be CBC
        secondaryCurriculum: prev.secondaryCurriculum || '' // Let user choose secondary curriculum
      }));
    }
  }, [formData.schoolType]);
  
  // Fix: Show 8-4-4 secondary level when secondary curriculum is Both
  const shouldShow844Secondary = () => {
    if (formData.schoolType === 'Primary') return false;
    
    return (
      formData.primaryCurriculum === '8-4-4' ||
      formData.primaryCurriculum === 'Both' ||
      formData.secondaryCurriculum === '8-4-4' ||
      formData.secondaryCurriculum === 'Both'
    );
  };
  
  // Fix: Show CBC levels when secondary curriculum is Both
  const shouldShowCBCLevels = () => {
    if (formData.schoolType === 'Primary') return true;
    
    return (
      formData.primaryCurriculum === 'CBC' ||
      formData.primaryCurriculum === 'Both' ||
      formData.secondaryCurriculum === 'CBC' ||
      formData.secondaryCurriculum === 'Both'
    );
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // NEW FEATURE: Check if field is locked before allowing changes
    if (isFieldLocked(name)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGradeLevelChange = (levelId) => {
    // NEW FEATURE: Check if grade levels are locked
    if (isFieldLocked('grade_levels')) {
      return;
    }
    
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
    // NEW FEATURE: Check if pathways are locked
    if (isFieldLocked('senior_secondary_pathways')) {
      return;
    }
    
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
      setLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const formDataToSend = new FormData();

      // 🏫 School Info
      formDataToSend.append("school[name]", formData.schoolName);
      formDataToSend.append("school[school_type]", formData.schoolType);
      formDataToSend.append("school[address]", formData.address);
      formDataToSend.append("school[city]", formData.city);
      formDataToSend.append("school[phone]", formData.phone);
      formDataToSend.append("school[email]", formData.email);
      formDataToSend.append("school[code]", formData.code);
      formDataToSend.append("school[primary_curriculum]", formData.primaryCurriculum);
      formDataToSend.append("school[secondary_curriculum]", formData.secondaryCurriculum);
      formDataToSend.append("school[has_streams]", formData.hasStreams ? "1" : "0");
      
      // Curriculum Levels
      formDataToSend.append("school[has_pre_primary]", formData.has_pre_primary ? "1" : "0");
      formDataToSend.append("school[has_primary]", formData.has_primary ? "1" : "0");
      formDataToSend.append("school[has_junior_secondary]", formData.has_junior_secondary ? "1" : "0");
      formDataToSend.append("school[has_senior_secondary]", formData.has_senior_secondary ? "1" : "0");
      formDataToSend.append("school[has_secondary]", formData.has_secondary ? "1" : "0");
      
      // Grade Levels
      if (formData.grade_levels.length > 0) {
        formData.grade_levels.forEach(level => {
          formDataToSend.append("school[grade_levels][]", level);
        });
      }
      
      // Senior Secondary Pathways
      if (formData.senior_secondary_pathways.length > 0) {
        formData.senior_secondary_pathways.forEach(pathway => {
          formDataToSend.append("school[senior_secondary_pathways][]", pathway);
        });
      }
      
      if (logo) formDataToSend.append("school[logo]", logo);

      // 👩‍💼 Admin Info (only for new registrations)
      if (!isEditMode) {
        formDataToSend.append("admin[full_name]", formData.adminName);
        formDataToSend.append("admin[gender]", formData.gender);
        formDataToSend.append("admin[email]", formData.adminEmail);
        formDataToSend.append("admin[phone]", formData.adminPhone);
        formDataToSend.append("admin[password]", formData.password);
      }

      const endpoint = isEditMode 
        ? `${API_BASE_URL}/schools/${initialData.id}`
        : `${API_BASE_URL}/schools`;
        
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        body: formDataToSend,
        headers: { Accept: "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Validation errors:", data);

        if (response.status === 422 && data.errors) {
          setErrors(data.errors);
          return;
        }

        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} school`);
      }

      // NEW FEATURE: Mark as submitted/locked after successful save
      setIsSubmitted(true);
      if (!isEditMode) {
        setIsLocked(true);
      }

      if (onSave) onSave(data);
      
      if (!isEditMode) {
        navigate('/login');
      } else {
        // Show success message for edit mode
        alert('School updated successfully!');
      }
    } catch (error) {
      setErrors(error.message);
    }
  };

  const fieldLabels = {
    "school.name": "School Name",
    "school.email": "School Email",
    "school.phone": "School Phone",
    "school.address": "School Address",
    "school.code": "School Code",
    "school.city": "City",
    "school.primary_curriculum": "Primary Curriculum",
    "school.secondary_curriculum": "Secondary Curriculum",
    "school.has_streams": "Enable Streams",
    "school.has_pre_primary": "Pre-Primary Level",
    "school.has_primary": "Primary Level",
    "school.has_junior_secondary": "Junior Secondary Level",
    "school.has_senior_secondary": "Senior Secondary Level",
    "school.has_secondary": "Secondary Level (8-4-4)",
    "school.senior_secondary_pathways": "Senior Secondary Pathways",
    "school.grade_levels": "Grade Levels",
    "admin.full_name": "Admin Full Name",
    "admin.email": "Admin Email",
    "admin.phone": "Admin Phone",
    "admin.password": "Admin Password",
    "admin.gender": "Admin Gender"
  };

  const curriculumOptions = [
    { value: 'CBC', label: 'CBC (Competency-Based Curriculum)' },
    { value: '8-4-4', label: '8-4-4 System' },
    { value: 'Both', label: 'Both Systems' }
  ];

  const pathwayOptions = [
    { value: 'STEM', label: 'STEM (Science, Technology, Engineering, Mathematics)' },
    { value: 'Arts', label: 'Arts & Sports Science' },
    { value: 'Social Sciences', label: 'Social Sciences' }
  ];

  // Get appropriate grade levels based on curriculum
  const getGradeLevels = () => {
    if (formData.primaryCurriculum === 'CBC') {
      return cbcGradeLevels;
    } else if (formData.primaryCurriculum === '8-4-4') {
      return classLevels;
    } else if (formData.primaryCurriculum === 'Both') {
      return [...cbcGradeLevels, ...classLevels];
    }
    return [];
  };

  // Get filtered curriculum options based on school type
  const getFilteredCurriculumOptions = (isPrimary) => {
    if (formData.schoolType === 'Primary') {
      return isPrimary 
        ? curriculumOptions.filter(option => option.value === 'CBC')
        : [{ value: '', label: 'Not applicable for primary schools' }];
    } else if (formData.schoolType === 'Secondary') {
      return isPrimary 
        ? [{ value: '', label: 'Not applicable for secondary schools' }]
        : curriculumOptions;
    } else if (formData.schoolType === 'Mixed') {
      if (isPrimary) {
        return curriculumOptions.filter(option => option.value === 'CBC');
      } else {
        return curriculumOptions;
      }
    } else {
      return curriculumOptions;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-6xl rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg sm:shadow-xl lg:shadow-2xl">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800/50 p-4 sm:p-6 md:p-8 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black dark:bg-white rounded-lg">
                <School className="w-5 h-5 text-white dark:text-black" />
              </div>
              <div>
                <h2 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  {isEditMode ? 'Edit School' : 'Create Your School'}
                </h2>
                <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
                  {isEditMode 
                    ? 'Update your school information' 
                    : 'Register your school and set up your administrator account'}
                </p>
              </div>
            </div>
            
            {/* Lock/Edit Indicator */}
            {(isLocked || isSubmitted) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isEditMode ? 'Edit Mode: Some fields cannot be changed' : 'School structure cannot be changed after creation'}
                </span>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isEditMode ? 'Cancel' : 'Back to Login'}
                </button>
              )}
            </div>
          </div>

          {/* Warning Alert for Locked Fields */}
          {(isLocked || isSubmitted) && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Important Notice: Restricted Fields
                </h3>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                School type, curriculum, and level selections cannot be changed once saved. 
                This ensures consistency in school structure and prevents data conflicts.
                {isEditMode && ' You can only modify basic information and contact details.'}
              </p>
            </div>
          )}

          {/* Error Alert */}
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
                    <strong>{fieldLabels[field] || field}:</strong>{" "}
                    {Array.isArray(messages) ? messages.join(", ") : messages}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Card Container */}
          <div className="bg-white dark:bg-slate-800/50 p-6 space-y-8">
            
            {/* Logo Upload Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                      <School className="w-16 h-16 text-blue-400 dark:text-blue-500" />
                    </div>
                  )}
                </div>
                {logoPreview && !isLocked && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {!isLocked && (
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
                )}
              </div>
              <div>
                <h3 className="font-medium text-[#0d141b] dark:text-white mb-1">School Logo</h3>
                <p className="text-sm text-[#4c739a] dark:text-slate-400">
                  Upload a new logo. Max size: 2MB. Recommended: 256×256px
                  {isLocked && " (Cannot be changed)"}
                </p>
              </div>
            </div>

            {/* School Information */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black dark:bg-white rounded-lg">
                  <School className="w-5 h-5 text-white dark:text-black" />
                </div>
                <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">School Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="e.g., Northwood High School"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                    disabled={isLocked && isEditMode}
                  />
                  {isLocked && isEditMode && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      School name can only be changed by contacting support
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    School Type *
                  </label>
                  <select
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('schoolType') ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                    disabled={isFieldLocked('schoolType')}
                  >
                    <option value="">Select type</option>
                    <option value="Primary">Primary School</option>
                    <option value="Secondary">Secondary School</option>
                    <option value="Mixed">Mixed (Primary & Secondary)</option>
                  </select>
                  {isFieldLocked('schoolType') && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      School type cannot be changed after initial setup
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    School Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g., NHS2024"
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isLocked && isEditMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                    disabled={isLocked && isEditMode}
                  />
                  {isLocked && isEditMode && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      School code is permanent and cannot be changed
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Primary Curriculum *
                  </label>
                  <select
                    name="primaryCurriculum"
                    value={formData.primaryCurriculum}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('primaryCurriculum') ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                    disabled={isFieldLocked('primaryCurriculum') || formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed'}
                  >
                    <option value="">Select curriculum</option>
                    {getFilteredCurriculumOptions(true).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {formData.schoolType === 'Primary' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary schools use CBC curriculum by default
                    </p>
                  )}
                  {formData.schoolType === 'Secondary' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary curriculum is not applicable for secondary schools
                    </p>
                  )}
                  {formData.schoolType === 'Mixed' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mixed schools primary curriculum is automatically set to CBC
                    </p>
                  )}
                  {isFieldLocked('primaryCurriculum') && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Primary curriculum cannot be changed after initial setup
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Secondary Curriculum *
                  </label>
                  <select
                    name="secondaryCurriculum"
                    value={formData.secondaryCurriculum}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('secondaryCurriculum') ? 'opacity-70 cursor-not-allowed' : ''}`}
                    required
                    disabled={isFieldLocked('secondaryCurriculum') || formData.schoolType === 'Primary'}
                  >
                    <option value="">Select curriculum</option>
                    {getFilteredCurriculumOptions(false).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {formData.schoolType === 'Secondary' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Secondary schools can choose between CBC (for senior secondary with STEM pathways) and 8-4-4
                    </p>
                  )}
                  {formData.schoolType === 'Primary' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Secondary curriculum is not applicable for primary schools
                    </p>
                  )}
                  {formData.schoolType === 'Mixed' && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose the secondary curriculum for your mixed school
                    </p>
                  )}
                  {isFieldLocked('secondaryCurriculum') && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Secondary curriculum cannot be changed after initial setup
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g., 123 Education Lane"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Northwood"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., (123) 456-7890"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g., contact@northwood.edu"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Has Streams Field - NEW FEATURE: Disabled when curriculum levels selected */}
              <div className={`mt-6 p-4 border rounded-lg ${shouldDisableStreams() ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      id="hasStreams"
                      name="hasStreams"
                      checked={formData.hasStreams}
                      onChange={handleChange}
                      disabled={shouldDisableStreams()}
                      className={`w-5 h-5 ${shouldDisableStreams() ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="hasStreams" className={`block text-sm font-medium ${shouldDisableStreams() ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                      Enable Streams for this School
                      {shouldDisableStreams() && " (Cannot be changed)"}
                    </label>
                    <p className={`text-xs ${shouldDisableStreams() ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                      {shouldDisableStreams() 
                        ? 'Streams setting cannot be changed once curriculum levels are selected or after school is saved.'
                        : 'Check this box if your school uses stream-based organization (e.g., Class A, Class B, etc.). This will allow you to create streams and assign teachers and students to them.'}
                    </p>
                    {shouldDisableStreams() && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded">
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          <strong>Note:</strong> Streams cannot be enabled or disabled after curriculum levels are selected. 
                          This ensures consistent school structure management.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum Levels Section */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black dark:bg-white rounded-lg">
                    <GraduationCap className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">Curriculum Levels</h2>
                </div>
                {!isFieldLocked('has_pre_primary') && (
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {showAdvancedOptions ? (
                      <>
                        Hide Advanced Options
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show Advanced Options
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CBC Levels - Show when CBC curriculum is selected */}
                {shouldShowCBCLevels() && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">CBC Levels</h3>
                      {isFieldLocked('has_pre_primary') && (
                        <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                          Locked
                        </span>
                      )}
                    </div>
                    
                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_pre_primary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_pre_primary"
                            name="has_pre_primary"
                            checked={formData.has_pre_primary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_pre_primary') || formData.primaryCurriculum === '8-4-4' || formData.schoolType === 'Secondary'}
                            className={`w-5 h-5 ${isFieldLocked('has_pre_primary') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_pre_primary" className={`block text-sm font-medium ${isFieldLocked('has_pre_primary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Pre-Primary (PP1-PP2)
                            {isFieldLocked('has_pre_primary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_pre_primary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Early childhood education for ages 4-6
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_primary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_primary"
                            name="has_primary"
                            checked={formData.has_primary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_primary') || formData.schoolType === 'Secondary'}
                            className={`w-5 h-5 ${isFieldLocked('has_primary') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_primary" className={`block text-sm font-medium ${isFieldLocked('has_primary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Primary (Grade 1-6)
                            {isFieldLocked('has_primary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_primary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Primary education for ages 6-12
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_junior_secondary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_junior_secondary"
                            name="has_junior_secondary"
                            checked={formData.has_junior_secondary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_junior_secondary') || formData.primaryCurriculum === '8-4-4' || formData.schoolType === 'Secondary'}
                            className={`w-5 h-5 ${isFieldLocked('has_junior_secondary') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_junior_secondary" className={`block text-sm font-medium ${isFieldLocked('has_junior_secondary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Junior Secondary (Grade 7-9)
                            {isFieldLocked('has_junior_secondary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_junior_secondary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Lower secondary education for ages 12-15
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Only show Senior Secondary for Secondary schools or Mixed schools */}
                    {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && (
                      <div className={`p-4 border rounded-lg ${isFieldLocked('has_senior_secondary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              id="has_senior_secondary"
                              name="has_senior_secondary"
                              checked={formData.has_senior_secondary}
                              onChange={handleChange}
                              disabled={isFieldLocked('has_senior_secondary') || formData.primaryCurriculum === '8-4-4' || 
                                (formData.secondaryCurriculum === '8-4-4' && formData.primaryCurriculum !== 'Both')}
                              className={`w-5 h-5 ${isFieldLocked('has_senior_secondary') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="has_senior_secondary" className={`block text-sm font-medium ${isFieldLocked('has_senior_secondary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                              Senior Secondary (Grade 10-12)
                              {isFieldLocked('has_senior_secondary') && " (Cannot be changed)"}
                            </label>
                            <p className={`text-xs ${isFieldLocked('has_senior_secondary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                              Upper secondary education for ages 15-18 with STEM pathways
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Senior Secondary Pathways */}
                    {formData.has_senior_secondary && (
                      <div className={`p-4 border rounded-lg ${isFieldLocked('senior_secondary_pathways') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Senior Secondary Pathways
                          </h4>
                          {isFieldLocked('senior_secondary_pathways') && (
                            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                              Locked
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isFieldLocked('senior_secondary_pathways') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mb-3`}>
                          {isFieldLocked('senior_secondary_pathways') 
                            ? 'Pathways cannot be changed after initial setup'
                            : 'Select the pathways your school offers for Senior Secondary students'}
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
                                  disabled={isFieldLocked('senior_secondary_pathways')}
                                  className={`w-5 h-5 ${isFieldLocked('senior_secondary_pathways') ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2`}
                                />
                              </div>
                              <div className="flex-1">
                                <label htmlFor={`pathway_${option.value}`} className={`block text-sm font-medium ${isFieldLocked('senior_secondary_pathways') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                                  {option.label}
                                  {isFieldLocked('senior_secondary_pathways') && " (Locked)"}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 8-4-4 Levels - Show when 8-4-4 curriculum is selected */}
                {shouldShow844Secondary() && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">8-4-4 Levels</h3>
                      {isFieldLocked('has_secondary') && (
                        <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                          Locked
                        </span>
                      )}
                    </div>
                    
                    {/* Only show Primary level for Primary or Mixed schools */}
                    {(formData.schoolType === 'Primary' || formData.schoolType === 'Mixed') && (
                      <div className={`p-4 border rounded-lg ${isFieldLocked('has_primary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              id="has_primary_844"
                              name="has_primary"
                              checked={formData.has_primary}
                              onChange={handleChange}
                              disabled={isFieldLocked('has_primary') || formData.primaryCurriculum === 'CBC' || formData.schoolType === 'Secondary'}
                              className={`w-5 h-5 ${isFieldLocked('has_primary') ? 'text-gray-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="has_primary_844" className={`block text-sm font-medium ${isFieldLocked('has_primary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                              Primary (Standard 1-8)
                              {isFieldLocked('has_primary') && " (Cannot be changed)"}
                            </label>
                            <p className={`text-xs ${isFieldLocked('has_primary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                              Primary education for ages 6-13
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show Secondary level for Secondary or Mixed schools */}
                    {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && (
                      <div className={`p-4 border rounded-lg ${isFieldLocked('has_secondary') ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              id="has_secondary"
                              name="has_secondary"
                              checked={formData.has_secondary}
                              onChange={handleChange}
                              disabled={isFieldLocked('has_secondary') || formData.primaryCurriculum === 'CBC' || 
                                (formData.secondaryCurriculum === 'CBC' && formData.primaryCurriculum !== 'Both')}
                              className={`w-5 h-5 ${isFieldLocked('has_secondary') ? 'text-gray-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="has_secondary" className={`block text-sm font-medium ${isFieldLocked('has_secondary') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                              Secondary (Form 1-4)
                              {isFieldLocked('has_secondary') && " (Cannot be changed)"}
                            </label>
                            <p className={`text-xs ${isFieldLocked('has_secondary') ? 'text-gray-500 dark:text-gray-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                              Secondary education for ages 13-17
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {showAdvancedOptions && !isFieldLocked('has_secondary') && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                          Advanced Options
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Additional settings for curriculum configuration will be available here in future updates.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Grade Levels / Class Levels Section */}
            {formData.primaryCurriculum && (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-black dark:bg-white rounded-lg">
                    <Award className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">
                      {formData.primaryCurriculum === '8-4-4' ? 'Class Levels' : 'Grade Levels'}
                    </h2>
                    {isFieldLocked('grade_levels') && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                        Grade/Class levels cannot be changed after initial setup
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.primaryCurriculum === 'CBC' && (
                    <div className="space-y-4">
                      {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                        const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                        if (levelGrades.length === 0) return null;
                        
                        const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                              level === 'Primary' ? formData.has_primary :
                                              formData.has_junior_secondary;
                        
                        return (
                          <div key={level} className={`p-4 ${isLevelSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'} border rounded-lg`}>
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {levelGrades.map(grade => (
                                <div key={grade.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`grade_${grade.id}`}
                                    checked={formData.grade_levels.includes(grade.id)}
                                    onChange={() => handleGradeLevelChange(grade.id)}
                                    disabled={!isLevelSelected || isFieldLocked('grade_levels')}
                                    className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                  />
                                  <label htmlFor={`grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {grade.name}
                                    {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Senior Secondary - Always visible when has_senior_secondary is true */}
                      {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && formData.has_senior_secondary && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Senior Secondary</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            These grade levels are automatically selected and managed when you enable the Senior Secondary level.
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {cbcGradeLevels.filter(g => g.level === 'Senior Secondary').map(grade => (
                              <div key={grade.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`grade_${grade.id}`}
                                  checked={formData.grade_levels.includes(grade.id)}
                                  onChange={() => handleGradeLevelChange(grade.id)}
                                  disabled={isFieldLocked('grade_levels')}
                                  className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                />
                                <label htmlFor={`grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {grade.name}
                                  {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.primaryCurriculum === '8-4-4' && (
                    <div className="space-y-4">
                      {['Primary', 'Secondary'].map(level => {
                        const levelClasses = classLevels.filter(c => c.level === level);
                        if (levelClasses.length === 0) return null;
                        
                        const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                              formData.has_secondary;
                        
                        // Skip primary levels if school type is Secondary
                        if (level === 'Primary' && formData.schoolType === 'Secondary') {
                          return null;
                        }
                        
                        return (
                          <div key={level} className={`p-4 ${isLevelSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'} border rounded-lg`}>
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {levelClasses.map(cls => (
                                <div key={cls.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`class_${cls.id}`}
                                    checked={formData.grade_levels.includes(cls.id)}
                                    onChange={() => handleGradeLevelChange(cls.id)}
                                    disabled={!isLevelSelected || isFieldLocked('grade_levels')}
                                    className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                                  />
                                  <label htmlFor={`class_${cls.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {cls.name}
                                    {isFieldLocked('grade_levels') && formData.grade_levels.includes(cls.id) && " ✓"}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {formData.primaryCurriculum === 'Both' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          You have selected to offer both CBC and 8-4-4 curricula. Please select the grade levels for CBC and class levels for 8-4-4 that your school offers.
                        </p>
                        {isFieldLocked('grade_levels') && (
                          <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                            ⚠️ Grade/Class levels cannot be changed after initial setup
                          </p>
                        )}
                      </div>
                      
                      {/* CBC Grade Levels */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">CBC Grade Levels</h3>
                        {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                          const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                          if (levelGrades.length === 0) return null;
                          
                          const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                                level === 'Primary' ? formData.has_primary :
                                                formData.has_junior_secondary;
                          
                          return (
                            <div key={`cbc_${level}`} className={`p-4 ${isLevelSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'} border rounded-lg`}>
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {levelGrades.map(grade => (
                                  <div key={grade.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`cbc_grade_${grade.id}`}
                                      checked={formData.grade_levels.includes(grade.id)}
                                      onChange={() => handleGradeLevelChange(grade.id)}
                                      disabled={!isLevelSelected || isFieldLocked('grade_levels')}
                                      className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                    />
                                    <label htmlFor={`cbc_grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {grade.name}
                                      {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Senior Secondary - Always visible when has_senior_secondary is true */}
                        {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && formData.has_senior_secondary && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Senior Secondary</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              These grade levels are automatically selected and managed when you enable the Senior Secondary level.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {cbcGradeLevels.filter(g => g.level === 'Senior Secondary').map(grade => (
                                <div key={grade.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`cbc_grade_${grade.id}`}
                                    checked={formData.grade_levels.includes(grade.id)}
                                    onChange={() => handleGradeLevelChange(grade.id)}
                                    disabled={isFieldLocked('grade_levels')}
                                    className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                  />
                                  <label htmlFor={`cbc_grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {grade.name}
                                    {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 8-4-4 Class Levels */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-green-700 dark:text-green-300">8-4-4 Class Levels</h3>
                        {['Primary', 'Secondary'].map(level => {
                          const levelClasses = classLevels.filter(c => c.level === level);
                          if (levelClasses.length === 0) return null;
                          
                          const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                                formData.has_secondary;
                          
                          // Skip primary levels if school type is Secondary
                          if (level === 'Primary' && formData.schoolType === 'Secondary') {
                            return null;
                          }
                          
                          return (
                            <div key={`844_${level}`} className={`p-4 ${isLevelSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'} border rounded-lg`}>
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{level}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {levelClasses.map(cls => (
                                  <div key={cls.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`844_class_${cls.id}`}
                                      checked={formData.grade_levels.includes(cls.id)}
                                      onChange={() => handleGradeLevelChange(cls.id)}
                                      disabled={!isLevelSelected || isFieldLocked('grade_levels')}
                                      className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-gray-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                                    />
                                    <label htmlFor={`844_class_${cls.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-gray-500 dark:text-gray-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {cls.name}
                                      {isFieldLocked('grade_levels') && formData.grade_levels.includes(cls.id) && " ✓"}
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

            {/* Admin Information - Only show for new registrations */}
            {!isEditMode && (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-black dark:bg-white rounded-lg">
                    <User className="w-5 h-5 text-white dark:text-black" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#0d141b] dark:text-white">Administrator Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleChange}
                      placeholder="e.g., Dr. Jane Smith"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      placeholder="e.g., admin@northwood.edu"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="adminPhone"
                      value={formData.adminPhone}
                      onChange={handleChange}
                      placeholder="e.g., (123) 456-7890"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a secure password"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent pr-10 transition-colors"
                        required
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  {isEditMode ? 'Cancel' : 'Cancel'}
                </button>
              )}
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isSubmitted ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200'} text-white`}
                disabled={isSubmitted}
              >
                <Save className="w-4 h-4" />
                {isEditMode 
                  ? (isSubmitted ? 'School Updated' : 'Update School') 
                  : (isSubmitted ? 'School Created' : 'Create School')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SchoolRegistration;
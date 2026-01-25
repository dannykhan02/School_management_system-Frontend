import React, { useEffect, useState } from "react";
import { Save, School, Upload, AlertCircle, X, Eye, EyeOff, History, CheckSquare, Square, ChevronDown, ChevronUp, GraduationCap, Award, Shield, Users, Loader, MapPin, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../utils/api";
import { toast } from "react-toastify";
import SuperAdminContactCard from "../../../components/SuperAdminContactCard";
import SchoolStructureInfo from "../../../components/SchoolStructureInfo";

function EditSchoolProfile() {
  const navigate = useNavigate();

  console.log("✅ EditSchoolProfile component is rendering");

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolType: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    code: "",
    primary_curriculum: "Both",
    secondary_curriculum: "Both",
    has_streams: false,
    has_pre_primary: false,
    has_primary: false,
    has_junior_secondary: false,
    has_senior_secondary: false,
    has_secondary: false,
    senior_secondary_pathways: [],
    grade_levels: [],
  });

  const [schoolId, setSchoolId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  
  // Super Admin related states
  const [showSuperAdminCard, setShowSuperAdminCard] = useState(false);

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

  const handleSuperAdminClick = () => {
    setShowSuperAdminCard(!showSuperAdminCard);
  };

  useEffect(() => {
    console.log("🔍 EditSchoolProfile useEffect running");
    const fetchSchool = async () => {
      try {
        console.log("📡 Fetching school data from API...");
        setIsLoading(true);
        const response = await apiRequest('schools/my-school', "GET");
        console.log("✅ API Response received:", response);
        console.log("📊 School data:", response.data);
        
        if (!response.data) {
          console.error("❌ No data received from API");
          toast.error("No school data found");
          setIsLoading(false);
          return;
        }

        const data = response.data;
        setSchoolId(data.id);
        console.log("🏫 School ID:", data.id);

        const schoolData = {
          schoolName: data.name || "",
          schoolType: data.school_type || "",
          address: data.address || "",
          city: data.city || "",
          phone: data.phone || "",
          email: data.email || "",
          code: data.code || "",
          primary_curriculum: data.primary_curriculum || "Both",
          secondary_curriculum: data.secondary_curriculum || "Both",
          has_streams: data.has_streams || false,
          has_pre_primary: data.has_pre_primary || false,
          has_primary: data.has_primary || false,
          has_junior_secondary: data.has_junior_secondary || false,
          has_senior_secondary: data.has_senior_secondary || false,
          has_secondary: data.has_secondary || false,
          senior_secondary_pathways: data.senior_secondary_pathways || [],
          grade_levels: data.grade_levels || [],
        };

        console.log("📝 Setting form data:", schoolData);
        setFormData(schoolData);
        setOriginalData(schoolData);

        if (data.logo) {
          console.log("🖼️ Setting logo preview");
          setLogoPreview(data.logo);
          setLogoError(false);
        }
        
        console.log("✅ School data loaded successfully");
      } catch (err) {
        console.error("❌ Failed to fetch school:", err);
        console.error("Error details:", err.response || err.message);
        toast.error("Failed to load school data. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchool();
  }, []);

  useEffect(() => {
    console.log("🔄 Form data updated:", formData);
  }, [formData]);

  // Check if field should be locked in edit mode
  const isFieldLocked = (fieldName) => {
    if (!isLocked) return false;
    
    // Fields that cannot be edited in edit mode
    const lockedFields = [
      'schoolType',
      'primary_curriculum',
      'secondary_curriculum',
      'has_streams',
      'has_pre_primary',
      'has_primary',
      'has_junior_secondary',
      'has_senior_secondary',
      'has_secondary',
      'senior_secondary_pathways',
      'grade_levels'
    ];
    
    return lockedFields.includes(fieldName);
  };

  // Check if streams should be disabled based on curriculum levels
  const shouldDisableStreams = () => {
    // In edit mode, streams should always be locked if the school structure is already defined
    if (isLocked) {
      return true;
    }
    
    // Check if any curriculum level is selected
    const hasAnyLevelSelected = 
      formData.has_pre_primary || 
      formData.has_primary || 
      formData.has_junior_secondary || 
      formData.has_senior_secondary || 
      formData.has_secondary;
    
    return hasAnyLevelSelected;
  };

  // Update secondary curriculum when primary curriculum changes
  useEffect(() => {
    if (formData.primary_curriculum === 'Both') {
      setFormData(prev => ({ ...prev, secondary_curriculum: 'Both' }));
    } else if (formData.primary_curriculum === 'CBC' || formData.primary_curriculum === '8-4-4') {
      setFormData(prev => ({ ...prev, secondary_curriculum: prev.secondary_curriculum || formData.primary_curriculum }));
    }
  }, [formData.primary_curriculum]);
  
  // Update level checkboxes based on curriculum
  useEffect(() => {
    if (formData.primary_curriculum === 'CBC') {
      setFormData(prev => ({
        ...prev,
        has_secondary: false
      }));
    } else if (formData.primary_curriculum === '8-4-4') {
      setFormData(prev => ({
        ...prev,
        has_pre_primary: false,
        has_junior_secondary: false,
        has_senior_secondary: false,
      }));
    }
  }, [formData.primary_curriculum]);
  
  // Update pathways based on senior secondary selection
  useEffect(() => {
    if (!formData.has_senior_secondary) {
      setFormData(prev => ({ ...prev, senior_secondary_pathways: [] }));
    }
  }, [formData.has_senior_secondary]);

  // Auto-select grade levels when level checkboxes change
  useEffect(() => {
    let selectedLevels = [];
    
    if (formData.primary_curriculum === 'CBC') {
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
    } else if (formData.primary_curriculum === '8-4-4') {
      if (formData.has_primary) {
        selectedLevels.push(...classLevels.filter(level => level.level === 'Primary').map(level => level.id));
      }
      if (formData.has_secondary) {
        selectedLevels.push(...classLevels.filter(level => level.level === 'Secondary').map(level => level.id));
      }
    } else if (formData.primary_curriculum === 'Both') {
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
    
    selectedLevels = [...new Set(selectedLevels)];
    
    setFormData(prev => ({ ...prev, grade_levels: selectedLevels }));
  }, [
    formData.has_pre_primary,
    formData.has_primary,
    formData.has_junior_secondary,
    formData.has_senior_secondary,
    formData.has_secondary,
    formData.primary_curriculum
  ]);

  // Update curriculum options based on school type
  useEffect(() => {
    if (formData.schoolType === 'Primary') {
      setFormData(prev => ({
        ...prev,
        primary_curriculum: 'CBC',
        secondary_curriculum: '',
        has_senior_secondary: false,
        has_secondary: false
      }));
    } else if (formData.schoolType === 'Secondary') {
      setFormData(prev => ({
        ...prev,
        primary_curriculum: '',
        has_pre_primary: false,
        has_primary: false,
        has_junior_secondary: false
      }));
    } else if (formData.schoolType === 'Mixed') {
      setFormData(prev => ({
        ...prev,
        primary_curriculum: 'CBC',
        secondary_curriculum: prev.secondary_curriculum || ''
      }));
    }
  }, [formData.schoolType]);

  // Track unsaved changes
  useEffect(() => {
    if (originalData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData) || logoFile !== null;
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, logoFile, originalData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Check if field is locked before allowing changes
    if (isFieldLocked(name)) {
      return;
    }
    
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleGradeLevelChange = (levelId) => {
    // Check if grade levels are locked
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
    // Check if pathways are locked
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
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size should not exceed 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      setLogoFile(file);
      setLogoError(false);

      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 Submitting form data...");
    setErrors({});
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.schoolName);
      formDataToSend.append("school_type", formData.schoolType);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("city", formData.city);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("code", formData.code);
      formDataToSend.append("primary_curriculum", formData.primary_curriculum);
      formDataToSend.append("secondary_curriculum", formData.secondary_curriculum);
      formDataToSend.append("has_streams", formData.has_streams ? "1" : "0");
      
      formDataToSend.append("has_pre_primary", formData.has_pre_primary ? "1" : "0");
      formDataToSend.append("has_primary", formData.has_primary ? "1" : "0");
      formDataToSend.append("has_junior_secondary", formData.has_junior_secondary ? "1" : "0");
      formDataToSend.append("has_senior_secondary", formData.has_senior_secondary ? "1" : "0");
      formDataToSend.append("has_secondary", formData.has_secondary ? "1" : "0");
      
      if (formData.grade_levels.length > 0) {
        formData.grade_levels.forEach(level => {
          formDataToSend.append("grade_levels[]", level);
        });
      }
      
      if (formData.senior_secondary_pathways.length > 0) {
        formData.senior_secondary_pathways.forEach(pathway => {
          formDataToSend.append("senior_secondary_pathways[]", pathway);
        });
      }

      if (logoFile) formDataToSend.append("logo", logoFile);
      formDataToSend.append("_method", "PUT");

      console.log("📝 Updating school with ID:", schoolId);
      console.log("📦 FormData being sent:", Object.fromEntries(formDataToSend));
      
      // Use schoolId from state
      const response = await apiRequest(`schools/${schoolId}`, "POST", formDataToSend);
      console.log("✅ Update successful:", response);
      
      toast.success("School profile updated successfully");
      setHasUnsavedChanges(false);
      setTimeout(() => navigate("/admin/dashboard"), 1500);
    } catch (err) {
      console.error("❌ Update failed:", err);
      if (err.status === 422) {
        setErrors(err.data.errors || { general: err.data.message });
        toast.error("Validation failed. Please check the form.");
      } else {
        toast.error("Failed to update school. Please try again.");
        console.error("Failed to update school:", err.data || err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldLabels = {
    name: "School Name",
    school_type: "School Type",
    address: "Address",
    city: "City",
    phone: "Phone",
    email: "Email",
    code: "School Code",
    logo: "School Logo",
    primary_curriculum: "Primary Curriculum",
    secondary_curriculum: "Secondary Curriculum",
    has_streams: "Enable Streams",
    has_pre_primary: "Pre-Primary Level",
    has_primary: "Primary Level",
    has_junior_secondary: "Junior Secondary Level",
    has_senior_secondary: "Senior Secondary Level",
    has_secondary: "Secondary Level (8-4-4)",
    senior_secondary_pathways: "Senior Secondary Pathways",
    grade_levels: "Grade Levels",
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
    if (formData.primary_curriculum === 'CBC') return cbcGradeLevels;
    if (formData.primary_curriculum === '8-4-4') return classLevels;
    if (formData.primary_curriculum === 'Both') return [...cbcGradeLevels, ...classLevels];
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

  // Fix: Show 8-4-4 levels when secondary curriculum is Both
  const shouldShow844Secondary = () => {
    if (formData.schoolType === 'Primary') return false;
    
    return (
      formData.primary_curriculum === '8-4-4' ||
      formData.primary_curriculum === 'Both' ||
      formData.secondary_curriculum === '8-4-4' ||
      formData.secondary_curriculum === 'Both'
    );
  };

  // Fix: Show CBC levels when secondary curriculum is Both
  const shouldShowCBCLevels = () => {
    if (formData.schoolType === 'Primary') return true;
    
    return (
      formData.primary_curriculum === 'CBC' ||
      formData.primary_curriculum === 'Both' ||
      formData.secondary_curriculum === 'CBC' ||
      formData.secondary_curriculum === 'Both'
    );
  };

  // Loading state
  if (isLoading) {
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-[#0d141b] dark:text-white">
            Edit School Profile
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#4c739a] dark:text-slate-400 font-normal leading-normal mt-1">
            Update school information and details
          </p>
        </div>
      </div>

      {/* School Structure Help Card - Using the new component */}
      <SchoolStructureInfo
        showSuperAdminCard={showSuperAdminCard}
        onSuperAdminClick={handleSuperAdminClick}
        title="School Structure Information"
        description="School structure fields are locked to maintain data consistency and prevent conflicts."
      />

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

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
          {/* Header Card - Same as SchoolProfile */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="relative mx-auto sm:mx-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                  {logoPreview && !logoError ? (
                    <img 
                      src={logoPreview} 
                      alt="School Logo" 
                      className="w-full h-full object-contain p-2 sm:p-3 bg-white dark:bg-slate-900"
                      onError={(e) => {
                        console.error('Failed to load image:', logoPreview);
                        setLogoError(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 flex items-center justify-center">
                      <School className="w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                {logoPreview && !logoError && (
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
                  {formData.schoolName || "School Name"}
                </h1>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <School className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">{formData.schoolType || 'School Type'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">{formData.city || 'City'}</span>
                  </div>
                </div>
                {logoError && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    ⚠️ Logo could not be loaded. Please upload a new one.
                  </p>
                )}
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
                    name="schoolName"
                    value={formData.schoolName}
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
                    name="schoolType"
                    value={formData.schoolType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('schoolType') ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
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
                      School type is permanent after setup
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    Primary Curriculum *
                  </label>
                  <select
                    name="primary_curriculum"
                    value={formData.primary_curriculum}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('primary_curriculum') ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                    required
                    disabled={isFieldLocked('primary_curriculum') || formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed'}
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
                  {isFieldLocked('primary_curriculum') && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Primary curriculum is permanent
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                    Stream Configuration
                  </label>
                  <div className={`p-4 border rounded-lg ${shouldDisableStreams() ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_streams"
                          name="has_streams"
                          checked={formData.has_streams}
                          onChange={handleChange}
                          disabled={shouldDisableStreams()}
                          className={`w-5 h-5 ${shouldDisableStreams() ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_streams" className={`block text-sm font-medium ${shouldDisableStreams() ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                          Enable Streams for this School
                          {shouldDisableStreams() && " (Cannot be changed)"}
                        </label>
                        <p className={`text-xs ${shouldDisableStreams() ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                          {shouldDisableStreams() 
                            ? 'Streams setting cannot be changed once curriculum levels are selected or after school is saved.'
                            : 'Check this box if your school uses stream-based organization (e.g., Class A, Class B, etc.). This will allow you to create streams and assign teachers and students to them.'}
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
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isLocked ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                    placeholder="Enter school code"
                    required
                    disabled={isLocked}
                  />
                  {isLocked && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      School code is permanent and cannot be changed
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors ${isFieldLocked('secondary_curriculum') ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
                    required
                    disabled={isFieldLocked('secondary_curriculum') || formData.schoolType === 'Primary'}
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
                  {isFieldLocked('secondary_curriculum') && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Secondary curriculum is permanent
                    </p>
                  )}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white">Curriculum Levels</h3>
              </div>
              {!isFieldLocked('has_pre_primary') && (
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
              {/* CBC Levels */}
              {shouldShowCBCLevels() && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">CBC Levels</h3>
                    {isFieldLocked('has_pre_primary') && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Locked
                      </span>
                    )}
                  </div>
                  
                  <div className={`p-4 border rounded-lg ${isFieldLocked('has_pre_primary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_pre_primary"
                          name="has_pre_primary"
                          checked={formData.has_pre_primary}
                          onChange={handleChange}
                          disabled={isFieldLocked('has_pre_primary') || formData.primary_curriculum === '8-4-4' || formData.schoolType === 'Secondary'}
                          className={`w-5 h-5 ${isFieldLocked('has_pre_primary') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_pre_primary" className={`block text-sm font-medium ${isFieldLocked('has_pre_primary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                          Pre-Primary (PP1-PP2)
                          {isFieldLocked('has_pre_primary') && " (Cannot be changed)"}
                        </label>
                        <p className={`text-xs ${isFieldLocked('has_pre_primary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                          Early childhood education for ages 4-6
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 border rounded-lg ${isFieldLocked('has_primary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_primary"
                          name="has_primary"
                          checked={formData.has_primary}
                          onChange={handleChange}
                          disabled={isFieldLocked('has_primary') || formData.schoolType === 'Secondary'}
                          className={`w-5 h-5 ${isFieldLocked('has_primary') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_primary" className={`block text-sm font-medium ${isFieldLocked('has_primary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                          Primary (Grade 1-6)
                          {isFieldLocked('has_primary') && " (Cannot be changed)"}
                        </label>
                        <p className={`text-xs ${isFieldLocked('has_primary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                          Primary education for ages 6-12
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 border rounded-lg ${isFieldLocked('has_junior_secondary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id="has_junior_secondary"
                          name="has_junior_secondary"
                          checked={formData.has_junior_secondary}
                          onChange={handleChange}
                          disabled={isFieldLocked('has_junior_secondary') || formData.primary_curriculum === '8-4-4' || formData.schoolType === 'Secondary'}
                          className={`w-5 h-5 ${isFieldLocked('has_junior_secondary') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                        />
                      </div>
                      <div className="flex-1">
                        <label htmlFor="has_junior_secondary" className={`block text-sm font-medium ${isFieldLocked('has_junior_secondary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                          Junior Secondary (Grade 7-9)
                          {isFieldLocked('has_junior_secondary') && " (Cannot be changed)"}
                        </label>
                        <p className={`text-xs ${isFieldLocked('has_junior_secondary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                          Lower secondary education for ages 12-15
                        </p>
                      </div>
                    </div>
                  </div>

                  {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && (
                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_senior_secondary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_senior_secondary"
                            name="has_senior_secondary"
                            checked={formData.has_senior_secondary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_senior_secondary') || formData.primary_curriculum === '8-4-4' || 
                              (formData.secondary_curriculum === '8-4-4' && formData.primary_curriculum !== 'Both')}
                            className={`w-5 h-5 ${isFieldLocked('has_senior_secondary') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_senior_secondary" className={`block text-sm font-medium ${isFieldLocked('has_senior_secondary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Senior Secondary (Grade 10-12)
                            {isFieldLocked('has_senior_secondary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_senior_secondary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Upper secondary education for ages 15-18 with STEM pathways
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.has_senior_secondary && (
                    <div className={`p-4 border rounded-lg ${isFieldLocked('senior_secondary_pathways') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Senior Secondary Pathways
                        </h4>
                        {isFieldLocked('senior_secondary_pathways') && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isFieldLocked('senior_secondary_pathways') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mb-3`}>
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
                                className={`w-5 h-5 ${isFieldLocked('senior_secondary_pathways') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                              />
                            </div>
                            <div className="flex-1">
                              <label htmlFor={`pathway_${option.value}`} className={`block text-sm font-medium ${isFieldLocked('senior_secondary_pathways') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
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

              {/* 8-4-4 Levels */}
              {shouldShow844Secondary() && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-[#0d141b] dark:text-white mb-4">8-4-4 Levels</h3>
                    {isFieldLocked('has_secondary') && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Locked
                      </span>
                    )}
                  </div>
                  
                  {/* Only show Primary level for Primary or Mixed schools */}
                  {(formData.schoolType === 'Primary' || formData.schoolType === 'Mixed') && (
                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_primary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_primary_844"
                            name="has_primary"
                            checked={formData.has_primary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_primary') || formData.primary_curriculum === 'CBC' || formData.schoolType === 'Secondary'}
                            className={`w-5 h-5 ${isFieldLocked('has_primary') ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_primary_844" className={`block text-sm font-medium ${isFieldLocked('has_primary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Primary (Standard 1-8)
                            {isFieldLocked('has_primary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_primary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Primary education for ages 6-13
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show Secondary level for Secondary or Mixed schools */}
                  {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && (
                    <div className={`p-4 border rounded-lg ${isFieldLocked('has_secondary') ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            id="has_secondary"
                            name="has_secondary"
                            checked={formData.has_secondary}
                            onChange={handleChange}
                            disabled={isFieldLocked('has_secondary') || formData.primary_curriculum === 'CBC' || 
                              (formData.secondary_curriculum === 'CBC' && formData.primary_curriculum !== 'Both')}
                            className={`w-5 h-5 ${isFieldLocked('has_secondary') ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor="has_secondary" className={`block text-sm font-medium ${isFieldLocked('has_secondary') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} cursor-pointer`}>
                            Secondary (Form 1-4)
                            {isFieldLocked('has_secondary') && " (Cannot be changed)"}
                          </label>
                          <p className={`text-xs ${isFieldLocked('has_secondary') ? 'text-slate-500 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'} mt-1`}>
                            Secondary education for ages 13-17
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {showAdvancedOptions && !isFieldLocked('has_secondary') && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
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

          {formData.primary_curriculum && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white">
                    {formData.primary_curriculum === '8-4-4' ? 'Class Levels' : 'Grade Levels'}
                  </h3>
                  {isFieldLocked('grade_levels') && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Grade/Class levels cannot be changed after initial setup
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {formData.primary_curriculum === 'CBC' && (
                  <div className="space-y-4">
                    {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                      const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                      if (levelGrades.length === 0) return null;
                      
                      const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                            level === 'Primary' ? formData.has_primary :
                                            formData.has_junior_secondary;
                      
                      return (
                        <div key={level} className={`p-4 ${isLevelSelected ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border rounded-lg`}>
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
                                  className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                />
                                <label htmlFor={`grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {grade.name}
                                  {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && formData.has_senior_secondary && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
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
                                className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                              />
                              <label htmlFor={`grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
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

                {formData.primary_curriculum === '8-4-4' && (
                  <div className="space-y-4">
                    {['Primary', 'Secondary'].map(level => {
                      const levelClasses = classLevels.filter(c => c.level === level);
                      if (levelClasses.length === 0) return null;
                      
                      const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                            formData.has_secondary;
                      
                      if (level === 'Primary' && formData.schoolType === 'Secondary') return null;
                      
                      return (
                        <div key={level} className={`p-4 ${isLevelSelected ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border rounded-lg`}>
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
                                  className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                                />
                                <label htmlFor={`class_${cls.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
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

                {formData.primary_curriculum === 'Both' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        You have selected to offer both CBC and 8-4-4 curricula. Please select grade levels for CBC and class levels for 8-4-4 that your school offers.
                      </p>
                      {isFieldLocked('grade_levels') && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                          Grade/Class levels cannot be changed after initial setup
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">CBC Grade Levels</h3>
                      {['Pre-Primary', 'Primary', 'Junior Secondary'].map(level => {
                        const levelGrades = cbcGradeLevels.filter(g => g.level === level);
                        if (levelGrades.length === 0) return null;
                        
                        const isLevelSelected = level === 'Pre-Primary' ? formData.has_pre_primary :
                                              level === 'Primary' ? formData.has_primary :
                                              formData.has_junior_secondary;
                        
                        return (
                          <div key={`cbc_${level}`} className={`p-4 ${isLevelSelected ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border rounded-lg`}>
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
                                    className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                  />
                                  <label htmlFor={`cbc_grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {grade.name}
                                    {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {(formData.schoolType === 'Secondary' || formData.schoolType === 'Mixed') && formData.has_senior_secondary && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
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
                                  className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600 focus:ring-2`}
                                />
                                <label htmlFor={`cbc_grade_${grade.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {grade.name}
                                  {isFieldLocked('grade_levels') && formData.grade_levels.includes(grade.id) && " ✓"}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-green-700 dark:text-green-300">8-4-4 Class Levels</h3>
                      {['Primary', 'Secondary'].map(level => {
                        const levelClasses = classLevels.filter(c => c.level === level);
                        if (levelClasses.length === 0) return null;
                        
                        const isLevelSelected = level === 'Primary' ? formData.has_primary :
                                              formData.has_secondary;
                        
                        if (level === 'Primary' && formData.schoolType === 'Secondary') return null;
                        
                        return (
                          <div key={`844_${level}`} className={`p-4 ${isLevelSelected ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'} border rounded-lg`}>
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
                                    className={`w-4 h-4 ${isFieldLocked('grade_levels') ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'} bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500 dark:focus:ring-green-600 focus:ring-2`}
                                  />
                                  <label htmlFor={`844_class_${cls.id}`} className={`text-sm ${isFieldLocked('grade_levels') ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
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
        </div>

        {showPreview && (
          <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Profile Preview
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden flex-shrink-0">
                {logoPreview && !logoError ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain p-2 bg-white dark:bg-slate-900"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 flex items-center justify-center">
                    <School className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 dark:text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl sm:text-2xl font-bold text-[#0d141b] dark:text-white mb-2">
                  {formData.schoolName || "School Name"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Type:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.schoolType || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Code:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.code || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">City:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.city || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Curriculum:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">{formData.primary_curriculum}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Streams:</span>
                    <span className="ml-2 text-[#0d141b] dark:text-white">
                      {formData.has_streams ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-[#4c739a] dark:text-slate-400">Levels:</span>
                    <div className="ml-2 flex flex-wrap gap-2 mt-1">
                      {formData.has_pre_primary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Pre-Primary</span>
                      )}
                      {formData.has_primary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Primary</span>
                      )}
                      {formData.has_junior_secondary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Junior Secondary</span>
                      )}
                      {formData.has_senior_secondary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">Senior Secondary</span>
                      )}
                      {formData.has_secondary && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">Secondary</span>
                      )}
                    </div>
                  </div>
                  {formData.grade_levels && formData.grade_levels.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-[#4c739a] dark:text-slate-400">Grade/Class Levels:</span>
                      <div className="ml-2 flex flex-wrap gap-1 mt-1">
                        {formData.grade_levels.map((level, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 text-xs rounded-full">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg sm:rounded-b-xl">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
                  navigate("/admin/dashboard");
                }
              } else {
                navigate("/admin/dashboard");
              }
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-colors bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !hasUnsavedChanges}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Super Admin Contact Card */}
      <SuperAdminContactCard 
        show={showSuperAdminCard}
        onClose={() => setShowSuperAdminCard(false)}
      />
    </div>
  );
}

export default EditSchoolProfile;
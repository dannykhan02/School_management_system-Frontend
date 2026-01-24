import React, { useEffect, useState } from 'react';
import { Edit, MapPin, Phone, Mail, School, BookOpen, CheckSquare, Square, GraduationCap, Award, Lock, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { Link } from 'react-router-dom';

function SchoolProfile() {
  const [schoolData, setSchoolData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isLocked, setIsLocked] = useState(true); // Always true for viewing existing school

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('schools', 'GET');
        setSchoolData(response.data);
        setLogoError(false);
        setIsLocked(!!response.data.id); // School is locked if it exists
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, []);

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

  // Helper function to get curriculum levels with lock status
  const getCurriculumLevels = () => {
    const levels = [];
    
    if (schoolData.has_pre_primary) levels.push({name: 'Pre-Primary', locked: true});
    if (schoolData.has_primary) levels.push({name: 'Primary', locked: true});
    if (schoolData.has_junior_secondary) levels.push({name: 'Junior Secondary', locked: true});
    if (schoolData.has_senior_secondary) levels.push({name: 'Senior Secondary', locked: true});
    if (schoolData.has_secondary) levels.push({name: 'Secondary', locked: true});
    
    return levels;
  };

  // Get curriculum type with lock indicator
  const getCurriculumType = () => {
    if (schoolData.primary_curriculum === 'Both') return {text: 'Both CBC & 8-4-4', locked: true};
    if (schoolData.primary_curriculum) return {text: schoolData.primary_curriculum, locked: true};
    return {text: 'Not Set', locked: false};
  };

  // Get secondary curriculum type
  const getSecondaryCurriculumType = () => {
    if (schoolData.secondary_curriculum === 'Both') return {text: 'Both CBC & 8-4-4', locked: true};
    if (schoolData.secondary_curriculum) return {text: schoolData.secondary_curriculum, locked: true};
    return {text: 'N/A', locked: false};
  };

  const getPathwayLabel = (pathway) => {
    switch(pathway) {
      case 'STEM': return 'STEM (Science, Technology, Engineering, Mathematics)';
      case 'Arts': return 'Arts & Sports Science';
      case 'Social Sciences': return 'Social Sciences';
      default: return pathway;
    }
  };

  const getGradeLevelsByCurriculum = () => {
    if (!schoolData.grade_levels || schoolData.grade_levels.length === 0) return null;
    
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
    
    const allLevels = [...cbcGradeLevels, ...classLevels];
    const selectedLevels = allLevels.filter(level => schoolData.grade_levels.includes(level.id));
    
    // Determine which curriculum to show based on school's primary curriculum
    let curriculaToShow = [];
    if (schoolData.primary_curriculum === 'CBC') {
      curriculaToShow = ['CBC'];
    } else if (schoolData.primary_curriculum === '8-4-4') {
      curriculaToShow = ['8-4-4'];
    } else if (schoolData.primary_curriculum === 'Both') {
      curriculaToShow = ['CBC', '8-4-4'];
    }
    
    // Group by curriculum
    const groupedLevels = {};
    curriculaToShow.forEach(curriculum => {
      groupedLevels[curriculum] = selectedLevels.filter(level => level.curriculum === curriculum);
    });
    
    // Group by level within each curriculum
    const result = {};
    
    Object.keys(groupedLevels).forEach(curriculum => {
      result[curriculum] = {};
      groupedLevels[curriculum].forEach(level => {
        if (!result[curriculum][level.level]) {
          result[curriculum][level.level] = [];
        }
        result[curriculum][level.level].push(level);
      });
    });
    
    return result;
  };

  const gradeLevelsByCurriculum = getGradeLevelsByCurriculum();
  const curriculumType = getCurriculumType();
  const secondaryCurriculumType = getSecondaryCurriculumType();
  const curriculumLevels = getCurriculumLevels();

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="p-2 bg-slate-700 dark:bg-slate-700 rounded-lg w-fit">
          <School className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-[#0d141b] dark:text-white">
            School Profile
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#4c739a] dark:text-slate-400 font-normal leading-normal mt-1">
            View and manage school information
          </p>
        </div>
      </div>

      {/* Locked Fields Warning */}
      {isLocked && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Important: School Structure is Locked
            </h3>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            School type, curriculum, and level selections cannot be changed after initial setup. 
            This ensures consistency in school structure and prevents data conflicts.
          </p>
          <div className="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Locked Fields:</strong> School Type, Primary/Secondary Curriculum, Curriculum Levels, Streams, Grade/Class Levels
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
              {schoolData.logo && !logoError ? (
                <img 
                  src={schoolData.logo} 
                  alt={`${schoolData.name} logo`}
                  className="w-full h-full object-contain p-2 sm:p-3 bg-white dark:bg-slate-900"
                  onError={(e) => {
                    console.error('Failed to load logo:', schoolData.logo);
                    setLogoError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
                  <School className="w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 text-blue-400 dark:text-blue-500" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#0d141b] dark:text-white mb-2 tracking-tight capitalize">
                {schoolData.name || 'School Name'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 justify-center sm:justify-start">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <BookOpen className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">{schoolData.school_type || 'School Type'}</span>
                  {isLocked && schoolData.school_type && (
                    <Lock className="w-3 sm:w-4 h-3 sm:h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" title="Cannot be changed" />
                  )}
                </div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">{schoolData.city || 'City'}</span>
                </div>
              </div>
              {logoError && schoolData.logo && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ Logo could not be loaded from server
                </p>
              )}
            </div>
          </div>
          <Link to={`/admin/edit-school-info/${schoolData.id}`} className="w-full sm:w-auto lg:flex-shrink-0">
            <button className="flex items-center justify-center gap-2 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 w-full sm:w-auto text-xs sm:text-sm lg:text-base dark:bg-white dark:text-black dark:hover:bg-gray-200">
              <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1">
            School Information
          </h2>
          <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
            Basic details and contact information
          </p>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Column 1 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide">
                  School Code
                </label>
                {isLocked && schoolData.code && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                )}
              </div>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.code || 'N/A'}
              </p>
              {isLocked && schoolData.code && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Permanent school identifier
                </p>
              )}
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide">
                  School Type
                </label>
                {isLocked && schoolData.school_type && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                  {schoolData.school_type || 'N/A'}
                </p>
              </div>
              {isLocked && schoolData.school_type && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  School type is permanent after setup
                </p>
              )}
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide">
                  Primary Curriculum
                </label>
                {isLocked && curriculumType.locked && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                  {curriculumType.text}
                </p>
              </div>
              {isLocked && curriculumType.locked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Primary curriculum is permanent
                </p>
              )}
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide">
                  Stream Configuration
                </label>
                {isLocked && schoolData.has_streams !== undefined && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {schoolData.has_streams ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Enabled
                    </span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Disabled
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {schoolData.has_streams 
                  ? "This school can create and manage streams for classrooms." 
                  : "This school does not use stream-based organization."}
              </p>
              {isLocked && schoolData.has_streams !== undefined && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> Stream setting cannot be changed after curriculum levels are selected
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Address
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4 sm:space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                City
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.city || 'N/A'}
              </p>
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide">
                  Secondary Curriculum
                </label>
                {isLocked && secondaryCurriculumType.locked && secondaryCurriculumType.text !== 'N/A' && (
                  <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                  {secondaryCurriculumType.text}
                </p>
              </div>
              {isLocked && secondaryCurriculumType.locked && secondaryCurriculumType.text !== 'N/A' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Secondary curriculum is permanent
                </p>
              )}
              {schoolData.school_type === 'Primary' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Secondary curriculum is not applicable for primary schools
                </p>
              )}
            </div>

            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Phone
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <Phone className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.phone || 'N/A'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Email
              </label>
              <div className="flex items-start gap-2 sm:gap-3">
                <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-[#4c739a] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm sm:text-base text-[#0d141b] dark:text-white font-medium leading-relaxed">
                  {schoolData.email || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Levels Section */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Curriculum Levels
              </h2>
              <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
                Educational levels offered by this school
              </p>
            </div>
            {isLocked && curriculumLevels.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                <Lock className="w-3 h-3" />
                <span>Locked</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {curriculumLevels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculumLevels.map((level, index) => (
                <div key={index} className={`p-4 ${level.name === 'Secondary' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'} border rounded-lg relative`}>
                  {isLocked && level.locked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-[#0d141b] dark:text-white">
                      {level.name}
                      {isLocked && level.locked && " (Locked)"}
                    </h3>
                  </div>
                  {level.name === 'Senior Secondary' && schoolData.senior_secondary_pathways && schoolData.senior_secondary_pathways.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Pathways:</p>
                      <div className="flex flex-wrap gap-2">
                        {schoolData.senior_secondary_pathways.map((pathway, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {pathway}
                          </span>
                        ))}
                      </div>
                      {isLocked && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Pathways are permanent after setup
                        </p>
                      )}
                    </div>
                  )}
                  {isLocked && level.locked && level.name !== 'Senior Secondary' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      This level cannot be changed
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No curriculum levels have been set up for this school yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grade/Class Levels Section - UPDATED */}
      {gradeLevelsByCurriculum && Object.keys(gradeLevelsByCurriculum).length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {schoolData.primary_curriculum === 'Both' ? 'Grade/Class Levels' : 
                   schoolData.primary_curriculum === 'CBC' ? 'Grade Levels' : 'Class Levels'}
                </h2>
                <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
                  {schoolData.primary_curriculum === 'Both' ? 'Specific grades and classes offered by this school' :
                   schoolData.primary_curriculum === 'CBC' ? 'Specific grades offered by this school' : 
                   'Specific classes offered by this school'}
                </p>
              </div>
              {isLocked && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>Locked</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {Object.keys(gradeLevelsByCurriculum).map(curriculum => (
                <div key={curriculum} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#0d141b] dark:text-white">
                      {curriculum === 'CBC' ? 'CBC Grade Levels' : '8-4-4 Class Levels'}
                    </h3>
                    {isLocked && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Permanent
                      </span>
                    )}
                  </div>
                  {Object.keys(gradeLevelsByCurriculum[curriculum]).length > 0 ? (
                    <div className="space-y-4">
                      {Object.keys(gradeLevelsByCurriculum[curriculum]).map(level => (
                        <div key={level} className={`p-4 ${curriculum === 'CBC' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'} border rounded-lg relative`}>
                          {isLocked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" title="Cannot be changed" />
                            </div>
                          )}
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            {level} {isLocked && "(Locked)"}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {gradeLevelsByCurriculum[curriculum][level].map(item => (
                              <span key={item.id} className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full border border-slate-300 dark:border-slate-600">
                                {item.name}
                              </span>
                            ))}
                          </div>
                          {isLocked && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                              Grade/Class levels cannot be changed after setup
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No {curriculum === 'CBC' ? 'grade' : 'class'} levels have been set up for this curriculum.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolProfile;
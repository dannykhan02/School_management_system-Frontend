import React, { useEffect, useState } from 'react';
import { Edit, MapPin, Phone, Mail, School, BookOpen, CheckSquare, Square, GraduationCap, Award, AlertCircle, Users, Shield, ChevronDown, ChevronUp, Loader, FlaskConical, Palette, Globe } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { Link } from 'react-router-dom';
import SuperAdminContactCard from '../../../components/SuperAdminContactCard';
import SchoolStructureInfo from '../../../components/SchoolStructureInfo';

// ─────────────────────────────────────────────────────────────────────────────
// COLOR HELPERS — mirrored from ClassroomManager, StreamManager, SubjectManager,
// TeacherManager so the School Profile uses the same design language.
// ─────────────────────────────────────────────────────────────────────────────

/** Level badge colours — identical to ClassroomManager / StreamManager */
const LEVEL_COLOURS = {
  'Pre-Primary':      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/10 dark:text-pink-300 dark:border-pink-800/40',
  'Primary':          'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:border-cyan-800/40',
  'Junior Secondary': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:border-amber-800/40',
  'Senior Secondary': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:border-amber-800/40',
  'Secondary':        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/10 dark:text-orange-300 dark:border-orange-800/40',
};

/** Curriculum badge colours — mirrored from SubjectManager / TeacherManager */
const getCurriculumBadgeColor = (type) => {
  if (type === 'CBC')   return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/10 dark:text-cyan-300';
  if (type === '8-4-4') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300';
  if (type === 'Both')  return 'bg-pink-100 text-pink-800 dark:bg-pink-900/10 dark:text-pink-300';
  return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
};

/** Pathway badge colours — mirrored from SubjectManager */
const getPathwayBadgeColor = (pathway) => {
  const map = {
    STEM:              'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/10 dark:text-cyan-300 dark:border-cyan-800/40',
    Arts:              'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/10 dark:text-pink-300 dark:border-pink-800/40',
    'Social Sciences': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-300 dark:border-amber-800/40',
  };
  return map[pathway] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
};

const getPathwayIcon = (pathway) => {
  if (pathway === 'STEM')            return <FlaskConical className="w-3 h-3" />;
  if (pathway === 'Arts')            return <Palette className="w-3 h-3" />;
  if (pathway === 'Social Sciences') return <Globe className="w-3 h-3" />;
  return null;
};

/** Level badge component — matches ClassroomManager's ClassroomLevelBadge */
const LevelBadge = ({ level }) => {
  if (!level) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${LEVEL_COLOURS[level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      <GraduationCap className="w-3 h-3" />{level}
    </span>
  );
};

/** Grade-level tag — identical to SubjectManager's getGradeLevelBadgeColor */
const GradeLevelTag = ({ label }) => (
  <span className="px-2 py-1 bg-cyan-50 text-cyan-700 dark:bg-cyan-900/10 dark:text-cyan-300 text-xs rounded-full border border-cyan-200 dark:border-cyan-800/40 font-medium">
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function SchoolProfile() {
  const [schoolData, setSchoolData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [showSuperAdminCard, setShowSuperAdminCard] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('schools/my-school', 'GET');
        setSchoolData(response.data);
        setLogoError(false);
        setIsLocked(!!response.data.id);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchools();
  }, []);

  const handleSuperAdminClick = () => {
    setShowSuperAdminCard(!showSuperAdminCard);
  };

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

  // ── Derived data ──────────────────────────────────────────────────────────

  const getCurriculumLevels = () => {
    const levels = [];
    if (schoolData.has_pre_primary)      levels.push({ name: 'Pre-Primary',      key: 'Pre-Primary' });
    if (schoolData.has_primary)          levels.push({ name: 'Primary',           key: 'Primary' });
    if (schoolData.has_junior_secondary) levels.push({ name: 'Junior Secondary',  key: 'Junior Secondary' });
    if (schoolData.has_senior_secondary) levels.push({ name: 'Senior Secondary',  key: 'Senior Secondary' });
    if (schoolData.has_secondary)        levels.push({ name: 'Secondary',         key: 'Secondary' });
    return levels;
  };

  const getCurriculumType = () => {
    if (schoolData.primary_curriculum === 'Both') return { text: 'Both CBC & 8-4-4', value: 'Both' };
    if (schoolData.primary_curriculum)            return { text: schoolData.primary_curriculum, value: schoolData.primary_curriculum };
    return { text: 'Not Set', value: null };
  };

  const getSecondaryCurriculumType = () => {
    if (schoolData.secondary_curriculum === 'Both') return { text: 'Both CBC & 8-4-4', value: 'Both' };
    if (schoolData.secondary_curriculum)            return { text: schoolData.secondary_curriculum, value: schoolData.secondary_curriculum };
    return { text: 'N/A', value: null };
  };

  const getGradeLevelsByCurriculum = () => {
    if (!schoolData.grade_levels || schoolData.grade_levels.length === 0) return null;

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

    let curriculaToShow = [];
    if (schoolData.primary_curriculum === 'CBC')  curriculaToShow = ['CBC'];
    else if (schoolData.primary_curriculum === '8-4-4') curriculaToShow = ['8-4-4'];
    else if (schoolData.primary_curriculum === 'Both')  curriculaToShow = ['CBC', '8-4-4'];

    const groupedLevels = {};
    curriculaToShow.forEach(curriculum => {
      groupedLevels[curriculum] = selectedLevels.filter(level => level.curriculum === curriculum);
    });

    const result = {};
    Object.keys(groupedLevels).forEach(curriculum => {
      result[curriculum] = {};
      groupedLevels[curriculum].forEach(level => {
        if (!result[curriculum][level.level]) result[curriculum][level.level] = [];
        result[curriculum][level.level].push(level);
      });
    });

    return result;
  };

  const gradeLevelsByCurriculum = getGradeLevelsByCurriculum();
  const curriculumType          = getCurriculumType();
  const secondaryCurriculumType = getSecondaryCurriculumType();
  const curriculumLevels        = getCurriculumLevels();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
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

      {/* ── School Structure Info Card ───────────────────────────────────── */}
      <SchoolStructureInfo
        showSuperAdminCard={showSuperAdminCard}
        onSuperAdminClick={handleSuperAdminClick}
        title="School Structure Information"
        description="School structure fields are locked to maintain data consistency and prevent conflicts."
      />

      {/* ── Hero Card ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 bg-slate-100 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
              {schoolData.logo && !logoError ? (
                <img
                  src={schoolData.logo}
                  alt={`${schoolData.name} logo`}
                  className="w-full h-full object-contain p-2 sm:p-3 bg-white dark:bg-slate-900"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-700/20 flex items-center justify-center">
                  <School className="w-10 sm:w-12 md:w-14 lg:w-16 h-10 sm:h-12 md:h-14 lg:h-16 text-slate-400 dark:text-slate-500" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#0d141b] dark:text-white mb-2 tracking-tight capitalize">
                {schoolData.name || 'School Name'}
              </h1>

              {/* Curriculum badge — uses SubjectManager / TeacherManager colours */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-2">
                {schoolData.primary_curriculum && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(schoolData.primary_curriculum)}`}>
                    {schoolData.primary_curriculum}
                  </span>
                )}
                {/* Streams badge — mirrors ClassroomManager */}
                {schoolData.has_streams ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/10 dark:text-cyan-300">
                    Streams Enabled
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
                    Direct Assignment
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-[#4c739a] dark:text-slate-400 justify-center sm:justify-start">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <BookOpen className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                  <span className="font-medium">{schoolData.school_type || 'School Type'}</span>
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

          <Link to="/admin/edit-school-info" className="w-full sm:w-auto lg:flex-shrink-0">
            <button className="flex items-center justify-center gap-2 px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg font-medium transition-colors bg-black text-white hover:bg-gray-800 w-full sm:w-auto text-xs sm:text-sm lg:text-base dark:bg-white dark:text-black dark:hover:bg-gray-200">
              <Edit className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Edit Profile
            </button>
          </Link>
        </div>
      </div>

      {/* ── School Information ───────────────────────────────────────────── */}
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

            {/* School Code */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                School Code
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold font-mono">
                {schoolData.code || 'N/A'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Permanent school identifier</p>
            </div>

            {/* School Type */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                School Type
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.school_type || 'N/A'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">School type is permanent after setup</p>
            </div>

            {/* Primary Curriculum — coloured badge */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                Primary Curriculum
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                  {curriculumType.text}
                </p>
                {curriculumType.value && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(curriculumType.value)}`}>
                    {curriculumType.value}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Primary curriculum is permanent</p>
            </div>

            {/* Stream Configuration — mirrors ClassroomManager streams badge */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 uppercase tracking-wide mb-1 sm:mb-2">
                Stream Configuration
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {schoolData.has_streams ? (
                  <>
                    <CheckSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Enabled
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/10 dark:text-cyan-300">
                      Active
                    </span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                      Streams Disabled
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/10 dark:text-amber-300">
                      Direct Assignment
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {schoolData.has_streams
                  ? 'This school can create and manage streams for classrooms.'
                  : 'This school does not use stream-based organisation.'}
              </p>
            </div>

            {/* Address */}
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

            {/* City */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                City
              </label>
              <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                {schoolData.city || 'N/A'}
              </p>
            </div>

            {/* Secondary Curriculum — coloured badge */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-3 sm:pb-4">
              <label className="block text-xs font-semibold text-[#4c739a] dark:text-slate-400 mb-1 sm:mb-2 uppercase tracking-wide">
                Secondary Curriculum
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base sm:text-lg text-[#0d141b] dark:text-white font-semibold">
                  {secondaryCurriculumType.text}
                </p>
                {secondaryCurriculumType.value && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(secondaryCurriculumType.value)}`}>
                    {secondaryCurriculumType.value}
                  </span>
                )}
              </div>
              {schoolData.school_type === 'Primary' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Secondary curriculum is not applicable for primary schools
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Secondary curriculum is permanent
                </p>
              )}
            </div>

            {/* Phone */}
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

            {/* Email */}
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

      {/* ── Curriculum Levels ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Curriculum Levels
          </h2>
          <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
            Educational levels offered by this school
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {curriculumLevels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculumLevels.map((level, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-colors ${
                    LEVEL_COLOURS[level.key]
                      ? `border ${LEVEL_COLOURS[level.key].split(' ').filter(c => c.startsWith('border')).join(' ')} ${LEVEL_COLOURS[level.key].split(' ').filter(c => c.startsWith('bg') || c.startsWith('dark:bg')).join(' ')} hover:opacity-90`
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {/* Level badge — uses the same LevelBadge component */}
                    <LevelBadge level={level.key} />
                  </div>

                  {/* Senior Secondary pathways — styled like SubjectManager pathway pills */}
                  {level.key === 'Senior Secondary' && schoolData.senior_secondary_pathways && schoolData.senior_secondary_pathways.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Pathways:</p>
                      <div className="flex flex-wrap gap-2">
                        {schoolData.senior_secondary_pathways.map((pathway, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getPathwayBadgeColor(pathway)}`}
                          >
                            {getPathwayIcon(pathway)}
                            {pathway}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No curriculum levels have been set up for this school yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Grade / Class Levels ─────────────────────────────────────────── */}
      {gradeLevelsByCurriculum && Object.keys(gradeLevelsByCurriculum).length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0d141b] dark:text-white mb-1 flex items-center gap-2">
              <Award className="w-5 h-5" />
              {schoolData.primary_curriculum === 'Both'  ? 'Grade / Class Levels' :
               schoolData.primary_curriculum === 'CBC'   ? 'Grade Levels'         : 'Class Levels'}
            </h2>
            <p className="text-xs sm:text-sm text-[#4c739a] dark:text-slate-400">
              {schoolData.primary_curriculum === 'Both'
                ? 'Specific grades and classes offered by this school'
                : schoolData.primary_curriculum === 'CBC'
                ? 'Specific grades offered by this school'
                : 'Specific classes offered by this school'}
            </p>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-8">
              {Object.keys(gradeLevelsByCurriculum).map(curriculum => (
                <div key={curriculum} className="space-y-4">

                  {/* Curriculum header — coloured badge from SubjectManager */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-[#0d141b] dark:text-white">
                      {curriculum === 'CBC' ? 'CBC Grade Levels' : '8-4-4 Class Levels'}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getCurriculumBadgeColor(curriculum)}`}>
                      {curriculum}
                    </span>
                  </div>

                  {Object.keys(gradeLevelsByCurriculum[curriculum]).length > 0 ? (
                    <div className="space-y-3">
                      {Object.keys(gradeLevelsByCurriculum[curriculum]).map(level => (
                        <div
                          key={level}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20"
                        >
                          {/* Level header with the shared LevelBadge */}
                          <div className="flex items-center gap-2 mb-3">
                            <LevelBadge level={level} />
                          </div>

                          {/* Grade / class pills — teal tones from SubjectManager's grade-level tag */}
                          <div className="flex flex-wrap gap-2">
                            {gradeLevelsByCurriculum[curriculum][level].map(item => (
                              <GradeLevelTag key={item.id} label={item.name} />
                            ))}
                          </div>
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

      {/* ── Super Admin Contact Card ─────────────────────────────────────── */}
      <SuperAdminContactCard
        show={showSuperAdminCard}
        onClose={() => setShowSuperAdminCard(false)}
      />
    </div>
  );
}

export default SchoolProfile;
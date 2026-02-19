import React, { useState, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { apiRequest } from '../utils/api';

// Searchable Dropdown Component
const SearchableDropdown = ({ options, value, onChange, placeholder, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(option => option.id === value);
  
  const filteredOptions = options.filter(option => 
    option.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="relative">
      <div 
        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white flex items-center justify-between cursor-text ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-[#0d141b] dark:text-white' : 'text-slate-400'}>
          {selectedOption ? `${selectedOption.full_name} (${selectedOption.email})` : placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-slate-400" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b border-slate-200 dark:border-slate-600">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-600 dark:text-white"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 ${option.id === value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-[#0d141b] dark:text-slate-300'}`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="font-medium">{option.full_name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{option.email}</div>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-slate-500 dark:text-slate-400">No matching users found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

function TeacherForm({
  formData,
  editingTeacher,
  onInputChange,
  onArrayChange,
  onSubmit,
  onClose,
  isSubmitting,
  users = [],
  school,
  specializationOptions = ['Sciences', 'Languages', 'Mathematics', 'Social Studies', 'Technical', 'Arts']
}) {
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(
    formData.subject_ids || []
  );

  // Sync selected subjects when formData.subject_ids changes (e.g., when editing)
  useEffect(() => {
    setSelectedSubjectIds(formData.subject_ids || []);
  }, [formData.subject_ids]);

  // Fetch subjects when levels/pathways/curriculum change
  useEffect(() => {
    const fetchSubjects = async () => {
      const levels = formData.teaching_levels || [];
      if (levels.length === 0) {
        setAvailableSubjects([]);
        return;
      }
      setLoadingSubjects(true);
      try {
        const params = new URLSearchParams();
        if (formData.curriculum_specialization) {
          params.append('curriculum', formData.curriculum_specialization);
        }
        const allSubjects = [];
        for (const level of levels) {
          params.set('level', level);
          params.delete('pathway'); // clear any leftover from previous iteration

          if (level === 'Senior Secondary' && formData.teaching_pathways?.length > 0) {
            for (const pathway of formData.teaching_pathways) {
              params.set('pathway', pathway);
              const res = await apiRequest(`subjects/filter?${params.toString()}`, 'GET');
              // Robust handling: support both res.data.flat and res.flat
              const subjectsData = res.flat !== undefined ? res : res.data;
              allSubjects.push(...(subjectsData?.flat || []));
            }
          } else {
            const res = await apiRequest(`subjects/filter?${params.toString()}`, 'GET');
            const subjectsData = res.flat !== undefined ? res : res.data;
            allSubjects.push(...(subjectsData?.flat || []));
          }
        }
        // Deduplicate by id
        const unique = Array.from(new Map(allSubjects.map(s => [s.id, s])).values());
        setAvailableSubjects(unique);
      } catch (e) {
        console.error('Failed to fetch subjects', e);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [formData.teaching_levels, formData.teaching_pathways, formData.curriculum_specialization]);

  const handleSubjectToggle = (subjectId) => {
    const updated = selectedSubjectIds.includes(subjectId)
      ? selectedSubjectIds.filter(id => id !== subjectId)
      : [...selectedSubjectIds, subjectId];
    setSelectedSubjectIds(updated);
    // Immediately notify parent so formData.subject_ids stays in sync
    onArrayChange('subject_ids', updated);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onInputChange(e);
  };

  const handleUserChange = (userId) => {
    onInputChange({
      target: {
        name: 'user_id',
        value: userId
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleTeachingLevelChange = (level) => {
    const current = formData.teaching_levels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onArrayChange('teaching_levels', updated);
  };

  const handleTeachingPathwayChange = (pathway) => {
    const current = formData.teaching_pathways || [];
    const updated = current.includes(pathway)
      ? current.filter(p => p !== pathway)
      : [...current, pathway];
    onArrayChange('teaching_pathways', updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-2xl mx-auto border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800/50 z-10">
          <h3 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
            {editingTeacher ? 'Edit Teacher' : 'Create New Teacher'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="user_id" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                User <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={users}
                value={formData.user_id}
                onChange={handleUserChange}
                placeholder="Select a user"
                disabled={!!editingTeacher}
              />
              {editingTeacher && (
                <p className="text-xs text-slate-500 mt-1">User cannot be changed after creation</p>
              )}
            </div>

            {school && school.primary_curriculum === 'Both' && (
              <div>
                <label htmlFor="curriculum_specialization" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                  Curriculum Specialization <span className="text-red-500">*</span>
                </label>
                <select 
                  id="curriculum_specialization"
                  name="curriculum_specialization" 
                  value={formData.curriculum_specialization} 
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select curriculum</option>
                  <option value="CBC">CBC</option>
                  <option value="8-4-4">8-4-4</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            )}

            {editingTeacher && formData.specialization && (
              <div className={school?.primary_curriculum === 'Both' ? '' : 'sm:col-span-2'}>
                <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                  Specialization (auto‑generated)
                </label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  {formData.specialization}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Qualification
              </label>
              <input 
                type="text" 
                id="qualification"
                name="qualification" 
                value={formData.qualification} 
                onChange={handleInputChange}
                placeholder="e.g., B.Sc Education"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Employment Type
              </label>
              <select 
                id="employment_type"
                name="employment_type" 
                value={formData.employment_type} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label htmlFor="employment_status" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Employment Status
              </label>
              <select 
                id="employment_status"
                name="employment_status" 
                value={formData.employment_status || 'active'} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="resigned">Resigned</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div>
              <label htmlFor="tsc_number" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                TSC Number
              </label>
              <input 
                type="text" 
                id="tsc_number"
                name="tsc_number" 
                value={formData.tsc_number} 
                onChange={handleInputChange}
                placeholder="e.g., TSC123456"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="tsc_status" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                TSC Status
              </label>
              <select 
                id="tsc_status"
                name="tsc_status" 
                value={formData.tsc_status || ''} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select TSC Status</option>
                <option value="registered">Registered</option>
                <option value="pending">Pending</option>
                <option value="not_registered">Not Registered</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_subjects" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Max Subjects to Teach
              </label>
              <input 
                type="number"
                id="max_subjects"
                name="max_subjects" 
                value={formData.max_subjects} 
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 4"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="max_classes" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Max Classes to Teach
              </label>
              <input 
                type="number"
                id="max_classes"
                name="max_classes" 
                value={formData.max_classes} 
                onChange={handleInputChange}
                min="1"
                placeholder="e.g., 6"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="max_weekly_lessons" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Max Weekly Lessons
              </label>
              <input 
                type="number"
                id="max_weekly_lessons"
                name="max_weekly_lessons" 
                value={formData.max_weekly_lessons} 
                onChange={handleInputChange}
                min="1"
                max="40"
                placeholder="e.g., 27"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>

            <div>
              <label htmlFor="min_weekly_lessons" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Min Weekly Lessons
              </label>
              <input 
                type="number"
                id="min_weekly_lessons"
                name="min_weekly_lessons" 
                value={formData.min_weekly_lessons} 
                onChange={handleInputChange}
                min="1"
                max="40"
                placeholder="e.g., 20"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
              Teaching Levels
            </label>
            <div className="space-y-2">
              {['Pre-Primary', 'Primary', 'Junior Secondary', 'Senior Secondary'].map(level => (
                <label key={level} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.teaching_levels?.includes(level)}
                    onChange={() => handleTeachingLevelChange(level)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{level}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.teaching_levels?.includes('Senior Secondary') && (
            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Teaching Pathways
              </label>
              <div className="space-y-2">
                {['STEM', 'Arts', 'Social Sciences'].map(pathway => (
                  <label key={pathway} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.teaching_pathways?.includes(pathway)}
                      onChange={() => handleTeachingPathwayChange(pathway)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{pathway}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.teaching_levels?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Qualified Subjects <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  ({selectedSubjectIds.length} selected — required for specialization)
                </span>
              </label>
              {loadingSubjects ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading subjects...
                </div>
              ) : availableSubjects.length === 0 ? (
                <p className="text-sm text-slate-400">No subjects found for selected levels.</p>
              ) : (
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg max-h-60 overflow-y-auto">
                  {Object.entries(
                    availableSubjects.reduce((acc, s) => {
                      const key = `${s.level} — ${s.category}`;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(s);
                      return acc;
                    }, {})
                  ).map(([group, subjects]) => (
                    <div key={group}>
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 sticky top-0">
                        {group}
                      </div>
                      {subjects.map(subject => (
                        <label key={subject.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSubjectIds.includes(subject.id)}
                            onChange={() => handleSubjectToggle(subject.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-700 dark:text-slate-300">{subject.name}</span>
                            {subject.is_core && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">Core</span>
                            )}
                          </div>
                          {formData.curriculum_specialization === '8-4-4' && selectedSubjectIds.includes(subject.id) && (
                            <input
                              type="text"
                              placeholder="Combo e.g. English/Lit"
                              className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-600 dark:text-white w-36"
                              onClick={e => e.preventDefault()}
                              onChange={e => {
                                onArrayChange('subject_pivot_meta', {
                                  ...(formData.subject_pivot_meta || {}),
                                  [subject.id]: {
                                    ...(formData.subject_pivot_meta?.[subject.id] || {}),
                                    combination_label: e.target.value
                                  }
                                });
                              }}
                              value={formData.subject_pivot_meta?.[subject.id]?.combination_label || ''}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all mt-2 sm:mt-0"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || (!editingTeacher && !formData.user_id)} 
              className="px-4 py-2 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px] flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                editingTeacher ? 'Update Teacher' : 'Create Teacher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherForm;
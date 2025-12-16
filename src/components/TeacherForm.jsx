// src/components/TeacherForm.jsx
import React, { useState } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import { toast } from "react-toastify";

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
  onSubmit,
  onClose,
  isSubmitting,
  users = [],
  school,
  specializationOptions = ['Sciences', 'Languages', 'Mathematics', 'Social Studies', 'Technical', 'Arts']
}) {
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

            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                Specialization
              </label>
              <select 
                id="specialization"
                name="specialization" 
                value={formData.specialization} 
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                <option value="">Select specialization</option>
                {specializationOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

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
          </div>

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
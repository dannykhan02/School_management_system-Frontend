import React from 'react';
import { X, Calendar, BookOpen } from 'lucide-react';

function AcademicYearForm({ 
  formData, 
  editingYear, 
  onInputChange, 
  onSubmit, 
  onClose, 
  isSubmitting 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Custom validation to ensure curriculum_type is selected
    if (!formData.curriculum_type) {
      alert('Please select a curriculum type');
      return;
    }
    
    // Validate end date is after start date
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      alert('End date must be after start date');
      return;
    }
    
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={onInputChange}
                min="2000"
                max="2100"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="term"
                name="term"
                value={formData.term}
                onChange={onInputChange}
                placeholder="e.g., Term 1"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="curriculum_type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Curriculum Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-5 w-5 text-slate-400" />
              </div>
              <select
                id="curriculum_type"
                name="curriculum_type"
                value={formData.curriculum_type}
                onChange={onInputChange}
                className={`w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all cursor-pointer ${!formData.curriculum_type ? 'text-slate-400' : ''}`}
                required
              >
                <option value="" disabled>Select curriculum type</option>
                <option value="CBC" className="text-slate-900 dark:text-white">CBC</option>
                <option value="8-4-4" className="text-slate-900 dark:text-white">8-4-4</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={onInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={onInputChange}
                  min={formData.start_date}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={onInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              Set as active academic year
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                editingYear ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AcademicYearForm;
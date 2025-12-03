import React, { useEffect } from 'react';
import { X, Calendar, BookOpen } from 'lucide-react';

function AcademicYearForm({
  formData,
  editingYear,
  onInputChange,
  onSubmit,
  onClose,
  isSubmitting,
  schoolPrimaryCurriculum,
  showCurriculumField = true
}) {
  const currentYear = new Date().getFullYear();

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    onInputChange(e);

    if (newYear) {
      if (formData.start_date) {
        const existingStartDate = new Date(formData.start_date);
        const newStartDate = new Date(newYear, existingStartDate.getMonth(), existingStartDate.getDate());
        onInputChange({
          target: {
            name: 'start_date',
            value: newStartDate.toISOString().split('T')[0]
          }
        });
      } else {
        onInputChange({
          target: {
            name: 'start_date',
            value: `${newYear}-01-01`
          }
        });
      }

      if (formData.end_date) {
        const existingEndDate = new Date(formData.end_date);
        const newEndDate = new Date(newYear, existingEndDate.getMonth(), existingEndDate.getDate());
        onInputChange({
          target: {
            name: 'end_date',
            value: newEndDate.toISOString().split('T')[0]
          }
        });
      } else {
        onInputChange({
          target: {
            name: 'end_date',
            value: `${newYear}-12-31`
          }
        });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (showCurriculumField && !formData.curriculum_type) {
      alert('Please select a curriculum type');
      return;
    }

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      alert('End date must be after start date');
      return;
    }

    onSubmit(e);
  };

  const getYearDateRange = () => {
    const year = parseInt(formData.year) || currentYear;
    return {
      minDate: `${year}-01-01`,
      maxDate: `${year}-12-31`
    };
  };

  const { minDate, maxDate } = getYearDateRange();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800/50 z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white">
            {editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label htmlFor="year" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleYearChange}
                min={currentYear}
                max="2100"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Must be current year or future year
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="term" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                Term <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="term"
                name="term"
                value={formData.term}
                onChange={onInputChange}
                placeholder="e.g., Term 1"
                className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {showCurriculumField && (
            <div className="space-y-1">
              <label htmlFor="curriculum_type" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                Curriculum Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                </div>
                <select
                  id="curriculum_type"
                  name="curriculum_type"
                  value={formData.curriculum_type}
                  onChange={onInputChange}
                  className={`w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all cursor-pointer ${!formData.curriculum_type ? 'text-slate-400' : ''}`}
                  required
                >
                  <option value="" disabled>Select curriculum type</option>
                  <option value="CBC" className="text-[#0d141b] dark:text-white">CBC</option>
                  <option value="8-4-4" className="text-[#0d141b] dark:text-white">8-4-4</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {!showCurriculumField && schoolPrimaryCurriculum && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                Curriculum Type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={schoolPrimaryCurriculum}
                  readOnly
                  className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 text-sm sm:text-base border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    (Auto-set)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label htmlFor="start_date" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={onInputChange}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Must be in {formData.year || currentYear}
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="end_date" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={onInputChange}
                  min={formData.start_date || minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Must be in {formData.year || currentYear} and after start date
              </p>
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
            <label htmlFor="is_active" className="ml-2 block text-sm text-[#0d141b] dark:text-slate-300 cursor-pointer">
              Set as active academic year
            </label>
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
              disabled={isSubmitting}
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

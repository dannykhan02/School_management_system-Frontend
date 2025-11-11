import React from 'react';
import { Calendar} from 'lucide-react';


function AcademicYearForm({ formData, editingYear, onInputChange, onSubmit, onClose }) {
  const isFormValid = formData.term && 
                     formData.start_date && 
                     formData.end_date && 
                     new Date(formData.start_date) <= new Date(formData.end_date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-2xl m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-white rounded-lg">
              <span className="material-symbols-outlined text-white text-base"><Calendar/></span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                {editingYear ? 'Edit Academic Year' : 'Create New Academic Year'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {editingYear ? 'Update the academic year details' : 'Define the term and dates for the academic year'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base text-gray-600 dark:text-gray-400">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div className="p-6 space-y-6">
            {/* Term Name */}
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Term Name *
              </label>
              <input
                type="text"
                id="term"
                name="term"
                value={formData.term}
                onChange={onInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Term 1, Fall Semester, etc."
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={onInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={onInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Validation Note */}
            {formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date) && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ End date must be after start date.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              {editingYear ? 'Update Academic Year' : 'Create Academic Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AcademicYearForm;
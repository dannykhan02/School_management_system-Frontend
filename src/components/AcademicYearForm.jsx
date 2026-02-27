import React, { useState } from 'react';
import { X, Calendar, BookOpen, Plus, Trash2, Layers } from 'lucide-react';

// ─── Single-term form ────────────────────────────────────────────────────────

function SingleTermForm({
  formData,
  editingYear,
  onInputChange,
  onSubmit,
  onClose,
  isSubmitting,
  schoolPrimaryCurriculum,
  showCurriculumField,
  onSwitchToBulk,
}) {
  const currentYear = new Date().getFullYear();

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    onInputChange(e);

    if (newYear) {
      if (formData.start_date) {
        const existingStartDate = new Date(formData.start_date);
        const newStartDate = new Date(newYear, existingStartDate.getMonth(), existingStartDate.getDate());
        onInputChange({ target: { name: 'start_date', value: newStartDate.toISOString().split('T')[0] } });
      } else {
        onInputChange({ target: { name: 'start_date', value: `${newYear}-01-01` } });
      }

      if (formData.end_date) {
        const existingEndDate = new Date(formData.end_date);
        const newEndDate = new Date(newYear, existingEndDate.getMonth(), existingEndDate.getDate());
        onInputChange({ target: { name: 'end_date', value: newEndDate.toISOString().split('T')[0] } });
      } else {
        onInputChange({ target: { name: 'end_date', value: `${newYear}-12-31` } });
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

  const year = parseInt(formData.year) || currentYear;
  const minDate = `${year}-01-01`;
  const maxDate = `${year}-12-31`;

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Year + Term */}
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
            className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Current year or future</p>
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
            className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-400"
            required
          />
        </div>
      </div>

      {/* Curriculum */}
      {showCurriculumField ? (
        <div className="space-y-1">
          <label htmlFor="curriculum_type" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
            Curriculum Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
            <select
              id="curriculum_type"
              name="curriculum_type"
              value={formData.curriculum_type}
              onChange={onInputChange}
              className="w-full pl-10 pr-8 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none transition-all cursor-pointer"
              required
            >
              <option value="" disabled>Select curriculum type</option>
              <option value="CBC">CBC</option>
              <option value="8-4-4">8-4-4</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      ) : schoolPrimaryCurriculum ? (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">Curriculum Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={schoolPrimaryCurriculum}
              readOnly
              className="w-full pl-10 pr-20 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-xs text-slate-500">(Auto-set)</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1">
          <label htmlFor="start_date" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={onInputChange}
            min={minDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Must be in {formData.year || currentYear}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="end_date" className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={onInputChange}
            min={formData.start_date || minDate}
            max={maxDate}
            className="w-full px-3 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            required
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Must be in {formData.year || currentYear} and after start date</p>
        </div>
      </div>

      {/* Active checkbox */}
      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={onInputChange}
          className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded cursor-pointer"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-[#0d141b] dark:text-slate-300 cursor-pointer">
          Set as active academic year
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
        {/* Switch to bulk (only when creating) */}
        {!editingYear && (
          <button
            type="button"
            onClick={onSwitchToBulk}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
          >
            <Layers className="w-4 h-4" />
            Create Multiple Terms
          </button>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm sm:text-base bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px] flex items-center justify-center"
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
      </div>
    </form>
  );
}

// ─── Bulk term form ───────────────────────────────────────────────────────────

const TERM_PRESETS = {
  CBC: [
    { term: 'Term 1', start_date: '', end_date: '', is_active: false },
    { term: 'Term 2', start_date: '', end_date: '', is_active: false },
    { term: 'Term 3', start_date: '', end_date: '', is_active: false },
  ],
  '8-4-4': [
    { term: 'Term 1', start_date: '', end_date: '', is_active: false },
    { term: 'Term 2', start_date: '', end_date: '', is_active: false },
    { term: 'Term 3', start_date: '', end_date: '', is_active: false },
  ],
};

function BulkTermForm({
  onSubmit,
  onClose,
  isSubmitting,
  schoolPrimaryCurriculum,
  showCurriculumField,
  onSwitchToSingle,
  initialYear,
  initialCurriculumType,
}) {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(initialYear || currentYear.toString());
  const [curriculumType, setCurriculumType] = useState(
    showCurriculumField ? (initialCurriculumType || '') : (schoolPrimaryCurriculum || '')
  );
  const [terms, setTerms] = useState([
    { term: 'Term 1', start_date: '', end_date: '', is_active: false },
    { term: 'Term 2', start_date: '', end_date: '', is_active: false },
    { term: 'Term 3', start_date: '', end_date: '', is_active: false },
  ]);

  const yearNum = parseInt(year) || currentYear;
  const minDate = `${yearNum}-01-01`;
  const maxDate = `${yearNum}-12-31`;

  // Apply preset when curriculum changes
  const handleCurriculumChange = (e) => {
    const val = e.target.value;
    setCurriculumType(val);
    if (TERM_PRESETS[val]) {
      setTerms(TERM_PRESETS[val].map(t => ({ ...t })));
    }
  };

  const handleTermChange = (index, field, value) => {
    setTerms(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleActiveChange = (index, checked) => {
    setTerms(prev => prev.map((t, i) => i === index ? { ...t, is_active: checked } : t));
  };

  const addTerm = () => {
    setTerms(prev => [...prev, { term: `Term ${prev.length + 1}`, start_date: '', end_date: '', is_active: false }]);
  };

  const removeTerm = (index) => {
    if (terms.length <= 1) return;
    setTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!year) { alert('Please enter a year'); return; }
    if (showCurriculumField && !curriculumType) { alert('Please select a curriculum type'); return; }

    // Validate each term
    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      if (!t.term.trim()) { alert(`Term ${i + 1}: name is required`); return; }
      if (!t.start_date) { alert(`Term ${i + 1}: start date is required`); return; }
      if (!t.end_date) { alert(`Term ${i + 1}: end date is required`); return; }
      if (t.end_date < t.start_date) { alert(`Term ${i + 1}: end date must be after start date`); return; }
    }

    // Check for duplicate term names
    const names = terms.map(t => t.term.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      alert('Each term must have a unique name'); return;
    }

    onSubmit({
      year,
      curriculum_type: curriculumType,
      terms,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
      {/* Year + Curriculum row */}
      <div className={`grid grid-cols-1 gap-3 ${showCurriculumField ? 'sm:grid-cols-2' : ''}`}>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            min={currentYear}
            max="2100"
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            required
          />
        </div>

        {showCurriculumField ? (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">
              Curriculum Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={curriculumType}
                onChange={handleCurriculumChange}
                className="w-full pl-10 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-all cursor-pointer"
                required
              >
                <option value="" disabled>Select curriculum</option>
                <option value="CBC">CBC</option>
                <option value="8-4-4">8-4-4</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300">Curriculum Type</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BookOpen className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={schoolPrimaryCurriculum}
                readOnly
                className="w-full pl-10 pr-20 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs text-slate-500">(Auto-set)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0d141b] dark:text-white">
            Terms <span className="text-slate-400 font-normal">({terms.length})</span>
          </h3>
          <button
            type="button"
            onClick={addTerm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Term
          </button>
        </div>

        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {terms.map((term, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 rounded-xl p-3 sm:p-4 space-y-3"
            >
              {/* Term header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Term {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeTerm(index)}
                  disabled={terms.length <= 1}
                  className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded"
                  aria-label="Remove term"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Term name */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Term Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={term.term}
                  onChange={e => handleTermChange(index, 'term', e.target.value)}
                  placeholder="e.g., Term 1"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={term.start_date}
                    onChange={e => handleTermChange(index, 'start_date', e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="w-full px-2 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={term.end_date}
                    onChange={e => handleTermChange(index, 'end_date', e.target.value)}
                    min={term.start_date || minDate}
                    max={maxDate}
                    className="w-full px-2 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Active checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`is_active_${index}`}
                  checked={term.is_active}
                  onChange={e => handleActiveChange(index, e.target.checked)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor={`is_active_${index}`} className="text-xs text-[#0d141b] dark:text-slate-300 cursor-pointer">
                  Set as active term
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary info */}
      <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-lg px-4 py-3">
        <p className="text-xs text-cyan-800 dark:text-cyan-300">
          <span className="font-semibold">{terms.length} term{terms.length !== 1 ? 's' : ''}</span> will be created for{' '}
          <span className="font-semibold">{year}</span>
          {curriculumType || schoolPrimaryCurriculum ? (
            <> under <span className="font-semibold">{curriculumType || schoolPrimaryCurriculum}</span> curriculum</>
          ) : null}.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onSwitchToSingle}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
        >
          <Calendar className="w-4 h-4" />
          Single Term
        </button>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-[#0d141b] dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Create {terms.length} Term{terms.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Props:
 *  - initialMode: 'single' | 'bulk'  (default: 'single')
 *    Lets the parent control which mode the form opens in.
 *  - onBulkSubmit: called with { year, curriculum_type, terms }
 */
function AcademicYearForm({
  formData,
  editingYear,
  onInputChange,
  onSubmit,
  onClose,
  isSubmitting,
  schoolPrimaryCurriculum,
  showCurriculumField = true,
  onBulkSubmit,
  initialMode = 'single',
}) {
  // Honour initialMode but allow switching; force single when editing
  const [mode, setMode] = useState(editingYear ? 'single' : initialMode);

  // If editingYear changes (e.g. parent re-uses the modal), stay in single
  const effectiveMode = editingYear ? 'single' : mode;

  const modalTitle = () => {
    if (editingYear) return 'Edit Academic Year';
    if (effectiveMode === 'bulk') return 'Create Multiple Terms';
    return 'Create Academic Year';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {effectiveMode === 'bulk' ? (
              <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
            ) : (
              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#0d141b] dark:text-white leading-tight">
                {modalTitle()}
              </h2>
              {effectiveMode === 'bulk' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create all terms for a year in one action
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {effectiveMode === 'single' ? (
            <SingleTermForm
              formData={formData}
              editingYear={editingYear}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
              onClose={onClose}
              isSubmitting={isSubmitting}
              schoolPrimaryCurriculum={schoolPrimaryCurriculum}
              showCurriculumField={showCurriculumField}
              onSwitchToBulk={() => setMode('bulk')}
            />
          ) : (
            <BulkTermForm
              onSubmit={onBulkSubmit}
              onClose={onClose}
              isSubmitting={isSubmitting}
              schoolPrimaryCurriculum={schoolPrimaryCurriculum}
              showCurriculumField={showCurriculumField}
              onSwitchToSingle={() => setMode('single')}
              initialYear={formData?.year}
              initialCurriculumType={formData?.curriculum_type}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AcademicYearForm;
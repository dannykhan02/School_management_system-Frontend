// src/components/TeacherForm.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, ChevronDown, GraduationCap, Briefcase, BookOpen, BarChart2, Zap, AlertCircle, FlaskConical, Palette, Globe } from 'lucide-react';
import { apiRequest } from '../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const SearchableDropdown = ({ options, value, onChange, placeholder, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen]         = useState(false);
  const selectedOption  = options.find(o => o.id === value);
  const filteredOptions = options.filter(o =>
    o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button type="button" disabled={disabled} onClick={() => setIsOpen(p => !p)}
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black bg-white dark:bg-slate-700 text-left flex items-center justify-between disabled:opacity-50">
        <span className={selectedOption ? 'text-[#0d141b] dark:text-white' : 'text-slate-400'}>
          {selectedOption ? `${selectedOption.full_name} (${selectedOption.email})` : (placeholder || 'Select user…')}
        </span>
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-56 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-slate-600">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input autoFocus type="text"
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-md focus:outline-none dark:text-white"
                placeholder="Search…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} />
            </div>
          </div>
          <ul className="py-1 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map(o => (
              <li key={o.id}
                className={`px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 ${o.id === value ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-300' : 'text-[#0d141b] dark:text-slate-300'}`}
                onClick={() => { onChange(o.id); setIsOpen(false); setSearchTerm(''); }}>
                <div className="font-medium text-sm">{o.full_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{o.email}</div>
              </li>
            )) : <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No matching users found</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700 mb-4">
    <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md">
      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
    </div>
    <div>
      <h4 className="text-sm font-semibold text-[#0d141b] dark:text-white">{title}</h4>
      {subtitle && <p className="text-xs text-[#4c739a] dark:text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-[#4c739a] dark:text-slate-400 mt-1">{hint}</p>}
  </div>
);

const inputCls  = "w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent dark:bg-slate-700 dark:text-white placeholder-slate-400";
const selectCls = inputCls;

// Pathway badge
const PathwayBadge = ({ pathway }) => {
  const config = {
    STEM:             { icon: FlaskConical, cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
    Arts:             { icon: Palette,      cls: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800' },
    'Social Sciences':{ icon: Globe,        cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  };
  const { icon: Icon, cls } = config[pathway] || { icon: null, cls: '' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded border ${cls}`}>
      {Icon && <Icon className="w-3 h-3" />}{pathway}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CombinationPicker
// ─────────────────────────────────────────────────────────────────────────────
const CombinationPicker = ({ grouped, value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const allCombos = Object.values(grouped).flat();
  const selected  = allCombos.find(c => c.id === parseInt(value));
  const q = search.toLowerCase();
  const filteredGrouped = Object.entries(grouped).reduce((acc, [group, combos]) => {
    const matches = combos.filter(c =>
      c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || group.toLowerCase().includes(q)
    );
    if (matches.length) acc[group] = matches;
    return acc;
  }, {});
  const hasResults = Object.keys(filteredGrouped).length > 0;

  return (
    <div className="relative">
      <button type="button" disabled={disabled}
        onClick={() => { setIsOpen(p => !p); setSearch(''); }}
        className={`w-full px-3 py-2.5 text-sm rounded-lg border shadow-sm flex items-center justify-between gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-black
          ${selected ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50/60 dark:bg-cyan-900/20 text-[#0d141b] dark:text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400'} disabled:opacity-50`}>
        <div className="flex-1 min-w-0 text-left">
          {selected ? (
            <span className="block truncate font-medium text-[#0d141b] dark:text-white">
              {selected.name}<span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">{selected.code}</span>
            </span>
          ) : <span className="text-slate-400 dark:text-slate-400">Select combination (optional)</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selected && (
            <span role="button" tabIndex={0}
              onClick={e => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onChange(''), setIsOpen(false))}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-500 cursor-pointer" title="Clear">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute z-40 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl flex flex-col overflow-hidden" style={{ maxHeight: '18rem' }}>
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or code…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:text-white placeholder-slate-400"
                  onClick={e => e.stopPropagation()} />
              </div>
            </div>
            <div className="overflow-y-auto">
              <div className={`px-3 py-2 cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-400`}
                onClick={() => { onChange(''); setIsOpen(false); }}>
                <span className="italic text-xs">No combination</span>
              </div>
              {hasResults ? Object.entries(filteredGrouped).map(([group, combos]) => (
                <div key={group}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 border-y border-slate-100 dark:border-slate-700 sticky top-0">{group}</div>
                  {combos.map(c => {
                    const isSelected = parseInt(value) === c.id;
                    return (
                      <div key={c.id}
                        className={`px-3 py-2.5 cursor-pointer flex items-start justify-between gap-3 transition-colors ${isSelected ? 'bg-cyan-50 dark:bg-cyan-900/25 text-cyan-800 dark:text-cyan-200' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[#0d141b] dark:text-slate-300'}`}
                        onClick={() => { onChange(String(c.id)); setIsOpen(false); setSearch(''); }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          {c.primary_subjects?.length > 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{c.primary_subjects.join(' · ')}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">{c.code}</span>
                      </div>
                    );
                  })}
                </div>
              )) : <p className="px-3 py-4 text-sm text-slate-400 text-center">No combinations match "{search}"</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main TeacherForm
// ─────────────────────────────────────────────────────────────────────────────
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
}) {
  const [combinations, setCombinations]               = useState([]);
  const [loadingCombinations, setLoadingCombinations] = useState(false);
  const [activeCombination, setActiveCombination]     = useState(null);

  const [availableSubjects, setAvailableSubjects]   = useState([]);
  const [loadingSubjects, setLoadingSubjects]       = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(formData.subject_ids || []);
  const [comboAutoTickedIds, setComboAutoTickedIds] = useState([]);
  const [loadingPreview, setLoadingPreview]         = useState(false);
  const [unmatchedNames, setUnmatchedNames]         = useState([]);

  const onArrayChangeRef     = useRef(onArrayChange);
  const availableSubjectsRef = useRef([]);
  useEffect(() => { onArrayChangeRef.current = onArrayChange; }, [onArrayChange]);
  useEffect(() => { availableSubjectsRef.current = availableSubjects; }, [availableSubjects]);

  // Sync if parent resets
  useEffect(() => { setSelectedSubjectIds(formData.subject_ids || []); }, [formData.subject_ids]);

  // Load combinations
  useEffect(() => {
    const fetchCombinations = async () => {
      setLoadingCombinations(true);
      try {
        const res = await apiRequest('teacher-combinations', 'GET');
        const raw = res?.data ?? res ?? {};
        const arr = Array.isArray(raw) ? raw : (raw.flat ?? Object.values(raw).flat() ?? []);
        setCombinations(arr);
        if (formData.combination_id) {
          const found = arr.find(c => c.id === parseInt(formData.combination_id));
          if (found) setActiveCombination(found);
        }
      } catch (e) {
        console.error('Failed to fetch combinations', e);
        setCombinations([]);
      } finally {
        setLoadingCombinations(false);
      }
    };
    fetchCombinations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load available subjects based on levels / pathways / curriculum ──────────
  // Fetches subjects for EVERY selected level independently, so "English" at
  // Junior Secondary (ID 42) and "English" at Senior Secondary (ID 91) both
  // appear as separate selectable entries.
  //
  // For Senior Secondary:
  //   - If pathways are ticked   → fetch once per pathway (pathway-scoped subjects)
  //   - If no pathways yet        → fetch WITHOUT a pathway filter so ALL Senior
  //     Secondary subjects load immediately (admin can still see them while picking pathways)
  useEffect(() => {
    const fetchSubjects = async () => {
      const levels = formData.teaching_levels || [];
      if (!levels.length) { setAvailableSubjects([]); return; }
      setLoadingSubjects(true);
      try {
        const curriculum = formData.curriculum_specialization;
        const pathways   = formData.teaching_pathways || [];
        const all = [];

        const fetchLevel = async (level, pathway = null) => {
          const params = new URLSearchParams();
          params.set('level', level);
          if (curriculum) params.set('curriculum', curriculum);
          if (pathway)    params.set('pathway', pathway);
          try {
            const res = await apiRequest(`subjects/filter?${params.toString()}`, 'GET');
            // API returns { flat: [...], grouped: {...} } or just an array
            const flat = res?.flat ?? res?.data?.flat ?? res?.data ?? (Array.isArray(res) ? res : []);
            return Array.isArray(flat) ? flat : [];
          } catch { return []; }
        };

        for (const level of levels) {
          if (level === 'Senior Secondary') {
            if (pathways.length > 0) {
              // Fetch per pathway so pathway-exclusive subjects are included
              for (const pathway of pathways) {
                all.push(...await fetchLevel(level, pathway));
              }
            } else {
              // No pathway selected yet — still show ALL Senior Secondary subjects
              // so admin can see what's available while they pick pathways
              all.push(...await fetchLevel(level));
            }
          } else {
            // Pre-Primary, Primary, Junior Secondary — no pathway concept
            all.push(...await fetchLevel(level));
          }
        }

        // Deduplicate by subject ID (same subject at different levels = different IDs)
        const uniqueSubjects = Array.from(new Map(all.map(s => [s.id, s])).values());
        setAvailableSubjects(uniqueSubjects);
      } catch (e) {
        console.error('Failed to fetch subjects', e);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [formData.teaching_levels, formData.teaching_pathways, formData.curriculum_specialization]);

  // ── Re-apply combo auto-ticks whenever availableSubjects changes ─────────────
  // When a combination is selected BEFORE levels are ticked, the preview returns
  // matched IDs but none are in availableSubjects yet. Once the admin ticks a
  // level, availableSubjects loads and this effect merges the pending combo IDs
  // into selectedSubjectIds — so subjects auto-tick at the right moment.
  //
  // Also handles the reverse: if a level is UN-ticked, subjects that were
  // auto-ticked for that level get removed.
  useEffect(() => {
    if (comboAutoTickedIds.length === 0) return;

    const availableIds = new Set(availableSubjects.map(s => s.id));

    // Find which combo IDs are now visible (level was just ticked)
    const nowVisible = comboAutoTickedIds.filter(id => availableIds.has(id));

    // Merge newly visible IDs into selection
    setSelectedSubjectIds(prev => {
      const prevSet = new Set(prev);
      const hasNewOnes = nowVisible.some(id => !prevSet.has(id));
      if (!hasNewOnes) {
        // Also check if we need to strip IDs that are no longer available
        const prevAutoSet = new Set(comboAutoTickedIds);
        const stripped = prev.filter(id => !prevAutoSet.has(id) || availableIds.has(id));
        if (stripped.length === prev.length) return prev; // no change
        setTimeout(() => onArrayChangeRef.current('subject_ids', stripped), 0);
        return stripped;
      }
      const merged = Array.from(new Set([...prev, ...nowVisible]));
      setTimeout(() => onArrayChangeRef.current('subject_ids', merged), 0);
      return merged;
    });
  }, [availableSubjects, comboAutoTickedIds]);

  // ── AUTO-TICK from combination preview ───────────────────────────────────────
  // Stores ALL matched IDs from the school (across every level/pathway).
  // The re-apply effect above then merges the correct subset into
  // selectedSubjectIds each time the admin ticks/unticks a teaching level.
  //
  // Flow:
  //   1. Admin picks combination → all matched IDs stored in comboAutoTickedIds
  //   2. Admin ticks "Junior Secondary" → JS subjects for that combo auto-tick
  //   3. Admin ticks "Senior Secondary" → SS subjects for that combo auto-tick
  //   4. Admin un-ticks "Junior Secondary" → JS subjects removed automatically
  const autoTickFromCombination = useCallback(async (combinationId) => {
    if (!combinationId) return;
    setLoadingPreview(true);
    setUnmatchedNames([]);
    try {
      const res       = await apiRequest(`teacher-combinations/${combinationId}/preview`, 'GET');
      const matched   = res?.matched_subjects || res?.data?.matched_subjects || [];
      const unmatched = res?.unmatched_names  || res?.data?.unmatched_names  || [];

      // Store every matched ID — even ones for levels not yet ticked.
      // The re-apply useEffect will merge in the visible ones as levels are ticked.
      const allMatchedIds = matched.map(s => s.id);
      setComboAutoTickedIds(allMatchedIds);
      setUnmatchedNames(unmatched);

      // Immediately tick those already visible in availableSubjects
      // (i.e. levels were already ticked before combination was chosen)
      setSelectedSubjectIds(prev => {
        const currentlyAvailableIds = new Set(availableSubjectsRef.current.map(s => s.id));
        const immediateIds = allMatchedIds.filter(id => currentlyAvailableIds.has(id));
        const merged = Array.from(new Set([...prev, ...immediateIds]));
        setTimeout(() => onArrayChangeRef.current('subject_ids', merged), 0);
        return merged;
      });
    } catch (e) {
      console.error('Failed to auto-tick subjects from combination', e);
    } finally {
      setLoadingPreview(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSubjectToggle = (id) => {
    setSelectedSubjectIds(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setTimeout(() => onArrayChange('subject_ids', updated), 0);
      return updated;
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    if (name === 'combination_id') {
      const combo = combinations.find(c => c.id === parseInt(value));
      setActiveCombination(combo || null);
      if (combo) {
        onInputChange({ target: { name: 'qualification',        value: combo.degree_title || ''     } });
        onInputChange({ target: { name: 'bed_institution_type', value: combo.institution_type || '' } });
        autoTickFromCombination(combo.id);
      } else {
        onInputChange({ target: { name: 'qualification',        value: '' } });
        onInputChange({ target: { name: 'bed_institution_type', value: '' } });
        setUnmatchedNames([]);
        const prevAutoTicked = new Set(comboAutoTickedIds);
        setSelectedSubjectIds(prev => {
          const updated = prev.filter(id => !prevAutoTicked.has(id));
          setTimeout(() => onArrayChange('subject_ids', updated), 0);
          return updated;
        });
        setComboAutoTickedIds([]);
      }
    } else {
      setTimeout(() => onInputChange({ target: { name, value: newValue } }), 0);
    }
  };

  const handleUserChange   = (id) => { setTimeout(() => onInputChange({ target: { name: 'user_id',       value: id } }), 0); };

  const handleTeachingLevelChange = (level) => {
    const cur = formData.teaching_levels || [];
    const updated = cur.includes(level) ? cur.filter(x => x !== level) : [...cur, level];
    setTimeout(() => onArrayChange('teaching_levels', updated), 0);
  };

  const handleTeachingPathwayChange = (pathway) => {
    const cur = formData.teaching_pathways || [];
    const updated = cur.includes(pathway) ? cur.filter(x => x !== pathway) : [...cur, pathway];
    setTimeout(() => onArrayChange('teaching_pathways', updated), 0);
  };

  // Grouped subjects by level-category for display, also computes a "name group"
  // so multi-level subjects (same name, different level IDs) appear visually linked
  const groupedSubjects = availableSubjects.reduce((acc, s) => {
    const key = `${s.level} — ${s.category || 'General'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  // Build name → all IDs map for smart cross-level suggestions
  const subjectNameMap = availableSubjects.reduce((acc, s) => {
    if (!acc[s.name]) acc[s.name] = [];
    acc[s.name].push(s.id);
    return acc;
  }, {});

  // For a given toggled subject, find sibling IDs (same name, other levels)
  const getSiblingIds = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    if (!subject) return [];
    return (subjectNameMap[subject.name] || []).filter(id => id !== subjectId);
  };

  // Smart toggle: when you tick a subject, we find sibling IDs (same name, other levels)
  // and offer to auto-select those too via the hint bar
  const [siblingHint, setSiblingHint] = useState(null); // { name, ids }

  const handleSubjectToggleSmart = (id) => {
    const isCurrentlySelected = selectedSubjectIds.includes(id);
    setSelectedSubjectIds(prev => {
      const updated = isCurrentlySelected ? prev.filter(x => x !== id) : [...prev, id];
      setTimeout(() => onArrayChange('subject_ids', updated), 0);
      return updated;
    });

    // If we're selecting (not deselecting), check for siblings not yet ticked
    if (!isCurrentlySelected) {
      const siblingIds = getSiblingIds(id);
      const untickedSiblings = siblingIds.filter(sid => !selectedSubjectIds.includes(sid) && sid !== id);
      if (untickedSiblings.length > 0) {
        const subject = availableSubjects.find(s => s.id === id);
        setSiblingHint({ name: subject?.name, ids: untickedSiblings });
        // Auto-dismiss after 8 seconds
        setTimeout(() => setSiblingHint(null), 8000);
      } else {
        setSiblingHint(null);
      }
    } else {
      setSiblingHint(null);
    }
  };

  const acceptSiblingHint = () => {
    if (!siblingHint) return;
    setSelectedSubjectIds(prev => {
      const merged = Array.from(new Set([...prev, ...siblingHint.ids]));
      setTimeout(() => onArrayChange('subject_ids', merged), 0);
      return merged;
    });
    setSiblingHint(null);
  };

  const groupedCombinations = combinations.reduce((acc, c) => {
    if (!acc[c.subject_group]) acc[c.subject_group] = [];
    acc[c.subject_group].push(c);
    return acc;
  }, {});

  const autoTickedSet = new Set(comboAutoTickedIds);

  // Count multi-level subjects (same name appearing in multiple levels)
  const multiLevelSubjectNames = Object.entries(subjectNameMap)
    .filter(([, ids]) => ids.length > 1)
    .map(([name]) => name);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800/50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-auto border border-slate-200 dark:border-slate-700 flex flex-col"
        style={{ maxHeight: '95vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0d141b] dark:text-white">
              {editingTeacher ? 'Edit Teacher' : 'New Teacher'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingTeacher ? 'Update teacher information and subjects' : 'Fill in details to create a teacher profile'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={e => { e.preventDefault(); onSubmit(e); }} className="px-4 sm:px-6 py-5 space-y-6" id="teacher-form">

            {/* ══ 1 — USER ═════════════════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={Briefcase} title="Teacher Account" />
              <Field label="User" required hint={editingTeacher ? 'User cannot be changed after creation.' : undefined}>
                <SearchableDropdown options={users} value={formData.user_id} onChange={handleUserChange} disabled={!!editingTeacher} />
              </Field>
            </section>

            {/* ══ 2 — B.Ed COMBINATION ══════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={GraduationCap} title="B.Ed Combination"
                subtitle="Selecting a combination auto-fills qualification, institution type, and qualified subjects." />
              <div className="space-y-4">
                <Field label="Combination">
                  {loadingCombinations ? (
                    <div className="flex items-center gap-2 py-2.5 text-sm text-slate-400">
                      <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading combinations…
                    </div>
                  ) : (
                    <CombinationPicker grouped={groupedCombinations} value={formData.combination_id || ''}
                      onChange={val => handleInputChange({ target: { name: 'combination_id', value: val } })} />
                  )}

                  {activeCombination && (
                    <div className="mt-2 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-xs space-y-2">
                      <p className="font-semibold text-cyan-900 dark:text-cyan-100">{activeCombination.degree_title}</p>
                      {activeCombination.primary_subjects?.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="font-medium text-cyan-800 dark:text-cyan-200 mr-1">Primary:</span>
                          {activeCombination.primary_subjects.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 text-[10px] font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                      {activeCombination.derived_subjects?.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="font-medium text-amber-700 dark:text-amber-300 mr-1">Also can teach:</span>
                          {activeCombination.derived_subjects.map(s => (
                            <span key={s} className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                      {activeCombination.eligible_levels?.length > 0 && (
                        <p className="text-cyan-800 dark:text-cyan-200">
                          <span className="font-medium">Can cover: </span>{activeCombination.eligible_levels.join(', ')}
                        </p>
                      )}
                      {loadingPreview ? (
                        <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400">
                          <svg className="animate-spin h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Finding matching subjects…
                        </div>
                      ) : comboAutoTickedIds.length > 0 ? (
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                          ✓ {comboAutoTickedIds.length} subject{comboAutoTickedIds.length !== 1 ? 's' : ''} auto-selected
                        </p>
                      ) : null}
                    </div>
                  )}
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Qualification" hint={activeCombination ? 'Auto-filled from combination — edit if needed.' : undefined}>
                      <div className="relative">
                        <input type="text" name="qualification" value={formData.qualification || ''} onChange={handleInputChange}
                          placeholder="Select a combination or type manually"
                          className={`${inputCls} ${activeCombination ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-900/10 pr-14' : ''}`} />
                        {activeCombination && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 font-medium pointer-events-none">auto</span>
                        )}
                      </div>
                    </Field>
                  </div>
                  <Field label="Institution Type" hint={activeCombination && formData.bed_institution_type ? 'Auto-filled' : undefined}>
                    <div className="relative">
                      <select name="bed_institution_type" value={formData.bed_institution_type || ''} onChange={handleInputChange}
                        className={`${selectCls} ${activeCombination && formData.bed_institution_type ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-900/10' : ''}`}>
                        <option value="">Select type</option>
                        <option value="university">University</option>
                        <option value="teacher_training_college">Teacher Training College</option>
                        <option value="technical_university">Technical University</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Graduation Year">
                    <input type="number" name="bed_graduation_year" value={formData.bed_graduation_year || ''} onChange={handleInputChange}
                      placeholder="e.g., 2018" min="1970" max={new Date().getFullYear()} className={inputCls} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Awarding Institution">
                      <input type="text" name="bed_awarding_institution" value={formData.bed_awarding_institution || ''} onChange={handleInputChange}
                        placeholder="e.g., University of Nairobi" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </div>
            </section>

            {/* ══ 3 — TSC ═════════════════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={BookOpen} title="TSC Registration" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field label="TSC Number">
                  <input type="text" name="tsc_number" value={formData.tsc_number || ''} onChange={handleInputChange}
                    placeholder="e.g., TSC123456" className={inputCls} />
                </Field>
                <Field label="TSC Status">
                  <select name="tsc_status" value={formData.tsc_status || ''} onChange={handleInputChange} className={selectCls}>
                    <option value="">Select status</option>
                    <option value="registered">Registered</option>
                    <option value="pending">Pending</option>
                    <option value="not_registered">Not Registered</option>
                  </select>
                </Field>
              </div>
            </section>

            {/* ══ 4 — EMPLOYMENT ═══════════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={Briefcase} title="Employment" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {school?.primary_curriculum === 'Both' && (
                  <Field label="Curriculum Specialization" required>
                    <select name="curriculum_specialization" value={formData.curriculum_specialization || ''} onChange={handleInputChange} required className={selectCls}>
                      <option value="">Select curriculum</option>
                      <option value="CBC">CBC</option>
                      <option value="8-4-4">8-4-4</option>
                      <option value="Both">Both</option>
                    </select>
                  </Field>
                )}
                <Field label="Employment Type">
                  <select name="employment_type" value={formData.employment_type || ''} onChange={handleInputChange} className={selectCls}>
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </Field>
                <Field label="Employment Status">
                  <select name="employment_status" value={formData.employment_status || 'active'} onChange={handleInputChange} className={selectCls}>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="resigned">Resigned</option>
                    <option value="retired">Retired</option>
                  </select>
                </Field>
                {editingTeacher && formData.specialization && (
                  <div className="sm:col-span-2">
                    <Field label="Specialization (auto-generated)">
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {formData.specialization}
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </section>

            {/* ══ 5 — WORKLOAD LIMITS ══════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={BarChart2} title="Workload Limits" subtitle="Leave blank to use school defaults" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'max_subjects',       label: 'Max Subjects',    ph: '4'  },
                  { name: 'max_classes',         label: 'Max Classes',     ph: '6'  },
                  { name: 'max_weekly_lessons',  label: 'Max Lessons/Wk', ph: '27' },
                  { name: 'min_weekly_lessons',  label: 'Min Lessons/Wk', ph: '20' },
                ].map(({ name, label, ph }) => (
                  <Field key={name} label={label}>
                    <input type="number" name={name} value={formData[name] || ''} onChange={handleInputChange}
                      min="1" placeholder={ph} className={inputCls} />
                  </Field>
                ))}
              </div>
            </section>

            {/* ══ 6 — TEACHING LEVELS & PATHWAYS ═══════════════════════════════ */}
            <section>
              <SectionHeader icon={BookOpen} title="Teaching Levels & Pathways"
                subtitle={activeCombination
                  ? `Combination covers: ${activeCombination.eligible_levels?.join(', ')} — tick what applies at your school`
                  : 'Select the levels this teacher will cover'} />

              {/* Levels */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Levels <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['Pre-Primary', 'Primary', 'Junior Secondary', 'Senior Secondary'].map(level => {
                    const checked = formData.teaching_levels?.includes(level);
                    const inCombo = activeCombination?.eligible_levels?.includes(level);
                    return (
                      <label key={level}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm
                          ${checked
                            ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                            : inCombo
                              ? 'border-cyan-200 dark:border-cyan-800/50 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                              : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}>
                        <input type="checkbox" checked={!!checked} onChange={() => handleTeachingLevelChange(level)}
                          className="rounded border-slate-300 dark:border-slate-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm leading-tight">{level}</span>
                        {inCombo && !checked && <span className="ml-auto text-[10px] text-cyan-400">✓ eligible</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pathways — only when Senior Secondary is ticked */}
              {formData.teaching_levels?.includes('Senior Secondary') && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Senior Secondary Pathways
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { p: 'STEM',              icon: FlaskConical, activeColor: 'bg-cyan-500 border-cyan-500 text-white' },
                      { p: 'Arts',              icon: Palette,      activeColor: 'bg-pink-600 border-pink-600 text-white' },
                      { p: 'Social Sciences',   icon: Globe,        activeColor: 'bg-amber-600 border-amber-600 text-white' },
                    ].map(({ p, icon: Icon, activeColor }) => {
                      const checked = formData.teaching_pathways?.includes(p);
                      const inCombo = activeCombination?.eligible_pathways?.includes(p);
                      return (
                        <label key={p}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all
                            ${checked
                              ? `${activeColor}`
                              : inCombo
                                ? 'border-cyan-200 dark:border-cyan-800/50 text-slate-600 dark:text-slate-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                                : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}>
                          <input type="checkbox" checked={!!checked} onChange={() => handleTeachingPathwayChange(p)} className="sr-only" />
                          <Icon className={`w-4 h-4 ${checked ? 'text-white' : ''}`} />
                          <span className="text-xs font-medium text-center leading-tight">{p}</span>
                          {inCombo && !checked && <span className="text-[9px] text-cyan-500">eligible</span>}
                        </label>
                      );
                    })}
                  </div>
                  {/* Multi-level hint */}
                  {multiLevelSubjectNames.length > 0 && (
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                      💡 {multiLevelSubjectNames.length} subject{multiLevelSubjectNames.length>1?'s':''} ({multiLevelSubjectNames.slice(0,3).join(', ')}{multiLevelSubjectNames.length>3?'…':''}) appear across multiple levels — ticking them selects all levels.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* ══ 7 — QUALIFIED SUBJECTS ════════════════════════════════════════ */}
            <section>
              <SectionHeader icon={Zap} title="Qualified Subjects"
                subtitle={activeCombination
                  ? 'Subjects matched to this combination are auto-selected. Adjust as needed.'
                  : 'Select teaching levels above, then tick subjects below.'} />

              {/* Unmatched warning */}
              {unmatchedNames.length > 0 && !loadingPreview && (
                <div className="mb-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-xs text-orange-700 dark:text-orange-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-0.5">{unmatchedNames.length} subject{unmatchedNames.length>1?'s':''} not found in your school records:</p>
                      <p className="text-orange-600 dark:text-orange-400">{unmatchedNames.join(', ')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart sibling hint banner */}
              {siblingHint && (
                <div className="mb-3 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <p className="text-cyan-800 dark:text-cyan-200">
                      <span className="font-semibold">{siblingHint.name}</span> also exists at {siblingHint.ids.length} other level{siblingHint.ids.length>1?'s':''}.
                      Auto-select all?
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button type="button" onClick={acceptSiblingHint}
                      className="px-2.5 py-1 bg-cyan-600 text-white rounded-lg text-[10px] font-semibold hover:bg-cyan-700 transition-all">
                      Yes, all
                    </button>
                    <button type="button" onClick={() => setSiblingHint(null)}
                      className="px-2 py-1 text-cyan-600 dark:text-cyan-400 rounded-lg text-[10px] hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all">
                      No
                    </button>
                  </div>
                </div>
              )}

              {formData.teaching_levels?.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                  {loadingSubjects || loadingPreview ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {loadingPreview ? 'Auto-selecting from combination…' : 'Loading subjects…'}
                    </div>
                  ) : availableSubjects.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 p-4 text-center">
                      No subjects found for the selected levels{formData.teaching_levels?.includes('Senior Secondary') && !formData.teaching_pathways?.length ? ' — select a Senior Secondary pathway above' : ''}.
                    </p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {Object.entries(groupedSubjects).map(([group, subjects]) => (
                        <div key={group}>
                          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-100 dark:border-slate-600 flex items-center justify-between">
                            <span>{group}</span>
                            <span className="text-[10px] font-normal text-slate-400">{subjects.length}</span>
                          </div>
                          {subjects.map(s => {
                            const isChecked    = selectedSubjectIds.includes(s.id);
                            const isAutoTicked = autoTickedSet.has(s.id);
                            const hasSiblings  = (subjectNameMap[s.name] || []).length > 1;

                            return (
                              <label key={s.id}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-700/30 last:border-0
                                  ${isChecked
                                    ? isAutoTicked
                                      ? 'bg-cyan-50 dark:bg-cyan-900/15 hover:bg-cyan-100/70 dark:hover:bg-cyan-900/25'
                                      : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                  }`}>
                                <input type="checkbox" checked={isChecked} onChange={() => handleSubjectToggleSmart(s.id)}
                                  className="rounded border-slate-300 dark:border-slate-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.name}</span>
                                    {s.is_core && <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">Core</span>}
                                    {hasSiblings && (
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500" title="This subject exists at multiple levels">multi-level</span>
                                    )}
                                  </div>
                                </div>
                                {isAutoTicked && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-medium whitespace-nowrap flex-shrink-0">
                                    from combo
                                  </span>
                                )}
                                {formData.curriculum_specialization === '8-4-4' && isChecked && (
                                  <input type="text" placeholder="Combo e.g. Eng/Lit"
                                    className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-600 dark:text-white w-28 focus:outline-none focus:ring-2 focus:ring-black flex-shrink-0"
                                    onClick={e => e.preventDefault()}
                                    onChange={e => {
                                      const updatedMeta = { ...(formData.subject_pivot_meta || {}), [s.id]: { ...(formData.subject_pivot_meta?.[s.id] || {}), combination_label: e.target.value } };
                                      setTimeout(() => onArrayChange('subject_pivot_meta', updatedMeta), 0);
                                    }}
                                    value={formData.subject_pivot_meta?.[s.id]?.combination_label || ''} />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  {!loadingSubjects && !loadingPreview && selectedSubjectIds.length > 0 && (
                    <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between">
                      <span className="text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedSubjectIds.length}</span>{' '}
                        subject{selectedSubjectIds.length !== 1 ? 's' : ''} selected
                      </span>
                      {comboAutoTickedIds.length > 0 && (
                        <span className="text-cyan-600 dark:text-cyan-400">
                          {comboAutoTickedIds.filter(id => selectedSubjectIds.includes(id)).length} from combination
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-2 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Zap className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">Select teaching levels above to see available subjects.</p>
                </div>
              )}

              {/* Resync checkbox */}
              {editingTeacher && formData.combination_id && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                  <input type="checkbox" id="resync_subjects" name="resync_subjects"
                    checked={formData.resync_subjects || false} onChange={handleInputChange}
                    className="rounded border-slate-300 dark:border-slate-600" />
                  <label htmlFor="resync_subjects" className="text-xs text-amber-800 dark:text-amber-300 cursor-pointer">
                    Re-sync subjects from combination on save (replaces current assignments)
                  </label>
                </div>
              )}
            </section>

          </form>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 justify-end px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800/50">
          <button type="button" onClick={onClose} disabled={isSubmitting}
            className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="teacher-form"
            disabled={isSubmitting || (!editingTeacher && !formData.user_id) || loadingPreview || loadingSubjects}
            className="px-5 py-2.5 text-sm bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[120px] font-medium">
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving…
              </>
            ) : editingTeacher ? 'Update Teacher' : 'Create Teacher'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherForm;
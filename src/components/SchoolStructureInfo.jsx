import React from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const SchoolStructureInfo = ({ 
  showSuperAdminCard, 
  onSuperAdminClick, 
  title = "School Structure Information",
  description = "School structure fields are locked to maintain data consistency and prevent conflicts."
}) => {
  return (
    <div className="mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300 flex-shrink-0" />
          <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
            {title}
          </h3>
        </div>
        <button
          onClick={onSuperAdminClick}
          className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-full sm:w-auto"
          aria-expanded={showSuperAdminCard}
          aria-label={showSuperAdminCard ? "Hide super admin contacts" : "Show super admin contacts"}
        >
          {showSuperAdminCard ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span className="sm:hidden">Hide Contacts</span>
              <span className="hidden sm:inline">Hide Super Admin Contacts</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span className="sm:hidden">Need Changes?</span>
              <span className="hidden sm:inline">Contact Super Admin</span>
            </>
          )}
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 sm:mb-2">
        {description}
      </p>
      <div className="mt-3 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <strong className="font-semibold">Locked Fields:</strong> School Type, Curriculum Type, Curriculum Levels, Grade/Class Levels
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          To modify these fields, please contact a Super Administrator.
        </p>
      </div>
    </div>
  );
};

export default SchoolStructureInfo;
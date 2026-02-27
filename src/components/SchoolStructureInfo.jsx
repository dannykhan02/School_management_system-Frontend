import React from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

const SchoolStructureInfo = ({ 
  showSuperAdminCard, 
  onSuperAdminClick, 
  title = "School Structure Information",
  description = "School structure fields are locked to maintain data consistency and prevent conflicts."
}) => {
  return (
    <div className="mb-6 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border border-cyan-100 dark:border-slate-700 rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          {/* Shield icon — cyan accent, matching SuperAdminContactCard */}
          <div className="p-1 rounded-full bg-cyan-50 dark:bg-cyan-900/30 flex-shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
            {title}
          </h3>
        </div>
        {/* Contact button — cyan accent */}
        <button
          onClick={onSuperAdminClick}
          className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/40 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors w-full sm:w-auto"
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
      {/* Locked fields box — amber accent, matching SuperAdminContactCard info box */}
      <div className="mt-3 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/40">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <strong className="font-semibold text-amber-700 dark:text-amber-400">Locked Fields:</strong> School Type, Curriculum Type, Curriculum Levels, Grade/Class Levels
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          To modify these fields, please contact a Super Administrator.
        </p>
      </div>
    </div>
  );
};

export default SchoolStructureInfo;
// src/components/WorkloadMeter.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { Loader, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

function WorkloadMeter({ teacherId, academicYearId, compact = false }) {
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (teacherId && academicYearId) {
      fetchWorkload();
    }
  }, [teacherId, academicYearId]);

  const fetchWorkload = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await apiRequest(
        `teachers/${teacherId}/workload?academic_year_id=${academicYearId}`,
        'GET'
      );
      setWorkload(response.data || response);
    } catch (err) {
      console.error('Failed to fetch workload:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader className="w-4 h-4 text-slate-400 animate-spin" />
        {!compact && <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>}
      </div>
    );
  }

  if (error || !workload) {
    return (
      <div className="flex items-center gap-1">
        <AlertCircle className="w-4 h-4 text-red-500" />
        {!compact && <span className="text-xs text-red-600 dark:text-red-400">Error</span>}
      </div>
    );
  }

  const getStatusColor = () => {
    if (workload.is_overloaded) return 'bg-red-500 dark:bg-red-600';
    if (workload.is_underloaded) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-green-500 dark:bg-green-600';
  };

  const getStatusIcon = () => {
    if (workload.is_overloaded) return <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
    if (workload.is_underloaded) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />;
    return <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />;
  };

  const getStatusBadge = () => {
    if (workload.is_overloaded) {
      return (
        <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-semibold">
          Overloaded
        </span>
      );
    }
    if (workload.is_underloaded) {
      return (
        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
          Underloaded
        </span>
      );
    }
    return null;
  };

  // Compact version (for table cells)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 w-20 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${Math.min(workload.percentage_used, 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap">
          {workload.total_lessons}/{workload.max_lessons}
        </span>
        {workload.is_overloaded && (
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
      </div>
    );
  }

  // Full version (for detailed displays)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Workload Status
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Current Lessons</span>
          <span className="font-semibold">{workload.total_lessons}/{workload.max_lessons}</span>
        </div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${Math.min(workload.percentage_used, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Available Capacity</span>
          <span className="font-semibold">{workload.available_capacity} lessons</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs">
          <span className="text-slate-500 dark:text-slate-400">Subjects:</span>
          <span className="ml-1 font-semibold text-slate-900 dark:text-white">{workload.subject_count}</span>
        </div>
        <div className="text-xs">
          <span className="text-slate-500 dark:text-slate-400">Classes:</span>
          <span className="ml-1 font-semibold text-slate-900 dark:text-white">{workload.classroom_count}</span>
        </div>
      </div>
    </div>
  );
}

export default WorkloadMeter;
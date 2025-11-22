// src/Dashboard/Pages/Admin/ClassroomManager.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  MapPin, 
  Plus, 
  X,
  ChevronRight,
  AlertCircle,
  Users
} from 'lucide-react';
import { toast } from "react-toastify";

function ClassroomManager() {
  const { user, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [classrooms, setClassrooms] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    capacity: '',
  });

  // Get schoolId from user object - handle multiple possible property names
  const schoolId = user?.school_id || user?.schoolId || user?.school?.id;

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classroomsResponse, streamsResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest('streams', 'GET')
      ]);
      
      // Handle different response structures
      const classroomsData = classroomsResponse?.data || classroomsResponse || [];
      const streamsData = streamsResponse?.data || streamsResponse || [];
      
      // Calculate total capacity for each classroom by summing stream capacities
      const classroomsWithCapacity = classroomsData.map(classroom => {
        const classroomStreams = streamsData.filter(stream => stream.class_id === classroom.id);
        const totalCapacity = classroomStreams.reduce((sum, stream) => sum + (stream.capacity || 0), 0);
        
        return {
          ...classroom,
          streams: classroomStreams,
          calculatedCapacity: totalCapacity,
          streamCount: classroomStreams.length
        };
      });
      
      setClassrooms(classroomsWithCapacity);
      setStreams(streamsData);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load data';
      toast.error(errorMessage);
      
      // Set empty arrays on error to prevent UI issues
      setClassrooms([]);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };
  
  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedClassroom(null);
    setFormData({ class_name: '', capacity: '' });
  };

  const showEditForm = (classroom) => {
    setView('edit');
    setSelectedClassroom(classroom);
    setFormData({
      class_name: classroom.class_name,
      capacity: classroom.capacity || '',
    });
  };

  const showStreamsView = async (classroom) => {
    setView('streams');
    setSelectedClassroom(classroom);
    setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/streams`, 'GET');
      const classroomStreams = response?.streams || response?.data || response || [];
      
      // Calculate total capacity for this classroom's streams
      const totalCapacity = classroomStreams.reduce((sum, stream) => sum + (stream.capacity || 0), 0);
      
      setStreams(classroomStreams);
      setSelectedClassroom(prev => ({
        ...prev,
        calculatedCapacity: totalCapacity,
        streamCount: classroomStreams.length
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Could not load streams';
      toast.error(errorMessage);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedClassroom(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare payload with school_id
      const payload = { 
        class_name: formData.class_name,
        capacity: formData.capacity,
        school_id: schoolId // Always include school_id
      };
      
      let response;
      
      if (view === 'edit') {
        response = await apiRequest(`classrooms/${selectedClassroom.id}`, 'PUT', payload);
        toast.success('Classroom updated successfully');
      } else {
        response = await apiRequest('classrooms', 'POST', payload);
        toast.success('Classroom created successfully');
      }

      backToList();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} classroom: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      setLoading(true);
      try {
        await apiRequest(`classrooms/${id}`, 'DELETE');
        toast.success('Classroom deleted successfully');
        fetchInitialData();
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete classroom';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Classroom Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            Manage classrooms and their associated streams
          </p>
        </div>
        <button onClick={showCreateForm} className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          <Plus className="inline-block w-5 h-5 mr-2" />
          New Classroom
        </button>
      </div>

      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
          Existing Classrooms
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Class Name</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Streams</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => {
                    // Use calculated capacity if streams exist, otherwise use manual capacity
                    const displayCapacity = classroom.streamCount > 0 
                      ? classroom.calculatedCapacity 
                      : (classroom.capacity || 0);
                    
                    return (
                      <tr key={classroom.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {classroom.class_name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{displayCapacity} students</span>
                            {classroom.streamCount > 0 && classroom.capacity && (
                              <span className="text-xs text-slate-400">(Manual: {classroom.capacity})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {classroom.streamCount > 0 ? (
                            <button 
                              onClick={() => showStreamsView(classroom)} 
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>{classroom.streamCount} Stream(s)</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">No streams</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => showEditForm(classroom)} 
                              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit classroom"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(classroom.id)} 
                              className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Delete classroom"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No classrooms found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderFormView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {view === 'edit' ? 'Edit Classroom' : 'Create New Classroom'}
          </h3>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close form"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="class_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              id="class_name"
              name="class_name" 
              value={formData.class_name} 
              onChange={handleInputChange} 
              required
              placeholder="e.g., Form 1, Grade 5"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
            />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Capacity
            </label>
            <input 
              type="number"
              id="capacity"
              name="capacity" 
              value={formData.capacity} 
              onChange={handleInputChange} 
              min="1"
              placeholder="Maximum number of students"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white placeholder:text-slate-400 transition-all" 
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Note: For schools with streams, capacity will be calculated from stream capacities.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button 
              type="button" 
              onClick={backToList} 
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={loading} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                view === 'edit' ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStreamsView = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Streams for {selectedClassroom?.class_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Capacity: <span className="font-medium">{selectedClassroom?.calculatedCapacity || 0} students</span> 
              <span className="ml-2">({selectedClassroom?.streamCount || 0} streams)</span>
            </p>
          </div>
          <button 
            onClick={backToList} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {streams.length > 0 ? (
                streams.map(stream => (
                  <div 
                    key={stream.id} 
                    className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{stream.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Capacity: {stream.capacity || 0} students
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Class Teacher: {stream.classTeacher?.user?.name || stream.class_teacher?.name || 'Not Assigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{stream.capacity || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No streams found for this classroom.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has schoolId
  if (!user || !schoolId) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-slate-900 dark:text-slate-100 text-lg font-semibold mb-2">
            Unable to access classroom management
          </p>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {!user ? 'Please log in to continue.' : 'Your account is missing school information.'}
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg max-w-md">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Debug Info:</p>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ 
                hasUser: !!user, 
                schoolId: schoolId,
                userKeys: user ? Object.keys(user) : []
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Classrooms...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'streams' && renderStreamsView()}
    </div>
  );
}

export default ClassroomManager;
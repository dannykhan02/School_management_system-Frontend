import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  MapPin, 
  UserMinus, 
  Plus, 
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { toast } from "react-toastify";

function ClassroomManager() {
  const { user, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    capacity: '',
    class_teacher_id: '',
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
      const [classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('classrooms', 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET')
      ]);
      
      // Handle different response structures
      setClassrooms(classroomsResponse?.data || classroomsResponse || []);
      setTeachers(teachersResponse?.teachers || teachersResponse?.data || []);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load data';
      toast.error(errorMessage);
      
      // Set empty arrays on error to prevent UI issues
      setClassrooms([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedClassroom(null);
    setFormData({ class_name: '', capacity: '', class_teacher_id: '' });
  };

  const showEditForm = (classroom) => {
    setView('edit');
    setSelectedClassroom(classroom);
    setFormData({
      class_name: classroom.class_name,
      capacity: classroom.capacity || '',
      class_teacher_id: classroom.class_teacher_id || '',
    });
  };

  const showStreamsView = async (classroom) => {
    setView('streams');
    setSelectedClassroom(classroom);
    setLoading(true);
    try {
      const response = await apiRequest(`classrooms/${classroom.id}/streams`, 'GET');
      setStreams(response?.streams || response?.data || response || []);
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
      
      let classroomId;
      let response;
      
      if (view === 'edit') {
        response = await apiRequest(`classrooms/${selectedClassroom.id}`, 'PUT', payload);
        classroomId = selectedClassroom.id;
        toast.success('Classroom updated successfully');
      } else {
        response = await apiRequest('classrooms', 'POST', payload);
        classroomId = response?.data?.id || response?.id;
        toast.success('Classroom created successfully');
      }

      // Assign teacher if specified (using dedicated endpoint)
      if (formData.class_teacher_id && classroomId) {
        try {
          await apiRequest(`classrooms/${classroomId}/assign-teacher`, 'POST', { 
            teacher_id: formData.class_teacher_id 
          });
          toast.success('Teacher assigned successfully');
        } catch (teacherError) {
          const errorMessage = teacherError?.response?.data?.message || 'Teacher assignment failed';
          toast.warning(`Classroom saved, but ${errorMessage}`);
        }
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

  const handleRemoveTeacher = async (classroomId) => {
    if (window.confirm('Remove class teacher from this classroom?')) {
      setLoading(true);
      try {
        await apiRequest(`classrooms/${classroomId}/remove-teacher`, 'DELETE');
        toast.success('Class teacher removed successfully');
        fetchInitialData();
      } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to remove class teacher';
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
            Manage classrooms, assign teachers, and view associated streams.
          </p>
        </div>
        <button 
          onClick={showCreateForm} 
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
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
                  <th className="px-6 py-4 font-medium">Class Teacher</th>
                  <th className="px-6 py-4 font-medium">Capacity</th>
                  <th className="px-6 py-4 font-medium">Streams</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <tr key={classroom.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {classroom.class_name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {classroom.teacher ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{classroom.teacher.user?.name || classroom.teacher.name}</span>
                            <button 
                              onClick={() => handleRemoveTeacher(classroom.id)} 
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Remove teacher"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {classroom.capacity || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <button 
                          onClick={() => showStreamsView(classroom)} 
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>{classroom.streams?.length || 0} Stream(s)</span>
                        </button>
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          {view === 'edit' ? 'Edit Classroom' : 'Create New Classroom'}
        </h3>
        <button 
          onClick={backToList} 
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Class Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="class_name" 
            value={formData.class_name} 
            onChange={handleInputChange} 
            required
            placeholder="e.g., Form 1, Grade 5"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Capacity
          </label>
          <input 
            type="number" 
            name="capacity" 
            value={formData.capacity} 
            onChange={handleInputChange} 
            min="1"
            placeholder="Maximum number of students"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Class Teacher
          </label>
          <select 
            name="class_teacher_id" 
            value={formData.class_teacher_id} 
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select a teacher (optional)</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.user?.name || teacher.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button 
            type="button" 
            onClick={backToList} 
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : (view === 'edit' ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStreamsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Streams for {selectedClassroom?.class_name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage all streams belonging to this classroom.
          </p>
        </div>
        <button 
          onClick={backToList} 
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
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
                      Class Teacher: {stream.classTeacher?.user?.name || stream.class_teacher?.name || 'Not Assigned'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
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
  );

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
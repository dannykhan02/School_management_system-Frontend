import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext'; // Import useAuth
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  Plus, 
  X, 
  UserPlus, 
  UserMinus,
  GraduationCap,
  Crown,
  AlertCircle
} from 'lucide-react';
import { toast } from "react-toastify";

function StreamManager() {
  // Get authenticated user's school
  const { schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [streams, setStreams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allClassTeachers, setAllClassTeachers] = useState([]);
  const [streamTeachers, setStreamTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');
  
  const [selectedStream, setSelectedStream] = useState(null);
  const [formData, setFormData] = useState({ name: '', class_id: '', class_teacher_id: '' });
  const [teacherAssignmentData, setTeacherAssignmentData] = useState({ teacher_ids: [] });

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [streamsResponse, classroomsResponse, teachersResponse] = await Promise.all([
        apiRequest('streams', 'GET'),
        apiRequest('classrooms', 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET')
      ]);
      setStreams(streamsResponse || []);
      setClassrooms(classroomsResponse || []);
      setTeachers(teachersResponse?.teachers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // --- View Handlers ---
  const showCreateForm = () => {
    setView('create');
    setSelectedStream(null);
    setFormData({ name: '', class_id: '', class_teacher_id: '' });
  };

  const showEditForm = (stream) => {
    setView('edit');
    setSelectedStream(stream);
    setFormData({
      name: stream.name,
      class_id: stream.class_id,
      class_teacher_id: stream.class_teacher_id || '',
    });
  };

  const showManageTeachersView = async (stream) => {
    setView('manage-teachers');
    setSelectedStream(stream);
    setLoading(true);
    
    try {
      // Fetch fresh teacher data for this specific stream
      const response = await apiRequest(`streams/${stream.id}/teachers`, 'GET');
      setStreamTeachers(response.teachers || []);
      const freshIds = response.teachers?.map(t => t.id) || [];
      setTeacherAssignmentData({ teacher_ids: freshIds });
    } catch (error) {
      console.error('Failed to fetch stream teachers:', error);
      toast.error('Could not fetch the latest teacher assignments.');
      // Fallback to data in stream object
      const assignedTeacherIds = stream.teachers?.map(t => t.id) || [];
      setTeacherAssignmentData({ teacher_ids: assignedTeacherIds });
    } finally {
      setLoading(false);
    }
  };

  const showAllClassTeachersView = async () => {
    setView('all-class-teachers');
    setLoading(true);
    try {
      const response = await apiRequest('streams/class-teachers', 'GET');
      setAllClassTeachers(response || []);
    } catch (error) {
      console.error('Failed to fetch class teachers:', error);
      toast.error('Failed to fetch class teachers.');
      setAllClassTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedStream(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherAssignmentChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setTeacherAssignmentData({ teacher_ids: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = { ...formData, school_id: schoolId };
      let streamId;
      
      if (view === 'edit') {
        await apiRequest(`streams/${selectedStream.id}`, 'PUT', payload);
        streamId = selectedStream.id;
        toast.success('Stream updated successfully');
      } else {
        const response = await apiRequest('streams', 'POST', payload);
        streamId = response.id || response.data?.id;
        toast.success('Stream created successfully');
      }

      // Use dedicated endpoint for class teacher assignment if specified
      if (formData.class_teacher_id && streamId) {
        await apiRequest(`streams/${streamId}/assign-class-teacher`, 'POST', { 
          teacher_id: formData.class_teacher_id 
        });
      }
      
      backToList();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} stream.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this stream? This action cannot be undone.')) {
      try {
        await apiRequest(`streams/${id}`, 'DELETE');
        toast.success('Stream deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error('Failed to delete stream.');
      }
    }
  };

  const handleAssignClassTeacher = async (streamId, teacherId) => {
    if (!teacherId) return;
    
    try {
      await apiRequest(`streams/${streamId}/assign-class-teacher`, 'POST', { teacher_id: teacherId });
      toast.success('Class teacher assigned successfully');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to assign class teacher.');
    }
  };

  const handleRemoveClassTeacher = async (streamId) => {
    if (!window.confirm('Remove class teacher from this stream?')) return;
    
    try {
      // Using PUT with null as no dedicated DELETE endpoint exists
      await apiRequest(`streams/${streamId}`, 'PUT', { class_teacher_id: null });
      toast.success('Class teacher removed successfully');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to remove class teacher.');
    }
  };

  const handleSaveTeacherAssignments = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiRequest(`streams/${selectedStream.id}/assign-teachers`, 'POST', teacherAssignmentData);
      toast.success('Teacher assignments updated successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to update teacher assignments.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Stream Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            Manage streams, assign class teachers, and manage teaching staff.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={showAllClassTeachersView} 
            className="bg-slate-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-slate-600 transition-colors"
          >
            <Crown className="inline-block w-5 h-5 mr-2" />
            View Class Teachers
          </button>
          <button 
            onClick={showCreateForm} 
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="inline-block w-5 h-5 mr-2" />
            New Stream
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
          Existing Streams
        </h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Stream Name</th>
                  <th className="px-6 py-4 font-medium">Classroom</th>
                  <th className="px-6 py-4 font-medium">Class Teacher</th>
                  <th className="px-6 py-4 font-medium">Teachers</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {streams.length > 0 ? (
                  streams.map((stream) => (
                    <tr key={stream.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {stream.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {stream.classroom?.class_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {stream.classTeacher ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{stream.classTeacher.user?.name}</span>
                            <button 
                              onClick={() => handleRemoveClassTeacher(stream.id)} 
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Remove class teacher"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <select 
                            onChange={(e) => handleAssignClassTeacher(stream.id, e.target.value)}
                            className="text-xs border border-slate-300 rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign Teacher</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.user?.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <button 
                          onClick={() => showManageTeachersView(stream)} 
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          <span>{stream.teachers?.length || 0} Assigned</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => showEditForm(stream)} 
                            className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit stream"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(stream.id)} 
                            className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete stream"
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
                      No streams found. Create one to get started.
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
          {view === 'edit' ? 'Edit Stream' : 'Create New Stream'}
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
            Stream Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleInputChange} 
            required
            placeholder="e.g., Stream A, Blue Stream"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Classroom <span className="text-red-500">*</span>
          </label>
          <select 
            name="class_id" 
            value={formData.class_id} 
            onChange={handleInputChange} 
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="">Select a classroom</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.class_name}</option>
            ))}
          </select>
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
                {teacher.user?.name}
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

  const renderManageTeachersView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5"/>
            Manage Teachers
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            For Stream: {selectedStream?.name}
          </p>
        </div>
        <button 
          onClick={backToList} 
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSaveTeacherAssignments} className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Assign Teachers to this Stream
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple teachers.
              </p>
              <select 
                multiple 
                value={teacherAssignmentData.teacher_ids}
                onChange={handleTeacherAssignmentChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                size="8"
              >
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.user?.name}
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
                {loading ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );

  const renderAllClassTeachersView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Crown className="w-5 h-5"/>
            All Class Teachers
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View all streams and their assigned class teachers.
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
            {allClassTeachers.length > 0 ? (
              allClassTeachers.map(stream => (
                <div 
                  key={stream.id} 
                  className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{stream.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Classroom: {stream.classroom?.class_name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {stream.classTeacher?.user?.name || 'Not Assigned'}
                    </p>
                    <p className="text-xs text-slate-500">Class Teacher</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  No class teachers found.
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {loading && view === 'list' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading Streams...</p>
        </div>
      )}
      
      {!loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-teachers' && renderManageTeachersView()}
      {view === 'all-class-teachers' && renderAllClassTeachersView()}
    </div>
  );
}

export default StreamManager;
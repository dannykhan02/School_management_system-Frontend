// src/Dashboard/Pages/Admin/TeacherManager.jsx
import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Edit, 
  Trash2, 
  Loader, 
  Users, 
  BookOpen,
  Plus, 
  X,
  GraduationCap,
  MapPin,
  Crown
} from 'lucide-react';
import { toast } from "react-toastify";

function TeacherManager() {
  const { schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'manage-subjects', 'manage-assignments'
  
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    qualification: '',
    employment_type: '',
    tsc_number: '',
  });
  const [assignmentData, setAssignmentData] = useState({ subject_ids: [], stream_id: '' });

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [teachersResponse, classroomsResponse, streamsResponse, subjectsResponse] = await Promise.all([
        apiRequest(`teachers/school/${schoolId}`, 'GET'),
        apiRequest('classrooms', 'GET'),
        apiRequest('streams', 'GET'),
        apiRequest(`subjects/school/${schoolId}`, 'GET')
      ]);
      setTeachers(teachersResponse?.teachers || []);
      setClassrooms(classroomsResponse || []);
      setStreams(streamsResponse || []);
      setSubjects(subjectsResponse?.subjects || []);
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
    setSelectedTeacher(null);
    setFormData({ user_id: '', qualification: '', employment_type: '', tsc_number: '' });
  };

  const showEditForm = (teacher) => {
    setView('edit');
    setSelectedTeacher(teacher);
    setFormData({
      user_id: teacher.user_id,
      qualification: teacher.qualification,
      employment_type: teacher.employment_type,
      tsc_number: teacher.tsc_number,
    });
  };

  const showManageSubjectsView = (teacher) => {
    setView('manage-subjects');
    setSelectedTeacher(teacher);
    const subjectIds = teacher.subjects?.map(s => s.id) || [];
    setAssignmentData({ subject_ids: subjectIds, stream_id: '' });
  };

  const showManageAssignmentsView = (teacher) => {
    setView('manage-assignments');
    setSelectedTeacher(teacher);
    setAssignmentData({ subject_ids: [], stream_id: '' });
  };

  const backToList = () => {
    setView('list');
    setSelectedTeacher(null);
    fetchInitialData();
  };

  // --- CRUD Operations ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'subject_ids') {
      const selectedIds = Array.from(options, option => Number(option.value));
      setAssignmentData(prev => ({ ...prev, subject_ids: selectedIds }));
    } else {
      setAssignmentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, school_id: schoolId };
      
      if (view === 'edit') {
        await apiRequest(`teachers/${selectedTeacher.id}`, 'PUT', payload);
        toast.success('Teacher updated successfully');
      } else {
        await apiRequest('teachers', 'POST', payload);
        toast.success('Teacher created successfully');
      }
      
      backToList();
    } catch (error) {
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} teacher.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      try {
        await apiRequest(`teachers/${id}`, 'DELETE');
        toast.success('Teacher deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error('Failed to delete teacher.');
      }
    }
  };

  const handleSaveSubjectAssignments = async () => {
    setLoading(true);
    try {
      await apiRequest(`teachers/${selectedTeacher.id}/assign-subjects`, 'POST', { subject_ids: assignmentData.subject_ids });
      toast.success('Subject assignments updated successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to update subject assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClassroom = async () => {
    if (!assignmentData.classroom_id) return;
    try {
      await apiRequest(`teachers/${selectedTeacher.id}/assign-classroom`, 'POST', { classroom_id: assignmentData.classroom_id });
      toast.success('Teacher assigned to classroom successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to assign teacher to classroom.');
    }
  };

  const handleAssignToStream = async () => {
    if (!assignmentData.stream_id) return;
    try {
      await apiRequest(`teachers/${selectedTeacher.id}/assign-stream`, 'POST', { stream_id: assignmentData.stream_id });
      toast.success('Teacher assigned to stream successfully');
      backToList();
    } catch (error) {
      toast.error('Failed to assign teacher to stream.');
    }
  };
  
  // --- Render Functions ---
  const renderListView = () => (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Teacher Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">Manage teaching staff, their assignments, and qualifications.</p>
        </div>
        <button onClick={showCreateForm} className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          <Plus className="inline-block w-5 h-5 mr-2" />New Teacher
        </button>
      </div>
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">Existing Teachers</h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Qualification</th>
                  <th className="px-6 py-4 font-medium">TSC Number</th>
                  <th className="px-6 py-4 font-medium">Assignments</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{teacher.user?.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{teacher.qualification || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{teacher.tsc_number || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <div className="flex gap-2">
                           <button onClick={() => showManageSubjectsView(teacher)} className="flex items-center gap-1 text-blue-600 hover:underline">
                             <BookOpen className="w-4 h-4" />
                             <span>{teacher.subjects?.length || 0} Subjects</span>
                           </button>
                           <button onClick={() => showManageAssignmentsView(teacher)} className="flex items-center gap-1 text-green-600 hover:underline">
                             <GraduationCap className="w-4 h-4" />
                             <span>Assign</span>
                           </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => showEditForm(teacher)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No teachers found.</td>
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
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{view === 'edit' ? 'Edit Teacher' : 'Create New Teacher'}</h3>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* In a real app, you would have a user selection component here */}
        <div className="text-sm text-slate-500 dark:text-slate-400">User selection and linking would go here.</div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qualification</label>
          <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment Type</label>
          <input type="text" name="employment_type" value={formData.employment_type} onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">TSC Number</label>
          <input type="text" name="tsc_number" value={formData.tsc_number} onChange={handleInputChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={backToList} className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Saving...' : (view === 'edit' ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderManageSubjectsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />Manage Subjects
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">For Teacher: {selectedTeacher?.user?.name}</p>
        </div>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Subjects to this Teacher</label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg border-slate-300 dark:border-slate-600 p-3">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                <input
                  type="checkbox"
                  value={subject.id}
                  checked={assignmentData.subject_ids.includes(subject.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAssignmentData(prev => ({ ...prev, subject_ids: [...prev.subject_ids, subject.id] }));
                    } else {
                      setAssignmentData(prev => ({ ...prev, subject_ids: prev.subject_ids.filter(id => id !== subject.id) }));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{subject.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={backToList} className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSaveSubjectAssignments} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderManageAssignmentsView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />Manage Assignments
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">For Teacher: {selectedTeacher?.user?.name}</p>
        </div>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign as Class Teacher of</label>
          <select name="classroom_id" value={assignmentData.classroom_id} onChange={handleAssignmentChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white">
            <option value="">Select a classroom</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign as Class Teacher of Stream</label>
          <select name="stream_id" value={assignmentData.stream_id} onChange={handleAssignmentChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white">
            <option value="">Select a stream</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={backToList} className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium">Cancel</button>
          <button onClick={() => { handleAssignToClassroom(); handleAssignToStream(); }} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {authLoading && <div className="flex flex-col items-center justify-center py-16"><Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" /><p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p></div>}
      {!authLoading && loading && view === 'list' && <div className="flex flex-col items-center justify-center py-16"><Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" /><p className="mt-4 text-slate-500 dark:text-slate-400">Loading Teachers...</p></div>}
      {!authLoading && !loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-subjects' && renderManageSubjectsView()}
      {view === 'manage-assignments' && renderManageAssignmentsView()}
    </div>
  );
}

export default TeacherManager;
// src/Dashboard/Pages/Admin/SubjectManager.jsx
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
  UserMinus,
  UserPlus
} from 'lucide-react';
import { toast } from "react-toastify";

function SubjectManager() {
  const { schoolId, loading: authLoading } = useAuth();
  
  // --- State Management ---
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignedTeachers, setAssignedTeachers] = useState([]); // For the manage view
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'manage-teachers'
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (schoolId) {
      fetchInitialData();
    }
  }, [schoolId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsResponse, teachersResponse] = await Promise.all([
        apiRequest(`subjects/school/${schoolId}`, 'GET'),
        apiRequest(`teachers/school/${schoolId}`, 'GET')
      ]);
      setSubjects(subjectsResponse?.subjects || []);
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
    setSelectedSubject(null);
    setFormData({ name: '', code: '' });
  };

  const showEditForm = (subject) => {
    setView('edit');
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
    });
  };

  const showManageTeachersView = async (subject) => {
    setView('manage-teachers');
    setSelectedSubject(subject);
    setLoading(true);
    try {
      const response = await apiRequest(`subjects/${subject.id}/teachers`, 'GET');
      setAssignedTeachers(response.teachers || []);
    } catch (error) {
      toast.error('Could not fetch teachers for this subject.');
      setAssignedTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const backToList = () => {
    setView('list');
    setSelectedSubject(null);
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
      const payload = { ...formData, school_id: schoolId };
      
      if (view === 'edit') {
        await apiRequest(`subjects/${selectedSubject.id}`, 'PUT', payload);
        toast.success('Subject updated successfully');
      } else {
        await apiRequest('subjects', 'POST', payload);
        toast.success('Subject created successfully');
      }
      
      backToList();
    } catch (error) {
      toast.error(`Failed to ${view === 'edit' ? 'update' : 'create'} subject.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      try {
        await apiRequest(`subjects/${id}`, 'DELETE');
        toast.success('Subject deleted successfully');
        fetchInitialData();
      } catch (error) {
        toast.error('Failed to delete subject.');
      }
    }
  };

  const handleAssignTeacher = async (subjectId, teacherId) => {
    try {
      await apiRequest(`subjects/${subjectId}/assign-teacher`, 'POST', { teacher_id: teacherId });
      toast.success('Teacher assigned successfully');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to assign teacher.');
    }
  };

  const handleRemoveTeacher = async (subjectId, teacherId) => {
    try {
      await apiRequest(`subjects/${subjectId}/remove-teacher/${teacherId}`, 'DELETE');
      toast.success('Teacher removed successfully');
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to remove teacher.');
    }
  };
  
  const handleSaveTeacherAssignments = async () => {
    setLoading(true);
    try {
      const teacherIds = assignedTeachers.map(t => t.id);
      await apiRequest(`subjects/${selectedSubject.id}/assign-teachers`, 'POST', { teacher_ids: teacherIds });
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
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Subject Management</h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">Manage subjects, assign teachers, and oversee curriculum.</p>
        </div>
        <button onClick={showCreateForm} className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">
          <Plus className="inline-block w-5 h-5 mr-2" />New Subject
        </button>
      </div>
      <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">Existing Subjects</h2>
        <div className="overflow-x-auto">
          <div className="border rounded-lg border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject Name</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Assigned Teachers</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{subject.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{subject.code}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        <button onClick={() => showManageTeachersView(subject)} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Users className="w-4 h-4" />
                          <span>{subject.teachers?.length || 0} Assigned</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => showEditForm(subject)} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(subject.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No subjects found.</td>
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
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{view === 'edit' ? 'Edit Subject' : 'Create New Subject'}</h3>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject Code</label>
          <input type="text" name="code" value={formData.code} onChange={handleInputChange} required
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

  const renderManageTeachersView = () => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />Manage Teachers
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">For Subject: {selectedSubject?.name}</p>
        </div>
        <button onClick={backToList} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Assign Teachers to this Subject</label>
          <p className="text-xs text-slate-500 mb-2">These teachers will be marked as teaching this subject.</p>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg border-slate-300 dark:border-slate-600 p-3">
            {teachers.map(teacher => (
              <label key={teacher.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                <input
                  type="checkbox"
                  value={teacher.id}
                  checked={assignedTeachers.some(t => t.id === teacher.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setAssignedTeachers(prev => [...prev, teacher]);
                    } else {
                      setAssignedTeachers(prev => prev.filter(t => t.id !== teacher.id));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{teacher.user?.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={backToList} className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSaveTeacherAssignments} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Assignments'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {authLoading && <div className="flex flex-col items-center justify-center py-16"><Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" /><p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p></div>}
      {!authLoading && loading && view === 'list' && <div className="flex flex-col items-center justify-center py-16"><Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" /><p className="mt-4 text-slate-500 dark:text-slate-400">Loading Subjects...</p></div>}
      {!authLoading && !loading && view === 'list' && renderListView()}
      {(view === 'create' || view === 'edit') && renderFormView()}
      {view === 'manage-teachers' && renderManageTeachersView()}
    </div>
  );
}

export default SubjectManager;
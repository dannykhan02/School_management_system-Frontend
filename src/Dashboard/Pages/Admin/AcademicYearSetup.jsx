import React, { useEffect, useState } from 'react';
import AcademicYearForm from '../../../components/AcademicYearForm';
import { apiRequest } from '../../../utils/api';
import { Edit, Trash2, Loader,} from 'lucide-react';
import DisplayDate from '../../../utils/DisplayDate';
import { toast } from "react-toastify";

function AcademicYearSetup() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    term: '',
    start_date: '',
    end_date: '',
  });

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('academic-years', 'GET');
        setAcademicYears(response || []);
      } catch (error) {
        setAcademicYears([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicYears();
  }, []);

  // Open form for creating new academic year
  const handleAddNew = () => {
    setEditingYear(null);
    setFormData({
      term: '',
      start_date: '',
      end_date: '',
    });
    setShowForm(true);
  };

  // Open form for editing existing academic year
  const handleEdit = (id) => {
    const yearToEdit = academicYears.find(year => year.id === id);
    if (yearToEdit) {
      setEditingYear(yearToEdit);
      setFormData({
        term: yearToEdit.term,
        start_date: yearToEdit.start_date,
        end_date: yearToEdit.end_date,
      });
      setShowForm(true);
    }
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingYear(null);
    setFormData({
      term: '',
      start_date: '',
      end_date: '',
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (editingYear) {
      // Update existing academic year
      const response = await apiRequest(`academic-years/${editingYear.id}`, 'PUT', formData);
      const updatedYear = response.data;

      toast.success('Academic year updated successfully');

      // Update local state
      setAcademicYears(prevYears =>
        prevYears.map(year =>
          year.id === editingYear.id ? updatedYear : year
        )
      );
    } else {
      // Create new academic year
      const response = await apiRequest('academic-years', 'POST', formData);
      const newYear = response.data;

      toast.success('Academic year created successfully');

      // Add new academic year to local state
      if (newYear && newYear.id) {
        setAcademicYears(prevYears => [...prevYears, newYear]);
      } else {
        console.warn('Created academic year response missing ID:', newYear);
      }
    }

    handleCloseForm();
  } catch (error) {
    console.error('Failed to save academic year:', error);
   toast.error(`Failed to ${editingYear ? 'update' : 'create'} academic year. Please try again.`);
  }
};


  const handleDelete = async (id) => {
      try {
        await apiRequest(`academic-years/${id}`, 'DELETE');
        setAcademicYears(academicYears.filter(year => year.id !== id));
        toast.success('deleted successfully')
      } catch (error) {
        console.error('Failed to delete academic year:', error);
      }
  };



  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Academic Year Management
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            View existing academic years and create new ones.
          </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 hover:bg-gray-800"
        >
          New Academic Year
        </button>
      </div>

      {/* Loading State */}
      {loading && (
       <div className="flex flex-col items-center justify-center py-16">
      <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
    </div>
      )}

      {/* Table Section */}
      {!loading && (
        <div className="bg-white dark:bg-background-dark/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <h2 className="text-[#0d141b] dark:text-white text-2xl font-bold leading-tight tracking-[-0.015em] mb-6">
            Existing Academic Years
          </h2>

          <div className="overflow-x-auto">
            <div className="border rounded-lg border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-6 py-4 font-medium" scope="col">Term</th>
                    <th className="px-6 py-4 font-medium" scope="col">Start Date</th>
                    <th className="px-6 py-4 font-medium" scope="col">End Date</th>
                    <th className="px-6 py-4 font-medium text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {academicYears.length > 0 ? (
                    academicYears.map((year) => (
                      <tr 
                        key={year.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {year.term}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {DisplayDate(year.start_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {DisplayDate(year.end_date)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(year.id)}
                              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              aria-label={`Edit ${year.term}`}
                            >
                              <span className="material-symbols-outlined text-base"><Edit/></span>
                            </button>
                            <button 
                              onClick={() => handleDelete(year.id)}
                              className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              aria-label={`Delete ${year.term}`}
                            >
                              <span className="material-symbols-outlined text-base"><Trash2/></span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No academic years found. Create your first academic year to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Academic Year Form Modal */}
      {showForm && (
        <AcademicYearForm
          formData={formData}
          editingYear={editingYear}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

export default AcademicYearSetup;
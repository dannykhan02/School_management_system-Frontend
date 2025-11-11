import React, { useState, useEffect } from 'react';
import { Search, School, MapPin, Phone, Mail, User, Loader } from 'lucide-react';
import { apiRequest } from '../../../utils/api';

const SchoolList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState(null);

  // ✅ Fetch schools from API
 useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await apiRequest('schools/all', 'GET');
        setSchools(response.data);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // ✅ Filter schools
  const filteredSchools = schools.filter((school) => {
    const adminName = school.users?.[0]?.full_name || '';
    return (
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <main className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg dark:bg-white">
              <School className="w-6 h-6 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">School Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading
                  ? 'Loading schools...'
                  : `${filteredSchools.length} schools found`}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search schools, admins, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
            <Loader className="w-12 h-12 text-gray-600 dark:text-gray-400 animate-spin" />
          </div>
          ) : filteredSchools.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      School Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredSchools.map((school) => {
                    const admin = school.users?.[0];
                    return (
                      <tr
                        key={school.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group"
                        onClick={() => setSelectedSchool(school)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                         {school.logo ? (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center dark:bg-white">
                        <img 
                          src={school.logo} 
                          alt={`${school.name} logo`}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center dark:bg-white">
                        <School className="w-6 h-6 text-white dark:text-black" />
                      </div>
                    )}

                            <div>
                              <p className="font-semibold text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                {school.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {admin ? admin.full_name : 'No admin assigned'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span className="max-w-[200px]">{school.address}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            {school.phone}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span className="max-w-[200px]">{school.email}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-black dark:text-white mb-2">
                No schools found
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'No schools available in the system'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SchoolList;

import React, { useState } from 'react';
import { Book, Calendar, Award, Clock, User, AlertCircle, Check, Shield, FileText, BarChart3 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { usePasswordChange } from "../../../hooks/usePasswordChange";
import { toast } from "react-toastify";

function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    gender: user?.gender || ""
  });
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Use the custom password change hook
  const {
    showPasswordForm,
    setShowPasswordForm,
    passwordData,
    setPasswordData,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    errors,
    isSubmitting,
    handlePasswordChange,
    resetForm
  } = usePasswordChange();

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsProfileSubmitting(true);

    try {
      // This would be an API call to update user profile
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Profile updated successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="w-full py-8">
      <div className="px-6">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-[#0d141b] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Student Dashboard
          </h1>
          <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal leading-normal">
            View your courses, grades, and assignments.
          </p>
        </div>
        
        {/* Password Change Banner */}
        {user?.must_change_password && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You must change your password to continue using the system.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setShowPasswordForm(true);
                }}
                className="text-sm font-medium text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-[#4c739a] hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "courses"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-[#4c739a] hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "grades"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-[#4c739a] hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Grades
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "profile"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-[#4c739a] hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Profile
            </button>
          </nav>
        </div>
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#4c739a] dark:text-slate-400">Courses</p>
                    <p className="text-2xl font-semibold text-[#0d141b] dark:text-white">8</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#4c739a] dark:text-slate-400">Average Grade</p>
                    <p className="text-2xl font-semibold text-[#0d141b] dark:text-white">B+</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#4c739a] dark:text-slate-400">Attendance</p>
                    <p className="text-2xl font-semibold text-[#0d141b] dark:text-white">95%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#4c739a] dark:text-slate-400">Assignments</p>
                    <p className="text-2xl font-semibold text-[#0d141b] dark:text-white">3</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#0d141b] dark:text-white">Recent Grades</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">Mathematics</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Quiz #3</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d141b] dark:text-slate-200">A-</p>
                      <p className="text-xs text-[#4c739a] dark:text-slate-400">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">Science</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Lab Report</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d141b] dark:text-slate-200">B+</p>
                      <p className="text-xs text-[#4c739a] dark:text-slate-400">5 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">English</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Essay</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d141b] dark:text-slate-200">A</p>
                      <p className="text-xs text-[#4c739a] dark:text-slate-400">1 week ago</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-[#0d141b] dark:text-white">Upcoming Assignments</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">Mathematics</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Problem Set #5</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">Tomorrow</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">History</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Chapter 5 Reading</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d141b] dark:text-slate-200">3 days</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="font-medium text-[#0d141b] dark:text-slate-200">Science</p>
                      <p className="text-sm text-[#4c739a] dark:text-slate-400">Lab Report</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d141b] dark:text-slate-200">5 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Course 1 */}
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    M
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0d141b] dark:text-white">Mathematics</h3>
                    <p className="text-sm text-[#4c739a] dark:text-slate-400">Class 5A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Teacher</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Mr. Johnson</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Schedule</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Mon, Wed, Fri</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Time</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">9:00 - 10:00 AM</span>
                  </div>
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  View Details
                </button>
              </div>
              
              {/* Course 2 */}
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    S
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0d141b] dark:text-white">Science</h3>
                    <p className="text-sm text-[#4c739a] dark:text-slate-400">Class 5A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Teacher</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Ms. Davis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Schedule</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Tue, Thu</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Time</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">10:30 - 11:30 AM</span>
                  </div>
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  View Details
                </button>
              </div>
              
              {/* Course 3 */}
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    E
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0d141b] dark:text-white">English</h3>
                    <p className="text-sm text-[#4c739a] dark:text-slate-400">Class 5A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Teacher</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Mrs. Smith</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Schedule</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">Mon, Wed, Fri</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#4c739a] dark:text-slate-400">Time</span>
                    <span className="text-sm font-medium text-[#0d141b] dark:text-slate-200">11:00 AM - 12:00 PM</span>
                  </div>
                </div>
                <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Grades Tab */}
        {activeTab === "grades" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#0d141b] dark:text-white">Academic Performance</h2>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#4c739a] dark:text-slate-300">Overall Average</span>
                  <span className="text-lg font-bold text-[#0d141b] dark:text-white">B+</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-[#4c739a] dark:text-slate-300">
                      <tr>
                        <th className="px-6 py-4 font-medium">Subject</th>
                        <th className="px-6 py-4 font-medium">Grade</th>
                        <th className="px-6 py-4 font-medium">Percentage</th>
                        <th className="px-6 py-4 font-medium">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#0d141b] dark:text-white">
                          Mathematics
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            A-
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          88%
                        </td>
                        <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400">
                          2 days ago
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#0d141b] dark:text-white">
                          Science
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            B+
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          82%
                        </td>
                        <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400">
                          5 days ago
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#0d141b] dark:text-white">
                          English
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            A
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#0d141b] dark:text-white">
                          92%
                        </td>
                        <td className="px-6 py-4 text-[#4c739a] dark:text-slate-400">
                          1 week ago
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold mb-4 text-[#0d141b] dark:text-white">Profile Information</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <User className="w-12 h-12 text-blue-400 dark:text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#0d141b] dark:text-white">
                    {user?.full_name}
                  </h3>
                  <p className="text-[#4c739a] dark:text-slate-400">
                    {user?.role} at {user?.school_name || "Your School"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user?.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {user?.status === "active" ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={(e) => {
                        setProfileData({...profileData, full_name: e.target.value});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={(e) => {
                        setProfileData({...profileData, email: e.target.value});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={(e) => {
                        setProfileData({...profileData, phone: e.target.value});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={profileData.gender}
                      onChange={(e) => {
                        setProfileData({...profileData, gender: e.target.value});
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProfileSubmitting || !hasUnsavedChanges}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isProfileSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Password Change */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#0d141b] dark:text-white">Password & Security</h2>
                <button
                  onClick={() => {
                    if (showPasswordForm) {
                      resetForm();
                    }
                    setShowPasswordForm(!showPasswordForm);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </button>
              </div>
              
              <div className="flex items-center gap-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                    Password Security
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Last changed: {formatDate(user?.last_password_changed_at)}
                  </p>
                  {user?.must_change_password && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      You must change your password
                    </p>
                  )}
                </div>
              </div>
              
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                          minLength="8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#4c739a] dark:text-slate-400">
                        Password must be at least 8 characters long and different from your current password
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] dark:text-slate-300 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="new_password_confirmation"
                          value={passwordData.new_password_confirmation}
                          onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                          className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          required
                          minLength="8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-400">
                        {Object.entries(errors).map(([field, message]) => (
                          <li key={field}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./Dashboard/Layout/DashboardLayout";
import SchoolManager from './Dashboard/Pages/SuperAdmin/SchoolManager';
import Roles from './Dashboard/Pages/SuperAdmin/Roles';
import Login from './Auth/Login';
import SchoolProfile from './Dashboard/Pages/Admin/SchoolProfile';
import AcademicYearSetup from './Dashboard/Pages/Admin/AcademicYearSetup';
import SchoolRegistration from './Auth/SchoolRegistration';
import EditSchoolProfile from './Dashboard/Pages/Admin/EditSchoolProfile';
import UpdateUser from './Dashboard/Pages/Admin/UpdateUser';
import CreateUser from './Dashboard/Pages/Admin/CreateUser';

// Import new Manager Components
import ClassroomManager from './Dashboard/Pages/Admin/ClassroomManager';
import StreamManager from './Dashboard/Pages/Admin/StreamManager';
import SubjectManager from './Dashboard/Pages/Admin/SubjectManager';
import TeacherManager from './Dashboard/Pages/Admin/TeacherManager';

// Import Dashboard Components for different roles
import TeacherDashboard from './Dashboard/Pages/Teacher/TeacherDashboard';
import StudentDashboard from './Dashboard/Pages/Student/StudentDashboard';
import ParentDashboard from './Dashboard/Pages/Parent/ParentDashboard';

// ProtectedRoute Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, mustChangePassword } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to dashboard if password change is required
  if (mustChangePassword && !window.location.pathname.includes(`/${user.role}/dashboard`)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

function App() {
  // Initialize theme on app load
  useEffect(() => {
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const html = document.documentElement;

      if (savedTheme === 'dark') {
        html.classList.add('dark');
      } else if (savedTheme === 'light') {
        html.classList.remove('dark');
      } else {
        // Use system preference if no saved theme
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          html.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      }
    };

    initializeTheme();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/school-registration" element={<SchoolRegistration />} />
          <Route path="/login" element={<Login />} />
          
          {/* Super Admin */}
          <Route path="/super_admin/*" element={
            <ProtectedRoute requiredRole="super_admin">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SchoolManager />} />
            <Route path="schools" element={<SchoolManager />} />
            <Route path="roles" element={<Roles />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SchoolProfile />} />
            <Route path="edit-school-info/:id" element={<EditSchoolProfile />} />
            <Route path="academic-year" element={<AcademicYearSetup />} />
            <Route path="new-user" element={<CreateUser />} />
            <Route path="update-user/:id" element={<UpdateUser />} />
            
            {/* NEW Admin Routes */}
            <Route path="classrooms" element={<ClassroomManager />} />
            <Route path="streams" element={<StreamManager />} />
            <Route path="subjects" element={<SubjectManager />} />
            <Route path="teachers" element={<TeacherManager />} />
          </Route>

          {/* Teacher */}
          <Route path="/teacher/*" element={
            <ProtectedRoute requiredRole="teacher">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<div>Teacher Classes Page</div>} />
            <Route path="attendance" element={<div>Teacher Attendance Page</div>} />
            <Route path="grades" element={<div>Teacher Grades Page</div>} />
          </Route>
          
          {/* Student */}
          <Route path="/student/*" element={
            <ProtectedRoute requiredRole="student">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="courses" element={<div>Student Courses Page</div>} />
            <Route path="grades" element={<div>Student Grades Page</div>} />
          </Route>
          
          {/* Parent */}
          <Route path="/parent/*" element={
            <ProtectedRoute requiredRole="parent">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="children" element={<div>Parent Children Page</div>} />
            <Route path="events" element={<div>Parent Events Page</div>} />
            <Route path="reports" element={<div>Parent Reports Page</div>} />
          </Route>
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
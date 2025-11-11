import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./Dashboard/Layout/DashboardLayout";
import SchoolList from './Dashboard/Pages/SuperAdmin/SchoolList';
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


// ProtectedRoute Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

function App() {
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
            <Route path="dashboard" element={<SchoolList />} />
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
          } />
          
          {/* Student */}
          <Route path="/student/*" element={
            <ProtectedRoute requiredRole="student">
              <DashboardLayout />
            </ProtectedRoute>
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
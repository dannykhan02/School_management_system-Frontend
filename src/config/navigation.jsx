import React, { useState } from 'react';
import { 
  Users, 
  Book, 
  Calendar,
  Home,
  FileText,
  BarChart3,
  Crown,
  DoorOpen, // Icon for Classrooms
  Waves, // Icon for Streams
  BookOpen, // Icon for Subjects
  GraduationCap, // Icon for Teachers
  Building2, // Icon for Schools
  Shield // Icon for Roles
} from "lucide-react";

export const NAVIGATION_ITEMS = {
  super_admin: [
    { 
      name: "Schools", 
      icon: <Building2 size={20} />, 
      href: "/super_admin/dashboard" 
    },
    { 
      name: "Roles", 
      icon: <Shield size={20} />, 
      href: "/super_admin/roles" 
    },
  ],
  admin: [
    { 
      name: "School Profile", 
      icon: <Home size={20} />, 
      href: "/admin/dashboard" 
    },
    { 
      name: "Academic Year", 
      icon: <Calendar size={20} />, 
      href: "/admin/academic-year" 
    },
    { 
      name: "Classrooms", 
      icon: <DoorOpen size={20} />, 
      href: "/admin/classrooms" 
    },
    { 
      name: "Streams", 
      icon: <Waves size={20} />, 
      href: "/admin/streams" 
    },
    { 
      name: "Subjects", 
      icon: <BookOpen size={20} />, 
      href: "/admin/subjects" 
    },
    { 
      name: "Teachers", 
      icon: <GraduationCap size={20} />, 
      href: "/admin/teachers" 
    },
    { 
      name: "Add Users", 
      icon: <Users size={20} />, 
      href: "/admin/new-user" 
    },
  ],
  teacher: [
    { 
      name: "Dashboard", 
      icon: <Home size={20} />, 
      href: "/teacher/dashboard" 
    },
    { 
      name: "My Classes", 
      icon: <Book size={20} />, 
      href: "/teacher/classes" 
    },
    { 
      name: "Attendance", 
      icon: <Calendar size={20} />, 
      href: "/teacher/attendance" 
    },
    { 
      name: "Grades", 
      icon: <FileText size={20} />, 
      href: "/teacher/grades" 
    },
  ],
  student: [
    { 
      name: "Dashboard", 
      icon: <Home size={20} />, 
      href: "/student/dashboard" 
    },
    { 
      name: "My Courses", 
      icon: <BookOpen size={20} />, 
      href: "/student/courses" 
    },
    { 
      name: "Grades", 
      icon: <FileText size={20} />, 
      href: "/student/grades" 
    },
  ],
};

export const getNavigationItems = (role) => NAVIGATION_ITEMS[role] || [];
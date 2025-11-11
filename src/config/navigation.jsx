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
  GraduationCap // Icon for Teachers
} from "lucide-react";

export const NAVIGATION_ITEMS = {
  super_admin: [
    { name: "Dashboard", icon: <Crown size={20} />, href: "/super_admin/dashboard" },
    { name: "Roles", icon: <BarChart3 size={20} />, href: "/super_admin/roles" },
  ],
  admin: [
    { name: "School Profile", icon: <Home size={20} />, href: "/admin/dashboard" },
    { name: "Academic Year", icon: <Calendar size={20} />, href: "/admin/academic-year" },
    { name: "Classroom Management", icon: <DoorOpen size={20} />, href: "/admin/classrooms" }, // NEW
    { name: "Stream Management", icon: <Waves size={20} />, href: "/admin/streams" }, // NEW
    { name: "Subject Management", icon: <BookOpen size={20} />, href: "/admin/subjects" }, // NEW
    { name: "Teacher Management", icon: <GraduationCap size={20} />, href: "/admin/teachers" }, // NEW
    { name: "Add Users", icon: <Users size={20} />, href: "/admin/new-user" },
  ],
  teacher: [
    { name: "Dashboard", icon: <Home size={20} />, href: "/teacher/dashboard" },
    { name: "My Classes", icon: <Book size={20} />, href: "/teacher/classes" },
    { name: "Attendance", icon: <Calendar size={20} />, href: "/teacher/attendance" },
    { name: "Grades", icon: <FileText size={20} />, href: "/teacher/grades" },
  ],
};

export const getNavigationItems = (role) => NAVIGATION_ITEMS[role] || [];
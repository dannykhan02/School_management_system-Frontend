import { 
  Users, 
  Book, 
  Calendar,
  Home,
  FileText,
  BarChart3,
  Crown,
  DoorOpen,
  Waves,
  BookOpen,
  GraduationCap,
  Building2,
  Shield
} from "lucide-react";

export const NAVIGATION_ITEMS = {
  super_admin: [
    { 
      name: "Schools", 
      icon: Building2,
      href: "/super_admin/dashboard" 
    },
    { 
      name: "Roles", 
      icon: Shield,
      href: "/super_admin/roles" 
    },
  ],
  admin: [
    { 
      name: "School Profile", 
      icon: Home,
      href: "/admin/dashboard" 
    },
    { 
      name: "Academic Year", 
      icon: Calendar,
      href: "/admin/academic-year" 
    },
    { 
      name: "Classrooms", 
      icon: DoorOpen,
      href: "/admin/classrooms" 
    },
    { 
      name: "Streams", 
      icon: Waves,
      href: "/admin/streams" 
    },
    { 
      name: "Subjects", 
      icon: BookOpen,
      href: "/admin/subjects" 
    },
    { 
      name: "Teachers", 
      icon: GraduationCap,
      href: "/admin/teachers" 
    },
    { 
      name: "Add Users", 
      icon: Users,
      href: "/admin/new-user" 
    },
  ],
  teacher: [
    { 
      name: "Dashboard", 
      icon: Home,
      href: "/teacher/dashboard" 
    },
    { 
      name: "My Classes", 
      icon: Book,
      href: "/teacher/classes" 
    },
    { 
      name: "Attendance", 
      icon: Calendar,
      href: "/teacher/attendance" 
    },
    { 
      name: "Grades", 
      icon: FileText,
      href: "/teacher/grades" 
    },
  ],
  student: [
    { 
      name: "Dashboard", 
      icon: Home,
      href: "/student/dashboard" 
    },
    { 
      name: "My Courses", 
      icon: BookOpen,
      href: "/student/courses" 
    },
    { 
      name: "Grades", 
      icon: FileText,
      href: "/student/grades" 
    },
  ],
};

export const getNavigationItems = (role) => NAVIGATION_ITEMS[role] || [];
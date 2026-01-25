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
  Shield,
  User // Add this import
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
    { 
      name: "User Profile", 
      icon: User,
      href: "/super_admin/user-profile" 
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
      href: "/admin/streams",
      requiresStreams: true // This item requires streams to be enabled
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
    { 
      name: "User Profile", 
      icon: User,
      href: "/admin/user-profile" 
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
      name: "Streams", 
      icon: Waves,
      href: "/teacher/streams",
      requiresStreams: true // This item requires streams to be enabled
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
    { 
      name: "User Profile", 
      icon: User,
      href: "/teacher/user-profile" 
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
    { 
      name: "User Profile", 
      icon: User,
      href: "/student/user-profile" 
    },
  ],
  parent: [
    { 
      name: "Dashboard", 
      icon: Home,
      href: "/parent/dashboard" 
    },
    { 
      name: "My Children", 
      icon: Users,
      href: "/parent/children" 
    },
    { 
      name: "Events", 
      icon: Calendar,
      href: "/parent/events" 
    },
    { 
      name: "Reports", 
      icon: FileText,
      href: "/parent/reports" 
    },
    { 
      name: "User Profile", 
      icon: User,
      href: "/parent/user-profile" 
    },
  ],
};

export const getNavigationItems = (role) => NAVIGATION_ITEMS[role] || [];
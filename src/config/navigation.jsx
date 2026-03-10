import { 
  Users,
  CalendarDays,
  LayoutDashboard,
  ScrollText,
  BarChart3,
  Layers3,
  NotebookPen,
  LibraryBig,
  School,
  ShieldCheck,
  CircleUserRound,
  FlipHorizontal2,
  BookMarked,
  UserRoundPlus,
  ClipboardCheck,
  UsersRound,
  PartyPopper,
  TrendingUp,
  Landmark,
  Hash,
  ClipboardList,
} from "lucide-react";

export const NAVIGATION_ITEMS = {
  super_admin: [
    { 
      name: "Schools", 
      icon: Landmark,
      href: "/super_admin/dashboard" 
    },
    { 
      name: "Roles", 
      icon: ShieldCheck,
      href: "/super_admin/roles" 
    },
    { 
      name: "My Profile", 
      icon: CircleUserRound,
      href: "/super_admin/user-profile" 
    },
  ],
  admin: [
    { 
      name: "School Profile", 
      icon: School,
      href: "/admin/dashboard" 
    },
    { 
      name: "Academic Year", 
      icon: CalendarDays,
      href: "/admin/academic-year" 
    },
    { 
      name: "Classrooms", 
      icon: LayoutDashboard,
      href: "/admin/classrooms" 
    },
    { 
      name: "Streams", 
      icon: Layers3,
      href: "/admin/streams",
      requiresStreams: true
    },
    { 
      name: "Subjects", 
      icon: LibraryBig,
      href: "/admin/subjects" 
    },
    { 
      name: "Teachers", 
      icon: UsersRound,
      href: "/admin/teachers" 
    },
    { 
      name: "Add Users", 
      icon: UserRoundPlus,
      href: "/admin/new-user" 
    },
    // ── Enrollment ──────────────────────────────────────────────────────────
    { 
      name: "Enrollments", 
      icon: ClipboardList,      // clipboard with list — unambiguous applications queue
      href: "/admin/enrollments" 
    },
    { 
      name: "Admission Setup", 
      icon: Hash,               // hash/number sign — directly evokes admission numbering
      href: "/admin/admission-config" 
    },
    { 
      name: "My Profile", 
      icon: CircleUserRound,
      href: "/admin/user-profile" 
    },
  ],
  teacher: [
    { 
      name: "Dashboard", 
      icon: LayoutDashboard,
      href: "/teacher/dashboard" 
    },
    { 
      name: "My Classes", 
      icon: BookMarked,
      href: "/teacher/classes" 
    },
    { 
      name: "Streams", 
      icon: Layers3,
      href: "/teacher/streams",
      requiresStreams: true
    },
    { 
      name: "Attendance", 
      icon: ClipboardCheck,
      href: "/teacher/attendance" 
    },
    { 
      name: "Grades", 
      icon: NotebookPen,
      href: "/teacher/grades" 
    },
    { 
      name: "My Profile", 
      icon: CircleUserRound,
      href: "/teacher/user-profile" 
    },
  ],
  student: [
    { 
      name: "Dashboard", 
      icon: LayoutDashboard,
      href: "/student/dashboard" 
    },
    { 
      name: "My Courses", 
      icon: LibraryBig,
      href: "/student/courses" 
    },
    { 
      name: "Grades", 
      icon: TrendingUp,
      href: "/student/grades" 
    },
    { 
      name: "My Profile", 
      icon: CircleUserRound,
      href: "/student/user-profile" 
    },
  ],
  parent: [
    { 
      name: "Dashboard", 
      icon: LayoutDashboard,
      href: "/parent/dashboard" 
    },
    { 
      name: "My Children", 
      icon: UsersRound,
      href: "/parent/children" 
    },
    { 
      name: "Events", 
      icon: PartyPopper,
      href: "/parent/events" 
    },
    { 
      name: "Reports", 
      icon: ScrollText,
      href: "/parent/reports" 
    },
    { 
      name: "My Profile", 
      icon: CircleUserRound,
      href: "/parent/user-profile" 
    },
  ],
};

export const getNavigationItems = (role) => NAVIGATION_ITEMS[role] || [];
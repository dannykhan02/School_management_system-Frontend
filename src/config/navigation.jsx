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
} from "lucide-react";

export const NAVIGATION_ITEMS = {
  super_admin: [
    { 
      name: "Schools", 
      icon: Landmark,           // iconic building — evokes institutions/schools better than Building2
      href: "/super_admin/dashboard" 
    },
    { 
      name: "Roles", 
      icon: ShieldCheck,        // filled checkmark on shield — implies verified permissions
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
      icon: School,             // dedicated school icon — more specific than a generic Home
      href: "/admin/dashboard" 
    },
    { 
      name: "Academic Year", 
      icon: CalendarDays,       // calendar with date grid lines — more detailed than plain Calendar
      href: "/admin/academic-year" 
    },
    { 
      name: "Classrooms", 
      icon: LayoutDashboard,    // grid layout — evokes rooms/sections at a glance
      href: "/admin/classrooms" 
    },
    { 
      name: "Streams", 
      icon: Layers3,            // stacked layers — conveys grouped/tiered streams clearly
      href: "/admin/streams",
      requiresStreams: true
    },
    { 
      name: "Subjects", 
      icon: LibraryBig,         // open library shelves — richer than a plain book
      href: "/admin/subjects" 
    },
    { 
      name: "Teachers", 
      icon: UsersRound,         // grouped people silhouette — distinct from single-user icons
      href: "/admin/teachers" 
    },
    { 
      name: "Add Users", 
      icon: UserRoundPlus,      // user with a plus — unambiguous add-user action
      href: "/admin/new-user" 
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
      icon: LayoutDashboard,    // structured grid — standard but polished dashboard icon
      href: "/teacher/dashboard" 
    },
    { 
      name: "My Classes", 
      icon: BookMarked,         // bookmarked book — implies an assigned/personal class list
      href: "/teacher/classes" 
    },
    { 
      name: "Streams", 
      icon: Layers3,            // consistent with admin streams
      href: "/teacher/streams",
      requiresStreams: true
    },
    { 
      name: "Attendance", 
      icon: ClipboardCheck,     // clipboard with checkmark — classic attendance/register icon
      href: "/teacher/attendance" 
    },
    { 
      name: "Grades", 
      icon: NotebookPen,        // notebook with pen — evokes marking/grading work
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
      icon: LibraryBig,         // rich library icon — fits a course/subject catalogue
      href: "/student/courses" 
    },
    { 
      name: "Grades", 
      icon: TrendingUp,         // upward trend line — aspirational, implies academic progress
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
      icon: UsersRound,         // grouped users — better than generic Users for a family context
      href: "/parent/children" 
    },
    { 
      name: "Events", 
      icon: PartyPopper,        // celebratory — fitting for school events/activities
      href: "/parent/events" 
    },
    { 
      name: "Reports", 
      icon: ScrollText,         // scroll document — more formal/report-like than FileText
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
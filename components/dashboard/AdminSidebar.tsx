"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "../DarkModeToggle";
import { 
  Home, 
  Users, 
  GraduationCap, 
  Calendar, 
  ClipboardCheck, 
  BarChart2,
  Video,
  ClipboardList,
  UserPlus
} from "lucide-react";

interface AdminSidebarProps {
  isAdmin: boolean;
}

const adminRoutes = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Estudiantes",
    href: "/admin/students",
    icon: Users,
  },
  {
    label: "Registrar Usuario",
    href: "/admin/register",
    icon: UserPlus,
  },
  {
    label: "Cursos",
    href: "/admin/courses",
    icon: GraduationCap,
  },
  {
    label: "Reuniones",
    href: "/admin/meetings",
    icon: Calendar,
  },
  {
    label: "Asistencia",
    href: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Progreso Académico",
    href: "/admin/progress",
    icon: BarChart2,
  },
];

export function AdminSidebar({ isAdmin }: AdminSidebarProps) {
  const pathname = usePathname();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-6 flex flex-col h-full">
        <Link href="/" className="flex items-center gap-x-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <h1 className="font-bold text-xl">
            Admin Panel
          </h1>
        </Link>
        <div className="mt-2">
          <Link
            href="/my-courses"
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            ← Volver a mis cursos
          </Link>
        </div>
        <ScrollArea className="flex-1 mt-10">
          <nav className="flex flex-col gap-y-4">
            {adminRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-x-2 text-sm font-medium p-3 hover:bg-muted/50 rounded-lg transition-colors",
                  pathname === route.href
                    ? "bg-muted text-primary"
                    : "text-muted-foreground"
                )}
              >
                <route.icon className="h-5 w-5" />
                <span>{route.label}</span>
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t">
              <Link
                href="https://ministerio-sobrenatural.sanity.studio/studio/structure"
                target="_blank"
                className="flex items-center gap-x-2 text-sm font-medium p-3 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
              >
                <ClipboardList className="h-5 w-5" />
                <span>Sanity Studio</span>
              </Link>
              <Link
                href="https://ministerio-sobrenatural.sanity.studio/studio/structure/systemManagement;reuniones"
                target="_blank"
                className="flex items-center gap-x-2 text-sm font-medium p-3 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
              >
                <Video className="h-5 w-5" />
                <span>Dashboard de Reuniones</span>
              </Link>
            </div>
          </nav>
        </ScrollArea>
        <div className="p-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} M. Sobrenatural
          </p>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}

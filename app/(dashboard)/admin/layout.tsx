import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { adminClient } from "@/sanity/lib/adminClient";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";

// Verificar si un usuario es administrador
async function isAdmin(userId: string) {
  try {
    console.log("Verificando admin para userId:", userId);
    
    const query = `*[_type == "student" && clerkId == $userId && (role == "admin" || role == "superadmin")][0]`;
    console.log("Query:", query);
    
    const user = await adminClient.fetch(
      query,
      { userId }
    );
    
    console.log("Resultado de la consulta:", user);
    return Boolean(user);
  } catch (error) {
    console.error("Error al verificar admin:", error);
    return false;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  
  if (!user?.id) {
    return redirect("/auth/sign-in?redirectUrl=/admin");
  }
  
  // Verificar si el usuario es administrador
  const adminStatus = await isAdmin(user.id);
  console.log("Estado de admin para", user.id, ":", adminStatus);
  
  if (!adminStatus) {
    return redirect("/auth/sign-in?message=Acceso%20restringido.%20Solo%20administradores");
  }
  
  return (
    <div className="h-full">
      <div className="h-full flex">
        <div className="h-full w-64 flex-shrink-0 md:block hidden">
          <AdminSidebar isAdmin={adminStatus} />
        </div>
        <main className="flex-1 h-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

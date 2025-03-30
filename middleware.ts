import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Solución simple sin acceder a propiedades específicas de auth
export default clerkMiddleware((auth, req) => {
  // Extraer la ruta de manera segura
  let path = "/";
  try {
    path = new URL(req.url).pathname;
  } catch (e) {
    // Si falla, intentar con método alternativo
    const hostPart = req.headers.get("host") || "";
    path = req.url.split(hostPart)[1]?.split("?")[0] || "/";
  }
  
  // Comprobar autenticación de forma segura
  // @ts-ignore - Esto es necesario porque la estructura de auth puede variar
  const isSignedIn = Boolean(auth.userId || auth.sessionId || auth.getToken);
  
  console.log("Ruta:", path, "Autenticado:", isSignedIn);

  // Redirigir a /auth si está en la raíz y no está autenticado
  if (path === "/" && !isSignedIn) {
    console.log("Redirigiendo a /auth desde la raíz");
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Permitir acceso a la página de onboarding incluso si el usuario está autenticado
  if (path === "/onboarding") {
    console.log("Permitiendo acceso a la página de onboarding");
    return NextResponse.next();
  }

  // Redirigir a /my-courses si está autenticado y en página de auth
  if (isSignedIn && ["/auth", "/sign-in", "/sign-up"].includes(path)) {
    console.log("Redirigiendo a /my-courses");
    return NextResponse.redirect(new URL("/my-courses", req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

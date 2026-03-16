"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager";
}

export function AdminGuard({ children, requiredRole = "admin" }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Проверяем JWT токен и роль пользователя
        const response = await fetch("/api/auth/check-admin", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.role === requiredRole || data.role === "admin") {
            setIsAuthorized(true);
          } else {
            router.push("/");
          }
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("[AdminGuard] Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Будет перенаправлено
  }

  return <>{children}</>;
}

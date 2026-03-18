// @ts-nocheck
"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  userId: string;
  phone?: string;
  email?: string;
  name?: string;
  surname?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser({
            userId: userData.userId || "unknown",
            phone: userData.phone,
            email: userData.email,
            name: userData.name,
            surname: userData.surname,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("[useAuth] Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, isAuthenticated: user !== null };
}

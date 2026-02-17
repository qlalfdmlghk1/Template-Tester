import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/entities/user/model/user.type";
import { fetchCurrentUser } from "@/features/auth/api/auth.api";
import { AuthContext } from "@/features/auth/model/AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = useCallback((loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login }}>
      {children}
    </AuthContext.Provider>
  );
}

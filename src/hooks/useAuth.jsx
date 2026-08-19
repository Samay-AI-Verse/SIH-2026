import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLES } from "../types";
import { adminSession, adminSignOut } from "../services/apiService";

const AuthContext = createContext({
  user: null,
  profile: null,
  firebaseUser: null,
  loading: true,
  configured: true,
  isAdmin: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminSession()
      .then((session) => {
        if (!active) return;
        setUser(session?.admin || null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    function onStorage(event) {
      if (event.key === "sih_admin_token") {
        adminSession().then((session) => setUser(session?.admin || null));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isAdmin = Boolean(user);
  const profile = user
    ? { id: user.id, email: user.email, name: user.name || "Admin", role: ROLES.ADMIN }
    : null;

  const value = useMemo(
    () => ({
      user,
      profile,
      firebaseUser: user,
      loading,
      configured: true,
      isAdmin,
      refresh: async () => {
        const session = await adminSession();
        setUser(session?.admin || null);
        return session;
      },
      signOut: async () => {
        await adminSignOut();
        setUser(null);
      },
    }),
    [isAdmin, loading, profile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

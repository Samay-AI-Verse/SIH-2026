import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ROLES } from "../types";
import { adminSession, adminSignOut, subscribeTable } from "../services/apiService";

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
        const validAdmin = session?.admin || null;
        setUser(validAdmin);
        if (!validAdmin && window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          window.location.href = "/";
        }
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
          window.location.href = "/";
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    function onStorage(event) {
      if (event.key === "sih_admin_token") {
        adminSession().then((session) => setUser(session?.admin || null));
      }
    }

    function onUnauthorized() {
      setUser(null);
      if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
        window.location.href = "/";
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("admin_unauthorized", onUnauthorized);

    // Subscribe to SSE for FORCE_LOGOUT events across devices
    const unsubscribeSse = subscribeTable("FORCE_LOGOUT", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (payload.table === "FORCE_LOGOUT") {
          adminSignOut();
          setUser(null);
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/";
          }
        }
      } catch (err) {
        // ignore parse error
      }
    });

    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("admin_unauthorized", onUnauthorized);
      unsubscribeSse();
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

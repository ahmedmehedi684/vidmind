import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const CURRENT_USER_STORAGE_KEY = "app_current_user_id";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const persistCurrentUserId = (nextUser: User | null) => {
    try {
      if (nextUser?.id) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, nextUser.id);
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setSession(session);
      setUser(nextUser);
      persistCurrentUserId(nextUser);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const nextUser = session?.user ?? null;
      setSession(session);
      setUser(nextUser);
      persistCurrentUserId(nextUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

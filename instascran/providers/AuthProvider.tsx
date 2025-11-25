import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

type Profile = {
  username: string;
  avatar_url: string | null;
  full_name: string | null;
};

interface AuthContextProps {
  session: Session | null;
  loading: boolean;
  profile: Profile | null; 
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  session: null,
  loading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, full_name")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("Profile fetch result:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session) await fetchProfile(session.user.id);
  };

  const value = {
    session,
    loading,
    profile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
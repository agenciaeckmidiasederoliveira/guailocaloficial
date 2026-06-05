import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  role: "user" | "parceiro" | "admin";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isParceiro: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PROFILE_TIMEOUT_MS = 8000;

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Tempo esgotado ao carregar perfil")), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const authRequestRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const profileLoadedForRef = useRef<string | null>(null);
  const profileLoadingForRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if user is a partner via secure RPC (no direct SELECT on parceiros)
    const { data: parceiroInfo } = await supabase.rpc("get_my_parceiro_info");
    const isParceiro = Array.isArray(parceiroInfo) && parceiroInfo.length > 0;

    if (isParceiro && data.role === "user") {
      await supabase
        .from("profiles")
        .update({ role: "parceiro" })
        .eq("id", userId);
      return { ...data, role: "parceiro" } as Profile;
    }

    return data as Profile;
  }, []);

  const applySession = useCallback(async (nextSession: Session | null) => {
    const nextUserId = nextSession?.user?.id ?? null;
    const sameUser = currentUserIdRef.current === nextUserId;
    const needsProfile = !!nextUserId && profileLoadedForRef.current !== nextUserId;
    const alreadyLoadingProfile = !!nextUserId && profileLoadingForRef.current === nextUserId;

    // Evita corrida entre onAuthStateChange(INITIAL_SESSION) e getSession().
    // Antes, a segunda chamada invalidava a primeira e deixava loading=true para sempre.
    if (alreadyLoadingProfile) {
      setSession(nextSession);
      if (!sameUser) {
        setUser(nextSession?.user ?? null);
        currentUserIdRef.current = nextUserId;
      }
      return;
    }

    const requestId = ++authRequestRef.current;

    if (!sameUser || (needsProfile && !alreadyLoadingProfile)) {
      setLoading(true);
    }
    setSession(nextSession);
    if (!sameUser) {
      setUser(nextSession?.user ?? null);
    }
    currentUserIdRef.current = nextUserId;

    if (!nextUserId || !nextSession?.user) {
      setProfile(null);
      profileLoadedForRef.current = null;
      profileLoadingForRef.current = null;
      setLoading(false);
      return;
    }

    if (!needsProfile) {
      setLoading(false);
      return;
    }

    if (alreadyLoadingProfile) {
      return;
    }

    profileLoadingForRef.current = nextUserId;
    let nextProfile: Profile | null = null;
    try {
      nextProfile = await withTimeout(fetchProfile(nextSession.user.id), PROFILE_TIMEOUT_MS);
    } catch {
      nextProfile = null;
    }

    if (authRequestRef.current !== requestId) {
      return;
    }

    setProfile(nextProfile);
    profileLoadedForRef.current = nextUserId;
    profileLoadingForRef.current = null;
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(() => {
          void applySession(session);
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const signUp = async (email: string, password: string) => {
    // Preserve convite token through email confirmation redirect
    const conviteToken = localStorage.getItem("convite_token");
    const redirectPath = conviteToken ? `/auth?convite=${conviteToken}` : "/";
    const redirectUrl = `${window.location.origin}${redirectPath}`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
    currentUserIdRef.current = null;
    profileLoadedForRef.current = null;
    profileLoadingForRef.current = null;
    setLoading(false);
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      const nextProfile = await fetchProfile(user.id);
      setProfile(nextProfile);
      profileLoadedForRef.current = user.id;
      profileLoadingForRef.current = null;
    }
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === "admin" || user?.email === "gestorederoliveira@gmail.com";
  const isParceiro = profile?.role === "parceiro" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        isParceiro,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { Session } from "@supabase/supabase-js";
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext<{
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    // Handle deep links for email verification
    const handleDeepLink = async (url: string) => {
      const access_token = url.split('#')[1]?.split('&').find(p => p.startsWith('access_token='))?.split('=')[1];
      const refresh_token = url.split('#')[1]?.split('&').find(p => p.startsWith('refresh_token='))?.split('=')[1];
      
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) console.error('Error setting session from URL:', error);
      }
    };

    // Listen for deep links
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

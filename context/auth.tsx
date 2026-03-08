import { Session } from "@supabase/supabase-js";
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from 'react-native';
import { supabase } from "../lib/supabase";

const AuthContext = createContext<{
  session: Session | null;
  profile: any | null;
  isLoading: boolean;
  hasSkippedPairing: boolean;
  setHasSkippedPairing: (skipped: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSkippedPairing, setHasSkippedPairing] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status === 406) {
        // Profile doesn't exist - this shouldn't normally happen due to trigger
        // but can happen if user was manually deleted or trigger failed.
        console.warn('Profile not found for user');
        setProfile(null);
        return;
      }

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      // If we get an auth error, we might want to clear the session
      if (error.status === 401 || error.status === 403) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setHasSkippedPairing(false);
      }
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
        
        if (error) {
          console.error('Error setting session from URL:', error);
          Alert.alert('Error', 'Verification failed or link expired.');
        } else {
          Alert.alert(
            'Success',
            'Account verified successfully! You are now logged in.',
            [{ text: 'Great!' }]
          );
        }
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
        profile,
        isLoading,
        hasSkippedPairing,
        setHasSkippedPairing,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refreshProfile: async () => {
          if (session?.user) await fetchProfile(session.user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

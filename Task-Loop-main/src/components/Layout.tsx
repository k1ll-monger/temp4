
import React, { ReactNode, useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  onSearch?: (term: string) => void;
  onSessionUpdate?: (session: Session | null) => void;
  onProtectedNavigation?: (path: string) => void;
  requireAuth?: boolean;
}

const Layout = ({ 
  children, 
  onSearch, 
  onSessionUpdate, 
  onProtectedNavigation,
  requireAuth = false
}: LayoutProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session in localStorage
    const checkLocalSession = () => {
      const localSession = localStorage.getItem('taskloop_session');
      if (localSession) {
        const parsedSession = JSON.parse(localSession);
        if (parsedSession.isAuthenticated) {
          setSession(parsedSession as unknown as Session);
          setLoading(false);
          
          if (onSessionUpdate) {
            onSessionUpdate(parsedSession as unknown as Session);
          }
          return true;
        }
      }
      return false;
    };

    const hasLocalSession = checkLocalSession();
    
    // Remove authentication requirement
    setLoading(false);
    
    // Listen for storage changes (in case of login/logout in other tabs)
    const handleStorageChange = () => {
      checkLocalSession();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onSessionUpdate, navigate, requireAuth]);

  const handleProtectedNavigation = (path: string) => {
    // Allow navigation to any path
    navigate(path);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        onSearch={onSearch} 
        session={session}
        onProtectedNavigation={handleProtectedNavigation}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;

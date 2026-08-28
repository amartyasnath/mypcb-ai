import React, { useState, useEffect, useRef } from 'react';
import { User as AuthUser, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, User as UserIcon, ChevronUp } from 'lucide-react';
import { AuthModal } from './AuthModal';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(auth.currentUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Close the account menu on an outside click so it cannot get stuck open.
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full bg-primary text-primary-foreground rounded-lg p-2 text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Sign in / Register
        </button>
        {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      </div>
    );
  }

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Account';

  return (
    <div ref={containerRef} className="p-4 border-t border-border relative">
      {isMenuOpen && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-lg shadow-xl border border-border overflow-hidden text-sm">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 text-destructive hover:bg-secondary transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}

      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full bg-card border border-border p-3 rounded-lg flex justify-between items-center hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex flex-col text-left min-w-0">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
            Account
          </span>
          <span className="text-sm text-foreground font-bold truncate">{displayName}</span>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
};

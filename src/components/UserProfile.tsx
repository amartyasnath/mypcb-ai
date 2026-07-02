import React, { useState, useEffect } from 'react';
import { User as AuthUser, auth as firebaseAuth, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { LogOut, Settings, User as UserIcon, Palette, ChevronUp } from 'lucide-react';
import { AuthModal } from './AuthModal';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  if (!user) {
    return (
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full bg-blue-600 text-white rounded p-2 text-sm font-semibold hover:bg-blue-500 transition-colors cursor-pointer"
        >
          Sign in / Register
        </button>
        {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
      </div>
    );
  }

  const nameParts = (user.displayName || '').split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div className="p-4 border-t border-slate-800 relative">
      {isMenuOpen && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden text-sm">
          <button className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 text-left cursor-pointer">
            <Palette className="w-4 h-4" /> Personalization
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 text-left cursor-pointer">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 text-left cursor-pointer">
            <UserIcon className="w-4 h-4" /> Profile
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}

      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-full bg-slate-800 p-3 rounded-lg flex justify-between items-center hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <div className="flex flex-col text-left">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Account</span>
          <span className="text-sm text-slate-200 font-bold truncate">
            {firstName} {lastName}
          </span>
        </div>
        <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};

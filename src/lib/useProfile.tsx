import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataService } from './dataService';
import type { Profile } from '../types';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  saveProfile: (p: Omit<Profile, 'creadoEn' | 'actualizadoEn'>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, []);

  const saveProfile = useCallback(async (p: Omit<Profile, 'creadoEn' | 'actualizadoEn'>) => {
    const saved = await dataService.saveProfile(p);
    setProfile(saved);
  }, []);

  return <ProfileContext.Provider value={{ profile, loading, saveProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile debe usarse dentro de <ProfileProvider>');
  return ctx;
}

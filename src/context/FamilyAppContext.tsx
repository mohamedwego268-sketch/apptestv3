import React, { createContext, useContext } from 'react';
import {
  FamilySpaceState,
  LanguageCode,
  ParentProfileThemeSpec,
  ParentThemeRole,
} from '../domain/familySpaceCore';

export type PageId =
  | 'home'
  | 'children'
  | 'routine'
  | 'calendar'
  | 'wishes'
  | 'medical'
  | 'media'
  | 'community'
  | 'chat'
  | 'games'
  | 'services'
  | 'notifications'
  | 'assistant'
  | 'family'
  | 'settings'
  | 'privacy'
  | 'terms'
  | 'contact';

export interface FamilyAppContextValue {
  state: FamilySpaceState;
  setState?: React.Dispatch<React.SetStateAction<FamilySpaceState>>;
  lang?: LanguageCode;
  isEn?: boolean;
  brandName?: string;
  parentProfileSpec?: ParentProfileThemeSpec;
  activePage: PageId;
  navigateTo: (page: PageId) => void;
  setThemeRole?: (role: ParentThemeRole) => void;
  toggleDarkMode?: () => void;
  toggleLanguage?: () => void;
  showToast: (msg: string) => void;
}

const FamilyAppContext = createContext<FamilyAppContextValue | null>(null);

export const FamilyAppProvider: React.FC<{
  value: FamilyAppContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <FamilyAppContext.Provider value={value}>{children}</FamilyAppContext.Provider>;
};

export function useFamilyAppContext(): FamilyAppContextValue {
  const ctx = useContext(FamilyAppContext);
  if (!ctx) {
    throw new Error('useFamilyAppContext must be used within a FamilyAppProvider');
  }
  return ctx;
}

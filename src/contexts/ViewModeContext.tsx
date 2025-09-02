import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type ViewMode = 'overview' | 'full';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

interface ViewModeProviderProps {
  children: React.ReactNode;
}

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Check URL parameter first, then localStorage, then default
    const urlParams = new URLSearchParams(location.search);
    const urlView = urlParams.get('view');
    if (urlView === 'overview' || urlView === 'full') {
      return urlView as ViewMode;
    }
    
    // Load from localStorage or default to 'overview'
    const saved = localStorage.getItem('viewMode');
    return (saved as ViewMode) || 'overview';
  });

  // Update URL when viewMode changes
  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    
    // Update URL parameter if on home page
    if (location.pathname === '/') {
      const urlParams = new URLSearchParams(location.search);
      urlParams.set('view', mode);
      navigate(`/?${urlParams.toString()}`, { replace: true });
    }
  };

  // Persist to localStorage when viewMode changes
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  // Sync with URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlView = urlParams.get('view');
    if (urlView === 'overview' || urlView === 'full') {
      setViewMode(urlView as ViewMode);
    }
  }, [location.search]);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode: handleSetViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};
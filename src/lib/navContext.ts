interface NavContext {
  type: 'nft' | 'collection';
  items: string[];
  source: string;
  tab?: string;
}

const NAV_STORAGE_KEY = 'nav-context';

export const setNavContext = (context: NavContext) => {
  try {
    sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn('Failed to save navigation context:', error);
  }
};

export const getNavContext = (type: 'nft' | 'collection'): NavContext | null => {
  try {
    const stored = sessionStorage.getItem(NAV_STORAGE_KEY);
    if (!stored) return null;
    
    const context = JSON.parse(stored);
    return context.type === type ? context : null;
  } catch (error) {
    console.warn('Failed to read navigation context:', error);
    return null;
  }
};

export const clearNavContext = () => {
  try {
    sessionStorage.removeItem(NAV_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear navigation context:', error);
  }
};
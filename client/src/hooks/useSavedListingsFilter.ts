import { useState, useEffect } from 'react';

const SAVED_LISTINGS_FILTER_KEY = 'savedListingsFilter';

export function useSavedListingsFilter() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage and listen for changes from other tabs/windows
  useEffect(() => {
    // Load initial value from localStorage
    try {
      const stored = localStorage.getItem(SAVED_LISTINGS_FILTER_KEY);
      if (stored) {
        setSelectedCategory(stored === 'null' ? null : stored);
      }
    } catch (error) {
      console.error('Failed to read saved listings filter from localStorage:', error);
    }
    setIsInitialized(true);

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SAVED_LISTINGS_FILTER_KEY && e.newValue !== null) {
        setSelectedCategory(e.newValue === 'null' ? null : e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update localStorage whenever the category changes
  const updateCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    try {
      localStorage.setItem(SAVED_LISTINGS_FILTER_KEY, categoryId === null ? 'null' : categoryId);
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(
        new CustomEvent('savedListingsFilterChange', {
          detail: { categoryId }
        })
      );
    } catch (error) {
      console.error('Failed to save listings filter to localStorage:', error);
    }
  };

  return {
    selectedCategory,
    setSelectedCategory: updateCategory,
    isInitialized
  };
}

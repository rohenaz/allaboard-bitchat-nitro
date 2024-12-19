import { useState } from 'react';

export const lsTest = () => {
  const test = 'test';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export function useLocalStorage<T>(key: string, initialValue?: T): [T | null, (value: T | null) => void] {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    if (!lsTest()) {
      return initialValue ?? null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue ?? null;
    } catch (error) {
      console.error(error);
      return initialValue ?? null;
    }
  });

  const setValue = (value: T | null) => {
    try {
      setStoredValue(value);
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
} 
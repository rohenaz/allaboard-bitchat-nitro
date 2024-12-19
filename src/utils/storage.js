import { useCallback, useEffect, useMemo, useState } from 'react';

export const lsTest = () => {
  // TODO: Troubleshooting mobile issues
  return true;
  // var test = "test";
  // try {
  //   localStorage.setItem(test, test);
  //   localStorage.removeItem(test);
  //   return true;
  // } catch (e) {
  //   return false;
  // }
};

const replacer = (_key, value) => {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...originalObject]
    };
  }
  return value;
};

const reviver = (_key, value) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
};

const getStorage = (storageType) => {
  let storage;

  if (typeof window !== 'undefined') {
    switch (storageType) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
    }
  }

  return storage;
};

const saveInStorage = (storageType, storageKey, data) => {
  const storage = getStorage(storageType);

  try {
    if (storage) {
      if (data != null && data !== undefined) {
        storage.setItem(storageKey, JSON.stringify(data, replacer));
      } else {
        storage.removeItem(storageKey);
      }
    }
  } catch (_e) {}
};

const loadFromStorage = (storageType, localStorageKey) => {
  const storage = getStorage(storageType);

  try {
    if (storage) {
      const dataStr = storage.getItem(localStorageKey);
      return dataStr ? JSON.parse(dataStr, reviver) : undefined;
    }
  } catch (_e) {}

  return undefined;
};

export const saveInLocalStorage = (storageKey, data) =>
  saveInStorage('localStorage', storageKey, data);

export const loadFromLocalStorage = (storageKey) =>
  loadFromStorage('localStorage', storageKey) || undefined;

export const saveInSessionStorage = (storageKey, data) =>
  saveInStorage('sessionStorage', storageKey, data);

export const loadFromSessionStorage = (storageKey) =>
  loadFromStorage('sessionStorage', storageKey) || undefined;

// Hooks

const useStorage = (storageType, storageKey, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      return loadFromStorage(storageType, storageKey) || initialValue;
    } catch (e) {
      console.error(e);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue(value);
        saveInStorage(storageType, storageKey, value);
      } catch (e) {
        console.error(e);
      }
    },
    [storageKey, storageType],
  );

  // Listen to changes in local storage in order to adapt to actions from other browser tabs
  useEffect(() => {
    const handleChange = () => {
      setStoredValue(loadFromStorage(storageType, storageKey) || initialValue);
    };

    window.addEventListener('storage', handleChange, false);
    return () => {
      window.removeEventListener('storage', handleChange);
    };
  }, [initialValue, storageKey, storageType]);

  const value = useMemo(() => [storedValue, setValue], [storedValue, setValue]);

  return value;
};

export const useLocalStorage = (storageKey, initialValue) =>
  useStorage('localStorage', storageKey, initialValue);

export const useSessionStorage = (storageKey, initialValue) =>
  useStorage('sessionStorage', storageKey, initialValue);

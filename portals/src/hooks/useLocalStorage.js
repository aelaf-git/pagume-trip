import { useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (nextValue) => {
    setValue(nextValue);
    try {
      if (nextValue === null || nextValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(nextValue));
      }
    } catch {
      // ignore write errors (e.g. private browsing)
    }
  };

  return [value, setStoredValue];
}


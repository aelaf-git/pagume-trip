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
    setValue((prev) => {
      const resolved = typeof nextValue === "function" ? nextValue(prev) : nextValue;
      try {
        if (resolved === null || resolved === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        }
      } catch {
        // ignore write errors (e.g. private browsing)
      }
      return resolved;
    });
  };

  return [value, setStoredValue];
}


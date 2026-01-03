type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function getBrowserStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage;
    if (!storage || typeof storage.getItem !== "function") return null;
    return storage;
  } catch {
    return null;
  }
}

const noopStorage: StorageLike = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

export const safeLocalStorage: StorageLike = {
  getItem(key: string) {
    try {
      const storage = getBrowserStorage();
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      const storage = getBrowserStorage();
      if (storage) storage.setItem(key, value);
    } catch {
      return;
    }
  },
  removeItem(key: string) {
    try {
      const storage = getBrowserStorage();
      if (storage) storage.removeItem(key);
    } catch {
      return;
    }
  },
  clear() {
    try {
      const storage = getBrowserStorage();
      if (storage) storage.clear();
    } catch {
      return;
    }
  },
};

export const safeNoopStorage = noopStorage;

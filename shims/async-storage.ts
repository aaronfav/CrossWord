type StringPair = [string, string];
type NullablePair = [string, string | null];

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  if (!window.localStorage) return null;
  return window.localStorage;
}

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = getStorage();
    if (!storage) return null;
    return storage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(key);
  },
  async clear(): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    storage.clear();
  },
  async getAllKeys(): Promise<string[]> {
    const storage = getStorage();
    if (!storage) return [];
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  },
  async multiGet(keys: string[]): Promise<NullablePair[]> {
    const storage = getStorage();
    if (!storage) return keys.map((key) => [key, null]);
    return keys.map((key) => [key, storage.getItem(key)]);
  },
  async multiSet(pairs: StringPair[]): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    pairs.forEach(([key, value]) => storage.setItem(key, value));
  },
  async multiRemove(keys: string[]): Promise<void> {
    const storage = getStorage();
    if (!storage) return;
    keys.forEach((key) => storage.removeItem(key));
  },
};

export default AsyncStorage;

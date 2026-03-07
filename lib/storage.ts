const KEY = "user_session";

/** In-memory session storage. No native module required — works in Expo Go and any runtime. Session is lost on app restart. */
let memoryStore: string | null = null;

export async function getStoredSession(): Promise<string | null> {
  return Promise.resolve(memoryStore);
}

export async function setStoredSession(value: string): Promise<void> {
  memoryStore = value;
  return Promise.resolve();
}

export async function deleteStoredSession(): Promise<void> {
  memoryStore = null;
  return Promise.resolve();
}

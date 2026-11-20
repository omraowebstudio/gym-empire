/** Minimal key-value storage abstraction so saves can move to cloud storage later. */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private data = new Map<string, string>();
  async getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  async setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  async removeItem(key: string) {
    this.data.delete(key);
  }
  /** test helper */
  raw(): Map<string, string> {
    return this.data;
  }
}

/**
 * Future cloud save provider contract (e.g. Supabase storage keyed by auth user).
 * Not implemented in this release; local saves are authoritative.
 */
export interface CloudSaveProvider {
  upload(envelope: string): Promise<void>;
  download(): Promise<string | null>;
}

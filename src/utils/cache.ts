import type { GeoLocation } from '../types/index.js';

// ────────────────────────────────────────────────────────────
// LRU cache with a configurable entry cap
// ────────────────────────────────────────────────────────────
//
// The previous implementation used an unbounded `Map<string, CacheEntry>`,
// which leaks memory in long-running processes (each distinct lat/lng pair
// adds an entry that is never evicted). This LRU cache caps the entry count
// and evicts the least-recently-accessed entry when full.
//
// `Map` already preserves insertion order in JavaScript, so we get LRU
// semantics for free by deleting and re-inserting on every access.

export interface LruCacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LruCache<K, V> {
  private readonly store = new Map<K, LruCacheEntry<V>>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = 256) {
    this.maxEntries = Math.max(1, maxEntries);
  }

  get(key: K): LruCacheEntry<V> | undefined {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;
    // Move to end (most recently used) by deleting and re-inserting.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry;
  }

  set(key: K, entry: LruCacheEntry<V>): void {
    // If key already exists, delete first so re-insertion moves it to end.
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest (first key in the Map's insertion order).
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, entry);
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Return all keys (for debugging / metrics). */
  keys(): IterableIterator<K> {
    return this.store.keys();
  }
}

// ────────────────────────────────────────────────────────────
// Input validation helpers
// ────────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validate latitude / longitude and throw InvalidLocationError if out of range. */
export function validateLocation(location: GeoLocation): void {
  const { latitude, longitude } = location;
  if (typeof latitude !== 'number' || Number.isNaN(latitude)) {
    throw new InvalidLocationError(
      `location.latitude must be a number, got ${typeof latitude}`,
      { latitude: latitude as unknown as number },
    );
  }
  if (typeof longitude !== 'number' || Number.isNaN(longitude)) {
    throw new InvalidLocationError(
      `location.longitude must be a number, got ${typeof longitude}`,
      { longitude: longitude as unknown as number },
    );
  }
  if (latitude < -90 || latitude > 90) {
    throw new InvalidLocationError(
      `latitude ${latitude} out of range [-90, 90]`,
      { latitude, longitude },
    );
  }
  if (longitude < -180 || longitude > 180) {
    throw new InvalidLocationError(
      `longitude ${longitude} out of range [-180, 180]`,
      { latitude, longitude },
    );
  }
}

/** Validate that a date string is in ISO format (YYYY-MM-DD) and is a real calendar date. */
export function validateIsoDate(value: string, field: string): void {
  if (!ISO_DATE_RE.test(value)) {
    throw new ValidationError(field, `expected ISO date YYYY-MM-DD, got '${value}'`);
  }
  // JavaScript's Date parser is lenient — '2026-02-30' silently rolls over to
  // March 2. Parse the components and verify they round-trip.
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime())
    || parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new ValidationError(field, `'${value}' is not a valid calendar date`);
  }
}

// Import structured errors — placed at the bottom to avoid a circular import
// in case errors.ts ever imports from cache.ts (it doesn't currently, but
// this pattern is safe regardless).
import { InvalidLocationError, ValidationError } from '../errors.js';

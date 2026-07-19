import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a stored photo value into a displayable image src.
 * Uploaded images are stored as an object path (`/objects/...`) and must be
 * served through the API (`/api/storage/objects/...`). Full URLs (legacy or
 * external) are returned unchanged.
 */
export function resolvePhotoSrc(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/objects/')) return `/api/storage${pathOrUrl}`;
  return pathOrUrl;
}

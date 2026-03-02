import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function nanoid(size = 21): string {
  let result = "";
  const crypto = globalThis.crypto;
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  for (let i = 0; i < size; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

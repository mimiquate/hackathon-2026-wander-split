import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 exports `Algorithm` as an ambient `const enum`, which
// `isolatedModules` (on in this project) can't inline from a .d.ts-only
// package — so this is the library's own Algorithm.Argon2id value (2),
// not an arbitrary number.
const ARGON2ID = 2;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, { algorithm: ARGON2ID });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}

import { customAlphabet } from "nanoid";

const opaqueId = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789",
  14,
);

/** Identifiant d’URL non devinable (aucun titre ni métadonnée). */
export function generateOpaqueSlug(): string {
  return opaqueId();
}

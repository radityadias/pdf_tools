const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // no look-alike characters

/** Random password from the browser's secure generator, without modulo bias */
export function generatePassword(length = 16): string {
  const limit = Math.floor(0x100000000 / ALPHABET.length) * ALPHABET.length;
  const buf = new Uint32Array(1);
  const out: string[] = [];
  while (out.length < length) {
    crypto.getRandomValues(buf);
    if (buf[0] >= limit) continue;
    out.push(ALPHABET[buf[0] % ALPHABET.length]);
  }
  return out.join("");
}

export type Strength = { score: 0 | 1 | 2 | 3; label: string };

export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "" };
  if (pw.length < 8) return { score: 1, label: "Too short" };

  let kinds = 0;
  if (/[a-z]/.test(pw)) kinds++;
  if (/[A-Z]/.test(pw)) kinds++;
  if (/\d/.test(pw)) kinds++;
  if (/[^A-Za-z0-9]/.test(pw)) kinds++;

  if (pw.length >= 14 || (pw.length >= 10 && kinds >= 3)) return { score: 3, label: "Strong" };
  if (pw.length >= 10 || kinds >= 3) return { score: 2, label: "Okay" };
  return { score: 1, label: "Weak" };
}
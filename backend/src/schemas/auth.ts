export function objectWithKeys(value: unknown, keys: readonly string[]): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  return Object.keys(object).every((key) => keys.includes(key)) ? object : null;
}
export function normalizedEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function registrationBody(value: unknown) {
  const body = objectWithKeys(value, ['name', 'email', 'password', 'passwordConfirmation', 'termsAccepted', 'privacyAcknowledged']);
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 ||
      typeof body.password !== 'string' || typeof body.passwordConfirmation !== 'string' ||
      body.termsAccepted !== true || body.privacyAcknowledged !== true) return null;
  const email = normalizedEmail(body.email);
  return email ? { name: body.name.trim(), email, password: body.password, passwordConfirmation: body.passwordConfirmation,
    termsAccepted: true, privacyAcknowledged: true } : null;
}

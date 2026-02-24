import { Resend } from 'resend';

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  return new Resend(key);
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Plobie <hello@plobie.com>';

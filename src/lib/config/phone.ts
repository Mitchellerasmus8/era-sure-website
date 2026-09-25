import { isPlaceholder } from '@/lib/config/placeholders';

export function isConfirmed(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !isPlaceholder(value)
  );
}

export function normaliseNumber(
  value: string,
  keepLeadingPlus: boolean,
): string {
  const compactValue = value.replace(/[^\d+]/g, '');
  const digits = compactValue.replace(/\D/g, '');

  if (!keepLeadingPlus) {
    return digits;
  }

  return compactValue.startsWith('+') ? `+${digits}` : digits;
}

export function buildTelHref(value: string): string {
  return `tel:${normaliseNumber(value, true)}`;
}

export function buildWhatsAppHref(value: string, message?: string): string {
  const href = `https://wa.me/${normaliseNumber(value, false)}`;

  return message === undefined
    ? href
    : `${href}?text=${encodeURIComponent(message)}`;
}

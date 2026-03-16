import { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatPrice(kobo: number): string {
  const naira = kobo / 100;
  return '₦' + new Intl.NumberFormat('en-NG').format(naira);
}

export function formatPriceShort(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000_000) return `₦${(naira / 1_000_000_000).toFixed(1)}B`;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`;
  return `₦${naira.toFixed(0)}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + 's');
}

export function setLeadSource(source: string): void {
  localStorage.setItem('lead_source', source);
}

export function getLeadSource(): string {
  if (typeof window === 'undefined') return 'direct';
  return localStorage.getItem('lead_source') || 'direct';
}

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import PropertyCard from '../PropertyCard';
import type { PropertyListItem } from '@/types';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

// Mock the save mutation
vi.mock('@/store/api/propertyApi', () => ({
  useSavePropertyMutation: () => [vi.fn(), { isLoading: false }],
}));

const mockProperty: PropertyListItem = {
  id: 'test-id-123',
  title: 'Beautiful 3 Bedroom Flat in Lekki',
  slug: 'beautiful-3-bedroom-flat-lekki',
  listing_type: 'rent',
  price_kobo: 250000000,
  formatted_price: '₦2,500,000',
  price_negotiable: false,
  rent_period: 'yearly',
  bedrooms: 3,
  bathrooms: 2,
  toilets: 2,
  floor_area_sqm: 120,
  address: 'Lekki Phase 1, Lagos',
  featured: false,
  is_new: false,
  status: 'approved',
  property_type: { id: 'pt-1', name: 'Flat / Apartment', slug: 'flat-apartment' },
  city: { id: 'c-1', name: 'Eti-Osa', slug: 'eti-osa' },
  area: { id: 'a-1', name: 'Lekki Phase 1' },
  cover_image: { url: 'https://example.com/img.jpg', thumbnail_url: 'https://example.com/thumb.jpg' },
  agent: {
    id: 'agent-1',
    company_name: 'Lagos Realty',
    user_name: 'John Agent',
    is_verified: true,
  },
  images_count: 5,
  published_at: new Date().toISOString(),
};

describe('PropertyCard', () => {
  it('renders property title', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Beautiful 3 Bedroom Flat in Lekki')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/₦2,500,000/)).toBeInTheDocument();
  });

  it('shows rent period', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('/yearly')).toBeInTheDocument();
  });

  it('shows listing type badge', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('For Rent')).toBeInTheDocument();
  });

  it('shows bedroom count', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('3 Bed')).toBeInTheDocument();
  });

  it('shows bathroom count', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('2 Bath')).toBeInTheDocument();
  });

  it('shows location', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText(/Lekki Phase 1, Eti-Osa/)).toBeInTheDocument();
  });

  it('links to property detail page', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/beautiful-3-bedroom-flat-lekki');
  });

  it('shows property type badge', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Flat / Apartment')).toBeInTheDocument();
  });

  it('shows agent name', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('Lagos Realty')).toBeInTheDocument();
  });

  it('does not show save button when not authenticated', () => {
    renderWithProviders(<PropertyCard property={mockProperty} />);
    expect(screen.queryByLabelText(/save property/i)).not.toBeInTheDocument();
  });

  it('shows "For Sale" badge for sale listings', () => {
    const saleProperty = { ...mockProperty, listing_type: 'sale' as const, rent_period: undefined };
    renderWithProviders(<PropertyCard property={saleProperty} />);
    expect(screen.getByText('For Sale')).toBeInTheDocument();
  });

  it('shows featured badge when featured', () => {
    const featuredProperty = { ...mockProperty, featured: true };
    renderWithProviders(<PropertyCard property={featuredProperty} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('appends source param to link when provided', () => {
    renderWithProviders(<PropertyCard property={mockProperty} source="search" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/beautiful-3-bedroom-flat-lekki?ref=search');
  });
});

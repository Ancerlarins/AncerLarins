import type { Metadata } from 'next';
import PropertyDetailContent from '@/components/property/PropertyDetailContent';
import { API_URL } from '@/lib/constants';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchProperty(slug: string) {
  try {
    const res = await fetch(`${API_URL}/properties/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return '\u20A6' + new Intl.NumberFormat('en-NG').format(naira);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await fetchProperty(slug);

  if (!property) {
    return { title: 'Property Not Found | AncerLarins' };
  }

  const price = formatNaira(property.price_kobo);
  const period = property.rent_period ? `/${property.rent_period}` : '';
  const location = [property.area?.name, property.city?.name].filter(Boolean).join(', ');

  const specs = [
    property.bedrooms ? `${property.bedrooms} bed` : null,
    property.bathrooms ? `${property.bathrooms} bath` : null,
    property.furnishing ? property.furnishing.replace('_', ' ') : null,
    property.has_generator ? 'with generator' : null,
  ].filter(Boolean).join(', ');

  const title = property.meta_title || `${property.title} | ${price}${period} | AncerLarins`;
  const description = property.meta_description ||
    `${property.title} in ${location}. ${price}${period ? ` per ${property.rent_period}` : ''}. ${specs}. Contact agent on WhatsApp. View photos.`;

  const coverImage = property.images?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://ancerlarins.com/properties/${slug}`,
      images: coverImage ? [{ url: coverImage, width: 1200, height: 630, alt: property.title }] : [],
      siteName: 'AncerLarins',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: coverImage ? [coverImage] : [],
    },
    alternates: {
      canonical: `https://ancerlarins.com/properties/${slug}`,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await fetchProperty(slug);

  // BreadcrumbList structured data
  const breadcrumbLd = property ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://ancerlarins.com' },
      { '@type': 'ListItem', position: 2, name: 'Properties', item: 'https://ancerlarins.com/properties' },
      { '@type': 'ListItem', position: 3, name: property.title },
    ],
  } : null;

  // JSON-LD structured data
  const jsonLd = property ? {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `https://ancerlarins.com/properties/${slug}`,
    datePosted: property.published_at,
    ...(property.images?.[0]?.url && { image: property.images.map((img: { url: string }) => img.url) }),
    offers: {
      '@type': 'Offer',
      price: property.price_kobo / 100,
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city?.name || '',
      addressRegion: property.state?.name || 'Lagos',
      addressCountry: 'NG',
      streetAddress: property.address || '',
    },
    ...(property.bedrooms !== null && { numberOfBedrooms: property.bedrooms }),
    ...(property.bathrooms !== null && { numberOfBathroomsTotal: property.bathrooms }),
    ...(property.floor_area_sqm && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: property.floor_area_sqm,
        unitCode: 'MTK',
      },
    }),
  } : null;

  return (
    <>
      {breadcrumbLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PropertyDetailContent slug={slug} />
    </>
  );
}

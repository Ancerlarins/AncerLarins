'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGetPropertyTypesQuery } from '@/store/api/locationApi';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
  { id: 'short_let', label: 'Short Let' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const LOCATIONS = [
  'Ikoyi',
  'Victoria Island',
  'Lekki Phase 1',
  'Banana Island',
  'Ajah',
  'Ikeja GRA',
  'Yaba',
  'Oniru',
  'Osapa London',
];

const LOCATION_GROUPS = [
  { label: 'Island', items: ['Banana Island', 'Ikoyi', 'Victoria Island'] },
  { label: 'Lekki Axis', items: ['Lekki Phase 1', 'Oniru', 'Osapa London'] },
  { label: 'Mainland', items: ['Ajah', 'Yaba', 'Ikeja GRA'] },
];

// Values in kobo (1 Naira = 100 kobo) to match backend price_kobo column
const PRICE_RANGES: Record<TabId, { label: string; min?: number; max?: number }[]> = {
  sale: [
    { label: 'Under ₦50M', max: 5000000000 },
    { label: '₦50M - ₦100M', min: 5000000000, max: 10000000000 },
    { label: '₦100M - ₦300M', min: 10000000000, max: 30000000000 },
    { label: '₦300M - ₦500M', min: 30000000000, max: 50000000000 },
    { label: '₦500M+', min: 50000000000 },
  ],
  rent: [
    { label: 'Under ₦2M/yr', max: 200000000 },
    { label: '₦2M - ₦5M/yr', min: 200000000, max: 500000000 },
    { label: '₦5M - ₦10M/yr', min: 500000000, max: 1000000000 },
    { label: '₦10M - ₦20M/yr', min: 1000000000, max: 2000000000 },
    { label: '₦20M+/yr', min: 2000000000 },
  ],
  short_let: [
    { label: 'Under ₦50K/night', max: 5000000 },
    { label: '₦50K - ₦100K/night', min: 5000000, max: 10000000 },
    { label: '₦100K - ₦200K/night', min: 10000000, max: 20000000 },
    { label: '₦200K - ₦500K/night', min: 20000000, max: 50000000 },
    { label: '₦500K+/night', min: 50000000 },
  ],
};

const SUGGESTIONS = [
  '3-bed apartments in Lekki',
  'Duplexes in Ikeja GRA',
  'Short lets in Victoria Island',
];

/* ------------------------------------------------------------------ */
/*  TYPE_ICONS (from PropertyTypeExplorer)                             */
/* ------------------------------------------------------------------ */

const TYPE_ICONS: Record<string, string> = {
  apartment: 'M3 21V3h18v18H3zm2-2h4v-4H5v4zm0-6h4V9H5v4zm0-6h4V3H5v4zm6 12h4v-4h-4v4zm0-6h4V9h-4v4zm0-6h4V3h-4v4zm6 12h4v-4h-4v4zm0-6h4V9h-4v4zm0-6h4V3h-4v4z',
  house: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  duplex: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'semi-detached': 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  terrace: 'M3 21h18M3 18h18M6 18v-7m4 7V8m4 10V8m4 10v-7M3 7l9-4 9 4',
  bungalow: 'M3 12l9-8 9 8M5 10v10h14V10',
  mansion: 'M12 3L2 12h3v8h14v-8h3L12 3zm-2 15v-5h4v5',
  penthouse: 'M3 21h18v-2H3v2zm0-4h18v-2H3v2zm2-4h14V5L12 2 5 5v8zm4-2V7l3-2 3 2v4h-6z',
  'self-contain': 'M4 21V9l8-6 8 6v12H4zm4-5h8v5H8v-5z',
  land: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  'commercial-space': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  office: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  shop: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
};

const FALLBACK_PROPERTY_TYPES: { id: string; name: string; slug: string }[] = [
  { id: 'apartment', name: 'Apartment', slug: 'apartment' },
  { id: 'house', name: 'House', slug: 'house' },
  { id: 'duplex', name: 'Duplex', slug: 'duplex' },
  { id: 'semi-detached', name: 'Semi-Detached', slug: 'semi-detached' },
  { id: 'terrace', name: 'Terrace', slug: 'terrace' },
  { id: 'bungalow', name: 'Bungalow', slug: 'bungalow' },
  { id: 'mansion', name: 'Mansion', slug: 'mansion' },
  { id: 'penthouse', name: 'Penthouse', slug: 'penthouse' },
  { id: 'self-contain', name: 'Self Contain', slug: 'self-contain' },
  { id: 'land', name: 'Land', slug: 'land' },
  { id: 'commercial-space', name: 'Commercial Space', slug: 'commercial-space' },
  { id: 'office', name: 'Office', slug: 'office' },
  { id: 'shop', name: 'Shop', slug: 'shop' },
];

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs)                                                */
/* ------------------------------------------------------------------ */

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconBanknote({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 6h20v12H2V6zm10 3a3 3 0 100 6 3 3 0 000-6zM6 8v.01M18 16v.01" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Field Wrapper                                                      */
/* ------------------------------------------------------------------ */

function FieldWrapper({
  label,
  icon,
  children,
  showDivider = false,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  showDivider?: boolean;
}) {
  return (
    <div className={`group relative ${showDivider ? 'md:pr-5' : ''}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-accent-dark/80 group-hover:text-accent-dark transition-colors">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary dark:text-white/60 group-hover:text-text-primary dark:group-hover:text-white/80 transition-colors">
          {label}
        </span>
      </div>
      <div className="relative">
        {children}
      </div>
      {showDivider && (
        <div className="absolute right-0 top-2 bottom-1 w-px bg-primary/10 dark:bg-white/[0.08] hidden md:block" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CustomSelect                                                       */
/* ------------------------------------------------------------------ */

function CustomSelect({
  id,
  isOpen,
  onToggle,
  onClose,
  value,
  placeholder,
  children,
  onKeyDown,
}: {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  value: string;
  placeholder: string;
  children: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);
  const dropdownHeight = 280; // matches max-h-[280px]

  // Decide direction on open & on scroll/resize while open
  const updateDirection = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDirection();
    window.addEventListener('scroll', updateDirection, { passive: true });
    window.addEventListener('resize', updateDirection, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateDirection);
      window.removeEventListener('resize', updateDirection);
    };
  }, [isOpen, updateDirection]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      onToggle();
    } else if (isOpen && onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between py-1.5 text-sm outline-none cursor-pointer group/trigger border-b border-border/60 dark:border-white/[0.06] hover:border-accent-dark/30 dark:hover:border-white/[0.12] transition-colors"
      >
        <span className={value ? 'text-text-primary dark:text-white' : 'text-text-secondary/70 dark:text-white/50'}>
          {value || placeholder}
        </span>
        <IconChevronDown
          className={`h-3.5 w-3.5 text-text-secondary dark:text-white/50 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className={`absolute left-0 right-0 z-50 rounded-xl border border-primary/10 dark:border-white/[0.12] bg-white dark:bg-primary-light/95 backdrop-blur-xl shadow-2xl shadow-primary/10 dark:shadow-black/20 max-h-[280px] overflow-y-auto animate-modal-in scrollbar-none ${
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PropertySearch Component                                           */
/* ------------------------------------------------------------------ */

export default function PropertySearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('rent');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceIdx, setPriceIdx] = useState('');
  const [focused, setFocused] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const { data: typesData } = useGetPropertyTypesQuery();
  const apiTypes = typesData?.data;
  const propertyTypes = apiTypes && apiTypes.length > 0 ? apiTypes : FALLBACK_PROPERTY_TYPES;

  // Sync focused state with dropdown open state
  useEffect(() => {
    setFocused(openDropdown !== null);
  }, [openDropdown]);

  const toggleDropdown = useCallback((id: string) => {
    setOpenDropdown((prev) => {
      const next = prev === id ? null : id;
      setHighlightedIndex(-1);
      return next;
    });
  }, []);

  const closeDropdown = useCallback(() => {
    setOpenDropdown(null);
    setHighlightedIndex(-1);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    params.set('listing_type', activeTab);
    params.set('ref', 'hero');

    if (location) {
      params.set('q', location);
    }
    if (propertyType) {
      params.set('property_type', propertyType);
    }
    if (priceIdx) {
      const range = PRICE_RANGES[activeTab][Number(priceIdx)];
      if (range?.min) params.set('min_price', String(range.min));
      if (range?.max) params.set('max_price', String(range.max));
    }

    router.push(`/properties?${params.toString()}`);
  }, [activeTab, location, propertyType, priceIdx, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  /* ------ Location items flat list for keyboard nav ------ */
  const locationItems = LOCATION_GROUPS.flatMap((g) => g.items);

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i < locationItems.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : locationItems.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      setLocation(locationItems[highlightedIndex]);
      closeDropdown();
    }
  };

  const handlePropertyTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i < propertyTypes.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : propertyTypes.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      setPropertyType(propertyTypes[highlightedIndex].slug);
      closeDropdown();
    }
  };

  const budgetItems = PRICE_RANGES[activeTab];

  const handleBudgetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i < budgetItems.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : budgetItems.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      setPriceIdx(String(highlightedIndex));
      closeDropdown();
    }
  };

  /* ------ Helper: tier dot color for location groups ------ */
  const tierDotColor = (groupLabel: string, isSelected: boolean) => {
    if (isSelected) return 'bg-accent-dark shadow-[0_0_6px_rgba(201,168,76,0.5)]';
    switch (groupLabel) {
      case 'Island': return 'bg-accent-dark/70';
      case 'Lekki Axis': return 'bg-accent-dark/40';
      default: return 'bg-accent-dark/20';
    }
  };

  /* ------ Helper: find selected property type name ------ */
  const selectedTypeName = propertyTypes.find((t) => t.slug === propertyType)?.name || '';

  /* ------ Helper: selected budget label ------ */
  const selectedBudgetLabel = priceIdx !== '' ? PRICE_RANGES[activeTab][Number(priceIdx)]?.label || '' : '';

  return (
    <div className="w-full relative z-20">
      {/* Tabs row */}
      <div className="relative z-0 flex items-end gap-1 sm:gap-1.5 mb-0 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPriceIdx('');
                closeDropdown();
              }}
              className={`relative flex flex-col items-center px-4 sm:px-7 py-2 sm:py-3 text-[13px] sm:text-sm font-semibold tracking-wide transition-all duration-300 rounded-t-xl sm:rounded-t-2xl flex-shrink-0 ${
                isActive
                  ? 'bg-white/[0.08] shadow-sm shadow-primary/[0.04] dark:bg-primary-light/90 dark:shadow-none text-accent-dark backdrop-blur-xl'
                  : 'bg-white/[0.04] dark:bg-primary-light/30 text-text-muted dark:text-white/60 hover:text-text-secondary dark:hover:text-white/80 hover:bg-white/[0.06] dark:hover:bg-primary-light/50'
              }`}
            >
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-accent-dark" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search Card */}
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Property search"
        className={`relative z-10 rounded-b-2xl rounded-tr-2xl sm:rounded-b-3xl sm:rounded-tr-3xl border backdrop-blur-2xl p-4 sm:p-5 lg:p-7 transition-all duration-500 ${
          focused
            ? 'border-accent-dark/30 bg-white/85 shadow-xl shadow-primary/[0.06] dark:bg-primary-light/90 dark:shadow-accent-dark/5'
            : 'border-border/80 bg-white/65 shadow-lg shadow-primary/[0.04] dark:border-white/[0.08] dark:bg-primary-light/70 dark:shadow-none'
        }`}
      >
        {/* Glow effect */}
        <div
          className="absolute -inset-px rounded-b-2xl rounded-tr-2xl sm:rounded-b-3xl sm:rounded-tr-3xl bg-accent-dark/5 blur-xl -z-10 transition-opacity duration-500"
          style={{ opacity: focused ? 0.6 : 0 }}
        />

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-5">
          {/* ============ Location Dropdown ============ */}
          <FieldWrapper label="Location" icon={<IconMapPin className="h-4 w-4" />} showDivider>
            <CustomSelect
              id="location"
              isOpen={openDropdown === 'location'}
              onToggle={() => toggleDropdown('location')}
              onClose={closeDropdown}
              value={location}
              placeholder="Where in Lagos?"
              onKeyDown={handleLocationKeyDown}
            >
              {(() => {
                let flatIdx = 0;
                return LOCATION_GROUPS.map((group) => (
                  <div key={group.label}>
                    {/* Group header */}
                    <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border dark:bg-white/[0.06]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted dark:text-white/30">
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-border dark:bg-white/[0.06]" />
                    </div>
                    {/* Group items */}
                    {group.items.map((item) => {
                      const idx = flatIdx++;
                      const isSelected = location === item;
                      const isHighlighted = highlightedIndex === idx;
                      return (
                        <button
                          key={item}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setLocation(item);
                            closeDropdown();
                          }}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                            isHighlighted ? 'bg-accent-dark/[0.08] dark:bg-white/[0.06]' : ''
                          } ${isSelected ? 'text-accent-dark' : 'text-text-secondary dark:text-white/80 hover:text-text-primary dark:hover:text-white'}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 transition-all ${tierDotColor(group.label, isSelected)}`}
                          />
                          <span className="flex-1 text-left">{item}</span>
                          {isSelected && (
                            <IconCheck className="h-3.5 w-3.5 text-accent-dark flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </CustomSelect>
          </FieldWrapper>

          {/* ============ Property Type Dropdown ============ */}
          <FieldWrapper label="Property Type" icon={<IconHome className="h-4 w-4" />} showDivider>
            <CustomSelect
              id="property-type"
              isOpen={openDropdown === 'property-type'}
              onToggle={() => toggleDropdown('property-type')}
              onClose={closeDropdown}
              value={selectedTypeName}
              placeholder="Any type"
              onKeyDown={handlePropertyTypeKeyDown}
            >
              {propertyTypes.map((type, idx) => {
                const isSelected = propertyType === type.slug;
                const isHighlighted = highlightedIndex === idx;
                const iconPath = TYPE_ICONS[type.slug];
                return (
                  <button
                    key={type.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setPropertyType(type.slug);
                      closeDropdown();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                      isHighlighted ? 'bg-accent-dark/[0.08] dark:bg-white/[0.06]' : ''
                    } ${isSelected ? 'border-l-2 border-accent-dark text-accent-dark' : 'border-l-2 border-transparent text-text-secondary dark:text-white/80 hover:text-text-primary dark:hover:text-white'}`}
                  >
                    {/* Icon container */}
                    <span
                      className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-accent-dark/20'
                          : 'bg-accent-dark/[0.08] dark:bg-white/[0.06]'
                      } ${isHighlighted && !isSelected ? 'scale-110' : ''}`}
                    >
                      {iconPath ? (
                        <svg
                          className={`h-4 w-4 ${isSelected ? 'text-accent-dark' : 'text-text-muted dark:text-white/60'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
                        </svg>
                      ) : (
                        <IconHome className={`h-4 w-4 ${isSelected ? 'text-accent-dark' : 'text-text-muted dark:text-white/60'}`} />
                      )}
                    </span>
                    <span className="flex-1 text-left">{type.name}</span>
                    {isSelected && (
                      <IconCheck className="h-3.5 w-3.5 text-accent-dark flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </CustomSelect>
          </FieldWrapper>

          {/* ============ Budget Dropdown ============ */}
          <FieldWrapper label="Budget" icon={<IconBanknote className="h-4 w-4" />}>
            <CustomSelect
              id="budget"
              isOpen={openDropdown === 'budget'}
              onToggle={() => toggleDropdown('budget')}
              onClose={closeDropdown}
              value={selectedBudgetLabel}
              placeholder="Any budget"
              onKeyDown={handleBudgetKeyDown}
            >
              {budgetItems.map((range, idx) => {
                const isSelected = priceIdx === String(idx);
                const isHighlighted = highlightedIndex === idx;
                const tier = idx + 1;
                const totalDots = 5;
                // Warmer gold as tier goes up
                const filledOpacity = 0.4 + (tier / totalDots) * 0.6;
                const barWidth = `${(tier / totalDots) * 100}%`;
                return (
                  <button
                    key={range.label}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setPriceIdx(String(idx));
                      closeDropdown();
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer overflow-hidden ${
                      isHighlighted ? 'bg-accent-dark/[0.08] dark:bg-white/[0.06]' : ''
                    } ${isSelected ? 'text-accent-dark' : 'text-text-secondary dark:text-white/80 hover:text-text-primary dark:hover:text-white'}`}
                  >
                    {/* Background tier bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-accent-dark/[0.04] transition-all pointer-events-none"
                      style={{ width: barWidth }}
                    />
                    {/* Dot indicators */}
                    <span className="relative flex items-center gap-1 flex-shrink-0">
                      {Array.from({ length: totalDots }).map((_, dotIdx) => {
                        const isFilled = dotIdx < tier;
                        return (
                          <span
                            key={dotIdx}
                            className={`h-1.5 w-1.5 rounded-full transition-all ${
                              isSelected && isFilled
                                ? 'bg-accent-dark shadow-[0_0_4px_rgba(201,168,76,0.4)]'
                                : isFilled
                                  ? `bg-accent-dark`
                                  : 'bg-border dark:bg-white/[0.12]'
                            }`}
                            style={isFilled && !isSelected ? { opacity: filledOpacity } : undefined}
                          />
                        );
                      })}
                    </span>
                    <span className="relative flex-1 text-left">{range.label}</span>
                    {isSelected && (
                      <IconCheck className="relative h-3.5 w-3.5 text-accent-dark flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </CustomSelect>
          </FieldWrapper>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-accent-dark py-4 md:py-0 md:h-full md:px-5 lg:px-7 text-sm font-semibold text-primary transition-all hover:shadow-xl hover:shadow-accent-dark/20 active:scale-[0.97]"
            >
              <IconSearch className="h-5 w-5 relative z-10 flex-shrink-0" />
              <span className="relative z-10">Search</span>
              <div className="absolute inset-0 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Suggestions line */}
        <div className="mt-4 sm:mt-5 flex items-center gap-2 border-t border-border dark:border-white/[0.06] pt-4">
          <IconSparkles className="h-3.5 w-3.5 text-accent-dark/60 flex-shrink-0" />
          <p className="text-xs text-text-secondary dark:text-white/50">
            <span className="text-accent-dark/70 font-medium">Try:</span>{' '}
            {SUGGESTIONS.join(', ')}
          </p>
        </div>
      </form>
    </div>
  );
}

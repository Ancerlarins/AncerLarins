'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { toggleMobileMenu, closeMobileMenu } from '@/store/slices/uiSlice';
import type { RootState } from '@/store/store';
import ThemeToggle from '@/components/ui/ThemeToggle';
import NotificationBell from '@/components/dashboard/NotificationBell';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DropdownLink {
  label: string;
  href: string;
  desc?: string;
}

interface DropdownSection {
  title: string;
  icon?: React.ReactNode;
  links: DropdownLink[];
}

interface NavItem {
  label: string;
  href: string;
  mega?: boolean; // true = 3-column mega-menu
  sections?: DropdownSection[];
}

/* ------------------------------------------------------------------ */
/*  SVG micro-icons for mega-menu section headers                      */
/* ------------------------------------------------------------------ */

const IconHome = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);
const IconKey = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);
const IconSell = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconMap = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IconBuilding = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const IconCalendar = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const IconUsers = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Navigation data — consolidated 9 → 5 top-level items              */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Properties',
    href: '/properties',
    mega: true,
    sections: [
      {
        title: 'Buy',
        icon: IconHome,
        links: [
          { label: 'All For Sale', href: '/properties?listing_type=sale' },
          { label: 'Houses & Duplexes', href: '/properties?listing_type=sale&q=duplex' },
          { label: 'Apartments & Flats', href: '/properties?listing_type=sale&q=apartment' },
          { label: 'Penthouses', href: '/properties?listing_type=sale&q=penthouse' },
          { label: 'Land & Plots', href: '/properties?listing_type=sale&q=land' },
          { label: 'Commercial', href: '/properties?listing_type=sale&q=commercial' },
          { label: 'New Listings', href: '/properties?listing_type=sale&sort_by=newest' },
        ],
      },
      {
        title: 'Rent',
        icon: IconKey,
        links: [
          { label: 'All Rentals', href: '/properties?listing_type=rent' },
          { label: 'Apartments', href: '/properties?listing_type=rent&q=apartment' },
          { label: 'Houses & Duplexes', href: '/properties?listing_type=rent&q=duplex' },
          { label: 'Self Contain', href: '/properties?listing_type=rent&q=self+contain' },
          { label: 'Furnished Rentals', href: '/properties?listing_type=rent&furnishing=furnished' },
          { label: 'Affordable Rentals', href: '/properties?listing_type=rent&sort_by=price_asc' },
          { label: 'New Listings', href: '/properties?listing_type=rent&sort_by=newest' },
        ],
      },
      {
        title: 'Short Let',
        icon: IconCalendar,
        links: [
          { label: 'All Short Lets', href: '/properties?listing_type=short_let' },
          { label: 'Furnished Apartments', href: '/properties?listing_type=short_let&furnishing=furnished' },
          { label: 'Serviced Apartments', href: '/properties?listing_type=short_let&is_serviced=true' },
          { label: 'Houses & Duplexes', href: '/properties?listing_type=short_let&q=duplex' },
          { label: 'Budget-Friendly', href: '/properties?listing_type=short_let&sort_by=price_asc' },
          { label: 'New Listings', href: '/properties?listing_type=short_let&sort_by=newest' },
        ],
      },
      {
        title: 'Sell & Resources',
        icon: IconSell,
        links: [
          { label: 'List Your Property', href: '/dashboard/listings/new', desc: 'Free for all agents' },
          { label: 'Agent Sign Up', href: '/register?role=agent', desc: 'Create your agent profile' },
          { label: 'Agent Dashboard', href: '/dashboard', desc: 'Manage listings & leads' },
          { label: 'AncerEstimate', href: '/properties?listing_type=sale', desc: 'Automated valuations' },
          { label: 'Market Trends', href: '/neighborhoods', desc: 'Area price insights' },
        ],
      },
    ],
  },
  {
    label: 'Explore',
    href: '/neighborhoods',
    mega: true,
    sections: [
      {
        title: 'Neighborhoods',
        icon: IconMap,
        links: [
          { label: 'Lekki', href: '/properties?area=lekki' },
          { label: 'Ikoyi', href: '/properties?area=ikoyi' },
          { label: 'Victoria Island', href: '/properties?area=victoria-island' },
          { label: 'Yaba', href: '/properties?area=yaba' },
          { label: 'Ikeja', href: '/properties?area=ikeja' },
          { label: 'Ajah', href: '/properties?area=ajah' },
        ],
      },
      {
        title: 'Estates',
        icon: IconBuilding,
        links: [
          { label: 'All Estates', href: '/estates', desc: 'Explore Lagos estates' },
          { label: 'Gated Estates', href: '/estates?estate_type=gated_estate', desc: 'Secure gated communities' },
          { label: 'Highrise', href: '/estates?estate_type=highrise', desc: 'Apartment towers' },
        ],
      },
      {
        title: 'Agents',
        icon: IconUsers,
        links: [
          { label: 'All Agents', href: '/agents', desc: 'Browse verified agents' },
          { label: 'Top-Rated Agents', href: '/agents?sort=rating', desc: 'Highest rated pros' },
          { label: 'Become an Agent', href: '/register?role=agent', desc: 'Join our network' },
        ],
      },
    ],
  },
  {
    label: 'Requests',
    href: '/requests',
    sections: [
      {
        title: 'Property Requests',
        links: [
          { label: 'Browse Requests', href: '/requests', desc: 'See what people need' },
          { label: 'Post a Request', href: '/dashboard/requests', desc: 'Tell agents what you need' },
        ],
      },
    ],
  },
  {
    label: 'Cooperatives',
    href: '/cooperatives',
    sections: [
      {
        title: 'Cooperatives',
        links: [
          { label: 'Browse Cooperatives', href: '/cooperatives', desc: 'Find a co-op to join' },
          { label: 'My Cooperatives', href: '/dashboard/cooperatives', desc: 'Manage your co-ops' },
          { label: 'Start a Cooperative', href: '/dashboard/cooperatives', desc: 'Create a new co-op' },
        ],
      },
    ],
  },
  {
    label: 'Blog',
    href: '/blog',
    sections: [
      {
        title: 'Latest Articles',
        links: [
          { label: 'All Articles', href: '/blog', desc: 'Guides, reports & tips' },
          { label: 'Area Spotlights', href: '/blog?category=area_spotlight', desc: 'Lagos neighborhood deep dives' },
          { label: 'Market Reports', href: '/blog?category=market_report', desc: 'Price trends & analysis' },
          { label: 'Tips & Guides', href: '/blog?category=guide', desc: 'Renting & buying advice' },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  useScrolled hook                                                   */
/* ------------------------------------------------------------------ */

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll(); // check on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

/* ------------------------------------------------------------------ */
/*  Desktop dropdown component                                         */
/* ------------------------------------------------------------------ */

function NavDropdown({
  item,
  isOpen,
  onOpen,
  onClose,
  align = 'center',
}: {
  item: NavItem;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  align?: 'left' | 'center' | 'right';
}) {
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scheduleOpen = useCallback(() => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    onOpen();
  }, [onOpen]);

  const scheduleClose = useCallback(() => {
    closeTimeout.current = setTimeout(onClose, 150);
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
        containerRef.current?.querySelector<HTMLButtonElement>(':scope > button')?.focus();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, []);

  const hasSections = !!item.sections;
  const isMega = !!item.mega;

  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  const sectionCount = item.sections!.length;
  const panelWidth = isMega
    ? sectionCount >= 4 ? 'min-w-[820px]' : 'min-w-[640px]'
    : 'min-w-[280px]';
  const gridCols = isMega
    ? sectionCount >= 4
      ? 'grid-cols-4'
      : sectionCount === 3
        ? 'grid-cols-3'
        : 'grid-cols-2'
    : 'grid-cols-1';

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={scheduleOpen}
        onFocus={scheduleOpen}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            scheduleClose();
          }
        }}
        aria-haspopup={hasSections ? 'true' : undefined}
        aria-expanded={hasSections ? isOpen : undefined}
        className={`inline-flex items-center text-sm font-medium tracking-wide uppercase rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent relative group ${
          isOpen ? 'text-accent' : 'text-white/80 hover:text-accent'
        }`}
      >
        {item.label}
        {/* Active gold underline indicator */}
        <span
          className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-accent rounded-full motion-safe:transition-all motion-safe:duration-200 ${
            isOpen ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />
      </button>

      {hasSections && (
        <div
          role="menu"
          aria-label={`${item.label} submenu`}
          aria-hidden={!isOpen}
          className={`absolute top-full ${alignClass} pt-4 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
          }`}
          style={{ transformOrigin: 'top center' }}
        >
          <div className={`bg-surface rounded-xl shadow-2xl border border-border overflow-hidden ${panelWidth}`}>
            {/* Top accent bar */}
            <div className="h-0.5 bg-accent" />

            <div className={`grid ${gridCols} gap-0 divide-x divide-border`}>
              {item.sections!.map((section) => (
                <div key={section.title} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {section.icon && (
                      <span className="text-accent">{section.icon}</span>
                    )}
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      {section.title}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {section.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        role="menuitem"
                        tabIndex={isOpen ? 0 : -1}
                        onClick={onClose}
                        className="block px-3 py-2 rounded-lg hover:bg-accent-dark/5 transition-colors group/link focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px] focus-visible:rounded-lg"
                      >
                        <span className="text-sm font-medium text-text-primary group-hover/link:text-accent-dark transition-colors">
                          {link.label}
                        </span>
                        {link.desc && (
                          <span className="block text-xs text-text-muted mt-0.5">{link.desc}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile accordion item                                              */
/* ------------------------------------------------------------------ */

function MobileNavItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!item.sections) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="text-white/80 hover:text-accent px-3 py-2.5 rounded-lg hover:bg-white/5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between text-white/80 hover:text-accent px-3 py-2.5 rounded-lg hover:bg-white/5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {item.label}
      </button>

      {/* Smooth height accordion via grid rows */}
      <div
        role="region"
        aria-label={`${item.label} links`}
        className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="ml-3 pl-3 border-l border-white/10 mt-1 mb-2 space-y-1">
            {item.sections.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 py-1.5">
                  {section.title}
                </p>
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={onNavigate}
                    tabIndex={expanded ? 0 : -1}
                    className="block text-white/60 hover:text-accent text-sm px-3 py-2 rounded-lg hover:bg-white/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {link.label}
                    {link.desc && (
                      <span className="block text-xs text-white/30 mt-0.5">{link.desc}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar dropdown (authenticated desktop)                            */
/* ------------------------------------------------------------------ */

function AvatarDropdown({
  initials,
  onLogout,
}: {
  initials: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="text-accent text-sm font-semibold">{initials}</span>
      </button>

      <div
        role="menu"
        aria-label="Account submenu"
        aria-hidden={!open}
        className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden motion-safe:transition-all motion-safe:duration-200 ${
          open
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
        style={{ transformOrigin: 'top right' }}
      >
        <Link
          href="/dashboard"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-sm text-text-primary hover:bg-accent-dark/5 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/dashboard/profile"
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className="block px-4 py-2.5 text-sm text-text-primary hover:bg-accent-dark/5 transition-colors"
        >
          Profile
        </Link>
        <div className="border-t border-border" />
        <button
          role="menuitem"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            onLogout();
            setOpen(false);
          }}
          className="block w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-accent-dark/5 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Navbar                                                        */
/* ------------------------------------------------------------------ */

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state: RootState) => state.ui.mobileMenuOpen);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const scrolled = useScrolled(20);

  // Touch swipe tracking for mobile drawer
  const touchStartX = useRef<number | null>(null);

  const handleNavigate = useCallback(() => {
    dispatch(closeMobileMenu());
    setOpenDropdown(null);
  }, [dispatch]);

  // Global Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdown) setOpenDropdown(null);
        if (mobileMenuOpen) dispatch(closeMobileMenu());
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [openDropdown, mobileMenuOpen, dispatch]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Swipe-to-close handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 80) {
        dispatch(closeMobileMenu());
      }
      touchStartX.current = null;
    },
    [dispatch],
  );

  // Viewport-aware dropdown alignment
  const getAlign = (index: number): 'left' | 'center' | 'right' => {
    if (index <= 1) return 'left';
    if (index >= NAV_ITEMS.length - 1) return 'right';
    return 'center';
  };

  const initials = user?.first_name?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <nav
        className={`sticky top-0 z-50 motion-safe:transition-all motion-safe:duration-300 ${
          scrolled
            ? 'bg-primary/85 backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-primary border-b border-transparent'
        }`}
        aria-label="Main navigation"
      >
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20">
          <div
            className={`flex justify-between items-center motion-safe:transition-all motion-safe:duration-300 ${
              scrolled ? 'h-16' : 'h-20'
            }`}
          >
            {/* Logo — flush left */}
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded -ml-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              onClick={() => setOpenDropdown(null)}
            >
              <Image
                src="/images/logo-white.png"
                alt="AncerLarins"
                width={36}
                height={36}
                className={`h-auto motion-safe:transition-all motion-safe:duration-300 ${scrolled ? 'w-8' : 'w-9'}`}
              />
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-accent">Ancer</span>
                <span className="text-white">Larins</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-5 xl:gap-7">
              {NAV_ITEMS.map((item, index) => (
                <NavDropdown
                  key={item.label}
                  item={item}
                  isOpen={openDropdown === item.label}
                  onOpen={() => setOpenDropdown(item.label)}
                  onClose={() => setOpenDropdown(null)}
                  align={getAlign(index)}
                />
              ))}
            </div>

            {/* Desktop Auth — flush right */}
            <div className="hidden lg:flex items-center gap-2 -mr-1">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <div className="w-px h-5 bg-white/10 mx-1" />
                  <AvatarDropdown initials={initials} onLogout={logout} />
                </>
              ) : (
                <>
                  <div className="w-px h-5 bg-white/10 mx-1.5" />
                  <Link
                    href="/login"
                    className="text-white/80 hover:text-white transition-colors text-sm font-medium rounded-lg px-4 py-2 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-accent text-primary px-5 py-2 rounded-lg hover:bg-accent-dark transition-colors text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Animated hamburger button */}
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="lg:hidden text-white p-2 -mr-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent relative w-10 h-10 flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close' : 'Open'} menu</span>
              <span
                aria-hidden="true"
                className={`absolute w-5 h-0.5 bg-current motion-safe:transition-all motion-safe:duration-300 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute w-5 h-0.5 bg-current motion-safe:transition-all motion-safe:duration-300 ${
                  mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute w-5 h-0.5 bg-current motion-safe:transition-all motion-safe:duration-300 ${
                  mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Overlay to close dropdowns when clicking outside */}
        {openDropdown && (
          <div
            className="fixed inset-0 z-[-1] hidden lg:block"
            onClick={() => setOpenDropdown(null)}
            aria-hidden="true"
          />
        )}
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/*  Mobile drawer — always mounted, slides via translate-x          */}
      {/* ---------------------------------------------------------------- */}

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden motion-safe:transition-opacity motion-safe:duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => dispatch(closeMobileMenu())}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label="Mobile navigation"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-primary z-50 lg:hidden flex flex-col motion-safe:transition-transform motion-safe:duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <Link
            href="/"
            onClick={handleNavigate}
            className="flex items-center gap-2"
          >
            <Image src="/images/logo-white.png" alt="AncerLarins" width={28} height={28} className="h-7 w-auto" />
            <span className="text-lg font-bold text-accent">Ancer</span>
            <span className="text-lg font-bold text-white">Larins</span>
          </Link>
          <button
            onClick={() => dispatch(closeMobileMenu())}
            className="text-white/60 hover:text-white p-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable nav items */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <MobileNavItem key={item.label} item={item} onNavigate={handleNavigate} />
          ))}

          <div className="border-t border-white/10 my-3" />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-white/60 text-sm">Dark Mode</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Footer CTA buttons */}
        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                onClick={handleNavigate}
                className="block w-full text-center bg-accent text-primary px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  handleNavigate();
                }}
                className="block w-full text-center text-white/60 hover:text-white px-4 py-2.5 rounded-lg hover:bg-white/5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={handleNavigate}
                className="block w-full text-center text-white/80 hover:text-white px-4 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={handleNavigate}
                className="block w-full text-center bg-accent text-primary px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-dark transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

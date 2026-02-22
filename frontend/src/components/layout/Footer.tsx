'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const TRUST_ITEMS = [
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    text: 'Verified Agents',
  },
  {
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    text: 'Secure Platform',
  },
  {
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    text: 'Free to List',
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-primary text-white/70 relative" role="contentinfo">
      {/* Gold gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-dark/50 to-transparent" />

      {/* Trust bar */}
      <div className="border-b border-white/[0.06]">
        <div className="container-app py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUST_ITEMS.map((item) => (
              <div key={item.text} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-dark/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand + Social */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/images/logo-white.png" alt="AncerLarins" width={36} height={36} className="h-9 w-auto" />
              <span className="text-2xl font-bold text-accent">Ancer</span>
              <span className="text-2xl font-bold text-white">Larins</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5">
              Lagos-focused real estate platform. Find verified properties
              and connect with trusted agents across the city.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {/* Instagram */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-accent-dark/20 flex items-center justify-center transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 text-white/60 hover:text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* X/Twitter */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-accent-dark/20 flex items-center justify-center transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4 text-white/60 hover:text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-accent-dark/20 flex items-center justify-center transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 text-white/60 hover:text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] hover:bg-accent-dark/20 flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4 text-white/60 hover:text-accent" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold text-accent text-sm uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/properties?listing_type=rent" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Rent</Link></li>
              <li><Link href="/properties?listing_type=sale" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Buy</Link></li>
              <li><Link href="/agents" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Find Agents</Link></li>
              <li><Link href="/properties" className="hover:text-accent hover:underline underline-offset-2 transition-colors">All Properties</Link></li>
            </ul>
          </div>

          {/* Popular Areas */}
          <div>
            <h4 className="font-semibold text-accent text-sm uppercase tracking-wider mb-4">Areas</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/properties?area=lekki" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Lekki</Link></li>
              <li><Link href="/properties?area=ikoyi" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Ikoyi</Link></li>
              <li><Link href="/properties?area=victoria-island" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Victoria Island</Link></li>
              <li><Link href="/properties?area=ikeja" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Ikeja</Link></li>
              <li><Link href="/properties?area=yaba" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Yaba</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-accent text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-accent hover:underline underline-offset-2 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Blog</Link></li>
              <li><Link href="/terms" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-accent hover:underline underline-offset-2 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h4 className="font-semibold text-accent text-sm uppercase tracking-wider mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Get the latest listings and market insights delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 bg-white/[0.06] border border-white/[0.12] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-dark/50 transition-colors"
                required
              />
              <button
                type="submit"
                className="bg-accent-dark hover:bg-accent text-primary px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p className="text-sm text-success mt-2 animate-fade-in">Thanks for subscribing!</p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} AncerLarins. All rights reserved.</p>
          <p className="text-xs text-white/40">Real Estate, Lagos Nigeria</p>
        </div>
      </div>
    </footer>
  );
}

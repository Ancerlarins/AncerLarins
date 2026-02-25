import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'List Your Property Free | AncerLarins',
  description: 'List your luxury property on AncerLarins for free. Reach qualified buyers across Lagos and Nigeria.',
  openGraph: {
    title: 'List Your Property Free | AncerLarins',
    description: 'List your luxury property on AncerLarins for free. Reach qualified buyers across Lagos and Nigeria.',
  },
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <section className="bg-primary py-20 md:py-28">
          <div className="container-app text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              List Your Property — Completely Free
            </h1>
            <p className="text-white/60 text-lg mb-8">
              AncerLarins is free for all agents. No listing fees, no subscriptions, no hidden charges.
              List your luxury properties and reach qualified buyers across Lagos and Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register?role=agent"
                className="bg-accent text-primary px-8 py-3 rounded-xl font-semibold text-sm hover:bg-accent-dark transition-colors"
              >
                Create Agent Account
              </Link>
              <Link
                href="/properties"
                className="border border-white/20 text-white/80 px-8 py-3 rounded-xl font-semibold text-sm hover:border-white/40 hover:text-white transition-colors"
              >
                Browse Properties
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { API_URL } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  author?: { id: string; full_name: string; avatar_url: string | null };
  meta_title: string | null;
  meta_description: string | null;
  view_count: number;
  published_at: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  guide: 'Guide',
  market_report: 'Market Report',
  tips: 'Tips',
  news: 'News',
  area_spotlight: 'Area Spotlight',
};

async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  try {
    const res = await fetch(`${API_URL}/blog-posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: 'Article Not Found | AncerLarins' };
  }

  const title = post.meta_title || `${post.title} | AncerLarins Blog`;
  const description = post.meta_description || post.excerpt || post.content.slice(0, 155);

  return {
    title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `https://ancerlarins.com/blog/${post.slug}`,
      ...(post.cover_image_url && { images: [{ url: post.cover_image_url }] }),
      ...(post.published_at && { publishedTime: post.published_at }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 155),
    url: `https://ancerlarins.com/blog/${post.slug}`,
    ...(post.cover_image_url && { image: post.cover_image_url }),
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.author && {
      author: {
        '@type': 'Person',
        name: post.author.full_name,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'AncerLarins',
      url: 'https://ancerlarins.com',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary py-10 md:py-14">
          <div className="container-app max-w-3xl">
            <nav className="flex items-center gap-1.5 text-sm text-white/40 mb-4">
              <Link href="/" className="hover:text-white/60">Home</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <Link href="/blog" className="hover:text-white/60">Blog</Link>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-white/70 truncate">{post.title}</span>
            </nav>

            <span className="inline-block bg-accent/20 text-accent text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {CATEGORY_LABELS[post.category] || post.category}
            </span>

            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{post.title}</h1>

            <div className="flex items-center gap-3 mt-4">
              {post.author && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-sm font-bold">{post.author.full_name.charAt(0)}</span>
                  </div>
                  <span className="text-white/70 text-sm">{post.author.full_name}</span>
                </div>
              )}
              {post.published_at && (
                <span className="text-white/40 text-sm">
                  {new Date(post.published_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              <span className="text-white/30 text-sm">{post.view_count.toLocaleString()} views</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container-app max-w-3xl py-8 md:py-12">
          {post.cover_image_url && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <article className="prose prose-lg max-w-none text-text-primary prose-headings:text-text-primary prose-a:text-primary prose-strong:text-text-primary">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
          </article>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="text-xs bg-surface border border-border px-3 py-1.5 rounded-full text-text-secondary hover:bg-background transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Back */}
          <div className="mt-8">
            <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Blog
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

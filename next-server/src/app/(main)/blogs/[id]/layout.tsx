import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const base = 'https://www.devsonghee.com';
  try {
    const res = await fetch(`/api/blogs/${params.id}`, { next: { revalidate: 0 } });
    if (!res.ok) return {};
    const { blog } = await res.json();
    if (!blog) return {};
    const description = (blog.content as string || '').replace(/<[^>]*>/g, '').slice(0, 150);
    return {
      metadataBase: new URL(base),
      title: blog.title,
      description,
      openGraph: {
        title: blog.title,
        description,
        url: `${base}/blogs/${params.id}`,
        type: 'article',
      },
      keywords: [
        'React Query',
        '블로그',
        'Next.js',
        '프론트엔드 블로그',
        '비동기 캐싱',
      ],
    };
  } catch {
    return {};
  }
}

export default function BlogIdLayout({ children }: Props) {
  return <>{children}</>;
}
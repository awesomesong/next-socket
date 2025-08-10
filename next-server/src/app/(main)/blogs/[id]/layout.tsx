import { cache } from 'react';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// params를 캐시하여 한 번만 해결하도록 함
const getParams = cache(async (params: Promise<{ id: string }>) => {
  return await params;
});

// 블로그 데이터를 가져오는 함수 (캐시 적용)
const getBlogData = cache(async (id: string) => {
  try {
    const base = 'https://www.devsonghee.com';
    const res = await fetch(`${base}/api/blogs/${id}`, { 
      next: { revalidate: 3600 } // 1시간 캐시
    });
    
    if (!res.ok) {
      return null;
    }
    
    const { blog } = await res.json();
    return blog;
  } catch (error) {
    console.error('블로그 데이터 가져오기 오류:', error);
    return null;
  }
});

// 동기적으로 메타데이터를 생성하는 함수
const createMetadata = async (id: string) => {
  const base = 'https://www.devsonghee.com';
  
  // 블로그 데이터 가져오기
  const blog = await getBlogData(id);
  
  if (!blog) {
    // 블로그를 찾을 수 없는 경우 기본 메타데이터
    return {
      title: `Blog ${id}`,
      description: `Blog post with ID: ${id}`,
      openGraph: {
        title: `Blog ${id}`,
        description: `Blog post with ID: ${id}`,
        url: `${base}/blogs/${id}`,
        type: 'article',
      },
    };
  }
  
  // HTML 태그 제거하고 텍스트만 추출
  const contentText = blog.content?.replace(/<[^>]*>/g, '') || '';
  const description = contentText.slice(0, 150) + (contentText.length > 150 ? '...' : '');
  
  // 이미지 URL 추출 (JSON 파싱)
  let imageUrl = '';
  try {
    if (blog.image) {
      const imageData = JSON.parse(blog.image);
      if (imageData && imageData.length > 0) {
        imageUrl = imageData[0].url;
      }
    }
  } catch (error) {
    console.error('이미지 파싱 오류:', error);
  }
  
  const metadata = {
    metadataBase: new URL(base),
    title: blog.title || `Blog ${id}`,
    description,
    keywords: [
      '블로그',
      '개발',
      '프로그래밍',
      '기술',
      blog.title,
      ...(blog.author?.name ? [blog.author.name] : [])
    ],
    authors: blog.author?.name ? [{ name: blog.author.name }] : undefined,
    openGraph: {
      title: blog.title || `Blog ${id}`,
      description,
      url: `${base}/blogs/${id}`,
      type: 'article',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
      ...(blog.author?.name && { authors: [blog.author.name] }),
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title || `Blog ${id}`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
  
  return metadata;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await getParams(params);
  return await createMetadata(id);
}

export default async function BlogLayout({ children, params }: Props) {
  const { id } = await getParams(params);
  
  return <>{children}</>;
}
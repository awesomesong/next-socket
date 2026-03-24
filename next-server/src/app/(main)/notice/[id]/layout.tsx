import { cache } from 'react';

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// params를 캐시하여 한 번만 해결하도록 함
const getParams = cache(async (params: Promise<{ id: string }>) => {
  return await params;
});

// 공지사항 데이터를 가져오는 함수 (캐시 적용)
const getNoticData = cache(async (id: string) => {
  try {
    const base = 'https://www.devsonghee.com';
    const res = await fetch(`${base}/api/notice/${id}`, { 
      next: { revalidate: 3600 } // 1시간 캐시
    });
    
    if (!res.ok) {
      return null;
    }
    
    const { notice } = await res.json();
    return notice;
  } catch {
    return null;
  }
});

// 동기적으로 메타데이터를 생성하는 함수
const createMetadata = async (id: string) => {
  const base = 'https://www.devsonghee.com';
  
  // 공지사항 데이터 가져오기
  const notice = await getNoticData(id);
  
  if (!notice) {
    // 공지사항를 찾을 수 없는 경우 기본 메타데이터
    return {
      title: `Notice ${id}`,
      description: `Notice post with ID: ${id}`,
      openGraph: {
        title: `Notice ${id}`,
        description: `Notice post with ID: ${id}`,
        url: `${base}/notice/${id}`,
        type: 'article',
      },
    };
  }
  
  // HTML 태그 제거하고 텍스트만 추출
  const contentText = notice.content?.replace(/<[^>]*>/g, '') || '';
  const description = contentText.slice(0, 150) + (contentText.length > 150 ? '...' : '');
  
  // 이미지 URL 추출 (저장된 첫 번째 이미지 사용)
  const imageUrl = notice.image?.[0] || '';
  
  const metadata = {
    metadataBase: new URL(base),
    title: notice.title || `Notice ${id}`,
    description,
    keywords: [
      '공지사항',
      'Scent Memories 공지사항',
      '사용안내',
      '서비스 소개',
      notice.title,
      ...(notice.author?.name ? [notice.author.name] : [])
    ],
    authors: notice.author?.name ? [{ name: notice.author.name }] : undefined,
    openGraph: {
      title: notice.title || `Notice ${id}`,
      description,
      url: `${base}/notice/${id}`,
      type: 'article',
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630 }] }),
      ...(notice.author?.name && { authors: [notice.author.name] }),
      publishedTime: notice.createdAt,
      modifiedTime: notice.updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: notice.title || `Notice ${id}`,
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

export default async function NoticeLayout({ children }: Props) {
  
  return <>{children}</>;
}
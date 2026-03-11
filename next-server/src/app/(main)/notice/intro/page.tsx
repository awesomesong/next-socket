import type { Metadata } from 'next';
import NoticeIntroContent, {
  type IntroStep,
  type FragranceGuideStep,
} from './NoticeIntroContent';

export const metadata: Metadata = {
  title: 'Scent Memories 소개 및 이용 안내',
  description:
    'Scent Memories는 향기를 수집하고 기록하는 프론트엔드 포트폴리오 사이트입니다. 서비스 소개와 이용 방법을 안내합니다.',
};

const features = [
  { icon: '🌸', title: '향수 컬렉션', desc: '다양한 향수를 카드 형태로 탐색하고 향조·계절·지속력 등 상세 정보를 확인합니다.' },
  { icon: '⭐', title: '리뷰 & 별점', desc: '향수에 대한 개인 감상과 별점을 남기고, 다른 사용자의 리뷰도 열람할 수 있습니다.' },
  { icon: '📋', title: '공지사항', desc: '서비스 안내와 업데이트 내용을 게시합니다. 로그인한 사용자는 글 작성과 댓글이 가능합니다.' },
  { icon: '💬', title: '실시간 채팅', desc: 'Socket.io 기반의 실시간 채팅으로 다른 사용자와 향수에 대한 이야기를 나눌 수 있습니다.' },
  { icon: '🤖', title: 'AI 향기 대화', desc: 'Claude API를 활용한 AI 어시스턴트와 향수 추천 및 향기에 대한 대화를 즐길 수 있습니다.' },
  { icon: '🌙', title: '다크 모드', desc: '라이트·다크 테마를 자유롭게 전환합니다. 시스템 설정과 연동되며 언제든지 변경 가능합니다.' },
];

const steps: IntroStep[] = [
  { step: '01', title: '로그인 · 데모 체험', desc: '오른쪽 상단의 로그인 버튼을 클릭합니다. Google 또는 카카오 계정으로 간편하게 로그인할 수 있습니다. 계정이 없어도 데모 계정으로 회원가입 없이 모든 기능을 바로 체험할 수 있습니다.', image: { src: '/image/notice/login/login_demo.png', alt: '로그인 화면 — 데모 계정 체험 가능' } },
  { step: '02', title: '향수 탐색', desc: '상단 "Fragrance" 메뉴에서 향수 컬렉션을 탐색합니다. 카드를 클릭하면 향조, 계절감, 지속력 등 상세 정보와 다른 사용자의 리뷰를 확인할 수 있습니다.' },
  { step: '03', title: '리뷰 작성', desc: '향수 상세 페이지에서 별점과 나만의 감상을 기록합니다. 작성한 리뷰는 언제든지 수정하거나 삭제할 수 있습니다.' },
  { step: '04', title: '실시간 채팅', desc: '화면 우측 하단의 채팅 아이콘을 클릭하거나 상단 "Chat" 메뉴를 통해 채팅 기능에 접근합니다.' },
  { step: '05', title: '프로필 확인', desc: '상단 "Profile" 메뉴에서 내가 작성한 리뷰와 활동 내역을 한눈에 확인할 수 있습니다.' },
];

const techStack = [
  { category: 'Framework', items: ['Next.js 15 (App Router)', 'React 19'] },
  { category: 'Language', items: ['TypeScript'] },
  { category: 'Styling', items: ['Tailwind CSS v4', 'HeroUI'] },
  { category: 'Backend', items: ['Prisma ORM', 'PostgreSQL'] },
  { category: 'Data Fetching', items: ['TanStack Query (React Query)', 'GraphQL'] },
  { category: 'Real-time', items: ['Socket.io'] },
  { category: 'Auth', items: ['NextAuth.js (Google · Kakao)'] },
  { category: 'Media', items: ['Cloudinary'] },
  { category: '3D · Animation', items: ['Three.js'] },
  { category: 'AI', items: ['Claude API', 'OpenAI Vision (이미지 분석)'] },
];

const fragranceGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '향수 정보 추가 버튼 위치 확인',
    desc: '메인 페이지(첫 화면)에서 "향수 정보 추가" 버튼을 확인합니다. 데스크탑에서는 목록 우측 상단에, 모바일에서는 갤러리 제목 아래(필터 영역 위)에 있으며, 데모 계정이나 등록된 이메일(Google·카카오)로 로그인한 경우에만 표시됩니다.',
    webImg: { src: '/image/notice/fragrance/main_fragrance_web.png', alt: '메인 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/main_fragrance_mobile.png', alt: '메인 페이지 — 모바일' },
  },
  {
    step: '02',
    title: '향수 정보 추가 페이지',
    desc: '메인 페이지에서 "향수 정보 추가" 버튼을 누르면 향수 등록 폼이 열립니다. 이미지 영역에 파일을 드래그 앤 드롭하거나 클릭해 여러 장을 한 번에 업로드할 수 있으며, 업로드 후에도 "+ 이미지 추가" 버튼으로 이미지를 계속 더할 수 있습니다. 업로드가 완료되면 AI가 이미지를 분석해 브랜드·이름·설명 등을 자동으로 채워 주며, 결과에 따라 일부 항목은 직접 입력하거나 수정해야 할 수 있습니다. 필수 입력 항목은 브랜드, 향수 이름, URL 슬러그(소문자와 언더바만)이고 제품 설명과 노트(TOP·HEART·BASE)는 선택입니다. 입력을 마친 뒤 "향수 등록하기"로 제출하거나 "취소"를 눌러 폼을 닫을 수 있습니다. 데스크탑/모바일 환경에 따라 이미지 영역과 버튼 위치가 다르게 보일 수 있습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web01.png', alt: '향수 정보 추가 버튼 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile01.png', alt: '향수 정보 추가 버튼 — 모바일' },
  },
  {
    step: '03',
    title: '이미지 업로드 & AI 자동 분석',
    desc: '향수 이미지를 선택하면 먼저 Cloudinary에 업로드되어 공개 접근 가능한 이미지 URL이 생성됩니다. 이 URL은 Next.js API Route(/api/fragrance/analyze)로 전달되고, 서버는 해당 URL과 분석 프롬프트를 OpenAI Vision(gpt-4o)에 전송합니다. gpt-4o는 이미지를 직접 보고 브랜드명·설명·향 노트 등의 정보를 JSON 형식으로 반환하며, 클라이언트는 이를 받아 React state(formData)의 비어 있는 필드에만 자동으로 채워 넣습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web02.png', alt: 'AI 이미지 분석 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile02.png', alt: 'AI 이미지 분석 완료 — 모바일' },
  },
  {
    step: '04',
    title: '향수 정보 입력 및 수정',
    desc: 'AI가 자동으로 채운 브랜드, 향수 이름, URL 슬러그, 제품 상세 설명, 노트 정보(TOP·HEART·BASE)를 확인합니다. 분석되지 않은 항목은 직접 입력하고, 잘못 채워진 내용은 수정합니다. 모든 필수 항목(브랜드, 향수 이름, URL 슬러그)을 채운 뒤 하단의 "향수 등록하기" 버튼을 클릭하면 향수가 등록됩니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web03.png', alt: '향수 정보 입력 폼 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile03.png', alt: '향수 정보 입력 폼 — 모바일' },
  },
  {
    step: '05',
    title: '등록 완료 & 상세 페이지 확인',
    desc: '등록이 완료되면 해당 향수의 상세 페이지로 이동합니다. 입력한 정보와 향 노트를 확인할 수 있으며, 본인이 등록한 향수인 경우에만 우측 상단의 "수정"·"삭제" 버튼으로 내용을 수정하거나 삭제할 수 있습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_save_web.png', alt: '향수 상세 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_save_mobile.png', alt: '향수 상세 페이지 — 모바일' },
  },
];

export default function IntroPage() {
  return (
    <NoticeIntroContent
      features={features}
      steps={steps}
      techStack={techStack}
      fragranceGuideSteps={fragranceGuideSteps}
    />
  );
}

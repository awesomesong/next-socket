import type { Metadata } from 'next';
import GuideContent, {
  type loginStep,
  type FragranceGuideStep,
  type MainGalleryGuide,
} from '@/src/app/components/GuideContent';

export const metadata: Metadata = {
  title: 'Scent Memories 소개 및 이용 안내',
  description:
    'Scent Memories는 향수를 수집하고 기록하는 프론트엔드 포트폴리오 사이트입니다. 서비스 소개와 이용 방법을 안내합니다.',
  openGraph: {
    title: 'Scent Memories 소개 및 이용 안내',
    description:
      'Scent Memories는 향수를 수집하고 기록하는 프론트엔드 포트폴리오 사이트입니다. 서비스 소개와 이용 방법을 안내합니다.',
    url: "/notice",
    images: [
      {
        url: '/image/metadata/guide.png',
        width: 1200,
        height: 822,
        alt: 'Scent Memories 서비스 소개',
      },
    ],
  },
};

const features = [
  {
    icon: '🌸',
    title: '향수 갤러리',
    desc: '브랜드·이름·이미지로 향수를 탐색하고 직접 등록·관리할 수 있는 메인 갤러리입니다. 무한 스크롤(Infinite Query)로 자연스럽게 이어지며, 브랜드 필터로 원하는 향수만 골라볼 수 있습니다.',
  },
  {
    icon: '📷',
    title: 'AI 이미지 분석 자동 입력',
    desc: '향수 이미지를 업로드하면 OpenAI GPT-4o Vision으로 브랜드·향수 이름·설명·향 노트를 분석해, 향수 등록 폼을 자동으로 채워 줍니다. 누락되거나 부정확한 항목만 직접 수정하면 돼서, 신규로 등록하는 절차가 한층 간소화됩니다.',
  },
  {
    icon: '⭐',
    title: '리뷰',
    desc: '향수 상세 페이지에서 리뷰를 작성하고 수정·삭제할 수 있습니다. 무한 스크롤로 다른 사용자의 리뷰도 이어서 볼 수 있으며, 새로 등록된 리뷰는 실시간으로 목록에 반영됩니다.',
  },
  {
    icon: '📋',
    title: '공지사항',
    desc: '서비스 소개, 이용 방법, 업데이트 내역을 공지로 안내합니다. WYSIWYG 에디터(Quill)로 이미지와 다양한 텍스트 스타일이 포함된 글을 작성할 수 있고, 댓글로 의견을 남길 수 있습니다. 업로드한 이미지는 Cloudinary CDN으로 제공되며, DOMPurify로 악성 스크립트를 차단해 안전하게 표시됩니다.',
  },
  {
    icon: '💬',
    title: '실시간 채팅',
    desc: 'Socket.IO 기반 1:1·그룹 채팅으로 다른 사용자와 실시간 채팅이 가능합니다. 상대방이 오프라인 상태여도 메시지는 서버에 보관(최대 24시간)되어 재접속 시 자동으로 전달됩니다.',
  },
  {
    icon: '🤖',
    title: 'AI 어시스턴트',
    desc: 'GPT-4o 기반으로 AI에게 향수 추천이나 궁금한 점을 물어볼 수 있습니다. 답변은 타이핑되는 것처럼 실시간 스트리밍(SSE)으로 출력되어 기다림 없이 자연스럽게 대화할 수 있습니다.',
  },
  {
    icon: '✨',
    title: '3D 배경',
    desc: '메인 화면에 Three.js 기반 인터랙티브 3D 은하수 배경을 구현했습니다. 스크롤 하면 은하수 속으로 빨려 들어가는 듯한 부드러운 확대 효과를 경험할 수 있습니다.',
  },
  {
    icon: '🌙',
    title: '다크 모드 및 반응형',
    desc: '라이트/다크 모드를 지원하고, 데스크탑·태블릿·모바일 환경에 최적화된 반응형 웹 레이아웃을 구현했습니다.',
  },
  {
    icon: '🔐',
    title: '간편 로그인 & 데모 계정',
    desc: 'Google·카카오 OAuth와 이메일/비밀번호(Credentials) 로그인을 지원하며, 별도 회원가입 없이 바로 체험할 수 있는 데모 계정을 제공합니다. 모든 기능은 NextAuth 기반 JWT 세션으로 보호되어 안전하게 이용할 수 있습니다.',
  },
];

const steps: loginStep[] = [
  { step: '01', title: '로그인 · 데모 체험', desc: '데모 계정 버튼을 누르면 별도 가입 없이 바로 이용할 수 있으며, Google·카카오 소셜 로그인 또는 이메일/비밀번호로도 로그인할 수 있습니다.', image: { src: '/image/notice/auth/signin.png', alt: '로그인 화면' } },
  { step: '02', title: '계정 등록(회원가입)', desc: '이메일과 비밀번호를 입력해 계정을 만들 수 있습니다.', image: { src: '/image/notice/auth/signup.png', alt: '계정등록(회원가입) 화면' } },
];

const techStack = [
  { category: 'Framework', items: ['Next.js 15 (App Router)', 'React 19'] },
  { category: 'Language', items: ['TypeScript'] },
  { category: 'Styling', items: ['Tailwind CSS v3', 'HeroUI', 'next-themes'] },
  { category: 'Backend', items: ['Prisma ORM', 'PostgreSQL', 'Express (custom server)'] },
  { category: 'Data Fetching', items: ['TanStack Query (React Query)'] },
  { category: 'State · Forms', items: ['Zustand', 'React Hook Form'] },
  { category: 'Real-time', items: ['Socket.io'] },
  {
    category: 'Auth',
    items: [
      'NextAuth.js (Google · Kakao · Credentials)',
      'Prisma Adapter (@auth/prisma-adapter)',
      'bcryptjs',
    ],
  },
  { category: 'Media', items: ['Cloudinary'] },
  { category: '3D · Animation', items: ['Three.js', 'Framer Motion'] },
  {
    category: 'Editor · UI',
    items: ['React Quill', 'react-select', 'DOMPurify', 'react-hot-toast'],
  },
  { category: 'Utilities', items: ['Day.js', 'react-intersection-observer'] },
  { category: 'AI', items: ['OpenAI GPT-4', 'OpenAI Vision (이미지 분석)'] },
];

const fragranceGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '향수 정보 추가 버튼의 위치 확인',
    desc: '메인 페이지(첫 화면)에서 "향수 정보 추가" 버튼을 확인합니다. 데스크탑에서는 목록 우측 상단에, 모바일에서는 갤러리 제목 아래(필터 영역 위)에 있으며, 데모 계정이나 등록된 이메일 및 소셜로그인(Google·카카오)으로 로그인한 경우에만 표시됩니다.',
    webImg: { src: '/image/notice/fragrance/main_fragrance_web.png', alt: '메인 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/main_fragrance_mobile.png', alt: '메인 페이지 — 모바일' },
  },
  {
    step: '02',
    title: '향수 정보 추가 페이지',
    desc: '이미지 영역에 파일을 드래그 앤 드롭하거나 클릭해 여러 장을 한 번에 업로드할 수 있으며, 업로드 후에도 "+ 이미지 추가" 버튼으로 이미지를 추가할 수 있습니다. 업로드가 완료되면 AI가 이미지를 분석해 브랜드·이름·설명·노트를 자동으로 채워주며, 결과에 따라 일부 항목은 직접 입력하거나 수정해야 할 수 있습니다. 필수 입력 항목은 브랜드, 향수 이름, 제품 설명이고, 노트(TOP·HEART·BASE)는 선택입니다. 입력을 마친 뒤 "향수 등록하기"로 제출하거나 "취소"를 눌러 해당 페이지를 나갈 수 있습니다. 데스크탑/모바일 환경에 따라 이미지 영역과 버튼 위치가 다르게 보일 수 있습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web01.png', alt: '향수 정보 추가 버튼 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile01.png', alt: '향수 정보 추가 버튼 — 모바일' },
  },
  {
    step: '03',
    title: '이미지 업로드 & AI 자동 분석',
    desc: '향수 이미지를 선택하면 먼저 Cloudinary에 업로드되어 공개 접근 가능한 이미지 URL이 생성됩니다. 이 URL은 Next.js API Route(/api/fragrance/analyze)로 전달되고, 서버는 해당 URL과 분석 프롬프트를 OpenAI Vision(gpt-4o)에 전송합니다. gpt-4o는 이미지를 직접 보고 브랜드명과 향수 이름을 읽어내며, 이렇게 식별한 제품을 바탕으로 설명과 향 노트(TOP·HEART·BASE)를 모델이 가진 향수 지식에서 추론해 JSON 형식으로 반환합니다. 클라이언트는 이를 받아 React state(formData)의 비어 있는 필드에만 자동으로 채워 넣습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web02.png', alt: 'AI 이미지 분석 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile02.png', alt: 'AI 이미지 분석 완료 — 모바일' },
  },
  {
    step: '04',
    title: '향수 정보 입력 및 수정',
    desc: 'AI가 자동으로 채운 브랜드, 향수 이름, 제품 상세 설명, 노트 정보(TOP·HEART·BASE)를 확인합니다. 분석되지 않은 항목은 직접 입력하고, 잘못 채워진 내용은 수정합니다. 모든 필수 항목(브랜드, 향수 이름, 제품 상세 설명)을 채운 뒤 하단의 "향수 등록하기" 버튼을 클릭하면 향수가 등록됩니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_create_web03.png', alt: '향수 정보 입력 폼 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_create_mobile03.png', alt: '향수 정보 입력 폼 — 모바일' },
  },
  {
    step: '05',
    title: '등록 완료 & 상세 페이지 확인',
    desc: '등록이 완료되면 해당 향수의 상세 페이지로 이동합니다. 입력한 정보를 확인할 수 있으며, 본인이 등록한 향수인 경우에만 우측 상단의 수정·삭제 버튼으로 내용을 수정하거나 삭제할 수 있습니다.',
    webImg: { src: '/image/notice/fragrance/fragrance_save_web.png', alt: '향수 상세 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance/fragrance_save_mobile.png', alt: '향수 상세 페이지 — 모바일' },
  },
];

const fragranceDetailSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '향수 카드 클릭 → 상세 페이지 진입',
    desc: '갤러리에서 원하는 향수 카드를 클릭하면 해당 향수의 상세 페이지로 이동합니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web01.png', alt: '향수 상세 페이지 진입 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile01.png', alt: '향수 상세 페이지 진입 — 모바일' },
  },
  {
    step: '02',
    title: '비로그인 상태 — 리뷰 입력 칸 미표시',
    desc: '로그인하지 않은 상태에서는 향수 상세 정보(이미지·브랜드·이름·설명·노트)만 확인할 수 있습니다. 우측 상단에는 갤러리로 돌아가는 목록 버튼만 표시되며, 리뷰 입력 칸은 나타나지 않습니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web02.png', alt: '비로그인 상태 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile02.png', alt: '비로그인 상태 — 모바일' },
  },
  {
    step: '03',
    title: '로그인 상태 — 리뷰 입력 칸 & 수정·삭제 버튼 활성화',
    desc: '로그인하면 리뷰 섹션 상단에 "리뷰를 입력해 주세요." 입력 칸이 활성화됩니다. 해당 향수를 직접 등록한 사용자라면 우측 상단에 수정·삭제 버튼도 함께 표시됩니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web03.png', alt: '로그인 상태 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile03.png', alt: '로그인 상태 — 모바일' },
  },
  {
    step: '04',
    title: '리뷰 작성 & 제출',
    desc: '입력 칸에 감상을 작성하고 확인 버튼을 누르면 리뷰가 등록됩니다. 제출한 내용은 실시간으로 다른 사용자 화면에 즉시 반영됩니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web04.png', alt: '리뷰 작성 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile04.png', alt: '리뷰 작성 — 모바일' },
  },
  {
    step: '05',
    title: '리뷰 등록 완료 — 목록 반영',
    desc: '리뷰가 등록되면 리뷰 목록에 즉시 반영됩니다. 본인이 작성한 리뷰에는 수정·삭제 버튼이 함께 표시되며, 다른 사용자가 작성한 리뷰는 버튼 없이 내용만 표시됩니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web05.png', alt: '리뷰 등록 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile05.png', alt: '리뷰 등록 완료 — 모바일' },
  },
  {
    step: '06',
    title: '리뷰 수정',
    desc: '수정 버튼을 클릭하면 해당 리뷰 내용이 편집할 수 있는 입력창으로 전환되어서 수정할 수 있습니다. 내용을 변경한 뒤 저장 버튼을 누르면 수정이 완료되고, 취소 버튼을 누르면 원래 내용으로 돌아갑니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web06.png', alt: '리뷰 수정 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile06.png', alt: '리뷰 수정 — 모바일' },
  },
  {
    step: '07',
    title: '리뷰 수정 완료',
    desc: '수정한 내용이 리뷰 목록에 즉시 반영됩니다. 삭제 버튼을 누르면 해당 리뷰가 바로 제거되며, 수정·삭제 결과는 실시간으로 다른 사용자 화면에도 반영됩니다.',
    webImg: { src: '/image/notice/fragrance_detail/fragrance_detail_web07.png', alt: '리뷰 수정 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/fragrance_detail/fragrance_detail_mobile07.png', alt: '리뷰 수정 완료 — 모바일' },
  },
];

const chatMoveGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '상단 메뉴 및 아이콘을 통한 이동',
    desc: '상단 네비게이션의 "Chat"을 클릭해 채팅 멤버 목록으로 이동하거나, 화면 우측 하단의 채팅 아이콘을 클릭해 대화방 목록으로 바로 진입할 수 있습니다. 아이콘의 숫자 배지는 읽지 않은 메시지 수를 의미합니다.',
    webImg: { src: '/image/notice/chat/link/move_chat_web01.png', alt: '채팅 이동 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/link/move_chat_mobile01.png', alt: '채팅 이동 모바일 1 — 햄버거 메뉴' },
  },
  {
    step: '02',
    title: '모바일 환경에서 메뉴 열기',
    desc: '화면 좌측 상단의 햄버거 메뉴 아이콘을 눌러 메뉴를 펼친 뒤, 표시된 목록에서 "Chat"을 선택하면 채팅 화면으로 이동할 수 있습니다.',
    twinMobilePreview: true,
    webImg: { src: '/image/notice/chat/link/move_chat_mobile01.png', alt: '모바일 — 좌측 상단 햄버거 메뉴와 채팅 아이콘 위치 설명' },
    mobileImg: { src: '/image/notice/chat/link/move_chat_mobile02.png', alt: '모바일 — 모바일 메뉴 목록에서 Chat을 선택해 채팅 화면으로 이동하는 화면' },
  },
];

const chatMemberGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '멤버 목록 확인',
    desc: '서비스에 가입된 모든 멤버를 확인할 수 있습니다. 온라인 상태인 멤버는 프로필 아이콘 우측 상단에 초록색 점으로 표시됩니다. 채팅 멤버 목록의 우측 상단에 ⋮ 버튼을 누르면 단체 채팅, AI 채팅, 다크/라이트 모드 변경 메뉴가 나타납니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web01.png', alt: '채팅 멤버 목록 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile01.png', alt: '채팅 멤버 목록 — 모바일' },
  },
  {
    step: '02',
    title: '1:1 대화방 만들기',
    desc: '멤버 목록에서 대화하고 싶은 멤버의 이름이나 프로필 사진을 클릭하면 해당 멤버와 1:1 대화방이 열립니다. 이미 대화방이 존재하는 경우 기존 대화방으로 이동하며, 처음 대화를 시작하는 경우 새로운 임시 대화방이 생성됩니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web02.png', alt: '1:1 대화방 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile02.png', alt: '1:1 대화방 — 모바일' },
  },
  {
    step: '03',
    title: '멤버 더보기 메뉴 (⋮) — 단체채팅 · AI 채팅 · 다크/라이트 모드',
    desc: '멤버 화면 우측 상단의 ⋮ 버튼을 누르면 세 가지 기능을 바로 이용할 수 있습니다. ① 단체 채팅: 여러 멤버가 함께 참여할 수 있는 그룹 채팅방을 만듭니다. ② AI 채팅: 향수 AI 어시스턴트와 대화할 수 있는 전용 채팅방으로 이동합니다. ③ 다크 모드 / 라이트 모드: 현재 테마를 전환합니다. 다크 모드일 때는 "라이트 모드"로, 라이트 모드일 때는 "다크 모드"로 표시됩니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web03.png', alt: '더보기 메뉴 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile03.png', alt: '더보기 메뉴 — 모바일' },
  },
];

const noticeGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '목록에서 상세 페이지로 이동',
    desc: '공지사항 목록에서 원하는 공지를 클릭하면 상세 페이지로 이동합니다. 로그인 여부와 관계없이 누구나 공지 내용을 열람할 수 있으며, 제목·작성자·작성 시간·조회 수·댓글 수와 함께 본문 내용이 표시됩니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web01.png', alt: '목록에서 상세 페이지로 이동 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile01.png', alt: '목록에서 상세 페이지로 이동 — 모바일' },
  },
  {
    step: '02',
    title: '비로그인 상태 — 댓글 열람만 가능',
    desc: '로그인하지 않은 상태에서는 공지 내용과 기존 댓글을 자유롭게 열람할 수 있습니다. 다만 댓글을 작성하려면 상단의 "Login" 버튼을 클릭해 로그인해야 합니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web02.png', alt: '비로그인 상태 — 댓글 열람만 가능 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile02.png', alt: '비로그인 상태 — 댓글 열람만 가능 — 모바일' },
  },
  {
    step: '03',
    title: '로그인 후 — 댓글 입력창 활성화 & 작성자 수정·삭제 버튼',
    desc: '로그인하면 하단 댓글 입력창이 활성화되어 댓글을 작성할 수 있습니다. 해당 공지의 작성자면 우측 상단에 수정·삭제 버튼이 함께 표시되며, 공지를 편집하거나 삭제할 수 있습니다. 다른 사용자의 공지에는 수정·삭제 버튼이 표시되지 않습니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web03.png', alt: '로그인 후 — 댓글 입력창 활성화 & 작성자 수정·삭제 버튼 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile03.png', alt: '로그인 후 — 댓글 입력창 활성화 & 작성자 수정·삭제 버튼 — 모바일' },
  },
  {
    step: '04',
    title: '댓글 작성 및 등록',
    desc: '입력창에 댓글을 작성한 뒤 "확인" 버튼을 클릭하면 댓글이 등록됩니다. 댓글 수가 실시간으로 증가하며 등록된 댓글이 목록에 표시됩니다. 본인이 작성한 댓글에는 "수정·삭제" 버튼이 함께 나타납니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web04.png', alt: '댓글 작성 및 등록 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile04.png', alt: '댓글 작성 및 등록 — 모바일' },
  },
  {
    step: '05',
    title: '내 댓글에만 수정 · 삭제 버튼 표시',
    desc: '본인이 작성한 댓글에만 "수정·삭제" 버튼이 표시됩니다. "수정" 버튼을 클릭하면 댓글 내용이 편집할 수 있는 입력창으로 전환되어서 수정할 수 있습니다. "삭제" 버튼을 클릭하면 해당 댓글이 삭제됩니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web05.png', alt: '내 댓글에만 수정 · 삭제 버튼 표시 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile05.png', alt: '내 댓글에만 수정 · 삭제 버튼 표시 — 모바일' },
  },
  {
    step: '06',
    title: '댓글 수정 모드 — 내용 변경 후 확인',
    desc: '수정 모드에서 내용을 변경한 뒤 "저장" 버튼을 클릭하면 댓글이 즉시 수정되어 목록에 반영됩니다. "취소" 버튼을 클릭하면 변경 사항이 적용되지 않고 원래 내용으로 돌아갑니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web06.png', alt: '댓글 수정 모드 — 내용 변경 후 확인 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile06.png', alt: '댓글 수정 모드 — 내용 변경 후 확인 — 모바일' },
  },
];

const noticeWriteGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '비로그인 상태 — 읽기 전용',
    desc: '로그인하지 않은 상태에서는 공지 목록과 내용을 열람할 수 있지만, 글쓰기 버튼이 표시되지 않습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web01.png', alt: '공지사항 목록 — 데스크탑 (비로그인)' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile01.png', alt: '공지사항 목록 — 모바일 (비로그인)' },
  },
  {
    step: '02',
    title: '로그인 상태 — 글쓰기 버튼 활성화',
    desc: '로그인한 사용자는 우측 상단에 글쓰기 버튼이 표시됩니다. 버튼을 클릭하면 공지사항 작성 페이지로 이동합니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web02.png', alt: '공지사항 목록 — 데스크탑 (로그인, 글쓰기 버튼 표시)' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile02.png', alt: '공지사항 목록 — 모바일 (로그인, 글쓰기 버튼 표시)' },
  },
  {
    step: '03',
    title: '글쓰기 페이지',
    desc: '상단의 제목 입력란에 제목을 입력하고, 아래 에디터(Quill)에서 본문을 작성합니다. 에디터 툴바에서 굵게·기울임·밑줄·취소선 등의 텍스트 서식을 적용하거나, 이미지 아이콘을 클릭해 본문에 이미지를 삽입할 수 있습니다. 작성이 완료되면 등록 버튼을 클릭해 공지문을 게시하거나, 취소 버튼을 눌러 목록으로 돌아갈 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web03.png', alt: '공지사항 글쓰기 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile03.png', alt: '공지사항 글쓰기 페이지 — 모바일' },
  },
  {
    step: '04',
    title: '내용 작성 — 텍스트 & 이미지 삽입',
    desc: '에디터 툴바를 활용해 굵게·기울임·밑줄·취소선, 글자 크기와 색상 등 다양한 스타일로 텍스트를 자유롭게 작성할 수 있습니다. 또한 이미지 아이콘을 통해 본문 중간에 이미지를 삽입할 수 있으며, 삽입된 이미지는 Cloudinary CDN을 통해 제공됩니다. 작성한 내용은 에디터에서 바로 확인할 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web04.png', alt: '공지사항 내용 작성 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile04.png', alt: '공지사항 내용 작성 중 — 모바일' },
  },
  {
    step: '05',
    title: '등록 완료 — 공지사항 상세 페이지',
    desc: '등록 버튼을 클릭하면 작성한 공지사항이 저장되고 해당 공지의 상세 페이지로 이동합니다. 상세 페이지에서는 제목, 작성자, 조회 수, 댓글 수와 함께 본문 내용을 확인할 수 있습니다. 작성자 본인에게는 우측 상단에 수정·삭제 버튼이 표시되며, 하단에는 댓글을 작성할 수 있는 입력란이 나타납니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web05.png', alt: '공지사항 상세 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile05.png', alt: '공지사항 상세 페이지 — 모바일' },
  },
];

const chatConversationGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '대화방 탭 진입',
    desc: '채팅 메뉴에서 대화방 탭을 선택하면 참여 중인 대화 목록이 표시됩니다. 참여 중인 대화방이 없으면 "대화방이 없습니다." 안내가 표시되며, 메인 화면 중앙의 "향수 AI 어시스턴트와 채팅" 버튼을 클릭하면 AI 채팅방에 바로 이동할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web01.png', alt: '대화방 탭 진입 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile01.png', alt: '대화방 탭 진입 — 모바일' },
  },
  {
    step: '02',
    title: '대화방 더보기 메뉴(⋮)',
    desc: '"대화방" 제목 오른쪽의 더보기(⋮) 버튼을 클릭하면 다음 세 가지 메뉴가 표시됩니다. ① 단체 채팅: 여러 멤버가 함께 참여하는 그룹 채팅방을 만들 수 있습니다. ② AI 채팅: 향수 AI 어시스턴트와 대화할 수 있는 전용 채팅방으로 이동합니다. ③ 다크 모드 / 라이트 모드: 현재 테마를 전환합니다. 다크 모드일 때는 "라이트 모드"로, 라이트 모드일 때는 "다크 모드"로 표시됩니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web02.png', alt: '대화방 더보기 메뉴(⋮) — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile02.png', alt: '대화방 더보기 메뉴(⋮) — 모바일' },
  },
  {
    step: '03',
    title: '단체 채팅 모달 열기',
    desc: '⋮ 메뉴에서 "단체 채팅"을 선택하면 "대화 상대 선택" 모달이 열립니다. 채팅 이름 필드에 원하는 대화방 이름을 입력하고, 채팅 멤버 드롭다운에서 함께할 멤버를 선택합니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web03.png', alt: '단체 채팅 모달 열기 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile03.png', alt: '단체 채팅 모달 열기 — 모바일' },
  },
  {
    step: '04',
    title: '채팅 이름과 멤버 선택',
    desc: '채팅 이름을 입력하고 참여할 멤버를 선택한 후 "확인" 버튼을 클릭하면 단체 대화방이 생성됩니다. 멤버를 1명만 선택하면 1:1 대화방이 생성됩니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web04.png', alt: '채팅 이름과 멤버 선택 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile04.png', alt: '채팅 이름과 멤버 선택 — 모바일' },
  },
  {
    step: '05',
    title: '단체 대화방 생성 및 입장',
    desc: '임시 대화방이 생성되고 채팅창이 열립니다. 상단에는 방 이름과 참여 인원수가 표시되고, 하단 입력창에 첫 메시지를 입력해 전송하면 서버에서 대화방이 정식으로 생성됩니다. 생성이 완료되면 대화방 목록에 새 방이 추가되고, 방금 보낸 메시지가 채팅창에 나타납니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web05.png', alt: '단체 대화방 생성 및 입장 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile05.png', alt: '단체 대화방 생성 및 입장 — 모바일' },
  },
  {
    step: '06',
    title: '실시간 메시지 전송',
    desc: '메시지 입력창에 내용을 작성하고 전송 버튼을 클릭하면 실시간으로 메시지가 전달됩니다. 왼쪽 대화방 목록에는 마지막 메시지와 읽지 않은 메시지 수(배지)가 실시간으로 업데이트됩니다. 채팅창에는 날짜 구분 선이 자동으로 표시되어 대화 흐름을 쉽게 파악할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web06.png', alt: '실시간 메시지 전송 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile06.png', alt: '실시간 메시지 전송 — 모바일' },
  },
  {
    step: '07',
    title: '대화방 목록 확인',
    desc: '대화방 목록에는 내가 참여한 모든 대화방이 표시됩니다. 각 항목에는 대화방 이름, 마지막 메시지, 전송 시각, 읽지 않은 메시지 수(배지)가 함께 표시됩니다. 목록에서 원하는 대화방을 클릭하면 해당 채팅창으로 바로 이동합니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web07.png', alt: '대화방 목록 확인 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile07.png', alt: '대화방 목록 확인 — 모바일' },
  },
];

const chatDetailSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '채팅창 상단 메뉴(···) & 읽음 표시',
    desc: '대화방 채팅창 우측 상단의 ··· 버튼을 누르면 채팅방 서랍이 열립니다. 서랍에서는 현재 참여 중인 멤버 목록을 확인하고 대화방을 나갈 수 있습니다. 내가 보낸 메시지 아래에는 "읽음: [닉네임]" 형태로 읽은 상태가 표시됩니다. 상대방이 메시지를 읽으면 읽음 표시가 자동으로 업데이트됩니다.',
    webImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_web01.png', alt: '채팅창 상단 메뉴(···) & 읽음 표시 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_mobile01.png', alt: '채팅창 상단 메뉴(···) & 읽음 표시 — 모바일' },
  },
  {
    step: '02',
    title: '채팅방 서랍 — 참여 멤버 & 대화방 나가기',
    desc: '··· 버튼을 누르면 오른쪽에서 채팅방 서랍이 열립니다. 서랍 상단에는 대화방 이름과 총참여 인원수가 표시되고, 그 아래에는 참여 멤버의 프로필 사진·이름·이메일이 나열됩니다. 본인 계정에는 "나" 배지가, 현재 온라인 상태인 멤버는 프로필 아이콘 우측 상단에 초록색 점이 표시됩니다. 서랍 하단의 "대화방 나가기" 버튼을 클릭하면 해당 대화방에서 나갈 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_web02.png', alt: '채팅방 서랍 — 참여 멤버 & 대화방 나가기 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_mobile02.png', alt: '채팅방 서랍 — 참여 멤버 & 대화방 나가기 — 모바일' },
  },
  {
    step: '03',
    title: '대화방 나가기 — 확인 모달',
    desc: '대화방 나가기 버튼을 클릭하면 경고 모달이 나옵니다. 계속 나가려면 확인을, 취소하려면 취소 또는 X 버튼을 누릅니다.',
    webImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_web03.png', alt: '대화방 나가기 — 확인 모달 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_mobile03.png', alt: '대화방 나가기 — 확인 모달 — 모바일' },
  },
  {
    step: '04',
    title: '나가기 처리 중',
    desc: '확인 버튼을 누르면 버튼이 "삭제 중"으로 바뀌며 처리가 진행됩니다. 처리 중에는 버튼이 비활성화되어 중복 요청을 방지합니다.',
    webImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_web04.png', alt: '나가기 처리 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_mobile04.png', alt: '나가기 처리 중 — 모바일' },
  },
  {
    step: '05',
    title: '나가기 완료',
    desc: '대화방에서 나가면 "대화방이 삭제되었습니다." 토스트 메시지가 표시되고, 대화방 목록으로 자동 이동합니다. 나간 대화방은 목록에서 사라지며, 해당 대화의 모든 기록은 복구할 수 없습니다.',
    webImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_web05.png', alt: '나가기 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_detail/chat_conversation_detail_mobile05.png', alt: '나가기 완료 — 모바일' },
  },
];

const chatAiGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: 'AI 채팅방 진입',
    desc: 'AI 채팅방은 대화방 탭과 멤버 탭에서 동일하게 진입할 수 있습니다. 두 탭 모두 ⋮ 메뉴에서 "AI 채팅"을 선택하거나, 화면 중앙의 "향수 AI 어시스턴트와 채팅" 버튼을 눌러 바로 들어갈 수 있습니다. 어느 경로로 들어가도 동일한 AI 채팅방으로 이동합니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web01.png', alt: 'AI 채팅방 진입 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile01.png', alt: 'AI 채팅방 진입 — 모바일' },
  },
  {
    step: '02',
    title: 'AI 채팅방 초기 화면',
    desc: 'AI 채팅방에 처음 입장하면 임시 대화방이 생성됩니다. 이곳에서 향수 AI 어시스턴트에게 향수 추천, 향 계열, 취향별 조합 등 향수와 관련된 질문을 자유롭게 입력할 수 있습니다. 향수와 무관한 주제는 답변이 제한됩니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web02.png', alt: 'AI 채팅방 초기 화면 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile02.png', alt: 'AI 채팅방 초기 화면 — 모바일' },
  },
  {
    step: '03',
    title: '메시지 전송 & AI 응답 대기',
    desc: '질문을 입력해서 전송하면 AI가 답변 생성을 시작합니다. 응답이 준비되는 동안에는 다음 메시지 전송이 제한되며, 답변이 완료되면 다시 이어서 질문을 보낼 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web03.png', alt: '메시지 전송 & AI 응답 대기 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile03.png', alt: '메시지 전송 & AI 응답 대기 — 모바일' },
  },
  {
    step: '04',
    title: 'AI 응답 스트리밍',
    desc: 'AI 응답은 스트리밍 방식으로 제공되어, 답변이 완성되는 과정을 실시간으로 확인할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web04.png', alt: 'AI 응답 스트리밍 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile04.png', alt: 'AI 응답 스트리밍 — 모바일' },
  },
  {
    step: '05',
    title: 'AI 응답 완료',
    desc: '응답이 모두 완료되면 전체 내용이 화면에 표시되고 입력창이 다시 활성화됩니다. 이어서 추가 질문을 입력하거나, 이전 대화를 바탕으로 더 구체적인 향수 정보를 요청할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web05.png', alt: 'AI 응답 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile05.png', alt: 'AI 응답 완료 — 모바일' },
  },
];

const mainGalleryGuide: MainGalleryGuide = {
  title: '메인 화면 & 시그니처 향수 갤러리',
  desc: [
    <span key="1">메인 페이지는 상단의 <strong>3D 히어로 섹션</strong>과 그 아래 <strong>시그니처 향수 갤러리</strong>로 구성되어 있으며, 아래로 스크롤 하면 갤러리로 자연스럽게 이어집니다.</span>,
    <span key="2">갤러리 상단의 <strong>향수 필터</strong>에서 원하는 브랜드를 선택하면 해당 향수만 볼 수 있습니다. 필터 영역을 지나 아래로 스크롤 하면 필터가 헤더 아래에 고정되고, 다시 위로 스크롤 하면 원래 자리로 돌아갑니다. 브랜드가 많아 필터 버튼이 한 줄을 넘기면 일부만 노출되고 나머지는 숨겨지며, 더보기 버튼을 눌러 전체 목록을 확인할 수 있습니다</span>,
    <span key="3">갤러리 목록은 무한 스크롤로 불러오며, 카드를 클릭하면 해당 향수의 상세 페이지로 이동합니다. <strong>향수 정보 추가</strong> 버튼은 데스크탑에서는 목록 우측 상단에, 모바일에서는 갤러리 제목 아래(필터 영역 위)에 있으며, 로그인하면 이 버튼으로 새 향수를 등록할 수 있습니다.</span>,
  ],
  webImg: { src: '/image/notice/fragrance/main_fragrance_web.png', alt: '데스크탑 화면 — 향수 컬렉션' },
  mobileImg: { src: '/image/notice/fragrance/main_fragrance_mobile.png', alt: '모바일 화면 — 향수 컬렉션' },
};

export default function IntroPage() {
  return (
    <GuideContent
      features={features}
      steps={steps}
      techStack={techStack}
      fragranceGuideSteps={fragranceGuideSteps}
      fragranceDetailSteps={fragranceDetailSteps}
      noticeGuideSteps={noticeGuideSteps}
      noticeWriteGuideSteps={noticeWriteGuideSteps}
      chatMoveGuideSteps={chatMoveGuideSteps}
      chatMemberGuideSteps={chatMemberGuideSteps}
      chatConversationGuideSteps={chatConversationGuideSteps}
      chatDetailSteps={chatDetailSteps}
      chatAiGuideSteps={chatAiGuideSteps}
      mainGalleryGuide={mainGalleryGuide}
    />
  );
}

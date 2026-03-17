import type { Metadata } from 'next';
import NoticeIntroContent, {
  type IntroStep,
  type FragranceGuideStep,
} from './NoticeIntroContent';

export const metadata: Metadata = {
  title: 'Scent Memories 소개 및 이용 안내',
  description:
    'Scent Memories는 향수를 수집하고 기록하는 프론트엔드 포트폴리오 사이트입니다. 서비스 소개와 이용 방법을 안내합니다.',
};

const features = [
  { icon: '🌸', title: '향수 컬렉션', desc: '다양한 향수를 카드 형태로 탐색하고 향조·계절·지속력 등 상세 정보를 확인합니다.' },
  { icon: '⭐', title: '리뷰 & 별점', desc: '향수에 대한 개인 감상과 별점을 남기고, 다른 사용자의 리뷰도 열람할 수 있습니다.' },
  { icon: '📋', title: '공지사항', desc: '서비스 안내와 업데이트 내용을 게시합니다. 로그인한 사용자는 글 작성과 댓글이 가능합니다.' },
  { icon: '💬', title: '실시간 채팅', desc: 'Socket.io 기반의 실시간 채팅으로 다른 사용자와 향수에 대한 이야기를 나눌 수 있습니다.' },
  { icon: '🤖', title: 'AI 향수 대화', desc: 'OpenAI GPT-4 기반 AI 어시스턴트에게 향수에 관한 궁금한 점을 자유롭게 물어볼 수 있습니다. 취향이나 상황을 이야기하면 어울리는 향수를 추천받을 수도 있습니다.' },
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
  { category: 'Data Fetching', items: ['TanStack Query (React Query)'] },
  { category: 'Real-time', items: ['Socket.io'] },
  { category: 'Auth', items: ['NextAuth.js (Google · Kakao)'] },
  { category: 'Media', items: ['Cloudinary'] },
  { category: '3D · Animation', items: ['Three.js'] },
  { category: 'AI', items: ['OpenAI GPT-4', 'OpenAI Vision (이미지 분석)'] },
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

const chatMemberGuideSteps: FragranceGuideStep[] = [
  {
    step: '01',
    title: '멤버 목록 확인',
    desc: '채팅 탭의 멤버 화면에서 서비스에 가입된 모든 멤버를 확인할 수 있습니다. 온라인 상태인 멤버는 프로필 아이콘 우측 하단에 초록색 점으로 표시됩니다. 우측 상단의 ⋮ 버튼을 누르면 단체 채팅, AI 채팅, 다크/라이트 모드 변경 메뉴가 나타납니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web01.png', alt: '채팅 멤버 목록 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile01.png', alt: '채팅 멤버 목록 — 모바일' },
  },
  {
    step: '02',
    title: '1:1 대화방 만들기',
    desc: '멤버 목록에서 대화하고 싶은 멤버의 이름이나 프로필을 클릭하면 해당 멤버와의 1:1 대화방이 즉시 열립니다. 이미 대화방이 존재하는 경우 기존 대화방으로 이동하며, 처음 대화를 시작하는 경우 새로운 대화방이 생성됩니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web02.png', alt: '1:1 대화방 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile02.png', alt: '1:1 대화방 — 모바일' },
  },
  {
    step: '03',
    title: '더보기 메뉴 — 단체채팅 · AI 채팅 · 다크/라이트 모드',
    desc: '멤버 화면 우측 상단의 ⋮ 버튼을 누르면 세 가지 기능을 바로 이용할 수 있습니다. ① 단체 채팅: 여러 멤버가 함께 참여할 수 있는 그룹 채팅방을 만듭니다. ② AI 채팅: 향수 AI 어시스턴트와 대화할 수 있는 전용 채팅방으로 이동합니다. ③ 다크 모드 / 라이트 모드: 현재 테마를 전환합니다. 다크 모드일 때는 "라이트 모드"로, 라이트 모드일 때는 "다크 모드"로 표시됩니다.',
    webImg: { src: '/image/notice/chat/member/chat_member_web03.png', alt: '더보기 메뉴 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/member/chat_member_mobile03.png', alt: '더보기 메뉴 — 모바일' },
  },
];

const noticeGuideSteps: FragranceGuideStep[] = [
  {
    step: '12',
    title: '공지사항 목록 — 로그인 시 글쓰기 버튼 활성화',
    desc: '상단 "Notice" 메뉴를 클릭하면 공지사항 목록 페이지로 이동합니다. 로그인 여부와 관계없이 모든 공지를 자유롭게 열람할 수 있습니다. 로그인한 사용자에게만 우측 상단에 "글쓰기" 버튼이 표시되며, 비로그인 상태에서는 읽기만 가능합니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web02.png', alt: '공지사항 목록 — 데스크탑 (로그인 상태, 글쓰기 버튼 표시)' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile02.png', alt: '공지사항 목록 — 모바일 (로그인 상태, 글쓰기 버튼 표시)' },
  },
  {
    step: '13',
    title: '공지사항 상세 페이지 & 리뷰 — 목록에서 상세 페이지로 이동',
    desc: '공지사항 목록에서 원하는 공지를 클릭하면 해당 공지의 상세 페이지로 이동합니다. 로그인하지 않아도 누구나 공지 목록을 자유롭게 열람할 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web01.png', alt: '공지사항 목록 — 상세 페이지 진입 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile01.png', alt: '공지사항 목록 — 상세 페이지 진입 모바일' },
  },
  {
    step: '14',
    title: '비로그인 상태 — 댓글 입력창 미표시',
    desc: '로그인하지 않은 상태에서는 공지 제목·작성자·조회 수·본문 내용을 자유롭게 열람할 수 있습니다. 단, 댓글 입력창이 표시되지 않아 댓글을 작성할 수 없습니다. 댓글을 남기려면 상단 "Login" 버튼을 클릭해 로그인해야 합니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web02.png', alt: '공지사항 상세 페이지 — 비로그인 상태 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile02.png', alt: '공지사항 상세 페이지 — 비로그인 상태 모바일' },
  },
  {
    step: '15',
    title: '로그인 후 — 댓글 입력창 활성화 & 작성자 수정·삭제 버튼',
    desc: '로그인하면 하단 댓글 입력창이 활성화되어 댓글을 작성할 수 있습니다. 해당 공지의 작성자인 경우 우측 상단에 수정·삭제 버튼이 함께 표시되며, 공지를 편집하거나 삭제할 수 있습니다. 다른 사용자의 공지에는 수정·삭제 버튼이 표시되지 않습니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web03.png', alt: '공지사항 상세 페이지 — 로그인 후 댓글 입력 활성화 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile03.png', alt: '공지사항 상세 페이지 — 로그인 후 댓글 입력 활성화 모바일' },
  },
  {
    step: '16',
    title: '댓글 작성 및 등록',
    desc: '입력창에 댓글을 작성한 뒤 "등록" 버튼을 클릭하면 댓글이 등록됩니다. 댓글 수가 실시간으로 증가하며 등록된 댓글이 목록에 표시됩니다. 본인이 작성한 댓글에는 수정·삭제 버튼이 함께 나타납니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web04.png', alt: '공지사항 댓글 작성 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile04.png', alt: '공지사항 댓글 작성 완료 — 모바일' },
  },
  {
    step: '17',
    title: '댓글 수정 모드 — 수정 버튼 클릭 후 내용 변경',
    desc: '"수정" 버튼을 클릭하면 댓글 내용이 편집 가능한 입력창으로 전환됩니다. 기존 내용이 입력창에 채워지며, 원하는 내용으로 수정한 뒤 "확인" 버튼을 클릭합니다. "취소" 버튼을 클릭하면 수정을 취소하고 원래 내용으로 돌아갑니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web05.png', alt: '댓글 수정 모드 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile05.png', alt: '댓글 수정 모드 — 모바일' },
  },
  {
    step: '18',
    title: '댓글 수정 완료',
    desc: '"확인" 버튼을 클릭하면 수정이 완료되어 변경된 내용이 댓글 목록에 즉시 반영됩니다.',
    webImg: { src: '/image/notice/chat/notice_detail/notice_detail_web06.png', alt: '댓글 수정 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice_detail/notice_detail_mobile06.png', alt: '댓글 수정 완료 — 모바일' },
  },
  {
    step: '19',
    title: '글쓰기 페이지',
    desc: '글쓰기 버튼을 클릭하면 공지사항 작성 페이지로 이동합니다. 상단 제목 입력란에 제목을 입력하고, 아래 에디터(Quill)에서 본문을 작성합니다. 툴바에서 굵게·기울임·밑줄·취소선 등 텍스트 서식을 적용하거나 이미지를 삽입할 수 있습니다. 작성 완료 후 "등록" 버튼으로 제출하거나 "취소"로 목록에 돌아갈 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web03.png', alt: '공지사항 글쓰기 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile03.png', alt: '공지사항 글쓰기 페이지 — 모바일' },
  },
  {
    step: '20',
    title: '내용 작성 — 텍스트 & 이미지 입력',
    desc: '제목을 입력하고 에디터에서 본문을 작성합니다. 이미지 아이콘을 통해 본문 중간에 이미지를 삽입할 수 있으며, 삽입된 이미지는 Cloudinary CDN을 통해 제공됩니다. 작성한 내용은 에디터에서 바로 확인할 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web04.png', alt: '공지사항 내용 작성 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile04.png', alt: '공지사항 내용 작성 중 — 모바일' },
  },
  {
    step: '21',
    title: '등록 완료 — 공지사항 상세 페이지',
    desc: '등록 버튼을 클릭하면 공지가 저장되고 상세 페이지로 이동합니다. 제목, 작성자, 조회 수, 댓글 수와 함께 본문 내용을 확인할 수 있습니다. 작성자 본인에게는 우측 상단에 수정·삭제 버튼이 표시되며, 하단에서 댓글을 작성할 수 있습니다.',
    webImg: { src: '/image/notice/chat/notice/notice_web05.png', alt: '공지사항 상세 페이지 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/notice/notice_mobile05.png', alt: '공지사항 상세 페이지 — 모바일' },
  },
];

const chatConversationGuideSteps: FragranceGuideStep[] = [
  {
    step: '09',
    title: '대화방 탭 진입',
    desc: '채팅 메뉴에서 대화방 탭을 선택하면 내가 참여한 대화 목록이 표시됩니다. 참여 중인 대화방이 없는 경우 "대화방이 없습니다."가 나타나며, 화면 가운데에는 대화방이나 멤버를 선택하면 채팅이 시작된다는 안내가 표시됩니다. 하단의 "향수 AI 어시스턴트와 채팅" 버튼을 클릭하면 AI 채팅방으로 바로 이동할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web01.png', alt: '대화방 탭 초기 화면 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile01.png', alt: '대화방 탭 초기 화면 — 모바일' },
  },
  {
    step: '10',
    title: '대화방 더보기 메뉴',
    desc: '대화방 화면 우측 상단의 ⋮ 버튼을 클릭하면 세 가지 메뉴가 나타납니다. ① 단체 채팅: 여러 멤버가 함께 참여하는 그룹 채팅방을 만들 수 있습니다. ② AI 채팅: 향수 AI 어시스턴트와의 채팅방으로 바로 이동합니다. ③ 다크 모드 / 라이트 모드: 현재 테마를 즉시 전환합니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web02.png', alt: '대화방 더보기 메뉴 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile02.png', alt: '대화방 더보기 메뉴 — 모바일' },
  },
  {
    step: '11',
    title: 'AI 채팅방 진입',
    desc: '대화방 탭의 ⋮ 메뉴에서 "AI 채팅"을 선택하면 향수 AI 어시스턴트와의 전용 채팅방으로 이동합니다. 멤버 탭에서도 동일하게 ⋮ 메뉴를 열어 "AI 채팅"을 선택하거나, 화면 중앙의 "향수 AI 어시스턴트와 채팅" 버튼을 직접 클릭해 진입할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web01.png', alt: 'AI 채팅 진입 방법 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile01.png', alt: 'AI 채팅 진입 방법 — 모바일' },
  },
  {
    step: '12',
    title: 'AI 채팅방 초기 화면',
    desc: 'AI 채팅방에 입장하면 상단에 "향수 AI 어시스턴트"가 표시되고, 빈 대화창과 함께 하단 입력창이 활성화됩니다. 향수에 관해 궁금한 점이라면 무엇이든 자유롭게 입력해 보세요.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web02.png', alt: 'AI 채팅방 초기 화면 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile02.png', alt: 'AI 채팅방 초기 화면 — 모바일' },
  },
  {
    step: '13',
    title: '메시지 전송 & AI 응답 대기',
    desc: '궁금한 내용을 입력하고 전송 버튼을 누르면 좌측 대화방 목록에 "향수 AI 어시스턴트" 대화방이 생성됩니다. 동시에 채팅창에 "AI가 응답을 준비 중입니다." 메시지가 표시되고, AI 응답이 완료될 때까지 입력창이 비활성화됩니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web03.png', alt: 'AI 응답 대기 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile03.png', alt: 'AI 응답 대기 중 — 모바일' },
  },
  {
    step: '14',
    title: 'AI 응답 스트리밍',
    desc: 'AI가 스트리밍 방식으로 응답을 전달하며, 텍스트가 실시간으로 채워집니다. 향수 추천이나 관련 정보가 목록 형태로 구체적으로 안내되며, 응답이 완전히 완료되기 전까지는 추가 메시지를 보낼 수 없습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web04.png', alt: 'AI 응답 스트리밍 중 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile04.png', alt: 'AI 응답 스트리밍 중 — 모바일' },
  },
  {
    step: '15',
    title: 'AI 응답 완료',
    desc: '응답이 모두 완료되면 전체 내용이 화면에 표시되고 입력창이 다시 활성화됩니다. 이어서 추가 질문을 입력하거나, 이전 대화를 바탕으로 더 구체적인 향수 정보를 요청할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation_ai/chat_ai_web05.png', alt: 'AI 응답 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation_ai/chat_ai_mobile05.png', alt: 'AI 응답 완료 — 모바일' },
  },
  {
    step: '16',
    title: '단체 채팅 모달 열기',
    desc: '⋮ 메뉴에서 "단체 채팅"을 선택하면 "대화 상대 선택" 모달이 열립니다. 채팅 이름 필드에 원하는 대화방 이름을 입력하고, 채팅 멤버 드롭다운에서 함께할 멤버를 선택합니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web03.png', alt: '단체 채팅 모달 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile03.png', alt: '단체 채팅 모달 — 모바일' },
  },
  {
    step: '17',
    title: '채팅 이름과 멤버 선택',
    desc: '채팅 이름을 입력하고 참여할 멤버를 선택한 후 "확인" 버튼을 클릭하면 단체 대화방이 생성됩니다. 선택한 멤버는 태그 형태로 표시되며, × 버튼으로 제거하거나 드롭다운에서 추가할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web04.png', alt: '멤버 선택 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile04.png', alt: '멤버 선택 완료 — 모바일' },
  },
  {
    step: '18',
    title: '단체 대화방 생성 및 입장',
    desc: '확인 버튼을 누르면 단체 대화방이 즉시 생성되고 해당 채팅창이 열립니다. 대화방 상단에는 방 이름과 참여 인원 수가 표시되며, 하단 입력창에서 바로 메시지를 작성할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web05.png', alt: '단체 대화방 생성 완료 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile05.png', alt: '단체 대화방 생성 완료 — 모바일' },
  },
  {
    step: '19',
    title: '실시간 메시지 전송',
    desc: '메시지 입력창에 내용을 작성하고 전송 버튼을 클릭하면 실시간으로 메시지가 전달됩니다. 왼쪽 대화방 목록에는 마지막 메시지와 읽지 않은 메시지 수(배지)가 실시간으로 업데이트됩니다. 날짜 구분선이 자동으로 표시되어 대화 흐름을 쉽게 파악할 수 있습니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web06.png', alt: '메시지 전송 후 대화 화면 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile06.png', alt: '메시지 전송 후 대화 화면 — 모바일' },
  },
  {
    step: '20',
    title: '대화방 목록 확인',
    desc: '대화방 목록에는 내가 참여한 모든 대화방이 표시됩니다. 각 항목에는 대화방 이름, 마지막 메시지, 전송 시각, 읽지 않은 메시지 수(배지)가 함께 표시됩니다. 목록에서 원하는 대화방을 클릭하면 해당 채팅창으로 바로 이동합니다.',
    webImg: { src: '/image/notice/chat/conversation/chat_conversation_web07.png', alt: '대화방 목록 — 데스크탑' },
    mobileImg: { src: '/image/notice/chat/conversation/chat_conversation_mobile07.png', alt: '대화방 목록 — 모바일' },
  },
];

export default function IntroPage() {
  return (
    <NoticeIntroContent
      features={features}
      steps={steps}
      techStack={techStack}
      fragranceGuideSteps={fragranceGuideSteps}
      noticeGuideSteps={noticeGuideSteps}
      chatMemberGuideSteps={chatMemberGuideSteps}
      chatConversationGuideSteps={chatConversationGuideSteps}
    />
  );
}

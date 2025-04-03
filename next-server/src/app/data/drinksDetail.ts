import { image } from "@heroui/react";
import { info } from "console";

const drinksDetailData = [
    {
        name: '하이트 엑스트라 골드',
        slug: 'hite',
        image_header: '/image/drinks/detail/hite_header.jpg',
        image_footer: '/image/drinks/detail/hite_footer.jpg',
        description: `<span class="text-top">hite</span>
            <span class="text-bottom">더욱 업그레이드된 엑스트라 콜드 공법<br>라거 맥주의 청량한 맛을 극대화한 하이트 맥주</span>`,
    },
    {
        name: '맥스',
        slug: 'max',
        image_header: '/image/drinks/detail/max_header.jpg',
        image_footer: '/image/drinks/detail/max_footer.jpg',
        description: `<span class="text-top">Upgrade Max</span>
                <span class="text-bottom">12년 내공으로 만들어진 깊고 풍부한<br>Cream 生 All Malt Beer!</span>`,
    },
    {
        type: 'left&dark',
        name: '드라이 d',
        slug: 'dry',
        image_header: '/image/drinks/detail/dry_header.jpg',
        image_footer: '/image/drinks/detail/dry_footer.jpg',
        description: `<span class="text-top"><i>날카롭게 팍!</i> 드라이 d</span>
                <span class="text-bottom">5년여의 연구 끝에<br>하이트만의 고유한 dry 기술이 완성<br>Finish 관점에서<br>맥주의 새로운 맛을 완성하다!</span>`,  
    },
    {
        type: 'left',
        name: '스타우트',
        slug: 'stout',
        image_header: '/image/drinks/detail/stout_header.png',
        image_footer: '/image/drinks/detail/stout_footer.jpg',
        description: `<span class="text-top">New black Stout</span>
                <span class="text-bottom">누구나 가볍게 즐길 수 있는 부드럽고 깔끔한<br>라거타입 흑맥주, 스타우트!</span>`,
    },
    {
        type: 'left&dark',
        name: '퀸즈에일',
        slug: 'queens_ale',
        image_header: '/image/drinks/detail/ale_header.jpg',
        image_footer: '/image/drinks/detail/ale_footer.jpg',
        description: `<span class="text-top">QUEEN’S ALE</span>
            <span class="text-bottom">트리플 호핑과<br>풀바디감의 깊고 풍부한<br>Premium Pale Ale맥주</span>`
    },
    {
        type: 'left&dark',
        name: '참이슬',
        slug: 'chamisul',
        image_header: '/image/drinks/detail/chamisul_header.jpg',
        image_footer: '/image/drinks/detail/chamisul_footer.jpg',
        description: `<span class="text-top">깨끗한 참이슬 fresh</span>
                <span class="text-bottom">대한민국 No.1 대표 소주.<br>대나무 숯 정제로<br>이슬같은 깨끗한 소주.</span>`,
    },
    {
        type: 'left&dark',
        name: '참이슬 오리지널',
        slug: 'chamisul_original',
        image_header: '/image/drinks/detail/chamisul_original_header.png',
        image_footer: '/image/drinks/detail/chamisul_original_footer.jpg',
        description: `<span class="text-top">참이슬 오리지널</span>
            <span class="text-bottom">소주 본연의 깊고 진한 맛으로<br>대한민국 소주의 정통성을 지켜온 정통소주</span>`,
    },
    {
        name: '참이슬 16.9도',
        slug: 'chamisul_16',
        image_header: '/image/drinks/detail/chamisul_16_header.jpg',
        image: '/image/drinks/chamisul_classic_16.9.png',
        info: `<span class="text-top">참이슬 16.9도</span>
                <span class="text-bottom">한층 더 편하고<br>부담없는 참이슬 16.9도<br>영남 지역 소비자의<br>입맛에 맞춘 깔끔한 맛의 소주</span>`
    },
    {
        name: '진로골드',
        slug: 'jinro_gold',
        image_header: '/image/drinks/detail/jinrogold_header.jpg',
        image: '/image/drinks/jinro_gold.png',
        info: `<span class="text-top">진로골드</span>
            <span class="text-bottom">초정밀 여과처리 및 식물성 감미료 사용<br>90여년을 지켜온 장인정신과 첨단 과학의 만남</span>`
    },
    {
        name: '일품진로',
        slug: 'chamisul_ilpum',
        image_header: '/image/drinks/detail/ilpum_header.png',
        image: '/image/drinks/ilpum.png',
        info: `<span class="text-top">일품진로</span>
                <span class="text-bottom">참나무통 10년 이상 숙성 순쌀원액 100% 프리미엄 소주.<br>1924년부터 시작된 전통 소주 제조비법으로<br> 하이트진로의 양조 전문가들이 재탄생 시킨 증류식 소주</span>`
    },
    {
        name: '참이슬 담금주',
        slug: 'damgeumju',
        image_header: '/image/drinks/detail/chamisul_dam_header.jpg',
        image: '/image/drinks/chamisul_damgeumju.png',
        info: `<span class="text-top">참이슬 담금주</span>
                <span class="text-bottom">과실주와 약재주 맛있고<br>맑게 우려내는 참이슬 담금주</span>`
    },
    {
        name: '더클래스',
        slug: 'theclass',
        image_header: '/image/drinks/detail/theclass_header.jpg',
        image: '/image/drinks/theclass.png',
        info: `<span class="text-top">The Class</span>
                <span class="text-bottom">남녀 모두 부담 없이 즐길 수 있는 탁월한 부드러움<br>젊은 감각에 어울리는 모던하고 세련된 디자인</span>`
    },
    {
        type: 'wide',
        name: '킹덤',
        slug: 'kingdom',
        image_header: '/image/drinks/detail/kingdom_header.png',
        image: '/image/drinks/kingdom.png',
        info: `<span class="text-top">Kingdom</span>
                <span class="text-bottom">특별히 엄선된 오크통에서 숙성한 위스키<br>두 번 숙성하여 더욱 부드러운 위스키</span>`
    },
    {
        name: '필라이트',
        slug: 'filite',
        image_header: '/image/drinks/detail/filite_header.png',
        image: '/image/drinks/filite_beer.png',
        info: `<span class="text-top">필라이트</span>
            <span class="text-bottom">100% 아로마 호프 필라이트<br>가성비 높은 신개념 주류</span>`
    },
    {
        name: '망고링고',
        slug: 'mangolingo',
        image_header: '/image/drinks/detail/mangolingo_header.jpg',
        image: '/image/drinks/mangolingo.png',
        info: `<span class="text-top">망고링고</span>
            <span class="text-bottom">망고과즙(2.3%)이 함유된 알코올 도수 2.5도의 저주도<br>망고의 상큼한 맛이 청량감의 조화</span>`
    },
    {
        name: '이슬톡톡 복숭아',
        slug: 'isultoktok_peach',
        image_header: '/image/drinks/detail/isultoktok_peach_header.jpg',
        image: '/image/drinks/isultoktok_peach.png',
        info: `<span class="text-top">이슬톡톡 복숭아</span>
            <span class="text-bottom">새콤달콤 복숭아와 청량한 스파클링이 만나<br>3%의 낮은 도수인 이슬톡톡이 되다</span>`
    },
    {
        name: '이슬톡톡 파인애플',
        slug: 'isultoktok_pineapple',
        image_header: '/image/drinks/detail/isultoktok_header.jpg',
        image: '/image/drinks/isultoktok_pineapple.png',
        info: `<span class="text-top">이슬톡톡 파인애플</span>
            <span class="text-bottom">새콤달콤 파인애플과 청량한 스파클링이 만나 <br>3%의 낮은 도수인 이슬톡톡이 되다</span>`
    },
    {
        type: 'wide',
        name: '자몽에이슬',
        slug: 'chamisul_grapefruit',
        image_header: '/image/drinks/detail/chamisul_grapefruit_header.jpg',
        image: '/image/drinks/chamisul_jamong.png',
        info: `<span class="text-top">자몽에이슬</span>
            <span class="text-bottom">과일 자몽과 깨끗한 이슬의 완벽한 블렌딩으로 <br>누구나 가볍게 즐길 수 있습니다.</span>`
    },
    {
        type: 'wide',
        name: '청포도에이슬',
        slug: 'chamisul_greengrape',
        image_header: '/image/drinks/detail/chamisul_greengrape_header.jpg',
        image: '/image/drinks/chamisul_cheongpodo.png',
        info: `<span class="text-top">청포도에이슬</span>
                <span class="text-bottom">깔끔한 맛과 청량감으로 한층 업그레이드 되어<br>청포도 특유의 달콤한 맛과 향을 느낄 수 있습니다</span>`
    },
    {
        type: 'left&dark',
        name: '햇복분자',
        slug: 'bokbunja',
        image_header: '/image/drinks/detail/bokbunja_header.jpg',
        image_footer: '/image/drinks/detail/bokbunja_footer.jpg',
        description: `<span class="text-top">진로 햇복분자</span>
                <span class="text-bottom">갓 수확한 당도 높고<br>신선한 햇복분자만을 사용하여<br>맛과 영양을 고스란히 담아냈습니다</span>`,
    },
    {
        type: 'left&dark',
        name: '매화수',
        slug: 'maehwasu',
        image_header: '/image/drinks/detail/maehwasu_header.jpg',
        image_footer: '/image/drinks/detail/maehwasu_footer.jpg',
        description: `<span class="text-top">매화수</span>
                <span class="text-bottom">‘저온 냉동 여과공법’을 사용해<br>부드럽고 깨끗한 맛! <br>합리적인 가격의 대중 매실주!</span>`,
    },
    {
        name: '기린 이치방 시보리',
        slug: 'kirinichiban',
        image_header: '/image/drinks/detail/kirin_header.png',
        image:  '/image/drinks/kirin_ichiban.png',
        info: `<span class="text-top">기린 이치방 시보리</span>
            <span class="text-bottom">맥아의 첫 번째 즙만을 사용한<br>‘이치방 시보리 제법’으로 <br>더욱 맑고 깨끗한 맥주</span>`
    },
    {
        type: 'wide',
        name: 'Kronenbourg 1644 BLANC',
        slug: 'blanc',
        image_header: '/image/drinks/detail/blanc_header.jpg',
        image: '/image/drinks/blanc1664.png',
        info: `<span class="text-top">Kronenbourg 1664 BLANC</span>
            <span class="text-bottom">프랑스 최고급 밀맥주 <br>세계인이 즐겨 찾는 No.1 프랑스 밀맥주</span>`,
    },
    {
        name: 'SINGHA',
        slug: 'singha',
        image_header: '/image/drinks/detail/singha_header.jpg',
        image: '/image/drinks/singha.png',
        info: `<span class="text-top">SINGHA</span>
            <span class="text-bottom">태국 최초의 맥주<br>왕실이 인정한 Thai No.1 프리미엄 맥주</span>`
    }
  ];
  
  export default drinksDetailData;
  
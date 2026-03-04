const fragranceDetailData = [
  // Byredo
  {
    brand: 'Byredo',
    name: '알토 아스트랄',
    slug: 'byredo_alto_astral',
    image: '/image/fragrance/byredo/Alto_Astral.png',
    description: `<span class="text-top">Byredo · Alto Astral</span>
      <span class="text-bottom">긍정적인 에너지를 담은 'Alto Astral'은 브라질 포르투갈어로 즐거움, 낙관 그리고 주변 사람들의 기분까지 끌어올리는 좋은 분위기를 의미하는 단어입니다.\n알토 아스트랄의 구르망 향기는 브라질을 대표하는 진정한 즐거움을 상징합니다.\n강렬한 알데하이드와 코코넛 노트의 조화로 시작해, 인센스, 자스민 페탈 그리고 밀키 머스크로 이어지며, 샌달우드, 캐시미어 우드 그리고 솔티드 앰버로 마무리됩니다.\n시간이 흐르며 알토 아스트랄이 남기는 긍정적인 에너지를 느껴보세요.</span>`,
    notes: `
      TOP : 알데하이드, 코코넛 워터\nHEART : 인센스, 자스민 페탈, 밀키 머스크\nBASE : 샌달우드, 캐시미어 우드, 솔티드 앰버
    `,
  },
  {
    brand: 'Byredo',
    name: "발 다프리크 앱솔뤼",
    slug: 'byredo_bal_d_afrique',
    image: '/image/fragrance/byredo/Bal_d\'Afrique.png',
    description: `<span class="text-top">Byredo · Bal d'Afrique</span>
      <span class="text-bottom">창립자 벤 고햄의 아름답고 예술적인 아프리카 문화를 향한 러브레터를 담은, 발 다프리크 앱솔뤼 드 퍼퓸 앱솔루 시리즈는 기존 재료들을 새롭게 추출하여 강렬하고 응축된 포뮬러로 구성됩니다.\n기존 발 다프리크 오 드 퍼퓸을 재해석한 앱솔루 드 퍼퓸은 생동감 넘치는 가벼움과 중독성있는 깊이의 대비를 강조하며 더욱 풍부한 경험을 선사합니다.기존 발 다프리크 오 드 퍼퓸을 재해석한 앱솔루 드 퍼퓸은 생동감 넘치는 가벼움과 중독성있는 깊이의 대비를 강조하며 더욱 풍부한 경험을 선사합니다.</span>
    `,
    notes: `
      TOP: 베르가못, 레몬, 블랙 커런트 어코드\nHEART: 머스크 어코드, 프랄린 어코드, 바이올렛 어코드\nBASE: 시더우드, 베티버, 블랙 앰버 어코드
    `,
  },
  {
    brand: 'Byredo',
    name: '카사블랑카 릴리 익스트레잇',
    slug: 'byredo_casablanca_lily',
    image: '/image/fragrance/byredo/byr_ecom_nv_casablanca_lily.png',
    description: `<span class="text-top">Byredo · Casablanca Lily</span>
      <span class="text-bottom">어둠 속에서만 피어나는 진귀한 꽃을 향한 헌사, 카사블랑카 릴리는 밤이 가진 신비와 관능을 한 병에 담아냈습니다.\n당신의 가장 깊은 내면까지 부드럽게 감싸 안는 이 향은, 깊은 밤 꽃잎이 조용히 고개를 들듯 시간의 흐름에 따라 그 결을 서서히 펼쳐 보입니다.</span>`,
    notes: `
      TOP: 자두, 가드니아\nHEART: 인디언 튜베로즈, 카네이션\nBASE: 꿀 어코드, 로즈우드
    `,
  },
  {
    brand: 'Byredo',
    name: '집시 워터',
    slug: 'byredo_gypsy_water_absolu',
    image: '/image/fragrance/byredo/byredo_absolu_gypsy_water.png',
    description: `<span class="text-top">Byredo · Gypsy Water</span>
      <span class="text-bottom">집시워터는 로마 문화의 아름다움, 독특한 관습, 친밀한 믿음.\n그리고 차별화된 삶의 방식에 대한 찬가입니다.\n이 향기는 타고난 유목민이 구축한 다채로운 생활 방식에 대한 꿈에서 일깨웁니다. 강렬한 앰버와 신선한 시트러스, 그리고 솔잎과 샌달우드는 늪에서 보내는 집시의 밤에 열기를 더해줍니다.</span>`,
    notes: `
      TOP : 베르가못, 레몬, 페퍼, 주니퍼베리\nHEART : 인센스, 솔잎. 오리스\nBASE: 앰버, 바닐라, 샌달우드
    `,
  },
  // Chanel
  {
    brand: 'Chanel',
    name: '샹스 오 후레쉬',
    slug: 'chanel_chance_eau_fraiche',
    image: '/image/fragrance/chanel/CHANCE_EAU_FRAÎCHE.png',
    description: `<span class="text-top">Chanel · Chance Eau Fraîche</span>
      <span class="text-bottom">강렬한 에너지와 생기를 채워 주는 반짝이는 플로랄 우디 향수. 우연히 마주치게 되는 매 순간 신선하고 생동감 넘치는 활기를 가득 채워줍니다.</span>`,
    notes: `
      짙고 풍부한 우디 베이스에 상쾌한 향기가 강렬하게 휘몰아치는 우아한 향을 선사합니다. 과즙을 가득 머금은 시트론 어코드가 톡 쏘는듯 상큼하고 생동감 넘치는 향기를 채우고 난 뒤, 쟈스민 향을 풍성하게 머금은 하트 노트가 눈부신 플로랄 향기를 더해 줍니다. 강렬한 티크 우드 노트는 점차 깊고 그윽한 엠버 향으로 바뀌며 섬세한 향기의 흔적을 남깁니다.
    `,
  },
  {
    brand: 'Chanel',
    name: '샹스 오 스플렌디드',
    slug: 'chanel_chance_eau_splendide',
    image: '/image/fragrance/chanel/CHANCE_EAU_SPLENDIDE.png',
    description: `<span class="text-top">Chanel · Chance Eau Splendide</span>
      <span class="text-bottom">환하게 빛나는 매혹적인 프루티 플로랄 향.샹스 오 스플렌디드는 싱그러운 라즈베리 노트로 시작해 점차 로즈 제라늄이 어우러진 플로랄 하트 노트로 변해갑니다. 아이리스와 신비로운 시더 화이트 머스크 어코드가 조화를 이루며, 색감만큼이나 향까지 빛나는 매력을 지닌 향수입니다.</span>`,
    notes: `
      상큼한 과일, 장미, 바이올렛이 어우러진 밝게 빛나는 라즈베리 어코드를 시작으로, 풍성하게 감싸 안는 듯한 로즈 제라늄의 플로랄 하트 노트가 점차 선명하게 퍼져 나갑니다.\n은은한 장미 향과 민트 노트가 감도는 제라늄은 그라스 지역의 샤넬 정원에서 재배합니다. 여기에 파우더리한 아이리스와 신비로운 시더 화이트 머스크 어코드가 어우러져 한층 섬세한 분위기를 더해줍니다.
    `,
  },
  {
    brand: 'Chanel',
    name: '코코 마드모아젤',
    slug: 'chanel_coco_mademoiselle',
    image: '/image/fragrance/chanel/COCO_MADEMOISELLE.png',
    description: `<span class="text-top">Chanel · Coco Mademoiselle</span>
      <span class="text-bottom">코코 마드모아젤 자유롭고 대담함을 즐길 줄 아는 여성을 위한 향수 놀랍도록 프레쉬하면서도 동시에 거부할 수 없는 강렬한 엠버리 향기를 선사합니다.</span>`,
    notes: `
    코코 마드모아젤은 감각을 일깨우는 관능적인 향의 엠버리 계열 향수입니다. 생동감 넘치는 산뜻한 오렌지 노트가 향기의 문을 열며 감각을 깨우고 관능적이고 산뜻한 쟈스민과 로즈 어코드가 설렘을 안겨주며, 그 뒤로 팟츌리와 베티베가 오랫동안 향기의 흔적을 남깁니다.
    `,
  },
  {
    brand: 'Chanel',
    name: '코코 누와르',
    slug: 'chanel_coco_noir',
    image: '/image/fragrance/chanel/COCO_NOIR.png',
    description: `<span class="text-top">Chanel · Coco Noir</span>
      <span class="text-bottom">코코 누와르는 블랙 컬러로 여성의 진면목을 드러냅니다.\n눈부시게 빛나는 노트를 담은 모던한 엠버리 향수는 현대적인 시각으로 관능적인 이끌림을 강렬하게 표현합니다. 강렬한 표현.</span>`,
    notes: `
      눈부시게 빛나는 노트를 담은 모던한 엠버리 향수.\n
      선명하고 섬세하게 피어나는 베르가못 향은 호기심을 불러일으킵니다. 그 뒤로 센슈얼한 장미와 강렬한 제라늄 리프 노트가 어우러져 점차적으로 희망을 가득 담은 풍성한 하트 노트를 펼쳐냅니다. 팟츌리와 통카빈은 마지막까지 자석처럼 이끌리는 향기를 완성합니다.
    `,
  },
  {
    brand: 'Chanel',
    name: '가브리엘 샤넬',
    slug: 'chanel_gabrielle_essence',
    image: '/image/fragrance/chanel/GABRIELLE_CHANEL_ESSENCE.png',
    description: `<span class="text-top">Chanel · Gabrielle Chanel Essence</span>
      <span class="text-bottom">샤넬의 조향사 올리비에 뽈쥬가 탄생시킨 태양빛을 머금은 플로럴 향수.\n 가브리엘 샤넬에게서 영감을 받아 탄생한 가브리엘 샤넬 에쌍스는, 자신이 무엇을 원하는지 잘 알고 있고 자유롭게 자신의 생각을 표현하는 여성을 위한 향수입니다. 여성 본연의 자아를 표현해주고, 자신만의 아우라를 선사합니다.\n매우 얇고 정교한 유리로 만들어진 정사각형 보틀 속 향수는 마치 무중력을 떠다니는 것처럼 보입니다. 보틀의 라벨과 캡은 짙고 풍부한 골드 컬러를 발산합니다.
      </span>`,
    notes: `
      가브리엘 샤넬 에쌍스는 태양빛을 표현한 풍부한 향을 선사합니다.\n
      이국적이고 강렬한 자스민, 생동감 넘치는 과일 향이 매력적인 일랑일랑, 신선하고 반짝이는 오렌지 블로썸, 그리고 부드럽고 섬세한 그라스 튜베로즈를 포함한 4가지의 꽃향기가 어우러져 꽃이 지닌 달콤한 꿀을 연상시키는 플로럴 향입니다.
      그리고 마지막으로, 어떠한 꽃보다도 매혹적인 그라스 튜베로즈가 마법과 같은 매력을 발산하며 따뜻하게 감싸 안는 포근한 잔향을 선사합니다.
    `,
  },
  {
    brand: 'Chanel',
    name: 'N°19',
    slug: 'chanel_n19',
    image: '/image/fragrance/chanel/N19.png',
    description: `<span class="text-top">Chanel · N°19</span>
      <span class="text-bottom">쾌활함과 세련됨의 독특한 조화. 생기있고 독특한 개성을 표현하면서 대담한 향의 부케로서 생기있고 활기찬 개성을 표현합니다. 'N°19 오 드 퍼퓸'은 향의 농도만을 달리 한 것이 아닌, 본래의 향이 추구하는 바와 베이스 노트에 충실하면서 한편으로 새로움을 추구한 향의 새로운 해석입니다.</span>`,
    notes: `
      훌로랄-우디-그린, 화이트와 그린의 후로랄 노트의 조화.
    `,
  },
  {
    brand: 'Chanel',
    name: 'N°5 로',
    slug: 'chanel_n5_leau',
    image: '/image/fragrance/chanel/N°5_L_EAU_1.png',
    description: `<span class="text-top">Chanel · N°5 L'Eau</span>
      <span class="text-bottom">샤넬에서 새롭게 선보이는 N°5 로(L'EAU)를 만나보세요. 모던함 아래, 시트러스의 상쾌함과 장미, 쟈스민의 풍부하고 대담한 꽃의 부케를 향에 담았습니다. N°5 로(L'EAU)는 심플함을 찬양합니다. 미니멀한 패키징까지 더해진 N°5 로(L'EAU)는 분명한 선택입니다. N°5의 상징적인 실루엣이 케이스를 감싼 슬리브에 양각으로 새겨져 있습니다. 케이스 안에는 두 번째 슬리브가 투명한 물처럼 맑은 보틀을 감싸 안고 있습니다. 보틀의 마개와 같은 어떠한 구성품도, 메커니즘도, 에센스도 이 깨끗한 모습을 망치지 않습니다. 다시 한번 심플함이 지배합니다. 이 심플함은 N°5로(L'EAU)를 선택하는 여성의 상상력에 완전한 자유를 선사합니다.</span>`,
    notes: `
      N°5 로(L'EAU)는 마치 햇살을 흠뻑 받은 황금색 꿀처럼 눈부신 시트러스의 기운을 발산합니다. 레몬, 만다린, 오렌지 노트가 알데하이드와 어우러져 하늘에 닿을 듯 공중으로 발산합니다.
      그다음으로는 꽃들의 살랑거리는 소리가 마치 바람처럼 들려옵니다. 장미는 쟈스민, 일랑일랑과 만나 한층 더 모던함을 더합니다. 꽃향기가 한차례 지나가면, 베티베와 시더 향이 새로운 활력을 부여하고, 그 뒤로 부드러운 화이트 머스크 향이 따라옵니다.
    `,
  },
  // Dior
  {
    brand: 'Dior',
    name: '디올 어딕트 퍼플 글로우',
    slug: 'dior_addict_purple_glow',
    image: '/image/fragrance/dior/dior_addict_purple_glow_eau_de_parfum.png',
    description: `<span class="text-top">Dior · Addict Purple Glow</span>
      <span class="text-bottom">퍼플 글로우는 토스카나 아이리스 꽃잎의 아름다움과 달콤한 라즈베리 향이 어우러져 슈가 파우더를 뿌린듯한 우아한 꽃을 연상시킵니다.</span>`,
  },
  {
    brand: 'Dior',
    name: '디올 어딕트 로지 글로우',
    slug: 'dior_addict_rosy_glow',
    image: '/image/fragrance/dior/dior_addict_rosy_glow_eau_de_parfum.png',
    description: `<span class="text-top">Dior · Addict Rosy Glow</span>
      <span class="text-bottom">부드러운 핑크 컬러 속, 로즈 글로우는 다마스크 로즈 에센스에 반짝이는 리치 향을 더해 달콤한 캐러멜라이즈드 노트를 연상시키는 크리미한 어코드로 부드럽고 매혹적인 향을 선사합니다.</span>`,
  },
  {
    brand: 'Dior',
    name: '오 소바쥬 오 드 뚜왈렛',
    slug: 'dior_eau_sauvage',
    image: '/image/fragrance/dior/eau_sauvage_eau_de_toilette.png',
    description: `<span class="text-top">Dior · Eau Sauvage</span>
      <span class="text-bottom">오 소바쥬는 어제의 혁신이자 오늘의 위대한 전설이며, 동시에 모던하고 세련된 향수입니다. 사용하는 이의 안목과 품격 있는 남성미를 대변하는 오 소바쥬 오 드 뚜왈렛은 단순한 향수가 아닌 디올 하우스의 변치 않는 우아함과 모던함 즉, “디올 스피릿”을 상징하는 존재입니다. 플로럴 & 시트러스 노트로 구성된 오 소바쥬 오 드 뚜왈렛의 시그니처 향은 세련되고 강렬한 동시에 섬세하고 산뜻한 매력을 선사합니다. 오직 디올을 위해 재배되는 칼라브리아 산 카를로 베르가못, 벨벳 같은 헤디온의 생기 넘치는 플로럴 노트, 그리고 독특한 시프레의 향기가 조화를 이룹니다.</span>`,
  },
  {
    brand: 'Dior',
    name: '쟈도르 오 드 퍼퓸',
    slug: 'dior_jadore',
    image: '/image/fragrance/dior/jadore_Eau_de_parfum.png',
    description: `<span class="text-top">Dior · J'adore</span>
      <span class="text-bottom">디올을 대표하는 전설적인 여성용 플로럴 향수입니다. 일랑일랑 에센스와 다마스크 로즈 에센스를 중심으로 구성되었으며, 관능적인 자스민의 플로럴 및 프루티 노트가 더해져 풍성한 향기를 완성합니다.</span>`,
  },
  {
    brand: 'Dior',
    name: '미스 디올 블루밍 부케',
    slug: 'dior_miss_dior_blooming_bouquet',
    image: '/image/fragrance/dior/miss_dior_blooming_bouquet.png',
    description: `<span class="text-top">Dior · Miss Dior Blooming Bouquet</span>
      <span class="text-bottom">미스 디올 블루밍 부케 오 드 뚜왈렛은 생동감 넘치면서도 부드럽게 다가오는 플로럴 향수입니다. 갓 피어난 꽃들의 다채롭고 자연스러운 매력을 담고 있는 이 향수는 스위트피와 베르가못의 싱그러운 향기로 첫눈에 반한 사랑처럼 강렬한 시작을 알립니다. 이어지는 다마스크 로즈와 피오니 노트의 하모니가 열정으로 빛나는 감정처럼 고고한 존재감을 드러냅니다. 부드럽고 산뜻한 화이트 머스크 어코드가 사랑의 이야기를 담은 이 향수의 마지막을 장식합니다. 미스 디올 블루밍 부케의 독창적인 자카드 보우는 프랑스에서 가장 유명한 리본 제작 아뜰리에 중 하나이자 1864년도에 설립된 메종 포레(Maison Faure)에서 제작되었습니다. 이 부드럽고 산뜻한 노트의 오 드 뚜왈렛은 언제 어디서나 우아한 향기를 더할 수 있는 롤러-펄 형태로도 만날 수 있습니다.</span>`,
  },
  {
    brand: 'Dior',
    name: '미스 디올 에쌍스',
    slug: 'dior_miss_dior_essence',
    image: '/image/fragrance/dior/miss_dior_essence.png',
    description: `<span class="text-top">Dior · Miss Dior Essence</span>
      <span class="text-bottom">미스 디올 에쌍스는 놀랍고도 매혹적인 향을 선사합니다. 달콤한 블랙베리와 엘더플라워 어코드의 뒤를 이어 황홀한 자스민 부케가 강렬함을 안겨줍니다. 부드러운 우디 오크 어코드 베이스 위로, 상큼한 시프레가 플로럴 캔버스에 과감히 붓질하듯 여성 본연의 아름다움에 찬사를 보냅니다. 지극히 여성스러운 매력을 지닌 향수, 미스 디올 에쌍스는 사회적 관습에서 벗어나 자유롭게 자신의 삶을 이끌어가는 새로운 세대의 여성을 그려냅니다. 크리스챤 디올의 1948년 헤리티지 보틀을 재해석한 새 보틀에 담긴 미스 디올 에쌍스는 고유한 정체성을 오롯이 품은 채 당당한 존재감을 드러냅니다. 새롭게 탄생한 보틀의 진귀한 글래스 캡은 프로스티드 하운즈투스 모티프와 블랙 '뽀야나르' 보우로 장식되어 미스 디올의 시그니처인 꾸뛰르 감성을 완성합니다.</span>`,
  },
  // Diptyque
  {
    brand: 'Diptyque',
    name: '오데썽 오 드 뚜왈렛',
    slug: 'diptyque_eau_des_sens',
    image: '/image/fragrance/diptyque/Eau_des_Sens.png',
    description: `<span class="text-top">Diptyque · Eau des Sens</span>
      <span class="text-bottom">시트러스 계열 향수지만 단순히 상큼한 향기로 끝나지 않고, 오렌지 블로썸의 은은한 플로럴이 더해져 부드럽게 중심을 잡아줍니다. 비터 오렌지의 쌉싸름한 터치와 인센스, 쥬니퍼베리의 스파이시함 덕분에 단조롭지 않은 깊이감을 느낄 수 있어요.\n청량한 오렌지 열매 자체보다는, 후추처럼 톡 쏘는 비터 오렌지부터 열매의 맑고 싱그러움, 나무줄기에서 날 법한 담백한 씁쓸함까지- 전체적으로 생동감 있으면서도 정갈하고 단정한 무드가 그려지네요.\n'감각의 물'을 뜻하는 이름처럼, 섬세한 조향으로 다양한 감각을 자극하는 긍정적인 향수입니다. 움직일 때마다 은은하게 새어나가는 상큼함에 무더운 여름에도 부담 없이 사용하기 좋고, 부드러운 잔향까지 그리 어렵지 않은 향기로 데일리 향수는 물론 입문용으로도 손색 없답니다.</span>`,
    notes: `
      TOP: 비터 오렌지, 인센스, 오렌지 블로썸\n
      MIDDLE: 쥬니퍼베리, 안젤리카, 패츌리\n
      BASE: 스파이시 우디 어코드
    `
  },
  {
    brand: 'Diptyque',
    name: '플레르 드 뽀',
    slug: 'diptyque_fleur_de_peau',
    image: '/image/fragrance/diptyque/Fleur_de_Peau.png',
    description: `<span class="text-top">Diptyque · Fleur de Peau</span>
      <span class="text-bottom">'피부 위에 핀 꽃'이라는 이름처럼 마치 피부에서 자연스럽게 피어난 듯한 향으로 남녀노소 누구에게나 꾸준히 사랑받고 있어요. 향의 전반에는 파우더리한 머스크가 자리 잡고 있으며 곱고 깨끗한 아이리스와 알싸한 페퍼, 체취처럼 쿰쿰하면서도 프루티함도 슬쩍 스치는 암브레트 시드가 만나 은근하게 관능적인 부드러움을 더합니다. 시간이 지나면 은은한 플로럴 향조의 머스크가 살결 위에 따뜻하게 남아 '진짜 살 냄새'처럼 자연스럽고도 섬세한 잔향을 완성하네요. 피부와 맞닿아 있을 때 더욱 아름다워지는 잔향으로, 은밀한 내면의 향기까지 신경 쓰는 분이라면 깊숙한 곳에서부터 은은하게 퍼지는 고급스러운 보송함에 내내 미소 짓게 될 거예요.</span>`,
    notes: `
      TOP: 베르가못, 이탈리안 만다린\n
      MIDDLE: 암브레트 씨앗, 아이리스, 핑크 페퍼, 로즈\n
      BASE: 머스크
    `
  },
  {
    brand: 'Diptyque',
    name: '오르페옹 오 드 퍼퓸',
    slug: 'diptyque_orpheon',
    image: '/image/fragrance/diptyque/Orphéon_Eau_de_parfum.png',
    description: `<span class="text-top">Diptyque · Orphéon</span>
      <span class="text-bottom">뿌연 안개가 내려앉은 소나무 숲에 들어서며 첫 향이 시작됩니다. 톡 쏘는 느낌이 상쾌하면서도 깊은 신선함이 느껴지는데요, 곧이어 태우던 시가를 마른 꽃잎에 떨어트린 듯 매캐하면서도 어딘가 달콤한 연기가 포근하게 퍼집니다. 첫 향과 전혀 다른 무드의 잔향이 반전매력을 선사합니다. 머스크 특유의 포근함이 자꾸 생각나서 도저히 이 향수를 포기하지 못하게 만들죠. 고급 목재로 꾸며진 공간, 딥티크의 동료들과 함께했던 그 시간의 온기가 그대로 느껴지는 듯합니다. 오르페옹, 가본 적 없는 그곳이 어느새 제 추억의 한 장면이 된 것 같네요.</span>`,
    notes: `
      TOP: 시트러스 프루티, 진저, 쥬니퍼\n
      MIDDLE: 매그놀리아, 메탈릭 로즈, 일랑일랑\n
      BASE: 벤조인, 시더우드, 머스크, 패츌리 타바코, 통카빈
    `
  },
  {
    brand: 'Diptyque',
    name: '탐다오 오 드 뚜왈렛',
    slug: 'diptyque_tam_dao',
    image: '/image/fragrance/diptyque/Tam_Dao.png',
    description: `<span class="text-top">Diptyque · Tam Dao</span>
      <span class="text-bottom">복잡했던 마음을 한꺼번에 달래줄 법한, 신선한 공기 가득한 숲 속의 사찰 마루에서 날 법한 나무향입니다 피아노 선율이 고루 울려퍼지는 듯한 샌달우드와 시더우드의 리드미컬하면서도 규칙적인 무게감이 힐링되는 번져가며 커다란 숲의 하모니를 완성시키는 듯 아름답게 마무리 됩니다.</span>`,
    notes: `
      TOP: 로즈, 플럼블로썸, 이탈리안 사이프러스\n
      MIDDLE: 샌달우드, 시더우드\n
      BASE: 앰버, 스파이시 어코드, 화이트머스크, 브라질리안 로즈우드
    `
  },
  // Jo Malone
  {
    brand: 'Jo Malone London',
    name: '블랙베리 앤 베이 코롱',
    slug: 'jomalone_blackberry_bay',
    image: '/image/fragrance/jomalone/Blackberry_Bay_Cologne.png',
    description: `<span class="text-top">Jo Malone · Blackberry & Bay</span>
      <span class="text-bottom">순수의 향. 블랙베리를 따던 어린 시절의 추억, 블랙베리로 물든 입술과 손. 이제 막 수확한 월계수 잎의 신선함에 톡 쏘는 블랙베리 과즙을 가미하였습니다. 매력적이고 생기 넘치는 상쾌한 느낌의 향입니다.</span>`,
    notes: `
      TOP: 블랙베리\n
      HEART: 월계수 잎\n
      BASE: 시더우드
    `
  },
  {
    brand: 'Jo Malone London',
    name: '잉글리쉬 페어 앤 스윗 피 코롱',
    slug: 'jomalone_english_pear_freesia',
    image: '/image/fragrance/jomalone/English_Pear_Freesia_Cologne.png',
    description: `<span class="text-top">Jo Malone · English Pear & Freesia</span>
      <span class="text-bottom">햇살이 따스하게 내리쬐는 과수원에서 무르익기 직전의 매혹적인 배가 가지에 가득 달려 생기를 불어넣습니다. 스위트 피의 파스텔 색조와 부드러운 향에 둘러 쌓인 달콤한 과일이 파우더리한 화이트 머스크 베이스 위에 자리 잡고 있습니다.</span>`,
    notes: `
      TOP: 배\n
      HEART: 스위트 피\n
      BASE: 화이트 머스크
    `
  },
  {
    brand: 'Jo Malone London',
    name: '라임 바질 앤 만다린 코롱',
    slug: 'jomalone_lime_basil_mandarin',
    image: '/image/fragrance/jomalone/Lime_Basil_Mandarin_Cologne.png',
    description: `<span class="text-top">Jo Malone · Lime Basil & Mandarin</span>
      <span class="text-bottom">조 말론 런던의 시그니처 향. 카리브해의 산들바람에서 실려온 듯한 라임향에 톡 쏘는 바질과 향기로운 백리향이 더해져 독특한 조합을 만들어 냅니다. 현대적인 감각의 클래식한 향입니다.</span>`,
    notes: `
      TOP: 만다린\n
      HEART: 바질\n
      BASE: 앰버우드
    `
  },
  {
    brand: 'Jo Malone London',
    name: '레드 로즈 코롱',
    slug: 'jomalone_red_roses',
    image: '/image/fragrance/jomalone/Red_Roses_Cologne.png',
    description: `<span class="text-top">Jo Malone · Red Roses</span>
      <span class="text-bottom">현대적인 로맨스의 상징. 세상에서 가장 아름다운 일곱가지 장미가 조합된 관능적인 향입니다. 으깬 바이올렛 잎과 약간의 레몬이 조합되어 신선한 부케향을 발산합니다. 놀라울 정도로 투명하고 순수한 향을 선사합니다.</span>`,
    notes: `
      TOP: 레몬\n
      HEART: 레드 로즈 어코드\n
      BASE: 벌집
    `
  },
  // Tom Ford
  {
    brand: 'Tom Ford',
    name: '일렉트릭 체리 오 드 퍼퓸',
    slug: 'tom_ford_electric_cherry',
    image: '/image/fragrance/tom_ford/Electric_Cherry_Eau_de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Electric Cherry</span>
      <span class="text-bottom">처음엔 잘 익은 모렐로 체리의 진한 상큼함과 생강의 짜릿함이 만나 기분 좋은 에너지를 선사합니다. 이어서 화려하게 피어난 자스민 향기가 매혹적으로 다가오며, 마지막에는 포근한 머스크와 알싸한 핑크 페퍼가 어우러져 피부 위에 따스하고 부드러운 여운을 남깁니다.</span>`,
    notes: `
      모렐로 체리 센트트렉® (Morello Cherry Scenttrek®): 풍부하고 새콤달콤한 체리 향\n
      피스타치오 어코드 (Pistachio Accord): 고소하고 부드러운 질감\n
      시모가 진저 인디아 오르퓌르® (Shimoga Ginger India Orpur®): 생동감 넘치고 알싸한 진저\n
      자스민 삼박 앱솔루트 인디아 오르퓌르® (Jasmine Sambac Absolute, India Orpur®): 화려하고 풍성한 화이트 플로럴\n
      샌달우드 어코드 (Sandalwood Accord): 부드럽고 우아한 나무 향\n
      Ambrettolide (Ambrettolide): 세련되고 따뜻한 식물성 머스크
    `
  },
  {
    brand: 'Tom Ford',
    name: '네롤리 포르토피노 오 드 퍼퓸',
    slug: 'tom_ford_neroli_portofino',
    image: '/image/fragrance/tom_ford/Neroli_Portofino_Eau_de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Neroli Portofino</span>
      <span class="text-bottom">이동의 설렘과 활기를 담은 네롤리 포르토피노는 이탈리아 리비에라의 시원한 산들바람, 반짝이는 바다, 그리고 싱그러운 가로수들을 그대로 옮겨 놓은 듯한 향수입니다. 클래식한 오 드 코롱을 현대적으로 재해석한 이 향수는 톡 쏘는 시트러스 오일과 예상치 못한 플로럴 노트, 그리고 앰버의 잔향이 어우러져 가볍고 시원하면서도 결코 가볍지 않은 깊은 인상을 남깁니다.</span>`,
    notes: `
      튀니지산 네롤리 (Tunisian Neroli): 깨끗하고 쌉싸름한 오렌지 꽃 향\n
      이탈리아산 베르가모트 (Italian Bergamot): 상큼하고 우아한 시트러스 향\n
      윈터 옐로우 만다린 (Winter Yellow Mandarin): 달콤하고 과즙 넘치는 향\n
      오렌지 플라워 (Orange Flower): 은은하고 여성스러운 꽃 향\n
      라벤더 (Lavender): 차분하고 깨끗한 허브 향
    `
  },
  {
    brand: 'Tom Ford',
    name: '오드 보이저 오 드 퍼퓸',
    slug: 'tom_ford_oud_voyager',
    image: '/image/fragrance/tom_ford/Oud_Voyager_Eau_de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Oud Voyager</span>
      <span class="text-bottom">오드 보이저(Oud Voyager)는 오드(Oud, 침향)를 마치 보석 같은 꽃의 향연으로 새롭게 탈바꿈시킨 향수입니다. 톰 포드는 희귀한 오드와 풍성한 플로럴 노트를 정교하게 결합한 독자적인 플로럴 오드 트리-디스틸레이트(floral oud tri-distillate)를 선보입니다. 장미 같은 생명력을 지닌 제라늄 앱솔루트가 신선함을 더하고, 리빙 레드 피오니™ 어코드가 벨벳처럼 부드러운 질감을 선사합니다. 오직 톰 포드만을 위해 수확된 익스클루시브 오드는 특유의 우디한 생동감으로 향의 중심을 잡아줍니다. 자력처럼 끌리는 신비로움을 가진 이 우디 플로럴 향수는 오드의 새로운 여정을 시작합니다. 전설적인 성분인 오드가 리빙 레드 피오니™ 어코드와 제라늄 앱솔루트라는 두 가지 관능적인 꽃향기와 얽히며, 영원한 아름다움을 향한 독특한 조화를 만들어냅니다. 특히 톰 포드만을 위해 특별히 제작된 플로럴 오드 트리-디스틸레이트는 개별 성분들과 결합하여 더욱 강렬한 열망과 시그니처 향을 증폭시킵니다.</span>`,
    notes: `
      제라늄 앱솔루트 (Geranium Absolute): 장미와 유사한 싱그럽고 생기 넘치는 꽃향기\n
      리빙 레드 피오니™ 어코드 (Living Red Peony™ Accord): 벨벳처럼 부드럽고 풍성한 붉은 작약의 향\n
      플로럴 오드 트리-디스틸레이트 (Floral Oud Tri-Distillate): 제라늄, 오드, 레드 피오니를 세 번 증류하여 얻은 톰 포드만의 독자적인 혼합 원료\n
      시프리올 (Cypriol): 흙내음과 스파이시함이 섞인 우디한 향\n
      오드 (Oud): 깊고 신비로운 나무의 향 (침향)\n
      오스만투스 (Osmanthus): 잘 익은 살구처럼 달콤하고 부드러운 꽃향기 
    `
  },
  {
    brand: 'Tom Ford',
    name: '오드우드 오 드 퍼퓸',
    slug: 'tom_ford_oud_wood',
    image: '/image/fragrance/tom_ford/Oud_Wood_Eau_de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Oud Wood</span>
      <span class="text-bottom">오드 우드(Oud Wood)를 통해 톰 포드는 희귀한 오드(Oud, 침향) 노트를 사용하여 어둡고 대지적인 관능미로 오감을 압도합니다. 이국적인 로즈우드와 카다멈은 귀중한 오드 노트, 샌달우드, 베티버의 스모키한 조합으로 이어지며, 톤카 빈과 앰버가 따스함과 관능미를 더해줍니다. 오드 우드는 희귀한 오드 노트와 이국적인 스파이스, 카다멈으로 당신을 감싸 안으며, 이내 풍부하고 어두운 관능적 조화를 드러냅니다.</span>`,
    notes: `
      카다멈 (Cardamom): 이국적이고 쌉싸름한 스파이스 향\n
      핑크 페퍼 (Pink Pepper): 톡 쏘는 듯한 세련된 스파이시함\n
      패출리 (Patchouli): 깊고 묵직한 흙내음\n
      앰버 (Amber): 따뜻하고 고급스러운 잔향\n
      오드 (Oud): 신비롭고 압도적인 나무의 향 (침향)\n
      톤카 빈 (Tonka Bean): 부드럽고 달콤한 관능미
    `
  },
  {
    brand: 'Tom Ford',
    name: '로즈 익스포즈드 오 드 퍼퓸',
    slug: 'tom_ford_rose_exposed',
    image: '/image/fragrance/tom_ford/Rose_Exposed_Eau_de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Rose Exposed</span>
      <span class="text-bottom">플로럴 레더의 극치를 보여주는 이 경이로운 향수는 로즈 앱솔루트와 로즈 워터 익스트랙을 결합하여 오직 톰 포드만을 위해 공동 증류한 독자적인 '로즈-온-로즈(rose-on-rose)' 노트를 선보입니다. 진귀한 꽃들이 화이트 페퍼, 머스크, 그리고 우드와 어우러져 마법 같은 부케를 형성하며 감각을 사로잡습니다. 로즈 익스포즈드(Rose Exposed)는 장미의 모든 것을 가감 없이 드러냅니다. 마치 가장 화려하게 피어난 장미의 찰나를 포착한 듯, 부드러운 레더에 감싸인 채 야생적인 면모를 간직한 순수한 아름다움의 결정체를 보여줍니다.</span>`,
    notes: `
      독자적인 로즈-온-로즈 공동 증류 성분 (Exclusive rose-on-rose co-distillation): 장미의 정수를 극대화한 특별한 원료\n
      로즈 에센스 (Rose essence): 싱그럽고 신선한 장미 본연의 향\n
      로즈 컨센트레이트 (Rose concentrate): 깊고 농밀한 장미의 풍미\n
      화이트 페퍼 (White Pepper): 깨끗하고 알싸한 자극\n
      블랙 레더 어코드 (Black leather accord): 세련되고 관능적인 가죽의 질감\n
      캐시머란 (Cashmeran): 부드럽고 포근한 머스크-우디 향
    `
  },
  {
    brand: 'Tom Ford',
    name: '바닐라 섹스 오 드 퍼퓸',
    slug: 'tom_ford_vanilla_sex',
    image: '/image/fragrance/tom_ford/Vanilla_Sex_Eau de_Parfum.png',
    description: `<span class="text-top">Tom Ford · Vanilla Sex</span>
      <span class="text-bottom">본능적으로 중독적이고, 디자인적으로 열망을 불러일으킵니다. 바닐라 섹스(Vanilla Sex)는 깊고 진한 바닐라 노트와 밝고 화사한 바닐라 노트 사이의 매혹적인 상호작용을 조명합니다. 아이코닉한 원료인 바닐라에 밝고 관능적인 뉘앙스를 더한 톰 포드만의 독자적인 '바닐라 팅크 인디아(Vanilla Tincture India)' 어코드가 특징입니다. 바닐라 섹스 안에서 바닐라는 결코 평범하지 않은 특별한 역할을 수행합니다.</span>`,
    notes: `
      바닐라 팅크 인디아 (Vanilla Tincture India): 톰 포드만을 위해 설계된 밝고 세련된 바닐라 향\n
      바닐라 앱솔루트 (Vanilla Absolute): 깊고 풍부하며 농밀한 바닐라의 정수\n
      샌달우드 에센스 (Sandalwood Essence): 부드럽고 우아한 나무의 온기\n
      자스민 앱솔루트 (Jasmine Absolute): 관능적이고 화려한 화이트 플로럴 향\n
      오리스 어코드 (Orris Accord): 귀한 붓꽃 뿌리에서 추출한 파우더리하고 고급스러운 향\n
      아니말리스 어코드 (Animalis Accord): 원초적이고 매혹적인 살결의 느낌을 더하는 향
    `
  },
];

export default fragranceDetailData;

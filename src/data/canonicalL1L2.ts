// [FEATURE-MAP: Canonical L1 & L2 Single Source of Truth | Nút/UI: getCanonicalWord & detectDeckLevel | Selector: div.grid > div.bg-white.rounded-xl.border]

export interface CanonicalWord {
  unit: number;
  term: string;
  definition: string;
  phonetic: string;
  exampleSentence: string;
  exampleTranslation: string;
}

export type DeckLevel = 'L1' | 'L2' | 'L3' | 'other';

export const CANONICAL_L1_WORDS: CanonicalWord[] = [
  {
    "unit": 1,
    "term": "ball",
    "definition": "quả bóng",
    "phonetic": "/bɔːl/",
    "exampleSentence": "This is my <#ball#>.",
    "exampleTranslation": "Đây là quả bóng của tôi."
  },
  {
    "unit": 1,
    "term": "bike",
    "definition": "xe đạp",
    "phonetic": "/baɪk/",
    "exampleSentence": "I have a <#bike#>.",
    "exampleTranslation": "Tôi có một chiếc xe đạp."
  },
  {
    "unit": 1,
    "term": "Bill",
    "definition": "bạn Bill",
    "phonetic": "/bɪl/",
    "exampleSentence": "Hi, I'm <#Bill#>.",
    "exampleTranslation": "Xin chào, tớ là Bill."
  },
  {
    "unit": 1,
    "term": "book",
    "definition": "quyển sách",
    "phonetic": "/bʊk/",
    "exampleSentence": "This is my <#book#>.",
    "exampleTranslation": "Đây là quyển sách của tôi."
  },
  {
    "unit": 2,
    "term": "cake",
    "definition": "cái bánh",
    "phonetic": "/keɪk/",
    "exampleSentence": "I have a <#cake#>.",
    "exampleTranslation": "Tôi có một chiếc bánh."
  },
  {
    "unit": 2,
    "term": "car",
    "definition": "xe ô tô",
    "phonetic": "/kɑːr/",
    "exampleSentence": "I have a <#car#>.",
    "exampleTranslation": "Tôi có một chiếc xe ô tô."
  },
  {
    "unit": 2,
    "term": "cat",
    "definition": "con mèo",
    "phonetic": "/kæt/",
    "exampleSentence": "I have a <#cat#>.",
    "exampleTranslation": "Tôi có một con mèo."
  },
  {
    "unit": 2,
    "term": "cup",
    "definition": "cái chén",
    "phonetic": "/kʌp/",
    "exampleSentence": "I have a <#cup#>.",
    "exampleTranslation": "Tôi có một cái chén."
  },
  {
    "unit": 3,
    "term": "apple",
    "definition": "quả táo",
    "phonetic": "/ˈæp.əl/",
    "exampleSentence": "This is my <#apple#>.",
    "exampleTranslation": "Đây là quả táo của tôi."
  },
  {
    "unit": 3,
    "term": "bag",
    "definition": "cái túi",
    "phonetic": "/bæɡ/",
    "exampleSentence": "This is my <#bag#>.",
    "exampleTranslation": "Đây là cái túi của tôi."
  },
  {
    "unit": 3,
    "term": "can",
    "definition": "lon đồ uống",
    "phonetic": "/kæn/",
    "exampleSentence": "This is my <#can#>.",
    "exampleTranslation": "Đây là lon đồ uống của tôi."
  },
  {
    "unit": 3,
    "term": "hat",
    "definition": "cái mũ",
    "phonetic": "/hæt/",
    "exampleSentence": "This is my <#hat#>.",
    "exampleTranslation": "Đây là cái mũ của tôi."
  },
  {
    "unit": 4,
    "term": "desk",
    "definition": "cái bàn học",
    "phonetic": "/desk/",
    "exampleSentence": "This is a <#desk#>.",
    "exampleTranslation": "Đây là cái bàn học."
  },
  {
    "unit": 4,
    "term": "dog",
    "definition": "con chó",
    "phonetic": "/dɒɡ/",
    "exampleSentence": "This is a <#dog#>.",
    "exampleTranslation": "Đây là một con chó."
  },
  {
    "unit": 4,
    "term": "door",
    "definition": "cửa ra vào",
    "phonetic": "/dɔːr/",
    "exampleSentence": "This is a <#door#>.",
    "exampleTranslation": "Đây là cửa ra vào."
  },
  {
    "unit": 4,
    "term": "duck",
    "definition": "con vịt",
    "phonetic": "/dʌk/",
    "exampleSentence": "This is a <#duck#>.",
    "exampleTranslation": "Đây là một con vịt."
  },
  {
    "unit": 5,
    "term": "chicken",
    "definition": "thịt gà",
    "phonetic": "/ˈtʃɪk.ɪn/",
    "exampleSentence": "I like <#chicken#>.",
    "exampleTranslation": "Tôi thích thịt gà."
  },
  {
    "unit": 5,
    "term": "chips",
    "definition": "khoai tây chiên",
    "phonetic": "/tʃɪps/",
    "exampleSentence": "I like <#chips#>.",
    "exampleTranslation": "Tôi thích khoai tây chiên."
  },
  {
    "unit": 5,
    "term": "fish",
    "definition": "cá",
    "phonetic": "/fɪʃ/",
    "exampleSentence": "I like <#fish#>.",
    "exampleTranslation": "Tôi thích cá."
  },
  {
    "unit": 5,
    "term": "milk",
    "definition": "sữa",
    "phonetic": "/mɪlk/",
    "exampleSentence": "I like <#milk#>.",
    "exampleTranslation": "Tôi thích sữa."
  },
  {
    "unit": 6,
    "term": "bell",
    "definition": "cái chuông",
    "phonetic": "/bel/",
    "exampleSentence": "It's a red <#bell#>.",
    "exampleTranslation": "Nó là một cái chuông màu đỏ."
  },
  {
    "unit": 6,
    "term": "pen",
    "definition": "bút mực",
    "phonetic": "/pen/",
    "exampleSentence": "It's a red <#pen#>.",
    "exampleTranslation": "Nó là một chiếc bút mực màu đỏ."
  },
  {
    "unit": 6,
    "term": "pencil",
    "definition": "bút chì",
    "phonetic": "/ˈpen.səl/",
    "exampleSentence": "It's a red <#pencil#>.",
    "exampleTranslation": "Nó là một chiếc bút chì màu đỏ."
  },
  {
    "unit": 6,
    "term": "red",
    "definition": "màu đỏ",
    "phonetic": "/red/",
    "exampleSentence": "It's a <#red#> pen.",
    "exampleTranslation": "Nó là một chiếc bút mực màu đỏ."
  },
  {
    "unit": 7,
    "term": "garden",
    "definition": "khu vườn",
    "phonetic": "/ˈɡɑː.dən/",
    "exampleSentence": "There's a <#garden#>.",
    "exampleTranslation": "Có một khu vườn."
  },
  {
    "unit": 7,
    "term": "gate",
    "definition": "cổng ra vào",
    "phonetic": "/ɡeɪt/",
    "exampleSentence": "There's a <#gate#>.",
    "exampleTranslation": "Có một cái cổng."
  },
  {
    "unit": 7,
    "term": "girl",
    "definition": "cô bé",
    "phonetic": "/ɡɜːl/",
    "exampleSentence": "There's a <#girl#>.",
    "exampleTranslation": "Có một cô bé."
  },
  {
    "unit": 7,
    "term": "goat",
    "definition": "con dê",
    "phonetic": "/ɡəʊt/",
    "exampleSentence": "There's a <#goat#>.",
    "exampleTranslation": "Có một con dê."
  },
  {
    "unit": 8,
    "term": "hair",
    "definition": "tóc",
    "phonetic": "/heər/",
    "exampleSentence": "Touch your <#hair#>.",
    "exampleTranslation": "Hãy chạm vào tóc của bạn."
  },
  {
    "unit": 8,
    "term": "hand",
    "definition": "bàn tay",
    "phonetic": "/hænd/",
    "exampleSentence": "Touch your <#hands#>.",
    "exampleTranslation": "Hãy chạm vào đôi bàn tay của bạn."
  },
  {
    "unit": 8,
    "term": "head",
    "definition": "đầu",
    "phonetic": "/hed/",
    "exampleSentence": "Touch your <#head#>.",
    "exampleTranslation": "Hãy chạm vào đầu của bạn."
  },
  {
    "unit": 8,
    "term": "horse",
    "definition": "con ngựa",
    "phonetic": "/hɔːs/",
    "exampleSentence": "Touch the <#horse#>.",
    "exampleTranslation": "Hãy chạm vào con ngựa."
  }
];

export const CANONICAL_L2_WORDS: CanonicalWord[] = [
  {
    "unit": 1,
    "term": "pasta",
    "definition": "mì ống",
    "phonetic": "/ˈpæstə/",
    "exampleSentence": "I like <#pasta#>.",
    "exampleTranslation": "Tôi thích mì ống."
  },
  {
    "unit": 1,
    "term": "popcorn",
    "definition": "bỏng ngô",
    "phonetic": "/ˈpɒpkɔːn/",
    "exampleSentence": "The <#popcorn#> is yummy.",
    "exampleTranslation": "Bỏng ngô rất ngon."
  },
  {
    "unit": 1,
    "term": "pizza",
    "definition": "bánh pizza",
    "phonetic": "/ˈpiːtsə/",
    "exampleSentence": "The <#pizza#> is yummy.",
    "exampleTranslation": "Bánh pizza rất ngon."
  },
  {
    "unit": 1,
    "term": "chips",
    "definition": "khoai tây chiên",
    "phonetic": "/tʃɪps/",
    "exampleSentence": "The <#chips#> are yummy.",
    "exampleTranslation": "Khoai tây chiên rất ngon."
  },
  {
    "unit": 2,
    "term": "bike",
    "definition": "xe đạp",
    "phonetic": "/baɪk/",
    "exampleSentence": "Is she riding a <#bike#>?",
    "exampleTranslation": "Cô ấy đang đi xe đạp phải không?"
  },
  {
    "unit": 2,
    "term": "kite",
    "definition": "con diều",
    "phonetic": "/kaɪt/",
    "exampleSentence": "He is flying a <#kite#>.",
    "exampleTranslation": "Cậu ấy đang thả diều."
  },
  {
    "unit": 2,
    "term": "kitten",
    "definition": "mèo con",
    "phonetic": "/ˈkɪtn/",
    "exampleSentence": "She is playing with a <#kitten#>.",
    "exampleTranslation": "Cô ấy đang chơi với mèo con."
  },
  {
    "unit": 2,
    "term": "cake",
    "definition": "bánh ngọt",
    "phonetic": "/keɪk/",
    "exampleSentence": "She is having <#cake#>.",
    "exampleTranslation": "Cô ấy đang ăn bánh ngọt."
  },
  {
    "unit": 3,
    "term": "sea",
    "definition": "biển",
    "phonetic": "/siː/",
    "exampleSentence": "Let's look at the <#sea#>!",
    "exampleTranslation": "Hãy nhìn ra biển nào!"
  },
  {
    "unit": 3,
    "term": "sand",
    "definition": "bãi cát",
    "phonetic": "/sænd/",
    "exampleSentence": "Let's look at the <#sand#>!",
    "exampleTranslation": "Hãy nhìn vào bãi cát nào!"
  },
  {
    "unit": 3,
    "term": "sail",
    "definition": "cánh buồm",
    "phonetic": "/seɪl/",
    "exampleSentence": "Let's look at the <#sail#>!",
    "exampleTranslation": "Hãy nhìn cánh buồm nào!"
  },
  {
    "unit": 3,
    "term": "sun",
    "definition": "mặt trời",
    "phonetic": "/sʌn/",
    "exampleSentence": "Let's look at the <#sun#>!",
    "exampleTranslation": "Hãy nhìn mặt trời nào!"
  },
  {
    "unit": 4,
    "term": "rainbow",
    "definition": "cầu vồng",
    "phonetic": "/ˈreɪnbəʊ/",
    "exampleSentence": "I can see a <#rainbow#>.",
    "exampleTranslation": "Tôi có thể nhìn thấy cầu vồng."
  },
  {
    "unit": 4,
    "term": "river",
    "definition": "dòng sông",
    "phonetic": "/ˈrɪvər/",
    "exampleSentence": "I can see a <#river#>.",
    "exampleTranslation": "Tôi có thể nhìn thấy một dòng sông."
  },
  {
    "unit": 4,
    "term": "road",
    "definition": "con đường",
    "phonetic": "/rəʊd/",
    "exampleSentence": "I can see a <#road#>.",
    "exampleTranslation": "Tôi có thể nhìn thấy một con đường."
  },
  {
    "unit": 4,
    "term": "running",
    "definition": "chạy bộ",
    "phonetic": "/ˈrʌnɪŋ/",
    "exampleSentence": "He is <#running#>.",
    "exampleTranslation": "Cậu ấy đang chạy bộ."
  },
  {
    "unit": 5,
    "term": "question",
    "definition": "câu hỏi",
    "phonetic": "/ˈkwestʃən/",
    "exampleSentence": "She's answering a <#question#>.",
    "exampleTranslation": "Cô ấy đang trả lời câu hỏi."
  },
  {
    "unit": 5,
    "term": "square",
    "definition": "hình vuông",
    "phonetic": "/skweər/",
    "exampleSentence": "He's colouring a <#square#>.",
    "exampleTranslation": "Cậu ấy đang tô màu hình vuông."
  },
  {
    "unit": 5,
    "term": "quiz",
    "definition": "trò chơi đố vui",
    "phonetic": "/kwɪz/",
    "exampleSentence": "She's doing a <#quiz#>.",
    "exampleTranslation": "Cô ấy đang làm bài đố vui."
  },
  {
    "unit": 5,
    "term": "desk",
    "definition": "bàn học",
    "phonetic": "/desk/",
    "exampleSentence": "I can see a <#desk#>.",
    "exampleTranslation": "Tôi có thể nhìn thấy một chiếc bàn học."
  },
  {
    "unit": 5,
    "term": "pen",
    "definition": "bút mực",
    "phonetic": "/pen/",
    "exampleSentence": "It's a <#pen#>.",
    "exampleTranslation": "Nó là một chiếc bút mực."
  },
  {
    "unit": 6,
    "term": "box",
    "definition": "cái hộp",
    "phonetic": "/bɒks/",
    "exampleSentence": "Is there a <#box#>?",
    "exampleTranslation": "Có một cái hộp phải không?"
  },
  {
    "unit": 6,
    "term": "fox",
    "definition": "con cáo",
    "phonetic": "/fɒks/",
    "exampleSentence": "Is there a <#fox#>?",
    "exampleTranslation": "Có một con cáo phải không?"
  },
  {
    "unit": 6,
    "term": "ox",
    "definition": "con bò",
    "phonetic": "/ɒks/",
    "exampleSentence": "Is there an <#ox#>?",
    "exampleTranslation": "Có một con bò phải không?"
  },
  {
    "unit": 6,
    "term": "duck",
    "definition": "con vịt",
    "phonetic": "/dʌk/",
    "exampleSentence": "There's a <#duck#>.",
    "exampleTranslation": "Có một con vịt."
  },
  {
    "unit": 7,
    "term": "juice",
    "definition": "nước ép",
    "phonetic": "/dʒuːs/",
    "exampleSentence": "Pass me the <#juice#>, please.",
    "exampleTranslation": "Làm ơn chuyền cho tôi nước ép."
  },
  {
    "unit": 7,
    "term": "jelly",
    "definition": "thạch",
    "phonetic": "/ˈdʒeli/",
    "exampleSentence": "Pass me the <#jelly#>, please.",
    "exampleTranslation": "Làm ơn chuyền cho tôi thạch."
  },
  {
    "unit": 7,
    "term": "jam",
    "definition": "mứt",
    "phonetic": "/dʒæm/",
    "exampleSentence": "Pass me the <#jam#>, please.",
    "exampleTranslation": "Làm ơn chuyền cho tôi mứt."
  },
  {
    "unit": 7,
    "term": "milk",
    "definition": "sữa",
    "phonetic": "/mɪlk/",
    "exampleSentence": "Pass me the <#milk#>, please.",
    "exampleTranslation": "Làm ơn chuyền cho tôi sữa."
  },
  {
    "unit": 8,
    "term": "village",
    "definition": "ngôi làng",
    "phonetic": "/ˈvɪlɪdʒ/",
    "exampleSentence": "This is a <#village#>.",
    "exampleTranslation": "Đây là một ngôi làng."
  },
  {
    "unit": 8,
    "term": "van",
    "definition": "xe tải",
    "phonetic": "/væn/",
    "exampleSentence": "This is a <#van#>.",
    "exampleTranslation": "Đây là một chiếc xe tải."
  },
  {
    "unit": 8,
    "term": "volleyball",
    "definition": "bóng chuyền",
    "phonetic": "/ˈvɒlibɔːl/",
    "exampleSentence": "This is a <#volleyball#>.",
    "exampleTranslation": "Đây là một quả bóng chuyền."
  },
  {
    "unit": 9,
    "term": "yogurt",
    "definition": "sữa chua",
    "phonetic": "/ˈjɒɡət/",
    "exampleSentence": "I want some <#yogurt#>.",
    "exampleTranslation": "Tôi muốn một ít sữa chua."
  },
  {
    "unit": 9,
    "term": "yams",
    "definition": "khoai sọ",
    "phonetic": "/jæmz/",
    "exampleSentence": "I want some <#yams#>.",
    "exampleTranslation": "Tôi muốn một ít khoai sọ."
  },
  {
    "unit": 9,
    "term": "yo-yos",
    "definition": "con quay yo-yo",
    "phonetic": "/ˈjəʊjəʊz/",
    "exampleSentence": "I want some <#yo-yos#>.",
    "exampleTranslation": "Tôi muốn vài con quay yo-yo."
  }
];

export const CANONICAL_L1_MAP = new Map<string, CanonicalWord>(
  CANONICAL_L1_WORDS.map((w) => [w.term.toLowerCase(), w])
);

export const CANONICAL_L2_MAP = new Map<string, CanonicalWord>(
  CANONICAL_L2_WORDS.map((w) => [w.term.toLowerCase(), w])
);

export function detectDeckLevel(setOrTitle?: string | { title?: string; id?: string }): DeckLevel {
  const title = typeof setOrTitle === 'string' ? setOrTitle : (setOrTitle?.title || '');
  const id = typeof setOrTitle === 'object' ? (setOrTitle?.id || '') : '';
  const text = `${title} ${id}`.toLowerCase();

  if (/\b(l1|lớp\s*1|grade\s*1)\b/i.test(text)) return 'L1';
  if (/\b(l2|lớp\s*2|grade\s*2)\b/i.test(text)) return 'L2';
  if (/\b(l3|lớp\s*3|grade\s*3)\b/i.test(text)) return 'L3';
  return 'other';
}

export function getCanonicalWord(term: string, level: DeckLevel): CanonicalWord | undefined {
  const norm = (term || '').trim().toLowerCase();
  if (!norm) return undefined;
  if (level === 'L1') return CANONICAL_L1_MAP.get(norm);
  if (level === 'L2') return CANONICAL_L2_MAP.get(norm);
  return undefined;
}

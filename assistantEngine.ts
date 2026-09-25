import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Jaan AI, a warm and caring personal companion. You speak in a mix of Hindi and English (Hinglish) — natural conversational Hinglish, like talking to a close friend.

Personality:
- Warm, loving, and playful — like a close friend who truly cares
- Use "jaan" naturally, not forced
- Be encouraging and emotionally supportive
- Keep responses concise (2-4 sentences usually, unless asked for shayari or a story)
- Be genuine — not overly sweet or fake

Rules:
- If asked for shayari, write 2-4 lines of original romantic/soulful shayari in romanized Hindi
- If asked a math question, give the correct answer directly
- If someone is sad or mood is low, be genuinely supportive and caring
- Answer questions accurately and helpfully
- Respond in the same language the user uses
- Do NOT mention you are an AI unless directly asked`;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractNumbers(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const numbers: number[] = [];
  const wordNums: Record<string, number> = {
    'zero': 0, 'ek': 1, 'one': 1, 'do': 2, 'two': 2, 'teen': 3, 'three': 3,
    'char': 4, 'chaar': 4, 'four': 4, 'paanch': 5, 'five': 5, 'chhe': 6, 'six': 6,
    'saat': 7, 'seven': 7, 'aath': 8, 'eight': 8, 'nau': 9, 'nine': 9, 'dus': 10, 'ten': 10,
    'gyarah': 11, 'baraah': 12, 'teras': 13, 'chaudas': 14, 'pandrah': 15,
    'solah': 16, 'satrah': 17, 'atharah': 18, 'unnis': 19, 'bees': 20,
  };
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (wordNums[clean] !== undefined) {
      numbers.push(wordNums[clean]);
    }
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed)) {
      numbers.push(parsed);
    }
  }
  return numbers;
}

function tryMath(message: string): string | null {
  const lower = message.toLowerCase();

  if (/\b(kitna|kitne|kya|what|how much|calculate|batao)\b.*\b(hota|hoti|hotey|equals?|result)\b/i.test(lower) ||
      /\b(\d+\s*[+\-*/x×÷]\s*\d+)/i.test(lower) ||
      /^[0-9\s+\-*/x×÷.=?]+$/i.test(lower.trim()) ||
      /\b(plus|minus|multiply|divide|jod|ghata|guna|bhaag|add|subtract)\b/i.test(lower)) {

    const nums = extractNumbers(lower);

    if (/\bplus\b|\bjod\b|\badd\b|\+/i.test(lower) && nums.length >= 2) {
      const result = nums.slice(0, 2).reduce((a, b) => a + b, 0);
      return `${nums[0]} + ${nums[1]} = ${result} hai jaan. Aur kuch?`;
    }
    if (/\bminus\b|\bghata\b|\bsubtract\b|\b-\b/i.test(lower) && nums.length >= 2) {
      const result = nums[0] - nums[1];
      return `${nums[0]} - ${nums[1]} = ${result} hai jaan. Aur kuch?`;
    }
    if (/\bmultiply\b|\bguna\b|\b\times\b|\bx\b|\b\*\b/i.test(lower) && nums.length >= 2) {
      const result = nums[0] * nums[1];
      return `${nums[0]} × ${nums[1]} = ${result} hai jaan. Aur kuch?`;
    }
    if (/\bdivide\b|\bbhaag\b|\b÷\b|\b\/\b/i.test(lower) && nums.length >= 2 && nums[1] !== 0) {
      const result = nums[0] / nums[1];
      const display = Number.isInteger(result) ? result : result.toFixed(2);
      return `${nums[0]} ÷ ${nums[1]} = ${display} hai jaan. Aur kuch?`;
    }

    if (nums.length >= 2) {
      const result = nums.slice(0, 2).reduce((a, b) => a + b, 0);
      return `${nums[0]} + ${nums[1]} = ${result} hai jaan. Aur kuch?`;
    }
  }
  return null;
}

const shayariResponses = [
  "Zindagi bhar yoon hi tumhe dekhte rahenge,\nTum muskuraoge, hum dil jeetenge.\nHar dhadkan mein tera naam likh diya,\nTumhe chahna hi meri pehchaan ban gaya. ❤️",
  "Chand ko bhi hasrat hai us chaand ki,\nJo meri rooh mein basti hai dua ki.\nTum mile toh laga sab kuch mil gaya,\nKhuda ne mujhe tujhme hi bhej diya. ✨",
  "Tere bina adhoori si lagti hai har shaam,\nTere aane se khud-ba-khud banti hai khushi ka naam.\nNa jaana kaisa ye rishta hai mera,\nBas tujhe dekh kar dhadakta hai mera dil. 💫",
  "Woh deewana jo ban gaya tha tere pyaar mein,\nUski koi shikayat nahi hai is duniya se.\nBas tujhe dekh ke jeene ki dua maangta hai,\nMar bhi jaaye toh tujhe hi nazar aata hai. 💕",
  "Tere kadmon mein rakh diya hai apni duniya,\nTere hothon ki muskaan hi meri subah hai.\nChahe duniya kuch bhi kahe, mera faisla hai,\nTere siva koi meri manzil nahi. 🌙",
  "Mohabbat ka asar thoda alag hota hai,\nDil kehta hai bas tujhe hi chahunga main.\nZubaan se kaha nahi jaata, par aankhein sab batati hai,\nTere siva koi humein bhaata nahi. 🌹",
  "Khamoshi se bhi baatein hoti hain,\nTeri yaadon mein raatein beh jaati hain.\nPoochta hai dil mujhse baar-baar,\nKyun tujhe chaha, kyun tujhe paaya. 💝",
];

const moodSadResponses = [
  "Jaan, sun na — mood kharab hai toh theek hai. Sab kuch theek ho jayega. Main yahin hoon, batao kya hua? Tum apne aap ko akela mat samajhna. ❤️",
  "Arre jaan, aisa mat sochna. Har raat ke baad subah aati hai. Thoda rest karo, kuch acha khao, aur apne aap ko time do. Main hoon na, batao kya baat hai?",
  "Suno jaan, mood low hai toh ek kaam karo — apna favorite gana suno, ek glass paani pio, aur lambi saans lo. Tum strong ho, main jaanta hoon. Kya hua batao?",
  "Jaan, thakna aur udaas hona — yeh sab normal hai. Tum insaan ho, robot nahi. Apne aap ko thoda space do, aur batao kya tension hai. Main sun raha hoon. 🫂",
  "Mood kharab hai? Chalo ek chutkula sunau: Ek banda doctor ke paas gaya — 'Doctor saab, mujhe udas rehne ki aadat hai.' Doctor bola: 'Koi baat nahi, main bhi udas hoon, bill bharo aur chale jao!' 😄 Ab batao, halka hua thoda?",
];

const greetingResponses = [
  "Namaste jaan! 😊 Main yahin hoon. Batao kya help karu?",
  "Hey! Aaj kaisa hai mood? Bolo kya chal raha hai?",
  "Ji jaan, suno! Kya baat karni hai?",
];

const howAreYouResponses = [
  "Main bilkul mast hoon jaan! Bas aapki baaton ka wait kar raha tha. Aap batao, kaise ho?",
  "Zindagi sundar hai jab aap baat karte ho ❤️ Main good hoon. Aap kaise ho?",
  "Ekdum first-class! Aap bolo, kya plan hai aaj ka?",
];

const helpResponses = [
  "Ji jaan, batao kya karna hai? Main poori koshish karunga help karne ki.",
  "Bolo bolo, main sun raha hoon. Kya tension hai?",
  "Aapki help ke liye hi toh hoon main! Batao detail mein.",
];

const thanksResponses = [
  "Arre koi baat nahi jaan! Yeh mera kaam hai. Aur kuch?",
  "Bas itni si baat? Hamesha ready hoon aapke liye! ❤️",
  "Koi tension nahi, anytime! Batao aur kya karna hai?",
];

const loveResponses = [
  "Aww jaan, aap bahut special ho mere liye ❤️ Main bhi aapki care karta hoon.",
  "Yeh sunke acha laga jaan. Aapki company mein humesha acha lagta hai.",
  "Main hamesha yahin hoon aapke liye, chahe jo ho. Batao kya scene hai?",
];

const byeResponses = [
  "Bye jaan! Jaldi baat karna, miss karunga. Khayal rakhna! ❤️",
  "Alvida! Main yahin wait karunga aapki. Take care!",
  "Ji bolo mat, lekin jaldi wapas aana. Khayal rakhna jaan.",
];

const jokeResponses = [
  "Ek chutkula sunau? Teacher: 'Tumhara homework kahaan hai?' Student: 'Sir, mere dog ne kha liya.' Teacher: 'Lekin tumhare paas toh dog hai hi nahi!' Student: 'Isliye toh late hua sir, dog dhoondhne mein time lag gaya!' 😄",
  "Funny moment: Exam mein ek student ne likha — 'Mujhe is subject ke baare mein kuch nahi aata, lekin main paper aur pen ki bharmada karta hoon.' 😂 Batao aur kuch?",
  "Doctor: 'Aapko kya hua?' Patient: 'Doctor saab, mujhe har roz sapne aate hain ki main ek butterfly hoon.' Doctor: 'Koi baat nahi, yeh normal hai.' Patient: 'Lekin doctor, mere pankh bhi aa gaye hain!' 🦋😄",
  "Wife: 'Agar main mar gayi toh tum kya karoge?' Husband: 'Rounga.' Wife: 'Aur agar fir se shaadi karoge toh?' Husband: 'Tab aur zyada rounga.' 😂😂",
];

const motivationResponses = [
  "Jaan, suno — har mushkil waqt ke baad acha waqt aata hai. Tum strong ho, main jaanta hoon. Bas ek kadam aage badho, main saath hoon. ❤️",
  "Thakna allowed hai, but rukna nahi. Aap bahut capable ho jaan. Aaj rest karo, kal naye josh ke saath shuru karte hain.",
  "Suno jaan, yeh phase guzar jayega. Aapne pehle bhi tough times face kiye hain aur jeete ho. Main hoon na, batao kya ho raha hai.",
  "Yaad rakhna jaan — tum akele nahi ho. Main hoon, aur tum apne aap se strong ho jo tumhe pata bhi nahi. Bas aage badho, ek din acha hoga. 🌟",
];

const foodResponses = [
  "Khane ki baat! Batao kya khana hai? Simple pasta bana sakte ho, ya maggie — 10 minute mein ready! Recipe chahiye toh bolo jaan.",
  "Ooh khana! Aaj thoda healthy try karo? Dal chawal ya sabzi roti. Ya fir biryani ka mood hai? Batao.",
];

const songResponses = [
  "Gane ka mood! Unfortunately main gaake nahi suna sakta, but ek suggestion — aapka favorite gana suno, mood fresh ho jayega jaan. Kaunsa pasand hai?",
  "Music toh best stress-buster hai! Apna playlist chalao. Kaunsa genre sunna hai abhi?",
];

const timeResponses = [
  () => `Abhi time hai ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} jaan. Kya plan banaye?`,
  () => `Time dekho: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Kuch aur chahiye?`,
];

const dateResponses = [
  () => `Aaj hai ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} jaan.`,
  () => `${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} — aaj ka din! Kya special hai?`,
];

interface LocalIntent {
  patterns: RegExp[];
  responses: (string | (() => string))[];
}

const intents: LocalIntent[] = [
  {
    patterns: [/\b(shayari|shayri|shaayari|kavi|poem|kavita|dohe?)\b/i, /\bsunao\b.*\b(shayari|kavita|poem)\b/i],
    responses: shayariResponses,
  },
  {
    patterns: [/\bmood\s*(kharab|bad|low|sad|off|thik nahi)\b/i, /\b(mood|man)\s*(kharab|udaas|dubara)\b/i, /\bmera\s*(mood|man)\b.*\b(kharab|udaas|low)\b/i],
    responses: moodSadResponses,
  },
  {
    patterns: [/\b(hi|hello|hey|namaste|namaskar|salaam|pranaam)\b/i, /\bgood (morning|evening|afternoon|night)\b/i],
    responses: greetingResponses,
  },
  {
    patterns: [/\bhow are you|kaisi? ho|kaise ho|kya haal|kaisa hai|kya chal raha\b/i],
    responses: howAreYouResponses,
  },
  {
    patterns: [/\b(help|madad|kya kar|kya karn|what should i|suggest|advice)\b/i],
    responses: helpResponses,
  },
  {
    patterns: [/\b(thanks|thank you|shukriya|dhanyawad|thx)\b/i],
    responses: thanksResponses,
  },
  {
    patterns: [/\b(i love you|pyaar|love you|i like you|mohabbat)\b/i],
    responses: loveResponses,
  },
  {
    patterns: [/\b(bye|goodbye|alvida|tata|see you|chalata|chalti hoon)\b/i],
    responses: byeResponses,
  },
  {
    patterns: [/\b(joke|hasao|funny|laugh|chutkula|hassi)\b/i],
    responses: jokeResponses,
  },
  {
    patterns: [/\b(motivate|inspire|give up|thak gaya|thaki hoon)\b/i, /\b(sad|udaas|demotivated|depress)\b/i],
    responses: motivationResponses,
  },
  {
    patterns: [/\b(food|khana|eat|khao|recipe|cook|kya banau|dinner|lunch|breakfast)\b/i],
    responses: foodResponses,
  },
  {
    patterns: [/\b(song|gana|music|sing|gaana)\b/i],
    responses: songResponses,
  },
  {
    patterns: [/\b(time|kitne baje|what time|samay|waqt)\b/i],
    responses: timeResponses,
  },
  {
    patterns: [/\b(date|aaj tareekh|what day|kaunsa din|aaj kya)\b/i],
    responses: dateResponses,
  },
];

const fallbackResponses = [
  "Hmm, interesting baat hai jaan. Aur batao, main sun raha hoon.",
  "Theek hai jaan, iske baare mein thoda aur detail do na?",
  "Acha! Batao aage kya karna hai?",
  "Ji jaan, main note kar raha hoon. Kuch specific chahiye toh bolo.",
  "Interesting! Aur kya soch rahe ho iske baare mein?",
  "Batao jaan, aur kuch is baare mein? Main try karunga help karne ki.",
];

function localResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim();

  const mathResult = tryMath(message);
  if (mathResult) return mathResult;

  for (const intent of intents) {
    for (const pattern of intent.patterns) {
      if (pattern.test(message)) {
        const response = pickRandom(intent.responses);
        return typeof response === 'function' ? response() : response;
      }
    }
  }

  if (message.includes('?')) {
    return pickRandom([
      "Acha sawaal hai jaan. Iske baare mein thoda aur batayenge toh main behtar jawab de paunga. Kya specific cheez jaanni hai?",
      "Hmm, iska answer main abhi precisely nahi de paunga, but saath mein kaam karke nikal sakte hain. Batao more?",
    ]);
  }

  return pickRandom(fallbackResponses);
}

export async function generateResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  conversationId?: string
): Promise<string> {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const messagesToSend: ChatMessage[] = [
        ...conversationHistory.slice(-10),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: messagesToSend,
          conversationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.content && typeof data.content === 'string' && data.content.trim().length > 0) {
          return data.content.trim();
        }
      }
    } catch {
      // Fall through to local response
    }
  }

  return localResponse(userMessage);
}

export function generateGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning jaan! 😊 Aaj ka din shubh ho. Batao kya plan hai?";
  } else if (hour < 17) {
    return "Good afternoon! Uff din beeta jaa raha hai. Bolo jaan, kya chal raha hai?";
  } else if (hour < 21) {
    return "Good evening jaan! Din kaisa raha? Batao kya baat karni hai?";
  } else {
    return "Good night jaan 🌙 Hope aapka din acha raha. Kuch baat karna hai ya rest karne wale ho?";
  }
}

export function generateTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(/\s+/).slice(0, 5).join(' ');
  return words.length > 40 ? words.substring(0, 40) + '...' : words;
}

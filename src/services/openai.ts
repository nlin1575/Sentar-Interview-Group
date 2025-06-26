/* =====================================================================
   services/openai.ts   –  LOCAL LLM (Ollama) FOR GPT RESPONSES
   ---------------------------------------------------------------------
   npm install node-fetch@2    ← already done earlier
===================================================================== */

import path from 'path';
import fetch from 'node-fetch';
import { spawnSync } from 'child_process';
import { generateMockEmbedding, calculateEmbeddingCost } from '../utils/mockEmbedding';

/* Pipeline flag: we’re not talking to OpenAI at all */
export const isOpenAIAvailable = false;

/*───────────────────────────────────────────────────────────────────
  1.  Embeddings   (still mock)
───────────────────────────────────────────────────────────────────*/
const PY_SCRIPT = path.resolve(__dirname, '../utils/embed.py');

export async function generateEmbedding(
  text: string
): Promise<{ embedding: number[]; tokens: number; cost: number; type: 'real' | 'mock' }> {
  try {
    const result = spawnSync('python3', [PY_SCRIPT], { input: text, encoding: 'utf8', maxBuffer: 5_000_000 });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr || 'embed.py failed');

    const embedding = JSON.parse(result.stdout) as number[];
    if (!Array.isArray(embedding) || embedding.length !== 384) {
      throw new Error('Invalid embedding length');
    }

    /* Real cost: all-MiniLM is local ⇒ $0 */
    const tokens = Math.ceil(text.length / 4); // Approximate tokens (4 chars per token)
    return { embedding, tokens, cost: 0, type: 'real' };
  } catch (err) {
    console.warn('[EMBEDDING] Python embed failed, using mock:', err);
    const tokens = Math.ceil(text.length / 4); // Approximate tokens (4 chars per token)
    return {
      embedding: generateMockEmbedding(text, 384),
      tokens,
      cost: calculateEmbeddingCost(text),
      type: 'mock'
    };
  }
}

/*───────────────────────────────────────────────────────────────────
  2.  GPT Response – Ollama first, mock fallback
───────────────────────────────────────────────────────────────────*/
export async function generateGPTResponse(
  parsed: any,
  profile: any,
  carry_in: boolean,
  emotion_flip: boolean
): Promise<{ response: string; tokens: number; cost: number; type: 'real' | 'mock' }> {

  try {
    const prompt = buildEmpathyPrompt(parsed, profile, carry_in, emotion_flip);
    const fullPrompt = `
You are an empathetic AI companion. 
Reply with ONE sentence of gentle support that ends with an encouraging action or positive reassurance.
It MUST be 120 characters or fewer.

${prompt}

Response:
`;

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'phi',
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 40 }   // shorter completion
      })
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const { response } = (await res.json()) as { response: string };

    /* --- post-process to ONE sentence, ≤120 chars --- */
    const MAX = 120;
    let reply = response.replace(/\s+/g, ' ').trim();

    /* keep text up to first sentence end (. ! ?) */
    const firstEnd = reply.search(/[.!?]\s|[.!?]$/);
    if (firstEnd !== -1) reply = reply.slice(0, firstEnd + 1);

    /* hard cap length */
    if (reply.length > MAX) reply = reply.slice(0, MAX - 3).trimEnd() + '...';

    // Estimate tokens: prompt + response
    const promptTokens = Math.ceil(fullPrompt.length / 4);
    const responseTokens = Math.ceil(reply.length / 4);
    const totalTokens = promptTokens + responseTokens;

    return { response: reply, tokens: totalTokens, cost: 0, type: 'real' };
  } catch (err) {
    console.warn('[GPT_REPLY] Local LLM failed, using mock:', err);
    return generateMockGPTResponse(parsed, profile, carry_in, emotion_flip);
  }
}

/*──────── helper: build empathy prompt ────────*/
function buildEmpathyPrompt(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): string {
  /* ===== FEW-SHOT EXAMPLES ===== */
  const examples = `
User: I'm exhausted and overwhelmed.
AI: Rest is not failure—take a breath, you've got this.

User: I'm anxious about tomorrow's deadline.
AI: You've handled challenges before—focus now, victory ahead.

`;

  /* ===== CONTEXT ===== */
  let ctx = `User shared: themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], intent="${parsed.intent}".`;
  if (profile.entry_count === 0) {
    ctx += ' This is their first diary entry.';
  } else {
    ctx += ` Dominant vibe so far "${profile.dominant_vibe}" (${profile.entry_count} entries).`;
    if (emotion_flip) ctx += ' Emotion flip detected.';
    if (carry_in)     ctx += ' Continues recent pattern.';
  }

  return examples + ctx + '\nReply ≤120 characters (one sentence, encouragement required):';
}


/*──────────────── mock fallback (unchanged logic) ────────────────*/
function generateMockGPTResponse(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): { response: string; tokens: number; cost: number; type: 'real' | 'mock' } {
  const resp = generateEmpathicResponseMock(parsed, profile, carry_in, emotion_flip);
  const tokens = Math.ceil(resp.length / 4); // Approximate tokens for response
  return { response: resp, tokens, cost: 0, type: 'mock' }; // Mock cost = $0
}

/* ---- Mock helpers (same as before) ---- */
function generateEmpathicResponseMock(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): string {
  const vibe  = parsed.vibe[0]  || 'neutral';
  const theme = parsed.theme[0] || 'general';

  if (profile.entry_count === 0)            return firstEntry(vibe);
  if (emotion_flip)                         return flip(vibe);
  if (carry_in)                             return carry(vibe, theme);
                                            return standard(vibe);
}

const firstEntry = (v: string) => {
  const responses: Record<string, string[]> = {
    anxious: [
      "Sounds like you're feeling tense—that's okay.",
      "Welcome! Your feelings are valid and heard.",
      "First entry and already being brave—well done.",
      "Starting with honesty takes courage."
    ],
    excited: [
      "Love the energy! Keep that momentum going.",
      "What a wonderful way to begin this journey!",
      "Your enthusiasm is already shining through.",
      "Starting strong—I can feel your excitement!"
    ],
    exhausted: [
      "Rest is not failure—you're doing enough.",
      "Thank you for sharing even when you're tired.",
      "Your honesty about fatigue shows self-awareness.",
      "First step taken, even while weary—that's strength."
    ],
    confident: [
      "That confidence will take you far.",
      "Starting with self-assurance—I love it!",
      "Your confidence is already inspiring.",
      "What a powerful way to begin!"
    ],
    frustrated: [
      "Tough moments teach us the most.",
      "Thank you for trusting me with your frustration.",
      "Starting with real feelings—that's authentic.",
      "Your honesty about challenges is refreshing."
    ],
    grateful: [
      "Gratitude is a beautiful mindset.",
      "What a lovely way to start this journey!",
      "Your appreciation already sets a positive tone.",
      "Beginning with thankfulness—how wonderful!"
    ],
    sad: [
      "It's okay to feel down—you're not alone.",
      "Thank you for sharing your vulnerable feelings.",
      "Starting with honesty about sadness takes courage.",
      "Your openness is already a step toward healing."
    ],
    happy: [
      "Your joy is contagious—embrace it!",
      "What a delightful way to begin!",
      "Your happiness is already brightening my day.",
      "Starting with joy—the perfect foundation!"
    ]
  };

  const vibeResponses = responses[v];
  if (vibeResponses) {
    // Use a simple hash to pick a consistent but varied response
    const index = Math.abs(v.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % vibeResponses.length;
    return vibeResponses[index];
  }

  return "Thanks for sharing—I'm here to listen.";
};

const flip = (v: string) => {
  const responses: Record<string, string[]> = {
    anxious: [
      "Feeling different today—that's completely normal.",
      "Your mood has shifted—emotions are fluid.",
      "A change in emotional tone—you're human.",
      "Different feelings are emerging—that's okay."
    ],
    sad: [
      "It's okay to have down moments.",
      "Sadness is visiting—let it be heard.",
      "Your emotions are shifting—that's natural.",
      "Down feelings are part of the human experience."
    ],
    frustrated: [
      "Change in mood—let's work through it.",
      "Frustration is surfacing—that's information.",
      "Your emotional landscape is shifting.",
      "Different feelings are emerging—acknowledge them."
    ],
    exhausted: [
      "Your energy shifted—rest is needed.",
      "Fatigue is showing up—listen to your body.",
      "Energy levels are changing—that's normal.",
      "Tiredness is speaking—honor what it's saying."
    ],
    excited: [
      "Nice to see your spirits lift!",
      "Your energy is brightening—wonderful!",
      "Excitement is emerging—embrace it!",
      "Your mood is shifting upward—beautiful!"
    ],
    confident: [
      "Great to see you feeling stronger!",
      "Your confidence is emerging—own it!",
      "Self-assurance is growing—that's powerful.",
      "Strength is showing up—you're resilient."
    ],
    happy: [
      "Love seeing this positive shift!",
      "Joy is emerging—let it flow!",
      "Your happiness is surfacing—embrace it!",
      "Positive emotions are blooming—wonderful!"
    ],
    grateful: [
      "Beautiful change in perspective.",
      "Gratitude is emerging—that's transformative.",
      "Appreciation is flowing—how lovely!",
      "Thankfulness is surfacing—powerful shift."
    ]
  };

  const vibeResponses = responses[v];
  if (vibeResponses) {
    const index = Math.abs(v.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % vibeResponses.length;
    return vibeResponses[index];
  }

  // Fallback for emotion flips
  const fallbacks = [
    "Mood shifts happen—you're adapting beautifully.",
    "Emotional changes are natural—you're processing well.",
    "Your feelings are evolving—that's growth.",
    "Different emotions are surfacing—that's human."
  ];
  const fallbackIndex = Math.abs(v.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % fallbacks.length;
  return fallbacks[fallbackIndex];
};

const carry = (v: string, t: string) => {
  // Theme-based carry-in responses with variety
  const byTheme: Record<string, string[]> = {
    "work-life balance": [
      "This balance theme keeps coming up for you.",
      "You're still navigating that work-life harmony.",
      "Balance remains on your mind—that's important.",
      "Working through these balance challenges again."
    ],
    productivity: [
      "Your productivity focus continues to evolve.",
      "Still optimizing how you work—great awareness.",
      "Productivity patterns are developing nicely.",
      "You're consistently thinking about efficiency."
    ],
    "startup culture": [
      "Startup life keeps presenting new perspectives.",
      "The entrepreneurial journey continues to shape you.",
      "You're deeply engaged with this startup experience.",
      "Building something meaningful takes persistence."
    ],
    "personal growth": [
      "Your growth mindset keeps expanding.",
      "Self-development remains a priority—wonderful.",
      "You're consistently investing in yourself.",
      "Personal evolution is clearly important to you."
    ],
    relationships: [
      "Connections with others continue to matter to you.",
      "You're building meaningful relationships.",
      "Social bonds remain a focus—that's healthy.",
      "Your relational awareness keeps growing."
    ]
  };

  if (byTheme[t]) {
    const responses = byTheme[t];
    const index = Math.abs(t.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % responses.length;
    return responses[index];
  }

  // Vibe-based carry-in responses with variety
  const byVibe: Record<string, string[]> = {
    anxious: [
      "These anxious feelings are surfacing again.",
      "You're working through anxiety—that takes courage.",
      "Worry patterns are familiar, but so is your strength.",
      "Anxiety is visiting again—you know how to handle this."
    ],
    excited: [
      "Your enthusiasm keeps shining through!",
      "That excitement is becoming a beautiful pattern.",
      "Your energy continues to inspire.",
      "Excitement seems to be your natural state lately."
    ],
    exhausted: [
      "Fatigue is showing up again—listen to your body.",
      "You're recognizing tiredness—that's self-awareness.",
      "Rest continues to call to you.",
      "Your energy levels are asking for attention."
    ],
    grateful: [
      "Gratitude keeps flowing from you naturally.",
      "Your appreciation continues to grow.",
      "Thankfulness is becoming a beautiful habit.",
      "You're cultivating a grateful heart."
    ],
    confident: [
      "Your confidence is building consistently.",
      "Self-assurance keeps growing stronger.",
      "You're developing a solid sense of self.",
      "Confidence is becoming your natural state."
    ],
    neutral: [
      "You're developing consistent reflection patterns.",
      "These thoughtful moments are becoming regular.",
      "Your contemplative nature continues to show.",
      "Steady reflection is becoming your rhythm."
    ],
    happy: [
      "Joy keeps finding its way into your thoughts.",
      "Happiness is becoming a familiar visitor.",
      "Your positive energy continues to surface.",
      "Contentment seems to be growing in you."
    ],
    sad: [
      "You're allowing yourself to feel deeply again.",
      "These quieter emotions are part of your process.",
      "Sadness is visiting—you're handling it with grace.",
      "Your emotional honesty continues to show."
    ],
    frustrated: [
      "Frustration is surfacing again—that's information.",
      "You're recognizing these challenging feelings.",
      "These intense emotions are part of your growth.",
      "Your awareness of frustration is developing."
    ]
  };

  if (byVibe[v]) {
    const responses = byVibe[v];
    const index = Math.abs(v.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % responses.length;
    return responses[index];
  }

  // Fallback for carry-in situations
  const fallbacks = [
    "These patterns are becoming familiar to you.",
    "You're developing consistent themes in your reflections.",
    "Similar thoughts are surfacing—that's meaningful.",
    "You're processing recurring themes thoughtfully."
  ];
  const fallbackIndex = Math.abs((v + t).split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % fallbacks.length;
  return fallbacks[fallbackIndex];
};

const standard = (v: string) => {
  const responses: Record<string, string[]> = {
    anxious: [
      "Take a breath—you've got this.",
      "Anxiety is temporary, your strength is lasting.",
      "One step at a time—you're braver than you know.",
      "Your worries are valid, but so is your resilience."
    ],
    excited: [
      "That enthusiasm is infectious!",
      "Love seeing your energy shine through!",
      "Your excitement lights up the room.",
      "Channel that energy—amazing things await!"
    ],
    exhausted: [
      "Rest when you need it.",
      "Your body is asking for care—listen to it.",
      "Tired doesn't mean weak, it means human.",
      "Recovery is part of the journey."
    ],
    confident: [
      "That confidence suits you.",
      "Your self-assurance is inspiring.",
      "Own that confidence—you've earned it.",
      "Believing in yourself is half the battle won."
    ],
    frustrated: [
      "Challenges make us stronger.",
      "Your frustration shows you care deeply.",
      "This too shall pass—you're tougher than this.",
      "Channel that energy into positive change."
    ],
    grateful: [
      "Gratitude transforms everything.",
      "Your appreciation creates more joy.",
      "Thankfulness is a beautiful mindset.",
      "Gratitude multiplies the good in life."
    ],
    sad: [
      "Tough days don't last forever.",
      "It's okay to feel down—you're not alone.",
      "Your feelings are valid and temporary.",
      "Tomorrow holds new possibilities."
    ],
    happy: [
      "Your joy brightens the day.",
      "Happiness looks good on you!",
      "Your positive energy is contagious.",
      "Savor these beautiful moments."
    ]
  };

  const vibeResponses = responses[v];
  if (vibeResponses) {
    // Use a simple hash of the vibe to pick a consistent but varied response
    const index = Math.abs(v.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % vibeResponses.length;
    return vibeResponses[index];
  }

  return "Thanks for sharing your thoughts.";
};

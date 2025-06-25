/* =====================================================================
   services/openai.ts   –  LOCAL LLM (Ollama) FOR GPT RESPONSES
   ---------------------------------------------------------------------
   npm install node-fetch@2    ← already done earlier
===================================================================== */

import fetch from 'node-fetch';
import { generateMockEmbedding, calculateEmbeddingCost } from '../utils/mockEmbedding';

/* Pipeline flag: we’re not talking to OpenAI at all */
export const isOpenAIAvailable = false;

/*───────────────────────────────────────────────────────────────────
  1.  Embeddings   (still mock)
───────────────────────────────────────────────────────────────────*/
export async function generateEmbedding(text: string): Promise<{ embedding: number[]; cost: number }> {
  return {
    embedding: generateMockEmbedding(text, 384),
    cost: calculateEmbeddingCost(text)
  };
}

/*───────────────────────────────────────────────────────────────────
  2.  GPT Response – Ollama first, mock fallback
───────────────────────────────────────────────────────────────────*/
export async function generateGPTResponse(
  parsed: any,
  profile: any,
  carry_in: boolean,
  emotion_flip: boolean
): Promise<{ response: string; cost: number }> {

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

    return { response: reply, cost: 0 };
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
function generateMockGPTResponse(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): { response: string; cost: number } {
  const resp = generateEmpathicResponseMock(parsed, profile, carry_in, emotion_flip);
  return { response: resp, cost: 0.002 };
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

const firstEntry = (v: string) => ({
  anxious:    "Sounds like you're feeling tense—that's okay.",
  excited:    "Love the energy! Keep that momentum going.",
  driven:     "Your motivation is inspiring—stay focused.",
  curious:    "Great questions lead to great discoveries.",
  exhausted:  "Rest is not failure—you're doing enough.",
  confident:  "That confidence will take you far.",
  frustrated: "Tough moments teach us the most.",
  grateful:   "Gratitude is a beautiful mindset.",
  sad:        "It's okay to feel down—you're not alone.",
  happy:      "Your joy is contagious—embrace it!"
}[v] || "Thanks for sharing—I'm here to listen.");

const flip = (v: string) => ({
  anxious:    "🌊 Feeling different today—that's normal.",
  sad:        "💙 It's okay to have down moments.",
  frustrated: "🔄 Change in mood—let's work through it.",
  exhausted:  "💤 Your energy shifted—rest is needed.",
  excited:    "✨ Nice to see your spirits lift!",
  confident:  "💪 Great to see you feeling stronger!",
  happy:      "😊 Love seeing this positive shift!",
  grateful:   "🙏 Beautiful change in perspective."
}[v] || "🧩 Mood shifts happen—you're adapting.");

const carry = (v: string, t: string) => {
  const byTheme: Record<string,string> = {
    "work-life balance": "🧩 Still working on that balance, I see.",
    productivity:        "⚡ Productivity patterns continuing.",
    "startup culture":    "🚀 Startup life keeps you engaged.",
    "intern management":  "👥 Leadership thoughts persist.",
    "personal growth":    "🌱 Growth mindset showing again."
  };
  if (byTheme[t]) return byTheme[t];

  const byVibe: Record<string,string> = {
    driven:     "🧩 That drive keeps showing up 💪",
    anxious:    "🧩 Those worries are back—breathe 💨",
    curious:    "🧩 Your curiosity continues to spark ✨",
    exhausted:  "🧩 Still feeling drained—self-care time 💤"
  };
  return byVibe[v] || "🧩 Familiar patterns—you're processing.";
};

const standard = (v: string) => ({
  anxious:    "Take a breath—you've got this.",
  excited:    "That enthusiasm is infectious!",
  driven:     "Your determination shows.",
  curious:    "Questions lead to growth.",
  exhausted:  "Rest when you need it.",
  confident:  "That confidence suits you.",
  frustrated: "Challenges make us stronger.",
  grateful:   "Gratitude transforms everything.",
  sad:        "Tough days don't last forever.",
  happy:      "Your joy brightens the day."
}[v] || "Thanks for sharing your thoughts.");

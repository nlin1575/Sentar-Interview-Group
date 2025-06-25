import OpenAI from 'openai';
import { generateMockEmbedding, calculateEmbeddingCost } from '../utils/mockEmbedding';

// Auto-detect OpenAI API key and initialize client
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export const isOpenAIAvailable = !!openai;

/**
 * Generate embedding using OpenAI API or fallback to mock
 */
export async function generateEmbedding(text: string): Promise<{ embedding: number[], cost: number }> {
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      
      const embedding = response.data[0].embedding;
      const cost = calculateRealEmbeddingCost(text);
      
      return { embedding, cost };
    } catch (error) {
      console.warn('OpenAI embedding failed, falling back to mock:', error);
      return generateMockEmbeddingWithCost(text);
    }
  } else {
    return generateMockEmbeddingWithCost(text);
  }
}

/**
 * Generate GPT response using OpenAI API or fallback to mock
 */
export async function generateGPTResponse(
  parsed: any, 
  profile: any, 
  carry_in: boolean, 
  emotion_flip: boolean
): Promise<{ response: string, cost: number }> {
  if (openai) {
    try {
      const prompt = buildEmpathyPrompt(parsed, profile, carry_in, emotion_flip);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an empathetic AI companion. Generate a brief, caring response (≤55 characters) that acknowledges the user\'s feelings and provides gentle support.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      });
      
      const gptResponse = response.choices[0]?.message?.content?.trim() || 'I hear you.';
      const cost = calculateRealGPTCost(response.usage?.total_tokens || 0);
      
      // Ensure response is ≤55 characters
      const truncatedResponse = gptResponse.length > 55 ? gptResponse.substring(0, 52) + '...' : gptResponse;
      
      return { response: truncatedResponse, cost };
    } catch (error) {
      console.warn('OpenAI GPT failed, falling back to mock:', error);
      return generateMockGPTResponse(parsed, profile, carry_in, emotion_flip);
    }
  } else {
    return generateMockGPTResponse(parsed, profile, carry_in, emotion_flip);
  }
}

// Helper functions
function generateMockEmbeddingWithCost(text: string): { embedding: number[], cost: number } {
  return {
    embedding: generateMockEmbedding(text, 384),
    cost: calculateEmbeddingCost(text)
  };
}

function generateMockGPTResponse(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): { response: string, cost: number } {
  // Import the existing mock response logic
  const response = generateEmpathicResponseMock(parsed, profile, carry_in, emotion_flip);
  return { response, cost: 0.002 };
}

function buildEmpathyPrompt(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): string {
  const primaryVibe = parsed.vibe[0] || 'neutral';
  const primaryTheme = parsed.theme[0] || 'general';
  const isFirstEntry = profile.entry_count === 0;
  
  let prompt = `User shared: themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], intent="${parsed.intent}"`;
  
  if (isFirstEntry) {
    prompt += `. This is their first diary entry.`;
  } else {
    prompt += `. Their dominant vibe is "${profile.dominant_vibe}" (${profile.entry_count} entries).`;
    
    if (emotion_flip) {
      prompt += ` They're experiencing an emotion flip from their usual ${profile.dominant_vibe} to ${primaryVibe}.`;
    }
    
    if (carry_in) {
      prompt += ` This continues a pattern from recent entries.`;
    }
  }
  
  prompt += ` Generate a brief, empathetic response (≤55 chars).`;
  
  return prompt;
}

function calculateRealEmbeddingCost(text: string): number {
  // OpenAI text-embedding-ada-002: $0.0001 per 1K tokens
  // Rough estimate: ~4 characters per token
  const estimatedTokens = Math.ceil(text.length / 4);
  return (estimatedTokens / 1000) * 0.0001;
}

function calculateRealGPTCost(tokens: number): number {
  // GPT-3.5-turbo: $0.0015 per 1K input tokens, $0.002 per 1K output tokens
  // Simplified: average cost
  return (tokens / 1000) * 0.00175;
}

// Mock response generation (existing logic)
function generateEmpathicResponseMock(parsed: any, profile: any, carry_in: boolean, emotion_flip: boolean): string {
  const primaryVibe = parsed.vibe[0] || 'neutral';
  const primaryTheme = parsed.theme[0] || 'general';
  const isFirstEntry = profile.entry_count === 0;
  
  if (isFirstEntry) {
    return generateFirstEntryResponse(primaryVibe, primaryTheme);
  } else if (emotion_flip) {
    return generateEmotionFlipResponse(primaryVibe, profile.dominant_vibe);
  } else if (carry_in) {
    return generateCarryInResponse(primaryVibe, primaryTheme, profile);
  } else {
    return generateStandardResponse(primaryVibe, primaryTheme);
  }
}

function generateFirstEntryResponse(vibe: string, theme: string): string {
  const responses: Record<string, string> = {
    'anxious': "Sounds like you're feeling tense—that's okay.",
    'excited': "Love the energy! Keep that momentum going.",
    'driven': "Your motivation is inspiring—stay focused.",
    'curious': "Great questions lead to great discoveries.",
    'exhausted': "Rest is not failure—you're doing enough.",
    'confident': "That confidence will take you far.",
    'frustrated': "Tough moments teach us the most.",
    'grateful': "Gratitude is a beautiful mindset.",
    'sad': "It's okay to feel down—you're not alone.",
    'happy': "Your joy is contagious—embrace it!"
  };
  
  return responses[vibe] || "Thanks for sharing—I'm here to listen.";
}

function generateEmotionFlipResponse(currentVibe: string, dominantVibe: string): string {
  const flipResponses: Record<string, string> = {
    'anxious': "🌊 Feeling different today—that's normal.",
    'sad': "💙 It's okay to have down moments.",
    'frustrated': "🔄 Change in mood—let's work through it.",
    'exhausted': "💤 Your energy shifted—rest is needed.",
    'excited': "✨ Nice to see your spirits lift!",
    'confident': "💪 Great to see you feeling stronger!",
    'happy': "😊 Love seeing this positive shift!",
    'grateful': "🙏 Beautiful change in perspective."
  };
  
  return flipResponses[currentVibe] || "🧩 Mood shifts happen—you're adapting.";
}

function generateCarryInResponse(vibe: string, theme: string, profile: any): string {
  const carryResponses: Record<string, string> = {
    'work-life balance': "🧩 Still working on that balance, I see.",
    'productivity': "⚡ Productivity patterns continuing.",
    'startup culture': "🚀 Startup life keeps you engaged.",
    'intern management': "👥 Leadership thoughts persist.",
    'personal growth': "🌱 Growth mindset showing again."
  };
  
  const themeResponse = carryResponses[theme];
  if (themeResponse) return themeResponse;
  
  const vibeResponses: Record<string, string> = {
    'driven': "🧩 That drive keeps showing up 💪",
    'anxious': "🧩 Those worries are back—breathe 💨",
    'curious': "🧩 Your curiosity continues to spark ✨",
    'exhausted': "🧩 Still feeling drained—self-care time 💤"
  };
  
  return vibeResponses[vibe] || "🧩 Familiar patterns—you're processing.";
}

function generateStandardResponse(vibe: string, theme: string): string {
  const standardResponses: Record<string, string> = {
    'anxious': "Take a breath—you've got this.",
    'excited': "That enthusiasm is infectious!",
    'driven': "Your determination shows.",
    'curious': "Questions lead to growth.",
    'exhausted': "Rest when you need it.",
    'confident': "That confidence suits you.",
    'frustrated': "Challenges make us stronger.",
    'grateful': "Gratitude transforms everything.",
    'sad': "Tough days don't last forever.",
    'happy': "Your joy brightens the day."
  };
  
  return standardResponses[vibe] || "Thanks for sharing your thoughts.";
}

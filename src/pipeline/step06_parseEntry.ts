import { PipelineContext, LogEntry, ParsedEntry } from '../types';
import fetch from 'node-fetch';          // fetch for Node ≤18
import { jsonrepair } from 'jsonrepair'; // fixes almost-valid JSON
import OpenAI from 'openai';

function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (Array.isArray(val)) return val;
  if (val == null || val === '') return [];
  return [val as T];
}

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const isOpenAIAvailable = !!OPENAI_API_KEY;
const openai = isOpenAIAvailable ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Check for local LLM (Ollama) availability
async function isLocalLLMAvailable(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
    return res.ok;
  } catch {
    return false;
  }
}

/* -----------------------------------------------------------------
   LLM Selection: OpenAI → Local → Mock
   ----------------------------------------------------------------- */
async function parseWithLLM(text: string): Promise<{ parsed: ParsedEntry; tokens: number; cost: number; type: 'openai' | 'local' | 'mock' }> {
  const prompt = `
You are a JSON-only extraction engine.

Return **one single line** of STRICT JSON (double-quoted keys, no markdown, no comments).
If something is unclear, choose the closest reasonable value—never leave any array empty.

Field Guide
• **Theme**
    Meaning …… External topic of the entry  
    Detect …… nouns, topical hashtags  
    Example … "I keep checking Slack when tired"  
    Extract … ["work-life balance"]

• **Vibe**
    Meaning …… Emotional tone  
    Detect …… emotion words, intensifiers, punctuation  
    Example … "I'm exhausted and tense"  
    Extract … ["anxious","exhausted"]

• **Intent**
    Meaning …… Stated surface goal (want / plan / hope)  
    Detect …… verbs like want/plan/hope/need  
    Example … "I need rest, but worry I'll miss something"  
    Extract … "Rest without guilt"

• **Subtext**
    Meaning …… Hidden worry or underlying fear  
    Detect …… contrast words (but, however), tone shift  
    Example … "but I'm scared…"  
    Extract … "Fear of missing out"

• **Persona Trait**
    Meaning …… Behaviour style inferred from habits/phrasing  
    Detect …… repeated tone or phrasing ("keep checking Slack")  
    Example … "keep checking Slack"  
    Extract … ["conscientious","vigilant"]

• **Bucket**
    Meaning …… Broad entry category (how to file it)  
    Detect …… implicit; decide from context (thinking log, goal note, etc.)  
    Example … thinking log  
    Extract … ["Thought"]

Schema (use exactly this shape):
{
  "theme": ["#topic"],
  "vibe": ["tone"],
  "intent": "goal sentence",
  "subtext": "hidden worry",
  "persona_trait": ["trait"],
  "bucket": ["Thought"]
}

Example output (format only):
{"theme":["work-life balance"],"vibe":["anxious","exhausted"],"intent":"Rest without guilt","subtext":"Fear of missing out","persona_trait":["conscientious","vigilant"],"bucket":["Thought"]}

Diary entry:
"""${text}"""
JSON:
`;

  // Try OpenAI first
  if (isOpenAIAvailable && openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a JSON-only extraction engine. Return one single line of STRICT JSON with double-quoted keys, no markdown, no comments.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0
      });

      const responseText = response.choices[0].message.content?.trim() || '';
      
      // Grab first '{' … last '}'  (cuts out any chatter before repair)
      const first = responseText.indexOf('{');
      const last = responseText.lastIndexOf('}');
      if (first === -1 || last === -1) throw new Error('LLM did not return JSON');

      // Repair common LLM sins then parse
      const repaired = jsonrepair(responseText.slice(first, last + 1).trim());
      const parsed = JSON.parse(repaired) as ParsedEntry;

      const totalTokens = response.usage?.total_tokens || 0;
      
      // OpenAI gpt-4o-mini: $0.00015 per 1K input tokens, $0.0006 per 1K output tokens
      const inputCost = ((response.usage?.prompt_tokens || 0) / 1000) * 0.00015;
      const outputCost = ((response.usage?.completion_tokens || 0) / 1000) * 0.0006;
      const cost = inputCost + outputCost;

      return { parsed, tokens: totalTokens, cost, type: 'openai' };
    } catch (err) {
      console.warn('[PARSE_ENTRY] OpenAI failed, trying local:', err);
    }
  }

  // Try local LLM (Ollama)
  try {
    const localAvailable = await isLocalLLMAvailable();
    if (localAvailable) {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'phi',
          prompt,
          stream: false,
          options: { temperature: 0 }
        })
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

      const { response } = (await res.json()) as { response: string };

      // Grab first '{' … last '}'  (cuts out any chatter before repair)
      const first = response.indexOf('{');
      const last = response.lastIndexOf('}');
      if (first === -1 || last === -1) throw new Error('LLM did not return JSON');

      // Repair common LLM sins then parse
      const repaired = jsonrepair(response.slice(first, last + 1).trim());
      const parsed = JSON.parse(repaired) as ParsedEntry;

      // Estimate tokens: prompt + response
      const promptTokens = Math.ceil(prompt.length / 4);
      const responseTokens = Math.ceil(response.length / 4);
      const totalTokens = promptTokens + responseTokens;

      return { parsed, tokens: totalTokens, cost: 0, type: 'local' };
    }
  } catch (err) {
    console.warn('[PARSE_ENTRY] Local LLM failed, using mock:', err);
  }

  // Fallback to rule-based parsing (mock)
  const parsed = parseTextRuleBased(text);
  const tokens = Math.ceil(prompt.length / 4); // Approximate tokens for prompt
  return { parsed, tokens, cost: 0, type: 'mock' };
}

/* -----------------------------------------------------------------
   Exported pipeline step (async!) – remember to await in runner
   ----------------------------------------------------------------- */
   export async function step06_parseEntry(
    context: Partial<PipelineContext>
  ): Promise<{ context: Partial<PipelineContext>; log: LogEntry }> {
    if (!context.raw_text) throw new Error('raw_text is required for parsing');
  
    let parsed: ParsedEntry;
    let note: string;
    let parsingTokens: number = 0;
    let parsingCost: number = 0;
    let parsingType: 'openai' | 'local' | 'mock' = 'mock';
  
    try {
      const { parsed: llmParsed, tokens, cost, type } = await parseWithLLM(context.raw_text);
      parsed = llmParsed;
      parsingTokens = tokens;
      parsingCost = cost;
      parsingType = type;
      note = `[${type.toUpperCase()}] via ${type === 'openai' ? 'OpenAI' : type === 'local' ? 'Ollama' : 'Mock'}`;
    } catch (err) {
      console.warn('[PARSE_ENTRY] LLM failed, falling back to rule-based:', err);
      parsed = parseTextRuleBased(context.raw_text);
      parsingTokens = Math.ceil(context.raw_text.length / 4); // Approximate tokens
      parsingCost = 0;
      parsingType = 'mock';
      note = '[FALLBACK] rule-based parser';
    }

    parsed.theme         = toArray(parsed.theme);
    parsed.vibe          = toArray(parsed.vibe);
    parsed.persona_trait = toArray(parsed.persona_trait);
    parsed.bucket        = toArray(parsed.bucket);  
  
    /* update context with parsing costs */
    const updatedContext: Partial<PipelineContext> = { 
      ...context, 
      parsed,
      costs: {
        embedding_tokens: context.costs?.embedding_tokens || 0,
        embedding_cost: context.costs?.embedding_cost || 0,
        embedding_type: context.costs?.embedding_type || 'mock',
        parsing_tokens: parsingTokens,
        parsing_cost: parsingCost,
        parsing_type: parsingType,
        gpt_tokens: context.costs?.gpt_tokens || 0,
        gpt_cost: context.costs?.gpt_cost || 0,
        gpt_type: context.costs?.gpt_type || 'mock',
        total_tokens: (context.costs?.total_tokens || 0) + parsingTokens,
        total_cost: (context.costs?.total_cost || 0) + parsingCost
      }
    };
  
    /* log */
    const log: LogEntry = {
      tag: 'PARSE_ENTRY',
      input: `raw_text="${context.raw_text.slice(0, 40)}${context.raw_text.length > 40 ? '...' : ''}"`,
      output: `parsed=${JSON.stringify(parsed)}`,
      note
    };
  
    return { context: updatedContext, log };
  }

/*──────────────────────────────────────────────────────────────*/
/* 2 ── RULE-BASED PARSER                                       */
/*──────────────────────────────────────────────────────────────*/
function parseTextRuleBased(text: string): ParsedEntry {
  // Handle edge cases
  if (!text || text.trim().length === 0) {
    return {
      theme: ['general'],
      vibe: ['neutral'],
      intent: 'Express thoughts',
      subtext: 'Processing experiences',
      persona_trait: ['reflective'],
      bucket: ['Thought']
    };
  }

  const lower = text.toLowerCase();

  /* --- theme --- */
  const themeMap: Record<string, string[]> = {
    'work-life balance': ['work', 'life', 'balance', 'burnout', 'rest'],
    productivity: ['productive', 'efficiency', 'focus', 'deadline'],
    'startup culture': ['startup', 'company', 'culture', 'team'],
    'intern management': ['intern', 'mentoring', 'guidance'],
    'personal growth': ['learn', 'growth', 'development', 'skill'],
    relationships: ['friend', 'family', 'relationship'],
    health: ['health', 'exercise', 'sleep', 'tired', 'sick'],
    technology: ['code', 'programming', 'software', 'tech']
  };
  const theme =
    Object.entries(themeMap)
      .filter(([, kws]) => kws.some(k => lower.includes(k)))
      .map(([t]) => t) || ['general'];

  /* --- vibe --- */
  const vibeMap: Record<string, string[]> = {
    anxious: ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'panic', 'fear'],
    exhausted: ['tired', 'exhausted', 'drained', 'worn out', 'fatigue', 'weary'],
    excited: ['excited', 'thrilled', 'enthusiastic', 'energetic', 'pumped', 'motivated'],
    sad: ['sad', 'down', 'depressed', 'melancholy', 'blue', 'disappointed'],
    happy: ['happy', 'joy', 'cheerful', 'delighted', 'pleased', 'content', 'great'],
    grateful: ['grateful', 'thankful', 'appreciate', 'blessed'],
    confident: ['confident', 'proud', 'accomplished', 'successful'],
    frustrated: ['frustrated', 'annoyed', 'irritated', 'angry']
  };
  const detectedVibes = Object.entries(vibeMap)
    .filter(([, kws]) => kws.some(k => lower.includes(k)))
    .map(([v]) => v);

  // Add emoji-based vibe detection for emoji-heavy inputs
  const emojiVibes: string[] = [];
  if (text.includes('😀') || text.includes('😊') || text.includes('🎉') || text.includes('✨')) {
    emojiVibes.push('happy');
  }
  if (text.includes('😔') || text.includes('😢') || text.includes('😞')) {
    emojiVibes.push('sad');
  }
  if (text.includes('😰') || text.includes('😟') || text.includes('😨')) {
    emojiVibes.push('anxious');
  }
  if (text.includes('🔥') || text.includes('💪') || text.includes('🚀')) {
    emojiVibes.push('excited');
  }
  if (text.includes('🙏') || text.includes('💝') || text.includes('❤️')) {
    emojiVibes.push('grateful');
  }

  const allVibes = [...detectedVibes, ...emojiVibes];
  const vibe = allVibes.length > 0 ? [...new Set(allVibes)] : ['neutral'];

  /* --- intent (handle edge cases) --- */
  let intent = 'Express thoughts and feelings';

  // Handle very short inputs
  if (text.trim().length <= 3) {
    intent = 'Brief expression';
  } else {
    const mNeed = lower.match(/(?:need|want|plan|hope)\s+to\s+([^,.!?]+)/);
    if (mNeed) intent = `Work to ${mNeed[1].trim()}`;
  }

  /* --- subtext (simple cues) --- */
  let subtext = 'Processing experiences';
  if (lower.includes('but')) {
    subtext = 'Has conflicting feelings';
  } else if (text.trim().length <= 10) {
    subtext = 'Brief moment of reflection';
  }

  /* --- persona trait (handle edge cases) --- */
  let trait = ['reflective'];
  if (lower.includes('plan')) {
    trait = ['organiser'];
  } else if (text.trim().length <= 5) {
    trait = ['expressive'];
  }

  /* --- bucket --- */
  const bucket = ['Thought'];

  return { theme, vibe, intent, subtext, persona_trait: trait, bucket };
}
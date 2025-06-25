
import { PipelineContext, LogEntry, ParsedEntry } from '../types';
import fetch from 'node-fetch';          // fetch for Node ≤18
import { jsonrepair } from 'jsonrepair'; // fixes almost-valid JSON

/* -----------------------------------------------------------------
   Call Ollama (default model: `phi`) and return a ParsedEntry object
   ----------------------------------------------------------------- */
async function ollamaParse(text: string): Promise<ParsedEntry> {
  /* A VERY explicit prompt: forces strict, single-line JSON output. */
  const prompt = `
You are a JSON-only extraction engine.

Return **one single line** of STRICT JSON (double-quoted keys, no markdown, no comments).
If something is unclear, choose the closest reasonable value—never leave any array empty.

──────────────── Field Guide ────────────────
• **Theme**
    Meaning …… External topic of the entry  
    Detect …… nouns, topical hashtags  
    Example … “I keep checking Slack when tired”  
    Extract … ["work-life balance"]

• **Vibe**
    Meaning …… Emotional tone  
    Detect …… emotion words, intensifiers, punctuation  
    Example … “I’m exhausted and tense”  
    Extract … ["anxious","exhausted"]

• **Intent**
    Meaning …… Stated surface goal (want / plan / hope)  
    Detect …… verbs like want/plan/hope/need  
    Example … “I need rest, but worry I’ll miss something”  
    Extract … "Rest without guilt"

• **Subtext**
    Meaning …… Hidden worry or underlying fear  
    Detect …… contrast words (but, however), tone shift  
    Example … “but I’m scared…”  
    Extract … "Fear of missing out"

• **Persona Trait**
    Meaning …… Behaviour style inferred from habits/phrasing  
    Detect …… repeated tone or phrasing (“keep checking Slack”)  
    Example … “keep checking Slack”  
    Extract … ["conscientious","vigilant"]

• **Bucket**
    Meaning …… Broad entry category (how to file it)  
    Detect …… implicit; decide from context (thinking log, goal note, etc.)  
    Example … thinking log  
    Extract … ["Thought"]
──────────────────────────────────────────────

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

  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'phi',
      prompt,
      stream: false,
      // a deterministic model is easier to parse
      options: { temperature: 0 }
    })
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  /* Ollama wraps the real answer in { response: "...", done: true } */
  const { response } = (await res.json()) as { response: string };

  // Grab first '{' … last '}'  (cuts out any chatter before repair)
  const first = response.indexOf('{');
  const last  = response.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('LLM did not return JSON');

  // Repair common LLM sins then parse
  const repaired = jsonrepair(response.slice(first, last + 1).trim());
  return JSON.parse(repaired) as ParsedEntry;
}

/*──────────────────────────────────────────────────────────────*/
/* 2 ── RULE-BASED PARSER                                       */
/*──────────────────────────────────────────────────────────────*/
function parseTextRuleBased(text: string): ParsedEntry {
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
    anxious: ['anxious', 'worried', 'nervous', 'stressed'],
    exhausted: ['tired', 'exhausted', 'drained'],
    excited: ['excited', 'thrilled', 'enthusiastic'],
    sad: ['sad', 'down', 'depressed'],
    happy: ['happy', 'joy', 'cheerful']
  };
  const vibe =
    Object.entries(vibeMap)
      .filter(([, kws]) => kws.some(k => lower.includes(k)))
      .map(([v]) => v) || ['neutral'];

  /* --- intent (very simple fallback) --- */
  let intent = 'Express thoughts and feelings';
  const mNeed = lower.match(/(?:need|want|plan|hope)\s+to\s+([^,\.!?]+)/);
  if (mNeed) intent = `Work to ${mNeed[1].trim()}`;

  /* --- subtext (simple cues) --- */
  const subtext = lower.includes('but') ? 'Has conflicting feelings' : 'Processing experiences';

  /* --- persona trait (simple keywords) --- */
  const trait = lower.includes('plan') ? ['organiser'] : ['reflective'];

  /* --- bucket --- */
  const bucket = ['Thought'];

  return { theme, vibe, intent, subtext, persona_trait: trait, bucket };
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
  
    try {
      parsed = await ollamaParse(context.raw_text);
      note = '[LLM] phi via Ollama';
    } catch (err) {
      console.warn('[PARSE_ENTRY] LLM failed, falling back to rule-based:', err);
      parsed = parseTextRuleBased(context.raw_text);
      note = '[FALLBACK] rule-based parser';
    }
  
    /* update context */
    const updatedContext: Partial<PipelineContext> = { ...context, parsed };
  
    /* log */
    const log: LogEntry = {
      tag: 'PARSE_ENTRY',
      input: `raw_text="${context.raw_text.slice(0, 40)}${context.raw_text.length > 40 ? '...' : ''}"`,
      output: `parsed=${JSON.stringify(parsed)}`,
      note
    };
  
    return { context: updatedContext, log };
  }
import { PipelineContext, LogEntry, ParsedEntry } from '../types';

/**
 * Step 06: PARSE_ENTRY
 * Use ChatGPT-1 or rule-based extraction
 * Input: raw_text → Output: parsed
 */
export function step06_parseEntry(context: Partial<PipelineContext>): { context: Partial<PipelineContext>, log: LogEntry } {
  if (!context.raw_text) {
    throw new Error('raw_text is required for parsing');
  }

  // Rule-based parsing (mock GPT implementation)
  const parsed = parseTextRuleBased(context.raw_text);

  // Update context
  const updatedContext: Partial<PipelineContext> = {
    ...context,
    parsed
  };

  // Create log entry
  const log: LogEntry = {
    tag: 'PARSE_ENTRY',
    input: `raw_text="${context.raw_text.substring(0, 40)}${context.raw_text.length > 40 ? '...' : ''}"`,
    output: `parsed: themes=[${parsed.theme.join(', ')}], vibes=[${parsed.vibe.join(', ')}], intent="${parsed.intent}"`,
    note: `[ENHANCED] Balanced intent extraction (positive + conflict patterns) | ${parsed.theme.length} themes, ${parsed.vibe.length} vibes, ${parsed.persona_trait.length} traits`
  };

  return { context: updatedContext, log };
}

function parseTextRuleBased(text: string): ParsedEntry {
  const lowerText = text.toLowerCase();

  // Extract themes based on keywords and nouns
  const themes = extractThemes(lowerText);

  // Extract vibes based on emotion words and punctuation
  const vibes = extractVibes(lowerText, text);

  // Extract intent from goal-oriented language
  const intent = extractIntent(lowerText);

  // Extract subtext from contrasting words and tone shifts
  const subtext = extractSubtext(lowerText);

  // Extract persona traits from behavioral patterns
  const persona_traits = extractPersonaTraits(lowerText);

  // Determine bucket based on content type
  const bucket = determineBucket(lowerText);

  return {
    theme: themes,
    vibe: vibes,
    intent,
    subtext,
    persona_trait: persona_traits,
    bucket
  };
}

function extractThemes(text: string): string[] {
  const themeKeywords = {
    'work-life balance': ['work', 'life', 'balance', 'overtime', 'stress', 'burnout', 'rest'],
    'productivity': ['productive', 'efficiency', 'focus', 'distraction', 'procrastination', 'deadline'],
    'startup culture': ['startup', 'company', 'culture', 'team', 'meeting', 'project'],
    'intern management': ['intern', 'mentoring', 'teaching', 'guidance', 'management', 'leadership'],
    'personal growth': ['learn', 'growth', 'development', 'skill', 'improvement', 'challenge'],
    'relationships': ['friend', 'family', 'relationship', 'social', 'connection', 'communication'],
    'health': ['health', 'exercise', 'sleep', 'tired', 'energy', 'wellness'],
    'technology': ['code', 'programming', 'software', 'tech', 'computer', 'app']
  };

  const themes: string[] = [];
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      themes.push(theme);
    }
  }

  return themes.length > 0 ? themes : ['general'];
}

function extractVibes(lowerText: string, originalText: string): string[] {
  const vibeKeywords = {
    'anxious': ['anxious', 'worried', 'nervous', 'stressed', 'overwhelmed', 'panic'],
    'excited': ['excited', 'thrilled', 'enthusiastic', 'pumped', 'energetic'],
    'driven': ['motivated', 'determined', 'focused', 'ambitious', 'goal'],
    'curious': ['curious', 'wondering', 'interested', 'explore', 'discover'],
    'exhausted': ['tired', 'exhausted', 'drained', 'worn out', 'fatigue'],
    'confident': ['confident', 'sure', 'certain', 'capable', 'strong'],
    'frustrated': ['frustrated', 'annoyed', 'irritated', 'stuck', 'blocked'],
    'grateful': ['grateful', 'thankful', 'appreciate', 'blessed', 'lucky'],
    'sad': ['sad', 'down', 'depressed', 'blue', 'melancholy'],
    'happy': ['happy', 'joy', 'cheerful', 'pleased', 'content']
  };

  const vibes: string[] = [];
  for (const [vibe, keywords] of Object.entries(vibeKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      vibes.push(vibe);
    }
  }

  // Check punctuation for additional emotional cues
  if (originalText.includes('!')) {
    if (!vibes.includes('excited') && !vibes.includes('frustrated')) {
      vibes.push('excited');
    }
  }

  if (originalText.includes('?') && originalText.split('?').length > 2) {
    if (!vibes.includes('curious') && !vibes.includes('anxious')) {
      vibes.push('curious');
    }
  }

  return vibes.length > 0 ? vibes : ['neutral'];
}

function extractIntent(text: string): string {
  const lowerText = text.toLowerCase();

  // First, try to detect complex emotional conflicts and synthesize deeper intent
  const complexIntent = extractComplexIntent(lowerText, text);
  if (complexIntent) {
    return complexIntent;
  }

  // Fall back to enhanced pattern matching
  const enhancedIntent = extractEnhancedIntent(lowerText, text);
  if (enhancedIntent) {
    return enhancedIntent;
  }

  // Final fallback to basic patterns
  const basicIntent = extractBasicIntent(lowerText);
  return basicIntent || 'Express thoughts and feelings';
}

// Enhanced intent extraction with deep emotional understanding
function extractComplexIntent(lowerText: string, _originalText: string): string | null {
  // Pattern 1: "I need X but I'm scared/worried/afraid Y" → "Find X without fear/guilt"
  const needButScaredPattern = /i\s+(?:know\s+i\s+)?need\s+([^,\.!?]+)(?:,?\s*but|however|although)\s+(?:i'm\s+)?(?:scared|afraid|worried|anxious|fear)(?:\s+(?:i'll|that|of))?\s*([^\.!?]+)/;
  const needButScaredMatch = lowerText.match(needButScaredPattern);
  if (needButScaredMatch) {
    const need = cleanPhrase(needButScaredMatch[1]);
    const fear = cleanPhrase(needButScaredMatch[2]);
    return synthesizeConflictIntent(need, fear, 'fear');
  }

  // Pattern 2: "I want X but I feel guilty/bad Y" → "Achieve X without guilt"
  const wantButGuiltyPattern = /i\s+want\s+(?:to\s+)?([^,\.!?]+)(?:,?\s*but|however)\s+(?:i\s+)?(?:feel\s+)?(?:guilty|bad|selfish|wrong)(?:\s+about)?\s*([^\.!?]*)/;
  const wantButGuiltyMatch = lowerText.match(wantButGuiltyPattern);
  if (wantButGuiltyMatch) {
    const want = cleanPhrase(wantButGuiltyMatch[1]);
    const guilt = cleanPhrase(wantButGuiltyMatch[2]);
    return synthesizeConflictIntent(want, guilt, 'guilt');
  }

  // Pattern 3: "I should X but Y" → "Balance X with Y"
  const shouldButPattern = /i\s+should\s+([^,\.!?]+)(?:,?\s*but|however)\s+([^\.!?]+)/;
  const shouldButMatch = lowerText.match(shouldButPattern);
  if (shouldButMatch) {
    const should = cleanPhrase(shouldButMatch[1]);
    const obstacle = cleanPhrase(shouldButMatch[2]);
    return `Balance ${should} with ${obstacle}`;
  }

  // Pattern 4: Work-life balance conflicts
  if (lowerText.includes('work') && (lowerText.includes('life') || lowerText.includes('rest') || lowerText.includes('family'))) {
    if (lowerText.includes('balance') || (lowerText.includes('but') && (lowerText.includes('tired') || lowerText.includes('exhausted')))) {
      return 'Achieve sustainable work-life balance';
    }
  }

  // Pattern 5: FOMO (Fear of Missing Out) patterns
  if ((lowerText.includes('miss') && lowerText.includes('something')) ||
      (lowerText.includes('behind') && lowerText.includes('everyone')) ||
      (lowerText.includes('checking') && (lowerText.includes('slack') || lowerText.includes('email') || lowerText.includes('phone')))) {
    if (lowerText.includes('rest') || lowerText.includes('sleep') || lowerText.includes('break')) {
      return 'Find rest without fear of missing out';
    }
    return 'Stay connected without constant anxiety';
  }

  // Now add POSITIVE PATTERNS to balance the negative bias
  const positiveIntent = extractPositiveIntent(lowerText, _originalText);
  if (positiveIntent) {
    return positiveIntent;
  }

  return null;
}

// Extract positive, aspirational, and growth-oriented intents
function extractPositiveIntent(lowerText: string, _originalText: string): string | null {
  // Pattern 1: Excitement and enthusiasm
  const excitementPattern = /(?:i'm\s+)?(?:excited|thrilled|pumped|enthusiastic|passionate)\s+(?:about|to|for)\s+([^,\.!?]+)/;
  const excitementMatch = lowerText.match(excitementPattern);
  if (excitementMatch) {
    const activity = cleanPhrase(excitementMatch[1]);
    return `Pursue passion for ${activity}`;
  }

  // Pattern 2: Learning and growth
  const learningPattern = /(?:i\s+)?(?:want to learn|love learning|enjoy studying|fascinated by|curious about)\s+([^,\.!?]+)/;
  const learningMatch = lowerText.match(learningPattern);
  if (learningMatch) {
    const subject = cleanPhrase(learningMatch[1]);
    return `Master new knowledge in ${subject}`;
  }

  // Pattern 3: Achievement and accomplishment
  const achievementPattern = /(?:i\s+)?(?:accomplished|achieved|completed|finished|succeeded in)\s+([^,\.!?]+)/;
  const achievementMatch = lowerText.match(achievementPattern);
  if (achievementMatch) {
    const achievement = cleanPhrase(achievementMatch[1]);
    return `Celebrate success in ${achievement}`;
  }

  // Pattern 4: Gratitude and appreciation
  const gratitudePattern = /(?:i'm\s+)?(?:grateful|thankful|appreciate|blessed|lucky)\s+(?:for|that|to have)\s+([^,\.!?]+)/;
  const gratitudeMatch = lowerText.match(gratitudePattern);
  if (gratitudeMatch) {
    const blessing = cleanPhrase(gratitudeMatch[1]);
    return `Appreciate and nurture ${blessing}`;
  }

  // Pattern 5: Inspiration and creativity
  const inspirationPattern = /(?:i'm\s+)?(?:inspired|motivated|driven)\s+(?:by|to)\s+([^,\.!?]+)/;
  const inspirationMatch = lowerText.match(inspirationPattern);
  if (inspirationMatch) {
    const inspiration = cleanPhrase(inspirationMatch[1]);
    return `Channel inspiration from ${inspiration}`;
  }

  // Pattern 6: Joy and enjoyment
  const joyPattern = /(?:i\s+)?(?:love|enjoy|adore|cherish)\s+([^,\.!?]+)/;
  const joyMatch = lowerText.match(joyPattern);
  if (joyMatch) {
    const activity = cleanPhrase(joyMatch[1]);
    return `Cultivate joy through ${activity}`;
  }

  // Pattern 7: Building and creating
  const creationPattern = /(?:i\s+)?(?:building|creating|making|designing|developing)\s+([^,\.!?]+)/;
  const creationMatch = lowerText.match(creationPattern);
  if (creationMatch) {
    const creation = cleanPhrase(creationMatch[1]);
    return `Express creativity through ${creation}`;
  }

  // Pattern 8: Connection and relationships
  const connectionPattern = /(?:i\s+)?(?:connecting with|bonding with|building relationships|making friends)\s+([^,\.!?]+)/;
  const connectionMatch = lowerText.match(connectionPattern);
  if (connectionMatch) {
    const connection = cleanPhrase(connectionMatch[1]);
    return `Build meaningful connections with ${connection}`;
  }

  // Pattern 9: Energy and vitality
  const energyPattern = /(?:i\s+)?(?:feel energized|feel alive|feel vibrant|feel strong)\s+(?:by|when|from)\s+([^,\.!?]+)/;
  const energyMatch = lowerText.match(energyPattern);
  if (energyMatch) {
    const source = cleanPhrase(energyMatch[1]);
    return `Maintain vitality through ${source}`;
  }

  // Pattern 10: Progress and improvement
  const progressPattern = /(?:i'm\s+)?(?:getting better at|improving in|progressing with|advancing in)\s+([^,\.!?]+)/;
  const progressMatch = lowerText.match(progressPattern);
  if (progressMatch) {
    const skill = cleanPhrase(progressMatch[1]);
    return `Continue growth in ${skill}`;
  }

  // Pattern 11: Hope and optimism
  const hopePattern = /(?:i\s+)?(?:hope|optimistic|confident|believe)\s+(?:that|i can|i will)\s+([^,\.!?]+)/;
  const hopeMatch = lowerText.match(hopePattern);
  if (hopeMatch) {
    const aspiration = cleanPhrase(hopeMatch[1]);
    return `Work toward ${aspiration} with optimism`;
  }

  // Pattern 12: Discovery and exploration
  const discoveryPattern = /(?:i\s+)?(?:discovered|found|explored|uncovered)\s+([^,\.!?]+)/;
  const discoveryMatch = lowerText.match(discoveryPattern);
  if (discoveryMatch) {
    const discovery = cleanPhrase(discoveryMatch[1]);
    return `Explore and understand ${discovery}`;
  }

  return null;
}

// Enhanced pattern matching with context awareness
function extractEnhancedIntent(lowerText: string, _originalText: string): string | null {
  const enhancedPatterns = [
    // Goal-oriented with emotional context
    {
      pattern: /(?:want to|need to|trying to)\s+([^,\.!?]+)(?:\s+(?:without|while avoiding|but not)\s+([^,\.!?]+))?/,
      handler: (match: RegExpMatchArray) => {
        const goal = cleanPhrase(match[1]);
        const constraint = match[2] ? cleanPhrase(match[2]) : null;
        return constraint ? `Achieve ${goal} without ${constraint}` : `Work toward ${goal}`;
      }
    },

    // Improvement and growth patterns
    {
      pattern: /(?:improve|get better at|work on|focus on)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Improve ${cleanPhrase(match[1])}`
    },

    // Understanding and clarity seeking
    {
      pattern: /(?:understand|figure out|make sense of|clarify)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Gain clarity on ${cleanPhrase(match[1])}`
    },

    // Relationship and connection patterns
    {
      pattern: /(?:connect with|build relationship|communicate better)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Strengthen connection with ${cleanPhrase(match[1])}`
    },

    // Stress and overwhelm management
    {
      pattern: /(?:manage|handle|deal with|cope with)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Effectively manage ${cleanPhrase(match[1])}`
    },

    // Positive achievement patterns
    {
      pattern: /(?:celebrate|proud of|accomplished|achieved)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Celebrate achievement in ${cleanPhrase(match[1])}`
    },

    // Exploration and discovery
    {
      pattern: /(?:explore|discover|investigate|research)\s+([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Explore and discover ${cleanPhrase(match[1])}`
    },

    // Sharing and contribution
    {
      pattern: /(?:share|contribute|give back|help others)\s+(?:with|to|in)?\s*([^,\.!?]+)/,
      handler: (match: RegExpMatchArray) => `Share and contribute to ${cleanPhrase(match[1])}`
    }
  ];

  for (const { pattern, handler } of enhancedPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      return handler(match);
    }
  }

  return null;
}

// Basic intent patterns (fallback)
function extractBasicIntent(lowerText: string): string | null {
  const basicPatterns = [
    { pattern: /want to|need to|plan to|hope to|trying to/, prefix: 'Work toward' },
    { pattern: /should|must|have to/, prefix: 'Address need to' },
    { pattern: /will|going to|planning/, prefix: 'Plan to' },
    { pattern: /wish|hope|dream/, prefix: 'Aspire to' }
  ];

  for (const { pattern, prefix } of basicPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const afterMatch = lowerText.substring(lowerText.indexOf(match[0]) + match[0].length).trim();
      const firstPhrase = afterMatch.split(/[,\.!?]/)[0].trim();
      if (firstPhrase) {
        return `${prefix} ${cleanPhrase(firstPhrase)}`;
      }
    }
  }

  return null;
}

// Helper function to clean and normalize phrases
function cleanPhrase(phrase: string): string {
  return phrase
    .trim()
    .replace(/^(to\s+|the\s+|a\s+|an\s+)/i, '') // Remove leading articles/prepositions
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[,;]$/, '') // Remove trailing punctuation
    .trim();
}

// Synthesize intent from conflicting desires
function synthesizeConflictIntent(desire: string, obstacle: string, conflictType: 'fear' | 'guilt'): string {
  const cleanDesire = cleanPhrase(desire);
  const cleanObstacle = cleanPhrase(obstacle);

  // Map common desires to more meaningful expressions (without verbs)
  const desireMap: Record<string, string> = {
    'rest': 'rest',
    'sleep': 'adequate sleep',
    'break': 'breaks',
    'time off': 'time off',
    'relax': 'relaxation',
    'focus': 'focus',
    'help': 'help',
    'succeed': 'success',
    'grow': 'growth'
  };

  // Map obstacles to constraint expressions
  const constraintMap: Record<string, string> = {
    'miss something': 'fear of missing out',
    'miss something important': 'fear of missing out',
    'missing out': 'fear of missing out',
    'fall behind': 'falling behind',
    'disappoint': 'disappointing others',
    'fail': 'fear of failure',
    'judge': 'judgment from others',
    'lazy': 'appearing lazy',
    'selfish': 'seeming selfish'
  };

  const mappedDesire = desireMap[cleanDesire] || cleanDesire;

  // Try exact match first, then partial match for constraints
  let mappedConstraint = constraintMap[cleanObstacle];
  if (!mappedConstraint) {
    // Check for partial matches
    for (const [key, value] of Object.entries(constraintMap)) {
      if (cleanObstacle.includes(key) || key.includes(cleanObstacle)) {
        mappedConstraint = value;
        break;
      }
    }
  }
  mappedConstraint = mappedConstraint || cleanObstacle;

  if (conflictType === 'fear') {
    return `Find ${mappedDesire} without ${mappedConstraint}`;
  } else if (conflictType === 'guilt') {
    return `Achieve ${mappedDesire} without guilt about ${mappedConstraint}`;
  }

  return `Balance ${mappedDesire} with ${mappedConstraint}`;
}

function extractSubtext(text: string): string {
  const lowerText = text.toLowerCase();

  // First, try to extract deep psychological subtext
  const deepSubtext = extractDeepSubtext(lowerText, text);
  if (deepSubtext) {
    return deepSubtext;
  }

  // Fall back to contextual subtext patterns
  const contextualSubtext = extractContextualSubtext(lowerText);
  if (contextualSubtext) {
    return contextualSubtext;
  }

  // Final fallback to basic patterns
  const basicSubtext = extractBasicSubtext(lowerText);
  return basicSubtext || 'Processing experiences and emotions';
}

// Extract deep psychological subtext with workplace/social context
function extractDeepSubtext(lowerText: string, originalText: string): string | null {
  // Pattern 1: Work commitment fears - checking work tools when tired/resting
  if ((lowerText.includes('checking') || lowerText.includes('looking at')) &&
      (lowerText.includes('slack') || lowerText.includes('email') || lowerText.includes('work')) &&
      (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('rest')) &&
      (lowerText.includes('scared') || lowerText.includes('afraid') || lowerText.includes('worry'))) {
    if (lowerText.includes('miss')) {
      return 'Fears being seen as less committed or dedicated';
    }
    return 'Struggles with work-life boundaries and professional identity';
  }

  // Pattern 2: Perfectionism and control
  if ((lowerText.includes('perfect') || lowerText.includes('control') || lowerText.includes('everything')) &&
      (lowerText.includes('but') || lowerText.includes('however')) &&
      (lowerText.includes('tired') || lowerText.includes('overwhelmed') || lowerText.includes('stressed'))) {
    return 'Perfectionist tendencies conflicting with human limitations';
  }

  // Pattern 3: Imposter syndrome patterns
  if ((lowerText.includes('not good enough') || lowerText.includes('not smart enough') || lowerText.includes('fake')) ||
      (lowerText.includes('everyone else') && (lowerText.includes('better') || lowerText.includes('smarter')))) {
    return 'Struggles with imposter syndrome and self-worth';
  }

  // Pattern 4: Social approval seeking
  if ((lowerText.includes('what will') || lowerText.includes('what would')) &&
      (lowerText.includes('think') || lowerText.includes('say')) &&
      (lowerText.includes('others') || lowerText.includes('people') || lowerText.includes('they'))) {
    return 'Seeks external validation and fears judgment';
  }

  // Pattern 5: Fear of disappointing others
  if ((lowerText.includes('disappoint') || lowerText.includes('let down')) ||
      (lowerText.includes('should') && lowerText.includes('for') && (lowerText.includes('team') || lowerText.includes('others')))) {
    return 'Fears disappointing others and letting people down';
  }

  // Pattern 6: Success anxiety
  if ((lowerText.includes('succeed') || lowerText.includes('success')) &&
      (lowerText.includes('but') || lowerText.includes('however')) &&
      (lowerText.includes('scared') || lowerText.includes('afraid') || lowerText.includes('worry'))) {
    return 'Anxious about success and its implications';
  }

  // Pattern 7: Vulnerability and authenticity struggles
  if ((lowerText.includes('show') || lowerText.includes('reveal')) &&
      (lowerText.includes('weakness') || lowerText.includes('struggle') || lowerText.includes('real me')) &&
      (lowerText.includes('but') || lowerText.includes('afraid'))) {
    return 'Struggles with vulnerability and showing authentic self';
  }

  // Pattern 8: Comparison and competition
  if ((lowerText.includes('everyone else') || lowerText.includes('others')) &&
      (lowerText.includes('ahead') || lowerText.includes('better') || lowerText.includes('faster')) &&
      (lowerText.includes('behind') || lowerText.includes('slow') || lowerText.includes('not enough'))) {
    return 'Feels inadequate compared to others\' perceived success';
  }

  // Pattern 9: Control and uncertainty
  if ((lowerText.includes('control') || lowerText.includes('plan')) &&
      (lowerText.includes('but') || lowerText.includes('however')) &&
      (lowerText.includes('uncertain') || lowerText.includes('unknown') || lowerText.includes('unpredictable'))) {
    return 'Struggles with uncertainty and need for control';
  }

  // Pattern 10: Identity and role confusion
  if ((lowerText.includes('who am i') || lowerText.includes('identity')) ||
      (lowerText.includes('supposed to be') && (lowerText.includes('leader') || lowerText.includes('expert')))) {
    return 'Questions professional identity and role expectations';
  }

  // Now add POSITIVE SUBTEXT patterns to balance the negative bias
  const positiveSubtext = extractPositiveSubtext(lowerText, originalText);
  if (positiveSubtext) {
    return positiveSubtext;
  }

  return null;
}

// Extract positive underlying motivations and strengths
function extractPositiveSubtext(lowerText: string, _originalText: string): string | null {
  // Pattern 1: Growth mindset and learning orientation
  if ((lowerText.includes('learn') || lowerText.includes('grow') || lowerText.includes('improve')) &&
      (lowerText.includes('excited') || lowerText.includes('curious') || lowerText.includes('interested'))) {
    return 'Driven by genuine curiosity and desire for growth';
  }

  // Pattern 2: Service and contribution motivation
  if ((lowerText.includes('help') || lowerText.includes('support') || lowerText.includes('contribute')) &&
      (lowerText.includes('others') || lowerText.includes('team') || lowerText.includes('community'))) {
    return 'Motivated by desire to serve and contribute to others';
  }

  // Pattern 3: Mastery and excellence pursuit
  if ((lowerText.includes('master') || lowerText.includes('excel') || lowerText.includes('perfect')) &&
      (lowerText.includes('craft') || lowerText.includes('skill') || lowerText.includes('art'))) {
    return 'Pursues mastery and excellence in their craft';
  }

  // Pattern 4: Innovation and creativity drive
  if ((lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('innovate')) &&
      (lowerText.includes('new') || lowerText.includes('different') || lowerText.includes('unique'))) {
    return 'Driven by creative expression and innovation';
  }

  // Pattern 5: Connection and relationship building
  if ((lowerText.includes('connect') || lowerText.includes('bond') || lowerText.includes('relationship')) &&
      (lowerText.includes('deep') || lowerText.includes('meaningful') || lowerText.includes('authentic'))) {
    return 'Values deep, authentic human connections';
  }

  // Pattern 6: Purpose and meaning seeking
  if ((lowerText.includes('purpose') || lowerText.includes('meaning') || lowerText.includes('impact')) &&
      (lowerText.includes('find') || lowerText.includes('discover') || lowerText.includes('create'))) {
    return 'Seeks deeper purpose and meaningful impact';
  }

  // Pattern 7: Resilience and perseverance
  if ((lowerText.includes('keep going') || lowerText.includes('persist') || lowerText.includes('overcome')) &&
      (lowerText.includes('challenge') || lowerText.includes('difficult') || lowerText.includes('tough'))) {
    return 'Demonstrates resilience and determination to overcome challenges';
  }

  // Pattern 8: Gratitude and appreciation
  if ((lowerText.includes('grateful') || lowerText.includes('thankful') || lowerText.includes('appreciate')) &&
      (lowerText.includes('opportunity') || lowerText.includes('experience') || lowerText.includes('journey'))) {
    return 'Approaches life with gratitude and appreciation';
  }

  // Pattern 9: Leadership and mentorship inclination
  if ((lowerText.includes('lead') || lowerText.includes('mentor') || lowerText.includes('guide')) &&
      (lowerText.includes('inspire') || lowerText.includes('empower') || lowerText.includes('develop'))) {
    return 'Naturally inclined toward leadership and developing others';
  }

  // Pattern 10: Optimism and positive outlook
  if ((lowerText.includes('hope') || lowerText.includes('believe') || lowerText.includes('confident')) &&
      (lowerText.includes('future') || lowerText.includes('possible') || lowerText.includes('achieve'))) {
    return 'Maintains optimistic outlook and belief in possibilities';
  }

  // Pattern 11: Self-awareness and reflection
  if ((lowerText.includes('realize') || lowerText.includes('understand') || lowerText.includes('recognize')) &&
      (lowerText.includes('myself') || lowerText.includes('my') || lowerText.includes('own'))) {
    return 'Demonstrates strong self-awareness and reflective thinking';
  }

  // Pattern 12: Collaboration and teamwork values
  if ((lowerText.includes('together') || lowerText.includes('collaborate') || lowerText.includes('team')) &&
      (lowerText.includes('better') || lowerText.includes('stronger') || lowerText.includes('achieve'))) {
    return 'Values collaboration and collective achievement';
  }

  return null;
}

// Extract contextual subtext based on themes and situations
function extractContextualSubtext(lowerText: string): string | null {
  // Work-related contexts
  if (lowerText.includes('work') || lowerText.includes('job') || lowerText.includes('career')) {
    if (lowerText.includes('stress') || lowerText.includes('pressure')) {
      return 'Feels overwhelmed by professional expectations';
    }
    if (lowerText.includes('balance') && (lowerText.includes('life') || lowerText.includes('family'))) {
      return 'Struggles to maintain healthy boundaries';
    }
  }

  // Learning and growth contexts
  if (lowerText.includes('learn') || lowerText.includes('skill') || lowerText.includes('improve')) {
    if (lowerText.includes('slow') || lowerText.includes('behind') || lowerText.includes('not fast enough')) {
      return 'Feels inadequate about learning pace';
    }
    if (lowerText.includes('everyone') || lowerText.includes('others')) {
      return 'Compares progress to others unfavorably';
    }
  }

  // Relationship contexts
  if (lowerText.includes('friend') || lowerText.includes('family') || lowerText.includes('relationship')) {
    if (lowerText.includes('disappoint') || lowerText.includes('let down')) {
      return 'Fears damaging important relationships';
    }
    if (lowerText.includes('alone') || lowerText.includes('lonely')) {
      return 'Struggles with connection and belonging';
    }
  }

  // Leadership contexts
  if (lowerText.includes('lead') || lowerText.includes('manage') || lowerText.includes('mentor')) {
    if (lowerText.includes('not ready') || lowerText.includes('not qualified')) {
      return 'Questions leadership capabilities and readiness';
    }
    if (lowerText.includes('responsibility') && (lowerText.includes('heavy') || lowerText.includes('weight'))) {
      return 'Feels burdened by leadership responsibilities';
    }
    if (lowerText.includes('inspire') || lowerText.includes('empower') || lowerText.includes('develop')) {
      return 'Motivated by desire to develop and empower others';
    }
  }

  // Success and achievement contexts (positive)
  if (lowerText.includes('success') || lowerText.includes('achieve') || lowerText.includes('accomplish')) {
    if (lowerText.includes('excited') || lowerText.includes('proud') || lowerText.includes('happy')) {
      return 'Celebrates achievements and takes pride in progress';
    }
    if (lowerText.includes('share') || lowerText.includes('inspire') || lowerText.includes('motivate')) {
      return 'Wants to inspire others through personal success';
    }
  }

  // Innovation and creativity contexts (positive)
  if (lowerText.includes('create') || lowerText.includes('build') || lowerText.includes('design')) {
    if (lowerText.includes('passion') || lowerText.includes('love') || lowerText.includes('enjoy')) {
      return 'Driven by genuine passion for creative expression';
    }
    if (lowerText.includes('impact') || lowerText.includes('difference') || lowerText.includes('change')) {
      return 'Motivated by desire to create meaningful impact';
    }
  }

  return null;
}

// Basic subtext patterns (fallback)
function extractBasicSubtext(lowerText: string): string | null {
  const basicSubtextCues = [
    { pattern: /but|however|although|though/, subtext: 'Has conflicting internal feelings' },
    { pattern: /scared|afraid|fear/, subtext: 'Underlying anxiety about outcomes' },
    { pattern: /should|supposed to|expected/, subtext: 'Feels external pressure and obligation' },
    { pattern: /everyone else|others|they/, subtext: 'Compares self to others' },
    { pattern: /not good enough|failing|failure/, subtext: 'Struggles with self-doubt and adequacy' },
    { pattern: /what if|might|maybe/, subtext: 'Experiences uncertainty and hesitation' },
    { pattern: /guilty|selfish|wrong/, subtext: 'Carries guilt about personal needs' },
    { pattern: /perfect|flawless|mistake/, subtext: 'Holds unrealistic standards for self' }
  ];

  for (const { pattern, subtext } of basicSubtextCues) {
    if (pattern.test(lowerText)) {
      return subtext;
    }
  }

  return null;
}

function extractPersonaTraits(text: string): string[] {
  const traitKeywords = {
    'analytical': ['analyze', 'think', 'consider', 'evaluate', 'assess'],
    'organiser': ['plan', 'organize', 'schedule', 'structure', 'system'],
    'builder': ['create', 'build', 'make', 'develop', 'construct'],
    'mentor': ['help', 'teach', 'guide', 'support', 'mentor'],
    'creative': ['creative', 'imagine', 'design', 'artistic', 'innovative'],
    'conscientious': ['careful', 'thorough', 'detail', 'precise', 'meticulous'],
    'vigilant': ['watch', 'monitor', 'check', 'alert', 'aware'],
    'collaborative': ['team', 'together', 'collaborate', 'share', 'cooperate'],
    'independent': ['alone', 'myself', 'independent', 'solo', 'own'],
    'empathetic': ['understand', 'feel', 'empathy', 'compassion', 'care']
  };

  const traits: string[] = [];
  for (const [trait, keywords] of Object.entries(traitKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      traits.push(trait);
    }
  }

  return traits.length > 0 ? traits : ['reflective'];
}

function determineBucket(text: string): string[] {
  const bucketPatterns = [
    { pattern: /goal|target|achieve|accomplish|plan/, bucket: 'Goal' },
    { pattern: /think|thought|consider|reflect|ponder/, bucket: 'Thought' },
    { pattern: /hobby|fun|enjoy|leisure|play/, bucket: 'Hobby' },
    { pattern: /value|believe|important|principle|matter/, bucket: 'Value' },
    { pattern: /learn|realize|understand|insight|discovery/, bucket: 'Reflection' }
  ];

  for (const { pattern, bucket } of bucketPatterns) {
    if (pattern.test(text)) {
      return [bucket];
    }
  }

  return ['Thought']; // Default bucket
}
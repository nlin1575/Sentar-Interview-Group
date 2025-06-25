# Assumptions for Sentari Pipeline Implementation

## Embedding Dimensions
- **n = 384** - Using all-MiniLM-L6-v2 model standard dimension
- Mock embeddings will use random values in this dimension for testing

## GPT Reply Length
- Target: ≤55 characters as specified
- Fallback: If meaningful response requires more, will extend to ≤75 characters
- Will prioritize empathy and relevance over strict character limit

## Cosine Similarity Threshold
- **carry_in = true** when cosine similarity > 0.86 OR theme/vibe overlap detected
- Theme overlap: any shared theme between new entry and recent entries
- Vibe overlap: any shared emotional tone

## Profile Initialization
- New users start with empty profile (all counts = 0)
- dominant_vibe defaults to "neutral" until sufficient data
- Minimum 3 entries required before meaningful dominant_vibe calculation

## Mock Implementations
- **[MOCK]** Embedding: Random 384-dimensional vectors
- **[MOCK]** GPT: Rule-based response generation using templates
- **[MOCK]** Costs: $0.001 per embedding, $0.002 per GPT call

## Storage
- In-memory storage using JavaScript Map for entries and profiles
- Entry IDs generated using UUID v4
- Timestamps in ISO format

## Parsing Rules
- Themes extracted from nouns and key phrases
- Vibes extracted from emotion words and punctuation patterns
- Intent derived from goal-oriented language (want, need, plan, hope)
- Subtext inferred from contrasting statements and tone shifts
- Persona traits based on behavioral patterns and language style
- Buckets: ["Thought", "Goal", "Hobby", "Value", "Reflection"]

## Performance Targets
- Target latency: <3 seconds per entry
- Memory usage: <1GB during execution
- Mock cost: <$0.002 per entry
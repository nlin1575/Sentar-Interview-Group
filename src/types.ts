// Core data types for the Sentari pipeline

export interface ParsedEntry {
  theme: string[];
  vibe: string[];
  intent: string;
  subtext: string;
  persona_trait: string[];
  bucket: string[];
}

export interface MetaData {
  word_count: number;
  char_count: number;
  top_words: string[];
  has_exclamation: boolean;
  has_question: boolean;
  has_emoji: boolean;
  punctuation_density: number;
}

export interface UserProfile {
  top_themes: string[];
  theme_count: Record<string, number>;
  dominant_vibe: string;
  vibe_count: Record<string, number>;
  bucket_count: Record<string, number>;
  trait_pool: string[];
  last_theme: string;
  entry_count: number;
}

export interface DiaryEntry {
  id: string;
  raw_text: string;
  embedding: number[];
  meta_data: MetaData;
  parsed: ParsedEntry;
  timestamp: Date;
  carry_in: boolean;
  emotion_flip: boolean;
}

export interface PipelineContext {
  raw_text: string;
  embedding: number[];
  recent_entries: DiaryEntry[];
  profile: UserProfile;
  meta_data: MetaData;
  parsed: ParsedEntry;
  carry_in: boolean;
  emotion_flip: boolean;
  entry_id: string;
  response_text: string;
  start_time: number;
  costs: {
    embedding_cost: number;
    gpt_cost: number;
    total_cost: number;
  };
}

export interface PipelineResult {
  entryId: string;
  response_text: string;
  carry_in: boolean;
  updated_profile: UserProfile;
  execution_time: number;
  total_cost: number;
}

export interface LogEntry {
  tag: string;
  input: string;
  output: string;
  note: string;
}
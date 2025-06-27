#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { runPipeline } from '../src/runPipeline';
import { db } from '../src/db';
import { isOpenAIAvailable } from '../src/services/openai';

// load .env
config();

/*─────────────────────────────────────────────────────────────
  Simulate: process 99 mock diary entries first, then a 100-th
  real entry, so carry-in and profile stats are realistic.
─────────────────────────────────────────────────────────────*/
async function simulateHundredthEntry() {
  const userId = 'hundred-user';
  console.log('🎯 100-Entry Simulation');
  console.log(`🔑 OpenAI API: ${isOpenAIAvailable ? 'ENABLED' : 'DISABLED (mocks)'}`);
  console.log('='.repeat(60));

  /* 1️⃣  Seed DB with 99 mock records */
  console.log('📚 Seeding database with 99 mock entries…');
  db.initializeMockData(userId, 99);

  /* 2️⃣  Pull those mocks back out and run them through the pipeline */
  const mockEntries = db.getRecentEntries(userId, 99).reverse(); // oldest->newest

  let totalTokens = 0, totalTime = 0, totalCost = 0;

  console.log('⚙️  Processing mock entries…');
  for (let i = 0; i < mockEntries.length; i++) {
    const res = await runPipeline(mockEntries[i].raw_text, userId);
    totalTokens += res.total_tokens;
    totalTime   += res.execution_time;
    totalCost   += res.total_cost;
    if ((i + 1) % 20 === 0) {
      console.log(`   • ${i + 1}/99 processed`);
    }
  }
  console.log(`✅ Mock run complete — ${totalTime} ms, ${totalTokens} tokens, $${totalCost.toFixed(4)}\n`);

  /* 3️⃣  Real 100-th entry */
  const transcript =
    "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.";
  console.log(`📝 100th transcript: "${transcript}"`);
  console.log('='.repeat(60));

  const result = await runPipeline(transcript, userId);

  /* 4️⃣  Report */
  console.log('\n📊 FINAL RESULTS');
  console.log(`   Entry ID       : ${result.entryId}`);
  console.log(`   Response       : "${result.response_text}"`);
  console.log(`   Carry-in       : ${result.carry_in}`);
  console.log(`   Exec Time      : ${result.execution_time} ms`);
  console.log(`   Total Cost     : $${result.total_cost.toFixed(4)}`);

  console.log('\n📈 UPDATED PROFILE');
  console.log(`   Entry Count    : ${result.updated_profile.entry_count}`);
  console.log(`   Dominant Vibe  : ${result.updated_profile.dominant_vibe}`);
  console.log(`   Top Themes     : [${result.updated_profile.top_themes.join(', ')}]`);
  console.log(`   Traits         : [${result.updated_profile.trait_pool.join(', ')}]`);

  console.log('\n✅ Simulation finished successfully');
}

/* Kick it off */
simulateHundredthEntry().catch(err => {
  console.error('❌ Simulation failed:', err);
  process.exit(1);
});

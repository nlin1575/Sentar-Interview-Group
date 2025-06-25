#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { runPipeline } from '../src/runPipeline';
import { db } from '../src/db';
import { isOpenAIAvailable } from '../src/services/openai';

// Load environment variables
config();

/**
 * Simulate 100th entry (with 99 realistic prior entries)
 * This script demonstrates the pipeline with an established user profile
 */
async function simulateHundredthEntry() {
  console.log('🎯 SIMULATION: 100th entry (with 99 prior entries)\n');
  console.log(`🔑 OpenAI API: ${isOpenAIAvailable ? 'ENABLED' : 'DISABLED (using mocks)'}`);
  console.log('=' .repeat(60));

  // Initialize database with 99 mock entries
  console.log('📚 Initializing database with 99 mock entries...');
  db.initializeMockData('hundred-user', 99);

  // Sample 100th diary entry - more complex than first entry
  const transcript = "I'm feeling overwhelmed by all the intern feedback sessions, but I'm also excited about the progress they're making. Sometimes I wonder if I'm pushing them too hard, but I see their growth and it makes me proud.";

  console.log(`📝 Input transcript: "${transcript}"`);
  console.log('=' .repeat(60));

  try {
    // Run the pipeline
    const result = await runPipeline(transcript, 'hundred-user');

    // Display results
    console.log('📊 FINAL RESULTS:');
    console.log(`   Entry ID: ${result.entryId}`);
    console.log(`   Response: "${result.response_text}" (${result.response_text.length} chars)`);
    console.log(`   Carry-in: ${result.carry_in}`);
    console.log(`   Execution Time: ${result.execution_time}ms`);
    console.log(`   Total Cost: $${result.total_cost.toFixed(4)}`);

    console.log('\n📈 UPDATED PROFILE:');
    console.log(`   Entry Count: ${result.updated_profile.entry_count}`);
    console.log(`   Dominant Vibe: "${result.updated_profile.dominant_vibe}"`);
    console.log(`   Top Themes: [${result.updated_profile.top_themes.join(', ')}]`);
    console.log(`   Trait Pool: [${result.updated_profile.trait_pool.join(', ')}]`);
    console.log(`   Theme Counts: ${JSON.stringify(result.updated_profile.theme_count, null, 2)}`);

    console.log('\n✅ 100th entry simulation completed successfully!');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Run the simulation
simulateHundredthEntry().catch(console.error);
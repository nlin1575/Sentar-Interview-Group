#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { runPipeline } from '../src/runPipeline';
import { db } from '../src/db';
import { isOpenAIAvailable } from '../src/services/openai';

// Load environment variables
config();

/**
 * Simulate first-ever entry (no prior data)
 * This script demonstrates the pipeline with a completely new user
 */
async function simulateFirstEntry() {
  console.log('🎯 SIMULATION: First-ever entry (no prior data)\n');
  console.log(`🔑 OpenAI API: ${isOpenAIAvailable ? 'ENABLED' : 'DISABLED (using mocks)'}`);
  console.log('=' .repeat(60));

  // Clear database to ensure clean state
  db.clear();

  // Sample first diary entry
  const transcript = "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.";

  console.log(`📝 Input transcript: "${transcript}"`);
  console.log('=' .repeat(60));

  try {
    // Run the pipeline
    const result = await runPipeline(transcript, 'first-user');

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

    console.log('\n✅ First entry simulation completed successfully!');

  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  }
}

// Run the simulation
simulateFirstEntry().catch(console.error);
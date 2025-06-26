import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { runPipeline } from './runPipeline';
import { db } from './db';
import { isOpenAIAvailable } from './services/openai';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Store logs for the UI
let lastPipelineLogs: any[] = [];

// Override console.log to capture pipeline logs
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  // Capture pipeline step logs
  const message = args.join(' ');
  if (message.includes('[') && message.includes(']') && message.includes('input=') && message.includes('output=')) {
    // Parse the log message
    const tagMatch = message.match(/\[([^\]]+)\]/);
    const inputMatch = message.match(/input=<([^>]+)>/);
    const outputMatch = message.match(/output=<([^>]+)>/);
    const noteMatch = message.match(/note=<([^>]+)>/);
    
    if (tagMatch && inputMatch && outputMatch && noteMatch) {
      lastPipelineLogs.push({
        tag: tagMatch[1],
        input: inputMatch[1],
        output: outputMatch[1],
        note: noteMatch[1]
      });
    }
  }
  
  // Call original console.log
  originalConsoleLog(...args);
};

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    openai_available: isOpenAIAvailable,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/pipeline', async (req, res) => {
  try {
    const { transcript, userId = 'ui-user' } = req.body;
    
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        error: 'Invalid transcript provided'
      });
    }

    // Clear previous logs
    lastPipelineLogs = [];
    
    // Run the pipeline
    const result = await runPipeline(transcript, userId);
    
    // Return result with logs
    res.json({
      result,
      logs: lastPipelineLogs,
      openai_used: isOpenAIAvailable
    });
    
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Pipeline execution failed'
    });
  }
});

app.get('/api/profile/:userId?', (req, res) => {
  try {
    const userId = req.params.userId || 'ui-user';
    const profile = db.getProfile(userId);
    const entryCount = db.getEntryCount(userId);
    
    res.json({
      profile,
      entry_count: entryCount,
      user_id: userId
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch profile'
    });
  }
});

app.post('/api/bulk-process', async (req, res) => {
  try {
    const { entries, userId = 'bulk-user' } = req.body;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({
        error: 'Invalid entries array provided'
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({
        error: 'No entries provided'
      });
    }

    if (entries.length > 99) {
      return res.status(400).json({
        error: 'Maximum 99 entries allowed'
      });
    }

    // Clear database for this user
    db.clear();

    const results = [];
    let totalCost = 0;
    let totalTime = 0;

    // Process each entry through the pipeline
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (!entry.transcript || typeof entry.transcript !== 'string') {
        return res.status(400).json({
          error: `Invalid transcript at entry ${i + 1}`
        });
      }

      try {
        const result = await runPipeline(entry.transcript, userId);
        results.push({
          index: i + 1,
          transcript: entry.transcript,
          entryId: result.entryId,
          response_text: result.response_text,
          carry_in: result.carry_in,
          execution_time: result.execution_time,
          total_tokens: result.total_tokens,
          total_cost: result.total_cost
        });

        totalCost += result.total_cost;
        totalTime += result.execution_time;

      } catch (entryError) {
        console.error(`Error processing entry ${i + 1}:`, entryError);
        results.push({
          index: i + 1,
          transcript: entry.transcript,
          error: entryError instanceof Error ? entryError.message : 'Processing failed'
        });
      }
    }

    // Get final profile after all processing
    const finalProfile = db.getProfile(userId);

    res.json({
      success: true,
      processed_count: entries.length,
      results,
      final_profile: finalProfile,
      summary: {
        total_cost: totalCost,
        total_time: totalTime,
        average_time: totalTime / entries.length
      }
    });

  } catch (error) {
    console.error('Bulk processing error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Bulk processing failed'
    });
  }
});

app.post('/api/simulate/:type', async (req, res) => {
  try {
    const { type } = req.params;

    if (type === 'first') {
      // Clear database and run first entry simulation
      db.clear();
      const transcript = "I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.";

      lastPipelineLogs = [];
      const result = await runPipeline(transcript, 'first-user');

      res.json({
        result,
        logs: lastPipelineLogs,
        simulation_type: 'first'
      });

    } else if (type === 'hundred') {
      // Initialize with 99 entries and run 100th
      db.initializeMockData('hundred-user', 99);
      const transcript = "I'm feeling overwhelmed by all the intern feedback sessions, but I'm also excited about the progress they're making.";

      lastPipelineLogs = [];
      const result = await runPipeline(transcript, 'hundred-user');

      res.json({
        result,
        logs: lastPipelineLogs,
        simulation_type: 'hundred'
      });

    } else {
      res.status(400).json({
        error: 'Invalid simulation type. Use "first" or "hundred"'
      });
    }

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Simulation failed'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sentari API Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API: ${isOpenAIAvailable ? 'ENABLED' : 'DISABLED (using mocks)'}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /api/pipeline - Run pipeline on transcript`);
  console.log(`   POST /api/bulk-process - Process CSV entries (max 99)`);
  console.log(`   GET  /api/profile/:userId - Get user profile`);
  console.log(`   POST /api/simulate/first - Simulate first entry`);
  console.log(`   POST /api/simulate/hundred - Simulate 100th entry`);
  console.log(`   GET  /api/status - API status`);
});

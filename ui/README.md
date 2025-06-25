# Sentari Pipeline UI

A React-based web interface for the Sentari interview challenge pipeline.

## Features

- 📝 **Interactive Transcript Input** - Enter diary transcripts with example templates
- 🧠 **Real-time Pipeline Execution** - See all 13 steps execute in real-time
- 💬 **AI Response Display** - View the generated empathetic response (≤55 chars)
- 👤 **Profile Visualization** - See updated user profile with themes, vibes, and traits
- 📋 **Detailed Logs** - View complete pipeline execution logs
- 🔄 **Simulation Modes** - Test first entry vs 100th entry scenarios

## Quick Start

1. **Install UI dependencies:**
   ```bash
   npm run ui:install
   ```

2. **Start the development servers:**
   ```bash
   npm run dev:full
   ```

   This starts both:
   - API Server: http://localhost:3001
   - UI Server: http://localhost:3000

3. **Open your browser** to http://localhost:3000

## Manual Setup

If you prefer to run servers separately:

1. **Start API server:**
   ```bash
   npm run server
   ```

2. **Start UI (in another terminal):**
   ```bash
   npm run ui:dev
   ```

## Usage

1. **Enter a transcript** in the text area
2. **Try example buttons** for quick testing
3. **Click "Run Pipeline"** to execute all 13 steps
4. **View results:**
   - AI empathetic response
   - Updated user profile
   - Complete pipeline logs

## Example Transcripts

- **Work-Life Balance:** "I keep checking Slack even when I'm exhausted..."
- **Growth Mindset:** "I'm excited to learn machine learning..."
- **Leadership:** "I'm feeling overwhelmed by intern feedback sessions..."

## API Endpoints

- `POST /api/pipeline` - Run pipeline on transcript
- `POST /api/simulate/first` - Simulate first entry
- `POST /api/simulate/hundred` - Simulate 100th entry
- `GET /api/profile/:userId` - Get user profile
- `GET /api/status` - API status

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + TypeScript
- **Styling:** Custom CSS with gradient design
- **Real-time:** Pipeline logs captured and displayed

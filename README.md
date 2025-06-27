# 🧠 Sentari Pipeline - From Transcript to Empathy

AI-powered diary analysis system that transforms transcripts into empathetic responses and builds long-term user profiles through a 13-step pipeline. By Aneesh, Effan, Nicolas

## 🚀 Quick Setup

```bash
# Install dependencies
npm install

# Start Ollama (for local LLM)
ollama serve &

# Run development servers
npm run dev:full    # Backend + Frontend
# OR separately:
npm run server      # Backend only (port 3002)
cd ui && npm run dev # Frontend only (port 3000)
```

## 📋 Commands

```bash
# Simulations
npm run simulate:first    # First-ever entry
npm run simulate:hundred  # 100th entry (with 99 mock entries)

# Testing
npm run test             # Run all tests
npm run lint             # Code linting

# Development
npm run dev:full         # Full stack development
```

## 🎯 Features

- **13-step pipeline**: Raw text → Embedding → Parsing → Profile updates → Empathetic response
- **Carry-in logic**: Detects theme/vibe overlap and emotional continuity
- **Local LLM support**: Ollama integration with fallback to rule-based parsing
- **Web UI**: Manual entry and CSV bulk processing
- **Comprehensive testing**: Unit tests for all pipeline components

## 🏗️ Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + Vite
- **LLM**: Ollama (phi model) with rule-based fallback
- **Storage**: In-memory database
- **Testing**: Jest

Built for Sentari Interview Challenge • Team Group 1

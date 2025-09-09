# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UGC Script Splitter for Veo 3 - A full-stack React/Express application that transforms UGC (User-Generated Content) marketing scripts into AI-ready video segments optimized for Google's Veo 3 video generation platform. The system automatically splits scripts into 8-second segments with detailed character and scene descriptions.

## Commands

### Quick Start
```bash
npm run startup      # Automated startup with dependency checks
npm run startup:dev  # Start in development mode with hot reload
npm run check        # Show startup help and options
```

### Development
```bash
npm run dev         # Build client and start server (port 4800)
npm run dev:watch   # Server with client hot reload (uses concurrently)
npm run server      # Start server only with nodemon
npm run watch:client # Watch and rebuild client on changes
```

### Build & Production
```bash
npm run build       # Build React client and copy to root build/
npm start          # Start production server (direct)
npm run logs        # Tail application logs
```

### Installation
```bash
npm run install-all  # Install dependencies for both server and client
```

### Testing & Debugging
- No test framework is currently configured. Use manual testing through the development server.
- Health check endpoint: `GET /api/health` - Returns server status and configuration
- Startup diagnostics: `npm run startup -- --help` for options
- Logs directory: `./logs/` (created automatically when logging is enabled)

## Architecture

### Backend (Express - ES Modules)
- **server.js**: Main Express server (port 4800, defaults from PORT env)
  - Serves API routes and React build
  - Includes request logging, error handling, and health check endpoint
  - Rate limiting on API endpoints (10 requests/minute)
  
- **api/routes/**: API endpoints
  - `generate.js`: Standard script segmentation with OpenAI GPT-4
  - `generate.plus.js`: Enhanced Plus mode with file persistence in runs/plus/
  - `generateContinuation.js`: Continuation mode with voice profile generation
  - `generate.newcont.js`: New continuation mode implementation
  
- **api/services/**: External service integrations
  - `openaiService.js`: OpenAI GPT-4o integration for script processing
  - `openaiService.plus.js`: Enhanced service with run persistence
  - `veo3Service.js`: Google Veo 3 integration (Gemini API or Vertex AI)
  - `falaiService.js`: FalAI Veo3 integration for actual video generation

### Frontend (React)
- **client/src/App.js**: Main app with 4 tab navigation modes
  - Standard Generation
  - Continuation Mode  
  - Standard Plus (enhanced with run persistence)
  - New Continuation Mode
  
- **client/src/components/**:
  - `ScriptForm.js` / `ScriptFormPlus.js`: User input forms with extensive customization:
    - Character details (age, gender, ethnicity, features, clothing)
    - Scene settings (single/mixed locations, time of day, background life)
    - Voice and energy levels
    - Camera and product styles
  - `VideoGenerator.js` / `VideoGeneratorPlus.js`: Video generation interface with API selector (Gemini/FalAI/Kie.ai)
  - `APISelector.js`: Component for choosing between different video generation APIs
  - `ResultsDisplay.js` / `ResultsDisplayPlus.js`: Shows generated JSON segments with collapsible views
  - `ContinuationMode.js` / `NewContinuationMode.js`: Alternative UIs for continuation-style generation
  - `SegmentManager.js`: Edit, reorder, delete segments after generation
  - `BulkOperations.js`: Find & replace across all segments
  - `DownloadButton.js` / `DownloadButtonPlus.js`: ZIP export functionality
  - `ErrorBoundary.js`: React error handling wrapper
  - `JSONEditor.js`: Direct JSON editing interface
  - `SettingsDisplay.js`: Show current generation settings

- **client/src/api/**:
  - `client.js` / `clientPlus.js` / `clientNewCont.js`: API client implementations

### Key Features
1. **Script Processing**: Intelligent splitting into 8-second segments (~20 words each) using GPT-4o
2. **Multiple Generation Modes**:
   - Standard: 300+ word descriptions per segment
   - Enhanced Continuity: 500+ words with micro-expressions  
   - Continuation: Voice profile generation for consistency
   - Plus Mode: Enhanced features with run persistence
3. **Advanced Character Customization**:
   - Physical features, ethnicity, clothing details
   - Voice characteristics and energy levels
   - Dynamic energy arcs across segments
4. **Scene Management**:
   - Single or mixed location settings
   - Time of day and lighting variations
   - Background life and ambient elements
5. **Video Generation**:
   - Veo 3 integration via Gemini API or Vertex AI (descriptions only)
   - FalAI Veo3 integration for actual video generation ($0.20-$0.40 per second)
   - Kie.ai integration for actual video generation (93% cheaper, $0.40 vs $6 per segment)
6. **Post-Generation Tools**:
   - Segment manager for editing/reordering
   - Bulk find & replace operations
   - ZIP download for batch processing
7. **Developer Features**:
   - Run persistence in Plus mode (saves inputs/outputs to runs/plus/)
   - Request logging and error handling
   - Rate limiting (10 requests/minute)

## Environment Variables

Required in `.env`:
```
# Required
OPENAI_API_KEY=sk-...
OPENAI_PROJECT_ID=proj_...         # Optional: OpenAI project ID

# Choose ONE or MORE authentication methods for video generation:
GOOGLE_GEMINI_API_KEY=...          # Option A: Gemini API (descriptions only)
GOOGLE_APPLICATION_CREDENTIALS=... # Option B: Vertex AI service account
VERTEX_PROJECT_ID=...              # Required with Option B
VERTEX_LOCATION=us-central1        # Required with Option B
FAL_AI_API_KEY=...                # Option C: FalAI Veo3 (fast, actual videos)
KIEAI_API_KEY=...                 # Option D: Kie.ai (cheapest, actual videos)

# Optional
PORT=4800                          # Server port (default 4800)
NODE_ENV=development              # Environment mode
```

## API Endpoints

### Generation Endpoints
- `POST /api/generate` - Standard JSON segment generation
- `POST /api/generate-plus` - Enhanced generation with run persistence
- `POST /api/generate/continuation` - Continuation mode with voice profiles
- `POST /api/generate/new-continuation` - New continuation implementation

### Video & Export Endpoints
- `POST /api/download` - Download segments as ZIP archive
- `POST /api/download-plus` - Download Plus mode segments with metadata
- `POST /api/generate-videos` - Generate video descriptions via Veo 3/Gemini
- `POST /api/generate-videos-falai` - Generate actual videos via FalAI Veo3
- `POST /api/generate-video-kieai` - Generate actual videos via Kie.ai
- `GET /api/falai-status` - Check FalAI service availability

### Utility Endpoints
- `GET /api/health` - Health check endpoint

## OpenAI System Prompts

### 1. Standard Generation Template (ugc-template.md)
Used for generating 300+ word character descriptions per segment. Key requirements:
- **Physical Description**: 100+ words covering hair, face, eyes, body, hands, energy
- **Clothing**: 100+ words with exact details on all garments, colors, fit, accessories
- **Voice**: 50+ words on tone, pace, inflections, breathing patterns
- **Personality**: 50+ words on energy level, expressions, gestures, body language

Each segment JSON includes:
- Character positioning and framing
- Script text with timing
- Detailed actions synchronized to dialogue
- Product placement and interaction
- Camera angles and movement
- Lighting specifications
- Audio emphasis points
- Transition notes for seamless flow

### 2. Enhanced Continuity Template (veo3-enhanced-continuity.md)
Used for 500+ word descriptions with micro-expressions and detailed continuity. Adds:
- **Continuity Markers**: Exact start/end positions, expressions, gestures for each segment
- **Extended Descriptions**: 200+ words physical, 150+ words clothing, 100+ words current state
- **Voice Matching**: 100+ words with precise vocal blueprint including pitch patterns
- **Scene Continuity**: 250+ words environment, 75+ words camera, 50+ words lighting
- **Action Timeline**: Beat-by-beat synchronized actions with micro-expressions
- **Overlap Planning**: 1-second overlap zones between segments
- **Transition Types**: Continuous motion, matched still, or energy match transitions

### 3. Continuation Mode Template (veo3-continuation-minimal.md)
Used after initial segment to maintain consistency while minimizing redundancy:
- **Voice Matching**: 150+ words with exact technical specs (CRITICAL)
- **Behavioral Patterns**: 100+ words on gesture vocabulary and energy expression
- **Current State**: 50+ words on this moment's specific energy and expression
- **Minimal Physical**: Simply references "Continue from screenshot"
- Focuses on voice continuity, behavioral consistency, and smooth transitions

### 4. General Guidelines (veo3-json-guidelines.md)
Base requirements for all formats:
- 300+ words minimum per segment (500+ for enhanced)
- 8-second timing with ~20 words of dialogue
- Identical character/clothing/environment descriptions across segments
- Natural break points and seamless transitions
- Synchronized actions matching dialogue timing
- Quality validation checklists for consistency

## Prompt Processing Flow
1. **Input Validation**: Script must be 50+ characters, split into ~20 word segments
2. **Template Selection**: Based on jsonFormat parameter (standard/enhanced/continuation)
3. **Base Generation**: Creates consistent character/environment descriptions
4. **Segment Generation**: Sequential processing with continuity tracking
5. **Output Validation**: Ensures word counts and structure requirements are met
6. **Optional Persistence**: Plus mode saves to runs/plus/{timestamp}/

## Technical Implementation Details

### Dependencies
- **Backend**: Express 4.18, OpenAI 4.20, express-rate-limit, archiver, dotenv
- **Frontend**: React 18.2, react-scripts 5.0
- **Video Services**: @google/generative-ai, @google-cloud/vertexai
- **Development**: nodemon, concurrently

### File Structure
```
/
├── server.js                 # Main Express server
├── api/
│   ├── routes/              # API endpoint handlers
│   └── services/            # External service integrations
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.js          # Main app with routing
│   │   ├── components/     # UI components
│   │   └── api/            # API client code
│   └── build/              # Production build
├── instructions/            # OpenAI prompt templates
├── runs/plus/              # Persisted generation runs
└── build/                  # Served production build
```

### Error Handling & Logging

#### Startup Validation
- **Environment checks**: Validates required API keys on startup
- **Dependency verification**: Ensures node_modules exist before starting
- **Build status**: Checks for React build, provides helpful instructions if missing
- **Port conflicts**: Detects and reports port usage conflicts with solutions
- **Graceful shutdown**: Handles SIGTERM/SIGINT with proper cleanup

#### Runtime Error Handling
- **Global Express handler**: Catches all unhandled errors with unique error IDs
- **React ErrorBoundary**: Wraps entire app for frontend error recovery
- **Request tracking**: Each request gets unique ID for debugging
- **Environment-aware responses**: Detailed errors in dev, sanitized in production
- **Rate limiting**: Prevents API abuse (10 req/min per IP)

#### Logging System
- **Startup logging**: Comprehensive startup diagnostics with visual indicators
- **Request logging**: Tracks all API requests with timing and status
- **Error reporting**: Detailed error logs with stack traces and context
- **File logging**: Optional log files in `./logs/` directory (when enabled)
- **Log levels**: ERROR, WARN, INFO, DEBUG, TRACE (configurable via LOG_LEVEL env)

#### Helper Scripts
- **startup.js**: Automated startup with dependency checking and error recovery
- **utils/logger.js**: Centralized logging utility with color coding and file output

### Performance Considerations
- Script splitting optimized for 8-second segments (15-22 words)
- Parallel segment generation where possible
- Response caching for repeated requests
- Archiver compression level 9 for ZIP downloads

## Important Development Guidelines

### Code Style & Practices
- Uses ES Modules (`"type": "module"` in package.json)
- Express server runs on port 4800 by default (configurable via PORT env var)
- No test framework configured - use manual testing via development server
- All API endpoints have rate limiting (10 requests/minute per IP)
- Request logging enabled with unique request IDs for debugging

### Key Development Patterns
- **Error Handling**: Global Express error handler with unique error IDs and environment-aware responses
- **Startup Validation**: Comprehensive environment and dependency checks before server start
- **Request Tracking**: Each API request gets unique ID for end-to-end debugging
- **File Structure**: Clean separation between API routes (`/api/routes/`) and services (`/api/services/`)
- **Multiple Modes**: Four distinct generation modes with their own API endpoints and UI components

### Important Files to Know
- `startup.js`: Smart startup script with dependency checking and helpful error messages
- `utils/logger.js`: Centralized logging with file output and color coding
- `instructions/`: Contains OpenAI prompt templates - critical for understanding generation logic
- `runs/plus/`: Persistent storage for Plus mode generations (auto-created)

### Development Workflow
1. Use `npm run startup` for automated dependency checks and environment validation
2. Use `npm run dev:watch` for development with hot reload (client + server)
3. Check `/api/health` endpoint for server status and configuration
4. Review logs in `./logs/` directory for debugging
5. Plus mode automatically saves all inputs/outputs to `runs/plus/{timestamp}/`
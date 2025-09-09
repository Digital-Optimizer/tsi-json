#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  divider: () => console.log('─'.repeat(60))
};

// Check system requirements
function checkSystemRequirements() {
  log.header('🔍 Checking System Requirements');
  
  // Check Node.js version
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));
    
    if (majorVersion < 16) {
      log.error(`Node.js version ${nodeVersion} is too old. Please upgrade to v16 or higher.`);
      return false;
    }
    log.success(`Node.js ${nodeVersion} detected`);
  } catch (error) {
    log.error('Failed to check Node.js version');
    return false;
  }
  
  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log.success(`npm ${npmVersion} detected`);
  } catch (error) {
    log.error('npm not found. Please install npm.');
    return false;
  }
  
  return true;
}

// Check and install dependencies
function checkDependencies() {
  log.header('📦 Checking Dependencies');
  
  // Check root dependencies
  const rootPackageJson = path.join(__dirname, 'package.json');
  const rootNodeModules = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(rootNodeModules)) {
    log.warning('Root dependencies not installed');
    log.info('Installing root dependencies...');
    try {
      execSync('npm install', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      log.success('Root dependencies installed');
    } catch (error) {
      log.error('Failed to install root dependencies');
      return false;
    }
  } else {
    log.success('Root dependencies found');
  }
  
  // Check client dependencies
  const clientPath = path.join(__dirname, 'client');
  const clientNodeModules = path.join(clientPath, 'node_modules');
  
  if (!fs.existsSync(clientNodeModules)) {
    log.warning('Client dependencies not installed');
    log.info('Installing client dependencies...');
    try {
      execSync('npm install', { 
        cwd: clientPath, 
        stdio: 'inherit' 
      });
      log.success('Client dependencies installed');
    } catch (error) {
      log.error('Failed to install client dependencies');
      return false;
    }
  } else {
    log.success('Client dependencies found');
  }
  
  return true;
}

// Check environment configuration
function checkEnvironment() {
  log.header('🔐 Checking Environment Configuration');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found');
    
    // Create example .env file if it doesn't exist
    if (!fs.existsSync(envExamplePath)) {
      const exampleEnv = `# Required
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_PROJECT_ID=proj-your-project-id-here

# Server Configuration
PORT=4000
NODE_ENV=development

# Video Generation (Choose ONE)
# Option A: Gemini API
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Option B: Vertex AI
# GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
# VERTEX_PROJECT_ID=your-project-id
# VERTEX_LOCATION=us-central1

# Option C: Kie.ai
# KIEAI_API_KEY=your-kieai-api-key
`;
      fs.writeFileSync(envExamplePath, exampleEnv);
      log.info('Created .env.example file');
    }
    
    log.warning('Please create a .env file based on .env.example');
    log.info('Copy .env.example to .env and add your API keys');
    return false;
  }
  
  // Check for required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasOpenAIKey = envContent.includes('OPENAI_API_KEY=') && 
                       !envContent.includes('OPENAI_API_KEY=sk-your-api-key-here');
  
  if (!hasOpenAIKey) {
    log.error('OPENAI_API_KEY not configured in .env file');
    log.warning('Please add your OpenAI API key to the .env file');
    return false;
  }
  
  log.success('.env file configured');
  
  // Check for at least one video generation API
  const hasVideoAPI = 
    (envContent.includes('GOOGLE_GEMINI_API_KEY=') && !envContent.includes('GOOGLE_GEMINI_API_KEY=your-')) ||
    (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS=') && !envContent.includes('GOOGLE_APPLICATION_CREDENTIALS=./service-')) ||
    (envContent.includes('KIEAI_API_KEY=') && !envContent.includes('KIEAI_API_KEY=your-'));
  
  if (!hasVideoAPI) {
    log.warning('No video generation API configured (optional)');
    log.info('Add Gemini, Vertex AI, or Kie.ai API keys for video generation');
  } else {
    log.success('Video generation API configured');
  }
  
  return true;
}

// Check if build exists
function checkBuild() {
  log.header('🏗️  Checking Build Status');
  
  const buildPath = path.join(__dirname, 'build');
  const indexPath = path.join(buildPath, 'index.html');
  
  if (!fs.existsSync(buildPath) || !fs.existsSync(indexPath)) {
    log.warning('Build not found');
    log.info('Building React application...');
    
    try {
      execSync('npm run build', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      log.success('Build completed');
      return true;
    } catch (error) {
      log.error('Build failed');
      log.info('The server will start but the UI will not be available');
      log.info('Run "npm run build" manually to fix this');
      return false;
    }
  }
  
  log.success('Build found');
  return true;
}

// Start the server
function startServer(mode = 'production') {
  log.header('🚀 Starting Server');
  log.divider();
  
  try {
    if (mode === 'development') {
      log.info('Starting in development mode with watch...');
      execSync('npm run dev:watch', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
    } else {
      log.info('Starting production server...');
      execSync('npm start', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
    }
  } catch (error) {
    if (error.signal === 'SIGINT') {
      log.info('\nServer stopped by user');
    } else {
      log.error('Server crashed');
      process.exit(1);
    }
  }
}

// Main startup sequence
async function main() {
  console.clear();
  log.header('🎬 UGC Script Splitter - Startup Manager');
  log.divider();
  
  // Get startup mode from arguments
  const args = process.argv.slice(2);
  const isDev = args.includes('--dev') || args.includes('-d');
  const skipBuild = args.includes('--skip-build');
  const forceInstall = args.includes('--force-install');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node startup.js [options]

Options:
  --dev, -d        Start in development mode with hot reload
  --skip-build     Skip the build check/creation
  --force-install  Force reinstall all dependencies
  --help, -h       Show this help message

Examples:
  node startup.js           # Start production server
  node startup.js --dev     # Start development server
  node startup.js --skip-build --dev  # Dev mode without building
`);
    process.exit(0);
  }
  
  // Run checks
  if (!checkSystemRequirements()) {
    log.error('System requirements not met');
    process.exit(1);
  }
  
  if (forceInstall) {
    log.info('Force reinstalling dependencies...');
    try {
      execSync('rm -rf node_modules client/node_modules', { cwd: __dirname });
    } catch (e) {}
  }
  
  if (!checkDependencies()) {
    log.error('Failed to install dependencies');
    process.exit(1);
  }
  
  if (!checkEnvironment()) {
    log.error('Environment not properly configured');
    log.info('Please configure your .env file and try again');
    process.exit(1);
  }
  
  if (!skipBuild && !isDev) {
    checkBuild(); // Don't exit if build fails, server can still run
  }
  
  // Start the server
  startServer(isDev ? 'development' : 'production');
}

// Handle errors
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
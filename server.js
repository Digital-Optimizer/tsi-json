import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Startup logging
console.log('='.repeat(60));
console.log('SERVER STARTUP INITIATED');
console.log('='.repeat(60));
console.log(`Time: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log(`Script Location: ${__filename}`);
console.log('='.repeat(60));

// Validate critical environment variables
const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  
  // Check required variables
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is missing - Required for script generation');
  } else {
    console.log('✓ OpenAI API Key found:', `${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
  }
  
  // Check optional but recommended variables
  if (!process.env.GOOGLE_GEMINI_API_KEY && 
      !process.env.GOOGLE_APPLICATION_CREDENTIALS && 
      !process.env.KIEAI_API_KEY) {
    warnings.push('No video generation API keys found (Gemini/Vertex/Kie.ai) - Video generation will be disabled');
  } else {
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      console.log('✓ Gemini API Key found');
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('✓ Vertex AI credentials found:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    }
    if (process.env.KIEAI_API_KEY) {
      console.log('✓ Kie.ai API Key found');
    }
  }
  
  // Check build directory
  const buildPath = path.join(__dirname, 'build');
  if (!fs.existsSync(buildPath)) {
    warnings.push(`Build directory not found at ${buildPath} - Run 'npm run build' to create it`);
  } else {
    const indexPath = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      warnings.push('index.html not found in build directory - Run "npm run build" to create it');
    } else {
      console.log('✓ Build directory found with index.html');
    }
  }
  
  // Report issues
  if (errors.length > 0) {
    console.error('\n❌ CRITICAL ERRORS:');
    errors.forEach(err => console.error('  -', err));
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  WARNINGS:');
    warnings.forEach(warn => console.warn('  -', warn));
  }
  
  return { errors, warnings };
};

// Validate environment
const { errors, warnings } = validateEnvironment();

if (errors.length > 0) {
  console.error('\n🛑 Cannot start server due to critical errors.');
  console.error('Please fix the above issues and try again.');
  process.exit(1);
}

// Import routes after environment validation
let generateRoute, generateContinuationRoute, generatePlusRoute, generateNewContRoute, generateVideosFalAIRoute;

try {
  console.log('\nLoading route modules...');
  generateRoute = await import('./api/routes/generate.js');
  console.log('✓ Loaded generate.js');
  
  generateContinuationRoute = await import('./api/routes/generateContinuation.js');
  console.log('✓ Loaded generateContinuation.js');
  
  generatePlusRoute = await import('./api/routes/generate.plus.js');
  console.log('✓ Loaded generate.plus.js');
  
  generateNewContRoute = await import('./api/routes/generate.newcont.js');
  console.log('✓ Loaded generate.newcont.js');
  
  generateVideosFalAIRoute = await import('./api/routes/generateVideosFalAI.js');
  console.log('✓ Loaded generateVideosFalAI.js');
} catch (error) {
  console.error('❌ Failed to load route modules:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Enhanced request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Log request body for POST requests (excluding sensitive data)
  if (method === 'POST' && req.url.startsWith('/api/')) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const statusEmoji = status >= 200 && status < 300 ? '✓' : '✗';
      
      console.log(`  ${statusEmoji} Response: ${status} - Duration: ${duration}ms`);
    });
  }
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes (before static files)
try {
  app.use('/api', generateRoute.default);
  app.use('/api', generateContinuationRoute.default);
  app.use('/api', generatePlusRoute.default);
  app.use('/api', generateNewContRoute.default);
  app.use('/api', generateVideosFalAIRoute.default);
  console.log('✓ All API routes registered');
} catch (error) {
  console.error('❌ Failed to register routes:', error);
  process.exit(1);
}

// Serve static files from React build
const buildPath = path.join(__dirname, 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log(`✓ Serving static files from: ${buildPath}`);
} else {
  console.warn(`⚠️  Build directory not found: ${buildPath}`);
  console.warn('  The React app will not be available.');
  console.warn('  Run "npm run build" to create the production build.');
}

// Health check endpoint with detailed status
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    memory: process.memoryUsage(),
    apis: {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      vertex: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      kieai: !!process.env.KIEAI_API_KEY
    },
    buildAvailable: fs.existsSync(path.join(__dirname, 'build', 'index.html'))
  };
  
  res.json(healthStatus);
});

// Catch all handler - send React app for any route not handled above
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found at: ${indexPath}`);
    return res.status(503).send(`
      <html>
        <head><title>Application Not Built</title></head>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>📦 Application Not Built</h1>
          <p>The React application has not been built yet.</p>
          <h2>To fix this:</h2>
          <ol>
            <li>Open a terminal in the project root</li>
            <li>Run: <code style="background: #f0f0f0; padding: 4px 8px;">npm run build</code></li>
            <li>Restart the server: <code style="background: #f0f0f0; padding: 4px 8px;">npm start</code></li>
          </ol>
          <h2>For development:</h2>
          <p>Use <code style="background: #f0f0f0; padding: 4px 8px;">npm run dev</code> to build and start the server automatically.</p>
          <hr>
          <p><small>Server is running on port ${PORT}</small></p>
        </body>
      </html>
    `);
  }
  
  console.log(`Serving React app from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1>500 - Internal Server Error</h1>
            <p>Failed to load the application.</p>
            <details>
              <summary>Error Details</summary>
              <pre>${err.message}</pre>
            </details>
          </body>
        </html>
      `);
    }
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const errorId = Math.random().toString(36).substring(7);
  
  console.error('='.repeat(60));
  console.error(`ERROR [${errorId}] at ${timestamp}`);
  console.error('Request:', req.method, req.url);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('='.repeat(60));
  
  // Determine error response based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    errorId: errorId,
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { 
      stack: err.stack,
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    })
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('='.repeat(60));
  console.error('UNCAUGHT EXCEPTION - Server will shut down');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('='.repeat(60));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('='.repeat(60));
  console.error('UNHANDLED PROMISE REJECTION');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('='.repeat(60));
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  const server = app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`✅ SERVER STARTED SUCCESSFULLY`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📂 Build Path: ${path.join(__dirname, 'build')}`);
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Started with warnings - check above for details');
    }
    
    console.log('='.repeat(60));
    console.log('Press Ctrl+C to stop the server\n');
  });
  
  server.on('error', (error) => {
    console.error('='.repeat(60));
    console.error('❌ SERVER FAILED TO START');
    console.error('='.repeat(60));
    
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.error('\nTo fix this:');
      console.error('1. Find the process using the port:');
      console.error(`   lsof -i :${PORT}`);
      console.error('2. Kill the process:');
      console.error('   kill -9 <PID>');
      console.error('3. Or use a different port:');
      console.error(`   PORT=3002 npm start`);
    } else if (error.code === 'EACCES') {
      console.error(`Permission denied to use port ${PORT}.`);
      console.error('Try using a port number above 1024.');
    } else {
      console.error('Error details:', error);
    }
    
    console.error('='.repeat(60));
    process.exit(1);
  });
  
  return server;
};

// Start the server
const server = gracefulShutdown('STARTUP');

// Handle termination signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after 10 seconds');
      process.exit(1);
    }, 10000);
  });
});
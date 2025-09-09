import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor(name = 'app', options = {}) {
    this.name = name;
    this.level = options.level || (process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);
    this.writeToFile = options.writeToFile !== false;
    this.colorize = options.colorize !== false && process.stdout.isTTY;
    
    // Create log file streams
    if (this.writeToFile) {
      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(logsDir, `${name}-${date}.log`);
      this.errorFile = path.join(logsDir, `${name}-error-${date}.log`);
    }
    
    // Request tracking
    this.requestId = null;
  }
  
  setRequestId(id) {
    this.requestId = id;
  }
  
  clearRequestId() {
    this.requestId = null;
  }
  
  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);
    const requestIdStr = this.requestId ? `[${this.requestId}]` : '';
    
    let formattedMessage = `[${timestamp}] [${levelName}] [${this.name}]${requestIdStr} ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        formattedMessage += '\n' + JSON.stringify(data, null, 2);
      } else {
        formattedMessage += ' ' + data;
      }
    }
    
    return formattedMessage;
  }
  
  _colorizeMessage(level, message) {
    if (!this.colorize) return message;
    
    const levelColors = {
      [LogLevel.ERROR]: colors.red,
      [LogLevel.WARN]: colors.yellow,
      [LogLevel.INFO]: colors.blue,
      [LogLevel.DEBUG]: colors.cyan,
      [LogLevel.TRACE]: colors.magenta
    };
    
    const color = levelColors[level] || colors.white;
    return `${color}${message}${colors.reset}`;
  }
  
  _writeToFile(filename, message) {
    if (!this.writeToFile) return;
    
    fs.appendFile(filename, message + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }
  
  _log(level, message, data) {
    if (level > this.level) return;
    
    const formattedMessage = this._formatMessage(level, message, data);
    const colorizedMessage = this._colorizeMessage(level, formattedMessage);
    
    // Output to console
    if (level === LogLevel.ERROR) {
      console.error(colorizedMessage);
    } else if (level === LogLevel.WARN) {
      console.warn(colorizedMessage);
    } else {
      console.log(colorizedMessage);
    }
    
    // Write to file
    if (this.writeToFile) {
      this._writeToFile(this.logFile, formattedMessage);
      if (level === LogLevel.ERROR) {
        this._writeToFile(this.errorFile, formattedMessage);
      }
    }
  }
  
  error(message, data) {
    this._log(LogLevel.ERROR, message, data);
  }
  
  warn(message, data) {
    this._log(LogLevel.WARN, message, data);
  }
  
  info(message, data) {
    this._log(LogLevel.INFO, message, data);
  }
  
  debug(message, data) {
    this._log(LogLevel.DEBUG, message, data);
  }
  
  trace(message, data) {
    this._log(LogLevel.TRACE, message, data);
  }
  
  // Convenience methods
  success(message, data) {
    const successMessage = this.colorize ? `${colors.green}✓${colors.reset} ${message}` : `✓ ${message}`;
    this._log(LogLevel.INFO, successMessage, data);
  }
  
  divider() {
    this._log(LogLevel.INFO, '─'.repeat(60));
  }
  
  header(title) {
    this.divider();
    this._log(LogLevel.INFO, title);
    this.divider();
  }
  
  // Performance logging
  startTimer(label) {
    const startTime = Date.now();
    return {
      end: (message) => {
        const duration = Date.now() - startTime;
        this.info(`${message || label} (${duration}ms)`);
        return duration;
      }
    };
  }
  
  // API request logging
  logRequest(req) {
    const { method, url, headers, body } = req;
    this.info(`API Request: ${method} ${url}`, {
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type']
      },
      bodySize: body ? JSON.stringify(body).length : 0
    });
  }
  
  logResponse(res, duration) {
    const { statusCode } = res;
    const emoji = statusCode >= 200 && statusCode < 300 ? '✓' : '✗';
    this.info(`API Response: ${emoji} ${statusCode} (${duration}ms)`);
  }
  
  // Error reporting with context
  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...context
    };
    
    this.error('Application Error', errorInfo);
    
    // Also log to error-specific file with full details
    if (this.writeToFile) {
      const errorReport = {
        timestamp: new Date().toISOString(),
        name: this.name,
        requestId: this.requestId,
        error: errorInfo,
        environment: {
          node: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      };
      
      const reportFile = path.join(logsDir, `error-report-${Date.now()}.json`);
      fs.writeFileSync(reportFile, JSON.stringify(errorReport, null, 2));
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger('app');

// Middleware for Express
export function requestLogger(logger = defaultLogger) {
  return (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    req.requestId = requestId;
    logger.setRequestId(requestId);
    
    const timer = logger.startTimer('Request');
    logger.logRequest(req);
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = timer.end('Request completed');
      logger.logResponse(res, duration);
      logger.clearRequestId();
      originalSend.call(this, data);
    };
    
    next();
  };
}

// Error handler middleware for Express
export function errorLogger(logger = defaultLogger) {
  return (err, req, res, next) => {
    logger.logError(err, {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    next(err);
  };
}

// Export Logger class and default instance
export { Logger, LogLevel };
export default defaultLogger;
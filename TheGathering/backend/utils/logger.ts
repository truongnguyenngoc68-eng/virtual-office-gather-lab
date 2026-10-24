/**
 * Centralized logging utility
 * Supports different log levels and can be extended for external services
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level from environment or default to INFO
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    this.logLevel = envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)
      ? (envLogLevel as LogLevel)
      : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;
    let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      logMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        logMessage += ` | Stack: ${error.stack}`;
      }
    }

    return logMessage;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // Console output with appropriate method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }

    // TODO: Send to external logging service (Sentry, Logtail, etc.)
    // this.sendToExternalService(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Request logging helper
  logRequest(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    const context = {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
      userId,
    };

    if (statusCode >= 500) {
      this.error(`Request failed: ${method} ${path}`, undefined, context);
    } else if (statusCode >= 400) {
      this.warn(`Request warning: ${method} ${path}`, context);
    } else {
      this.info(`Request: ${method} ${path}`, context);
    }
  }

  // Database operation logging
  logDatabase(operation: string, collection: string, duration?: number, error?: Error): void {
    const context = {
      operation,
      collection,
      duration: duration ? `${duration}ms` : undefined,
    };

    if (error) {
      this.error(`Database error: ${operation} on ${collection}`, error, context);
    } else {
      this.debug(`Database: ${operation} on ${collection}`, context);
    }
  }

  // Socket.IO event logging
  logSocket(event: string, userId?: string, roomId?: string, error?: Error): void {
    const context = {
      event,
      userId,
      roomId,
    };

    if (error) {
      this.error(`Socket error: ${event}`, error, context);
    } else {
      this.debug(`Socket: ${event}`, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

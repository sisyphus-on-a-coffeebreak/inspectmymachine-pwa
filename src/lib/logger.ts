/**
 * Structured Logging Service
 * 
 * Provides a centralized logging interface that:
 * - Logs to console in development
 * - Silences logs in production (or sends to external service)
 * - Supports different log levels
 * - Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.isProduction = import.meta.env.PROD;
  }

  /**
   * Format log entry for console output
   */
  private formatLog(entry: LogEntry): string {
    const context = entry.context ? `[${entry.context}]` : '';
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
  }

  /**
   * Send log to external service (e.g., Sentry, LogRocket)
   * This can be extended to integrate with error tracking services
   */
  private sendToExternalService(entry: LogEntry): void {
    if (!this.isProduction) {
      return; // Only send to external services in production
    }

    // TODO: Integrate with error tracking service
    // Example: Sentry.captureMessage(entry.message, entry.level);
    // Example: LogRocket.log(entry.level, entry.message, entry.data);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    // In development, always log to console
    if (this.isDevelopment) {
      const formattedMessage = this.formatLog(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, data || '');
          break;
        case 'info':
          console.info(formattedMessage, data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, data || '');
          break;
        case 'error':
          console.error(formattedMessage, data || '');
          break;
      }
    }

    // In production, send critical errors to external service
    if (this.isProduction && level === 'error') {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, data?: unknown, context?: string): void {
    if (this.isDevelopment) {
      this.log('debug', message, data, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * Error level logging
   * Always logged, even in production (sent to external service)
   */
  error(message: string, error?: Error | unknown, context?: string): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    this.log('error', message, errorData, context);
    
    // In production, also log to console for critical errors
    // (browser console is still useful for debugging production issues)
    if (this.isProduction) {
      console.error(`[${context || 'ERROR'}] ${message}`, errorData);
    }
  }

  /**
   * Create a logger instance with a specific context
   * Useful for component or module-specific logging
   */
  createContext(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-specific logger
 * Automatically includes context in all log messages
 */
class ContextLogger {
  constructor(
    private logger: Logger,
    private context: string
  ) {}

  debug(message: string, data?: unknown): void {
    this.logger.debug(message, data, this.context);
  }

  info(message: string, data?: unknown): void {
    this.logger.info(message, data, this.context);
  }

  warn(message: string, data?: unknown): void {
    this.logger.warn(message, data, this.context);
  }

  error(message: string, error?: Error | unknown): void {
    this.logger.error(message, error, this.context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogEntry };
export { Logger, ContextLogger };

// Default export
export default logger;


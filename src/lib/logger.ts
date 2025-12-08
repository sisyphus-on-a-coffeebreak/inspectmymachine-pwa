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
   * Safely serialize data for console logging
   * Handles circular references and non-serializable values
   * Always returns a string to prevent "Cannot convert object to primitive value" errors
   */
  private safeSerialize(data: unknown): string {
    if (data === undefined || data === null) {
      return '';
    }
    
    // Primitives can be converted to string
    if (typeof data !== 'object') {
      return String(data);
    }
    
    // Handle Error instances specially
    if (data instanceof Error) {
      try {
        return JSON.stringify({
          name: data.name,
          message: data.message,
          stack: data.stack,
        }, null, 2);
      } catch {
        return `Error: ${data.name || 'Unknown'} - ${data.message || 'No message'}`;
      }
    }
    
    // For objects, try to serialize safely
    try {
      // Use a replacer to handle circular references
      const seen = new WeakSet();
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        // Handle non-serializable values
        if (value === undefined) {
          return '[undefined]';
        }
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        // Handle React ErrorInfo objects
        if (value && typeof value === 'object' && 'componentStack' in value) {
          return {
            componentStack: value.componentStack,
          };
        }
        return value;
      }, 2);
    } catch (err) {
      // If serialization fails, return a safe string representation
      try {
        return `[Object: ${Object.prototype.toString.call(data)}]`;
      } catch {
        return '[Object: Unable to serialize]';
      }
    }
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
      const safeData = data !== undefined ? this.safeSerialize(data) : '';
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, safeData);
          break;
        case 'info':
          console.info(formattedMessage, safeData);
          break;
        case 'warn':
          console.warn(formattedMessage, safeData);
          break;
        case 'error':
          // Always pass as string to prevent primitive conversion errors
          console.error(formattedMessage + (safeData ? '\n' + safeData : ''));
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
      const safeErrorData = this.safeSerialize(errorData);
      // Pass as string to prevent primitive conversion errors
      console.error(`[${context || 'ERROR'}] ${message}\n${safeErrorData}`);
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


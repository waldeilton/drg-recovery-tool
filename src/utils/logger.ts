/**
 * Logger Utility
 * Structured logging for DRG Recovery Tool
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: unknown;
}

export class Logger {
  private namespace: string;
  private logLevel: LogLevel;

  constructor(namespace: string, logLevel: LogLevel = 'info') {
    this.namespace = namespace;
    this.logLevel = logLevel;
  }

  private format(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      data,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      const entry = this.format('debug', message, data);
      // eslint-disable-next-line no-console
      console.debug(JSON.stringify(entry));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      const entry = this.format('info', message, data);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      const entry = this.format('warn', message, data);
      // eslint-disable-next-line no-console
      console.warn(JSON.stringify(entry));
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      const entry = this.format('error', message, errorData);
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(entry));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

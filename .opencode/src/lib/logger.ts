type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private minLevel: LogLevel;
  private context: Record<string, unknown>;

  constructor(minLevel: LogLevel = "INFO", baseContext: Record<string, unknown> = {}) {
    this.minLevel = minLevel;
    this.context = baseContext;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? { ...this.context, ...context } : this.context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry);
    if (entry.level === "ERROR") {
      console.error(json);
    } else if (entry.level === "WARN") {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("DEBUG")) return;
    this.output(this.formatEntry("DEBUG", message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("INFO")) return;
    this.output(this.formatEntry("INFO", message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog("WARN")) return;
    this.output(this.formatEntry("WARN", message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog("ERROR")) return;
    this.output(this.formatEntry("ERROR", message, context, error));
  }

  child(additionalContext: Record<string, unknown>): Logger {
    return new Logger(this.minLevel, { ...this.context, ...additionalContext });
  }

  withLevel(level: LogLevel): Logger {
    return new Logger(level, this.context);
  }
}

function createLogger(minLevel?: LogLevel): Logger {
  const envLevel = process.env["SDD_LOG_LEVEL"] as LogLevel | undefined;
  const level = minLevel ?? envLevel ?? "INFO";
  return new Logger(level);
}

// Default logger instance
const logger = createLogger();

export { Logger, createLogger, logger };
export type { LogLevel, LogEntry };

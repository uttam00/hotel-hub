type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.context ? `[${entry.context}]` : "",
    entry.message,
  ].filter(Boolean);

  return parts.join(" ");
}

function log(level: LogLevel, message: string, context?: string, data?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatLog(entry);

  switch (level) {
    case "error":
      console.error(formatted, data ? data : "");
      break;
    case "warn":
      console.warn(formatted, data ? data : "");
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formatted, data ? data : "");
      }
      break;
    default:
      console.log(formatted, data ? data : "");
  }
}

export const logger = {
  info: (message: string, context?: string, data?: unknown) =>
    log("info", message, context, data),
  warn: (message: string, context?: string, data?: unknown) =>
    log("warn", message, context, data),
  error: (message: string, context?: string, data?: unknown) =>
    log("error", message, context, data),
  debug: (message: string, context?: string, data?: unknown) =>
    log("debug", message, context, data),
};

export default logger;

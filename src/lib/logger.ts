type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly shouldSendToServer =
    import.meta.env.VITE_LOGGING_ENDPOINT !== undefined &&
    import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING !== "false";

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console
    const consoleMethod = level === "debug" ? "log" : level;
    console[consoleMethod](
      `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`,
      data || "",
    );

    // Send to server if configured
    if (this.shouldSendToServer && (level === "error" || level === "warn")) {
      this.sendToServer(entry);
    }
  }

  private sendToServer(entry: LogEntry): void {
    const endpoint = import.meta.env.VITE_LOGGING_ENDPOINT;
    if (!endpoint) return;

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch((err) => console.error("Failed to send log to server:", err));
  }

  public debug(message: string, data?: any): void {
    if (
      import.meta.env.MODE === "development" ||
      import.meta.env.VITE_DEBUG_LOGS === "true"
    ) {
      this.log("debug", message, data);
    }
  }

  public info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  public warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  public error(message: string, data?: any): void {
    this.log("error", message, data);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = Logger.getInstance();

import { logger } from "./logger";

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  timeToInteractive?: number;
}

interface MonitoringData {
  type: string;
  [key: string]: unknown;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring = false;
  private readonly endpoint =
    import.meta.env.VITE_MONITORING_ENDPOINT &&
    import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING !== "false"
      ? import.meta.env.VITE_MONITORING_ENDPOINT
      : undefined;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor page load performance
    window.addEventListener("load", () => this.captureLoadMetrics());

    // Monitor network errors
    window.addEventListener(
      "error",
      (event: ErrorEvent) => {
        if (event.target && (event.target as HTMLElement).tagName) {
          const target = event.target as HTMLElement;
          if (
            target.tagName === "IMG" ||
            target.tagName === "SCRIPT" ||
            target.tagName === "LINK"
          ) {
            this.logResourceError(target);
          }
        }
      },
      true,
    );

    // Monitor unhandled promise rejections
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      logger.error("Unhandled Promise Rejection:", event.reason);
      this.sendToMonitoring({
        type: "unhandled_rejection",
        message: event.reason?.message || "Unknown promise rejection",
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info("Performance monitoring started");
  }

  private captureLoadMetrics(): void {
    if (!window.performance) return;

    setTimeout(() => {
      const perfEntries = performance.getEntriesByType("navigation");
      const paintEntries = performance.getEntriesByType("paint");

      let firstPaint = 0;
      let firstContentfulPaint = 0;

      paintEntries.forEach((entry) => {
        if (entry.name === "first-paint") {
          firstPaint = entry.startTime;
        }
        if (entry.name === "first-contentful-paint") {
          firstContentfulPaint = entry.startTime;
        }
      });

      const navEntry = perfEntries[0] as PerformanceNavigationTiming;

      const metrics: PerformanceMetrics = {
        loadTime: navEntry ? navEntry.loadEventEnd - navEntry.startTime : 0,
        domContentLoaded: navEntry
          ? navEntry.domContentLoadedEventEnd - navEntry.startTime
          : 0,
        firstPaint,
        firstContentfulPaint,
      };

      logger.info("Page load performance metrics:", metrics);
      this.sendToMonitoring({
        type: "performance",
        metrics,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }, 0);
  }

  private logResourceError(target: HTMLElement): void {
    const resource = {
      tagName: target.tagName,
      src:
        (target as HTMLImageElement | HTMLScriptElement).src ||
        (target as HTMLLinkElement).href,
      id: target.id,
      className: target.className,
    };

    logger.error("Resource failed to load:", resource);
    this.sendToMonitoring({
      type: "resource_error",
      resource,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }

  private sendToMonitoring(data: MonitoringData): void {
    if (!this.endpoint) return;

    // Add device and browser information
    const enhancedData = {
      ...data,
      device: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        connection: navigator.connection
          ? {
              effectiveType: (navigator.connection as Record<string, unknown>).effectiveType,
              downlink: (navigator.connection as Record<string, unknown>).downlink,
              rtt: (navigator.connection as Record<string, unknown>).rtt,
            }
          : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    // Use the Beacon API for more reliable data sending when available
    if (navigator.sendBeacon && data.type !== "performance") {
      const blob = new Blob([JSON.stringify(enhancedData)], {
        type: "application/json",
      });
      const success = navigator.sendBeacon(this.endpoint, blob);
      if (!success) {
        // Fall back to fetch if sendBeacon fails
        this.sendWithFetch(enhancedData);
      }
    } else {
      this.sendWithFetch(enhancedData);
    }
  }

  private sendWithFetch(data: MonitoringData): void {
    fetch(this.endpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true, // Ensure data is sent even if page is unloading
    }).catch((err) => logger.error("Failed to send monitoring data:", err));
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
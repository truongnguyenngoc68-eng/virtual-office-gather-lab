/**
 * Frontend analytics utility
 * Tracks user events and sends to backend
 */

interface AnalyticsEvent {
  eventType: "page_view" | "user_action" | "error" | "performance" | "custom";
  eventName: string;
  properties?: Record<string, any>;
}

class Analytics {
  private sessionId: string;
  private serverUrl: string;
  private enabled: boolean = true;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    this.serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

    // Track page view on initialization
    this.track("page_view", "app_loaded", {
      path: window.location.pathname,
      referrer: document.referrer,
    });
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    return sessionId;
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await fetch(`${this.serverUrl}/api/analytics/track`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...event,
          sessionId: this.sessionId,
        }),
      });
    } catch (error) {
      // Silently fail - analytics should not break the app
      console.debug("Analytics tracking failed:", error);
    }
  }

  track(
    eventType: AnalyticsEvent["eventType"],
    eventName: string,
    properties?: Record<string, any>
  ): void {
    this.sendEvent({
      eventType,
      eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
  }

  trackPageView(path: string): void {
    this.track("page_view", "page_view", {
      path,
      referrer: document.referrer,
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track("user_action", action, properties);
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track("error", "error_occurred", {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context,
    });
  }

  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    this.track("performance", metric, {
      value,
      ...properties,
    });
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const analytics = new Analytics();

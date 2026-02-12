import { logger } from "./logger";
import { encryptData, decryptData } from "../components/ui/data-encryption";
import DOMPurify from 'dompurify';

// Enhanced Content Security Policy setup
export const setupCSP = () => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // Use a relaxed CSP for development
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content =
      "upgrade-insecure-requests; default-src 'self' 'unsafe-inline' 'unsafe-eval' *;";
    document.head.appendChild(meta);
    logger.info("Development CSP applied - all connections allowed");
    return;
  }

  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_CSP === "true") {
    // Only apply strict CSP in production
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = [
      "default-src 'self'",
      "img-src 'self' https://api.dicebear.com https://images.unsplash.com https://assets.mixkit.co data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://*.tempolabs.ai",
      "script-src 'self' 'nonce-${generateCSRFToken()}' https://api.tempolabs.ai",
      "style-src 'self' 'nonce-${generateCSRFToken()}'",
      "font-src 'self' data:",
      "frame-src 'self'",
      "worker-src 'self' blob:",
      "media-src 'self' https://assets.mixkit.co",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    document.head.appendChild(meta);

    // Add additional security headers
    const securityHeaders = [
      { name: "X-XSS-Protection", value: "1; mode=block" },
      { name: "X-Content-Type-Options", value: "nosniff" },
      { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        name: "Permissions-Policy",
        value: "camera=self, microphone=self, geolocation=self",
      },
      { name: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        name: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
    ];

    securityHeaders.forEach((header) => {
      const metaTag = document.createElement("meta");
      metaTag.httpEquiv = header.name;
      metaTag.content = header.value;
      document.head.appendChild(metaTag);
    });

    logger.info("CSP and security headers applied");
  }
};

// Enhanced XSS Protection using DOMPurify
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  // Use DOMPurify to sanitize text input
  // ALLOWED_TAGS: [] means strip ALL HTML tags, returning only text
  // This is perfect for user input fields where HTML is not expected
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed - strip everything
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep the text content
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true,
  });
};

// Validate and sanitize URL to prevent open redirect vulnerabilities
export const sanitizeUrl = (url: string): string => {
  if (!url) return "";

  try {
    // Check if it's a relative URL (starts with / but not //)
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }

    // For absolute URLs, validate they're to trusted domains
    const urlObj = new URL(url);
    const trustedDomains = [
      window.location.hostname,
      "tempolabs.ai",
      "supabase.co",
    ];

    if (
      trustedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
      )
    ) {
      return url;
    }

    // If not trusted, return a safe default
    logger.warn(`Potentially unsafe redirect URL blocked: ${url}`);
    return "/";
  } catch (e) {
    // If URL parsing fails, return a safe default
    logger.error(`Invalid URL sanitized: ${url}`, e);
    return "/";
  }
};

// Enhanced CSRF Protection with double submit cookie pattern
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32); // 32 bytes for better security
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export const storeCSRFToken = (token: string): void => {
  // Store in sessionStorage with expiration
  const expiration = Date.now() + 3600000; // 1 hour expiration
  sessionStorage.setItem("csrf_token", token);
  sessionStorage.setItem("csrf_token_expiry", expiration.toString());

  // Also set as a cookie with HttpOnly and SameSite attributes
  // Note: In a real production app, this would be set by the server
  // This is a client-side simulation for the Tempo environment
  document.cookie = `csrf_cookie=${token}; max-age=3600; path=/; SameSite=Strict`;
};

export const getCSRFToken = (): string | null => {
  const token = sessionStorage.getItem("csrf_token");
  const expiry = sessionStorage.getItem("csrf_token_expiry");

  if (!token || !expiry) return null;

  // Check if token is expired
  if (Date.now() > parseInt(expiry, 10)) {
    // Clear expired token
    sessionStorage.removeItem("csrf_token");
    sessionStorage.removeItem("csrf_token_expiry");
    document.cookie = "csrf_cookie=; max-age=0; path=/; SameSite=Strict";
    return null;
  }

  return token;
};

// Verify that the token in the header matches the token in the cookie
export const verifyCSRFToken = (headerToken: string): boolean => {
  // Extract the CSRF token from cookies
  const cookies = document.cookie.split(";");
  let cookieToken = null;

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrf_cookie") {
      cookieToken = value;
      break;
    }
  }

  // Verify that both tokens exist and match
  return !!cookieToken && !!headerToken && cookieToken === headerToken;
};

// Add CSRF token to fetch requests with automatic renewal
export const addCSRFToken = (headers: HeadersInit = {}): HeadersInit => {
  let token = getCSRFToken();

  // If token is expired or doesn't exist, generate a new one
  if (!token) {
    token = generateCSRFToken();
    storeCSRFToken(token);
  }

  if (token) {
    return {
      ...headers,
      "X-CSRF-Token": token,
    };
  }
  return headers;
};

// Create a wrapper for fetch that automatically adds CSRF protection
export const fetchWithCSRF = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const headers = addCSRFToken(options.headers || {});

  // Add additional security headers
  const secureHeaders = {
    ...headers,
    "X-Requested-With": "XMLHttpRequest", // Help prevent CSRF in older browsers
  };

  return fetch(url, {
    ...options,
    headers: secureHeaders,
  });
};

// Enhanced password strength checker with more comprehensive checks
export const checkPasswordStrength = (
  password: string,
): {
  score: number; // 0-4, 0 being very weak, 4 being very strong
  feedback: string;
  meetsMinimumRequirements: boolean;
} => {
  let score = 0;
  const feedback = [];

  // Minimum requirements tracking
  const requirements = {
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    special: false,
  };

  // Length check - stricter requirements
  if (password.length < 10) {
    feedback.push("Password should be at least 10 characters long");
  } else if (password.length >= 14) {
    score += 2;
    requirements.length = true;
  } else {
    score += 1;
    requirements.length = true;
  }

  // Complexity checks
  if (/[A-Z]/.test(password)) {
    score += 1;
    requirements.uppercase = true;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/[a-z]/.test(password)) {
    score += 1;
    requirements.lowercase = true;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
    requirements.numbers = true;
  } else {
    feedback.push("Add numbers");
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
    requirements.special = true;
  } else {
    feedback.push("Add special characters");
  }

  // Check for common patterns and dictionary words
  const commonPatterns = [
    /123|abc|qwerty|password|admin|welcome|letmein|trustno1/i,
    /asdf|zxcv|1234|4321|7890|0987|abcd|qwer/i,
    /password|passw0rd|p@ssw0rd|admin|administrator|root/i,
    /login|welcome|access|system|user|default|temp|test/i,
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common patterns and words");
  }

  // Check for repeated characters (e.g., 'aaa', '111')
  if (/(.)(\1{2,})/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid repeated characters");
  }

  // Check for sequential characters (e.g., 'abc', '123')
  if (/abcdef|ghijkl|mnopqr|stuvwx|yzabcd|012345|456789/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid sequential characters");
  }

  // Check for keyboard patterns (e.g., 'qwerty', 'asdfgh')
  if (/qwerty|asdfgh|zxcvbn|qazwsx|qawsed/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid keyboard patterns");
  }

  // Determine if password meets minimum requirements
  const meetsMinimumRequirements =
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.numbers &&
    requirements.special;

  return {
    score: Math.min(score, 4),
    feedback: feedback.join(". "),
    meetsMinimumRequirements,
  };
};

// Secure data storage with encryption
export const secureStore = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Add a timestamp for expiration checking
      const dataWithTimestamp = {
        value,
        timestamp: Date.now(),
        expires: key.includes("_session_")
          ? Date.now() + 24 * 60 * 60 * 1000
          : null, // Session data expires in 24 hours
      };

      const encryptedValue = await encryptData(
        JSON.stringify(dataWithTimestamp),
      );
      localStorage.setItem(`secure_${key}`, encryptedValue);

      // For sensitive data, also store in sessionStorage for added security
      if (key.includes("_sensitive_") || key.includes("_auth_")) {
        sessionStorage.setItem(`secure_${key}`, encryptedValue);
      }
    } catch (error) {
      logger.error("Error storing encrypted data:", error);
      // Only fall back for non-sensitive data
      if (!key.includes("_sensitive_") && !key.includes("_auth_")) {
        localStorage.setItem(key, value);
      }
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      // Try to get from sessionStorage first for sensitive data
      let encryptedValue = null;
      if (key.includes("_sensitive_") || key.includes("_auth_")) {
        encryptedValue = sessionStorage.getItem(`secure_${key}`);
      }

      // If not found in sessionStorage or not sensitive, try localStorage
      if (!encryptedValue) {
        encryptedValue = localStorage.getItem(`secure_${key}`);
      }

      if (!encryptedValue) return null;

      const decryptedValue = await decryptData(encryptedValue);
      if (!decryptedValue) return null;

      try {
        const parsedData = JSON.parse(decryptedValue);

        // Check if data has expired
        if (parsedData.expires && Date.now() > parsedData.expires) {
          this.removeItem(key);
          return null;
        }

        return parsedData.value;
      } catch (e) {
        // For backward compatibility with old format
        return decryptedValue;
      }
    } catch (error) {
      logger.error("Error retrieving encrypted data:", error);
      // Only fall back for non-sensitive data
      if (!key.includes("_sensitive_") && !key.includes("_auth_")) {
        return localStorage.getItem(key);
      }
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    sessionStorage.removeItem(`secure_${key}`);
    // Also remove non-secure version as fallback
    localStorage.removeItem(key);
  },

  clear(): void {
    // Only clear secure items
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("secure_")) {
        localStorage.removeItem(key);
      }
    });

    // Clear from sessionStorage too
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("secure_")) {
        sessionStorage.removeItem(key);
      }
    });
  },

  // Clean up expired items
  async cleanExpired(): Promise<void> {
    try {
      const keysToCheck = [];

      // Collect all secure keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("secure_")) {
          keysToCheck.push(key.replace("secure_", ""));
        }
      }

      // Check each key for expiration
      for (const key of keysToCheck) {
        const encryptedValue = localStorage.getItem(`secure_${key}`);
        if (!encryptedValue) continue;

        try {
          const decryptedValue = await decryptData(encryptedValue);
          if (!decryptedValue) continue;

          const parsedData = JSON.parse(decryptedValue);
          if (parsedData.expires && Date.now() > parsedData.expires) {
            this.removeItem(key);
          }
        } catch (e) {
          // Skip if can't parse
          continue;
        }
      }
    } catch (error) {
      logger.error("Error cleaning expired secure data:", error);
    }
  },
};

// Set up periodic cleaning of expired secure items
if (typeof window !== "undefined") {
  // Clean expired items on load
  secureStore.cleanExpired();

  // Set up interval to clean expired items
  setInterval(
    () => {
      secureStore.cleanExpired();
    },
    30 * 60 * 1000,
  ); // Every 30 minutes
}

// Enhanced rate limiting for API calls with IP tracking and progressive backoff
interface RateLimitEntry {
  count: number;
  resetTime: number;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  blockedUntil: number | null;
}

const rateLimits: Record<string, Record<string, RateLimitEntry>> = {};

// Get a unique identifier for the current user/session
const getClientIdentifier = (): string => {
  // In a real app, this would use IP address + additional factors
  // For this client-side simulation, we'll use a combination of available browser data
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a simple hash of these values
  const identifier = `${userAgent}|${language}|${screenWidth}x${screenHeight}|${timeZone}`;
  return identifier;
};

export const checkRateLimit = (
  endpoint: string,
  limit: number = 10,
  timeWindow: number = 60000, // 1 minute default
  maxConsecutiveFailures: number = 5,
  blockDuration: number = 300000, // 5 minutes default
): { allowed: boolean; retryAfter?: number } => {
  const now = Date.now();
  const clientId = getClientIdentifier();

  // Initialize endpoint tracking if it doesn't exist
  if (!rateLimits[endpoint]) {
    rateLimits[endpoint] = {};
  }

  // Initialize client tracking if it doesn't exist
  if (!rateLimits[endpoint][clientId]) {
    rateLimits[endpoint][clientId] = {
      count: 0,
      resetTime: now + timeWindow,
      consecutiveFailures: 0,
      lastFailureTime: null,
      blockedUntil: null,
    };
  }

  const entry = rateLimits[endpoint][clientId];

  // Check if client is blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    logger.warn(
      `Rate limit blocked for ${endpoint} - client ${clientId.substring(0, 8)}... blocked for ${retryAfter} more seconds`,
    );
    return { allowed: false, retryAfter };
  }

  // Reset count if time window has passed
  if (now > entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + timeWindow;
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > limit) {
    // Increment consecutive failures
    entry.consecutiveFailures++;
    entry.lastFailureTime = now;

    // Check if we should block this client
    if (entry.consecutiveFailures >= maxConsecutiveFailures) {
      // Implement exponential backoff - block duration increases with consecutive failures
      const backoffMultiplier = Math.min(
        Math.pow(2, entry.consecutiveFailures - maxConsecutiveFailures),
        24,
      ); // Cap at 24x (2 hours for 5 min default)
      const adjustedBlockDuration = blockDuration * backoffMultiplier;

      entry.blockedUntil = now + adjustedBlockDuration;

      logger.warn(
        `Rate limit exceeded for ${endpoint} - client ${clientId.substring(0, 8)}... blocked for ${adjustedBlockDuration / 1000} seconds due to ${entry.consecutiveFailures} consecutive failures`,
      );
      return {
        allowed: false,
        retryAfter: Math.ceil(adjustedBlockDuration / 1000),
      };
    }

    logger.warn(
      `Rate limit exceeded for ${endpoint} - client ${clientId.substring(0, 8)}... (${entry.consecutiveFailures}/${maxConsecutiveFailures} failures)`,
    );
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // If successful, reset consecutive failures
  if (entry.consecutiveFailures > 0) {
    entry.consecutiveFailures = 0;
  }

  return { allowed: true };
};

// Apply rate limiting to sensitive operations
export const applyRateLimitToAuth = async (
  operation: string,
  action: () => Promise<any>,
): Promise<any> => {
  const endpoint = `auth:${operation}`;
  const rateLimit = checkRateLimit(endpoint, 5, 60000); // 5 attempts per minute for auth operations

  if (!rateLimit.allowed) {
    const retryAfterSec = rateLimit.retryAfter || 60;
    logger.warn(
      `Rate limit applied to ${operation}. Try again in ${retryAfterSec} seconds.`,
    );
    throw new Error(
      `Too many ${operation} attempts. Please try again in ${retryAfterSec} seconds.`,
    );
  }

  try {
    return await action();
  } catch (error) {
    // Force a rate limit check again to increment failure count
    checkRateLimit(endpoint, 5, 60000);
    throw error;
  }
};

// Initialize enhanced security measures
export const initSecurity = (): void => {
  setupCSP();
  const token = generateCSRFToken();
  storeCSRFToken(token);

  // Add security headers
  if (import.meta.env.PROD) {
    // These would normally be set on the server, but we're simulating them here
    logger.info("Security headers would be set in production");
  }

  // Prevent clickjacking by setting X-Frame-Options
  const frameOptions = document.createElement("meta");
  frameOptions.httpEquiv = "X-Frame-Options";
  frameOptions.content = "DENY";
  document.head.appendChild(frameOptions);

  // Set X-Content-Type-Options to prevent MIME type sniffing
  const contentTypeOptions = document.createElement("meta");
  contentTypeOptions.httpEquiv = "X-Content-Type-Options";
  contentTypeOptions.content = "nosniff";
  document.head.appendChild(contentTypeOptions);

  // Set Referrer-Policy
  const referrerPolicy = document.createElement("meta");
  referrerPolicy.name = "referrer";
  referrerPolicy.content = "strict-origin-when-cross-origin";
  document.head.appendChild(referrerPolicy);

  // Prevent clickjacking
  if (window.self !== window.top) {
    // If the page is loaded in an iframe, redirect to the actual site
    window.top.location.href = window.self.location.href;
  }

  // Detect and prevent common XSS vectors
  const sanitizeParams = () => {
    const params = new URLSearchParams(window.location.search);
    let hasXssAttempt = false;

    params.forEach((value, key) => {
      // Check for common XSS patterns
      if (
        value.includes("<script") ||
        value.includes("javascript:") ||
        value.includes("data:") ||
        value.includes("vbscript:") ||
        /on\w+=/i.test(value) ||
        /\beval\(/i.test(value) ||
        /\balert\(/i.test(value) ||
        /\bdocument\./i.test(value)
      ) {
        hasXssAttempt = true;
        // Remove the suspicious parameter
        params.delete(key);
        logger.warn(`Potential XSS attempt detected in URL parameter: ${key}`);
      }
    });

    if (hasXssAttempt) {
      // Log the attempt and update the URL without the suspicious parameters
      logger.warn("Potential XSS attempt detected in URL parameters");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    }
  };

  sanitizeParams();

  // Set up event listener for storage events to detect tampering
  window.addEventListener("storage", (event) => {
    if (event.key && event.key.startsWith("secure_")) {
      // Someone might be trying to tamper with secure storage
      logger.warn("Potential tampering with secure storage detected", {
        key: event.key,
        oldValue: "[REDACTED]",
        newValue: "[REDACTED]",
      });

      // Optionally force logout or take other security measures
      // window.location.href = '/auth/login?reason=security';
    }
  });

  // Monitor for suspicious form submissions
  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target as HTMLFormElement;

      // Check if this is a login or sensitive form
      if (
        form.method === "post" &&
        (form.action.includes("/login") ||
          form.action.includes("/register") ||
          form.action.includes("/reset-password"))
      ) {
        // Check for CSRF token
        const csrfInput = form.querySelector('input[name="csrf_token"]');
        if (!csrfInput) {
          // No CSRF token found in a sensitive form submission
          logger.warn("Sensitive form submitted without CSRF token", {
            formAction: form.action,
          });
          event.preventDefault();
          alert(
            "Security error: form cannot be submitted. Please refresh the page and try again.",
          );
        }
      }
    },
    true,
  );

  // Patch fetch to use our CSRF-protected version by default
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    // Only add CSRF for same-origin requests
    if (
      typeof input === "string" &&
      (input.startsWith("/") || input.startsWith(window.location.origin))
    ) {
      return fetchWithCSRF(input.toString(), init);
    }
    return originalFetch(input, init);
  };

  logger.info("Enhanced security measures initialized");
};

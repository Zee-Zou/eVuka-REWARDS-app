/**
 * Security module for the application
 * Provides security-related functionality including initialization
 */

import DOMPurify from 'dompurify';

/**
 * Initializes security measures for the application
 * - Sets up Content Security Policy
 * - Configures XSS protection
 * - Sets up CSRF protection
 * - Initializes other security features
 */
export const initSecurity = () => {
  // Set security headers if in browser environment
  if (typeof window !== "undefined") {
    // Prevent clickjacking
    enforceFrameOptions();

    // Enable XSS protection
    enableXssProtection();

    // Set up CSRF protection
    setupCsrfProtection();

    // Monitor for suspicious activity
    monitorSuspiciousActivity();
  }
};

/**
 * Prevents the application from being embedded in iframes (clickjacking protection)
 */
const enforceFrameOptions = () => {
  // Only apply in production to allow for development tools
  if (import.meta.env.PROD) {
    try {
      // Attempt to ensure the page can't be framed (clickjacking protection)
      if (window.self !== window.top) {
        // If we're in a frame, attempt to break out
        window.top.location = window.self.location;
      }
    } catch (e) {
      // If we can't access window.top due to security restrictions,
      // we're likely in a cross-origin frame, which is already restricted
    }
  }
};

/**
 * Enables XSS protection measures
 */
const enableXssProtection = () => {
  // Client-side XSS protection
  // This is a defense-in-depth measure as modern browsers
  // have built-in XSS protection

  // Sanitize any dynamic content before insertion
  window.addEventListener("DOMContentLoaded", () => {
    // Set up mutation observer to sanitize dynamically added content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            // Only process element nodes
            if (node.nodeType === 1) {
              sanitizeElement(node as Element);
            }
          });
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

/**
 * Sanitizes an element to prevent XSS attacks
 * @param element The element to sanitize
 */
const sanitizeElement = (element: Element) => {
  // This is a simplified example
  // In a real application, you would use a library like DOMPurify

  // Remove potentially dangerous attributes
  const dangerousAttrs = ["onerror", "onload", "onclick", "onmouseover"];
  dangerousAttrs.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr);
    }
  });

  // Recursively sanitize child elements
  element.childNodes.forEach((child) => {
    if (child.nodeType === 1) {
      sanitizeElement(child as Element);
    }
  });
};

/**
 * Sets up CSRF protection for the application
 */
const setupCsrfProtection = () => {
  // For SPA applications, CSRF protection is typically handled by:
  // 1. Using HttpOnly cookies for session management
  // 2. Using custom headers for API requests that browsers won't send in cross-site requests

  // Add a custom header to all fetch/XHR requests
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    init = init || {};
    init.headers = init.headers || {};

    // Add a custom header that simple requests won't include
    const headers = new Headers(init.headers);
    headers.append("X-Requested-With", "XMLHttpRequest");
    init.headers = headers;

    return originalFetch.call(this, input, init);
  };

  // Also patch XMLHttpRequest for older code
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    const result = originalOpen.apply(this, arguments);
    this.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    return result;
  };
};

/**
 * Monitors for suspicious activity that might indicate security issues
 */
const monitorSuspiciousActivity = () => {
  // Monitor for excessive failed login attempts
  let loginAttempts = 0;
  const loginAttemptThreshold = 5;
  const loginAttemptWindow = 5 * 60 * 1000; // 5 minutes

  // Reset login attempts periodically
  setInterval(() => {
    loginAttempts = 0;
  }, loginAttemptWindow);

  // Expose a method to track login attempts
  window.trackLoginAttempt = (success: boolean) => {
    if (!success) {
      loginAttempts++;

      if (loginAttempts >= loginAttemptThreshold) {
        console.warn("Excessive login attempts detected");
        // In a real app, you might implement temporary IP blocking or CAPTCHA
      }
    } else {
      // Reset on successful login
      loginAttempts = 0;
    }
  };

  // Monitor for other suspicious patterns
  // This would be expanded in a real application
};

// Add type definition for the global window object
declare global {
  interface Window {
    trackLoginAttempt: (success: boolean) => void;
  }
}

/**
 * Validates user input to prevent injection attacks
 * @param input The user input to validate
 * @returns True if the input is safe, false otherwise
 */
export const validateUserInput = (input: string): boolean => {
  // Check for common injection patterns
  const dangerousPatterns = [
    /(<script[^>]*>|<\/script>)/i, // Script tags
    /(javascript:)/i, // JavaScript protocol
    /(\b)(on\w+\s*=)/i, // Inline event handlers
    /(\b)(data:text\/html)/i, // Data URI with HTML content
    /(document\.cookie)/i, // Cookie access
    /(localStorage|sessionStorage)/i, // Storage access
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
};

/**
 * DEPRECATED: Use crypto-secure.ts instead for real encryption
 *
 * These functions now delegate to the secure crypto module which uses
 * AES-GCM-256 encryption with PBKDF2 key derivation.
 *
 * Note: The new functions are async. Please update your code to use:
 * - import { encryptData, decryptData } from './crypto-secure'
 * - await encryptData(data)
 * - await decryptData(encrypted)
 */
export {
  encryptForStorage as encryptData,
  decryptFromStorage as decryptData,
  encryptData as encryptDataAsync,
  decryptData as decryptDataAsync,
  clearEncryptionSession,
  isEncryptionAvailable,
} from './crypto-secure';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify for comprehensive, battle-tested XSS protection
 * @param html The HTML content to sanitize
 * @param config Optional DOMPurify configuration
 * @returns Sanitized HTML content safe for rendering
 */
export const sanitizeHtml = (
  html: string,
  config?: DOMPurify.Config
): string => {
  // Default safe configuration
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false, // Prevent data-* attributes which can be exploited
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    SAFE_FOR_TEMPLATES: true, // Extra safety for template rendering
    RETURN_TRUSTED_TYPE: false, // Return string, not TrustedHTML
  };

  // Merge with custom config if provided
  const finalConfig = config ? { ...defaultConfig, ...config } : defaultConfig;

  return DOMPurify.sanitize(html, finalConfig);
};

/**
 * Generates a secure random token
 * @param length The length of the token to generate
 * @returns A secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

/**
 * Hashes a password or other sensitive data
 * @param data The data to hash
 * @returns A promise that resolves to the hashed data
 */
export const hashData = async (data: string): Promise<string> => {
  // In a real application, use a proper password hashing algorithm like bcrypt
  // This is a simplified example using SHA-256
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Verifies a CSRF token
 * @param token The token to verify
 * @param expectedToken The expected token value
 * @returns True if the token is valid, false otherwise
 */
export const verifyToken = (token: string, expectedToken: string): boolean => {
  // Use constant-time comparison to prevent timing attacks
  if (token.length !== expectedToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }

  return result === 0;
};
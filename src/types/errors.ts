export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string = message,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", "Authentication failed. Please try again.");
  }
}

export class CaptureError extends AppError {
  constructor(message: string) {
    super(
      message,
      "CAPTURE_ERROR",
      "Failed to capture receipt. Please try again.",
    );
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, code: string = "PROCESSING_ERROR") {
    super(
      message,
      code,
      "Failed to process receipt. Please try again.",
    );
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, "STORAGE_ERROR", "Failed to save data. Please try again.");
  }
}
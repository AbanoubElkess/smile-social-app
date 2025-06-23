export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502);
  }
}

export class AIError extends AppError {
  constructor(message: string = 'AI service error') {
    super(message, 500);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 402);
  }
}

export class MediaError extends AppError {
  constructor(message: string = 'Media processing failed') {
    super(message, 400);
  }
}

export class NotificationError extends AppError {
  constructor(message: string = 'Notification failed') {
    super(message, 500);
  }
}

// Helper function to determine if an error is operational
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Helper function to format error for API response
export const formatErrorResponse = (error: Error, isDevelopment: boolean = false) => {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        ...(isDevelopment && { stack: error.stack }),
      },
    };
  }

  // For non-operational errors, don't expose internal details in production
  return {
    success: false,
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      statusCode: 500,
      ...(isDevelopment && { stack: error.stack }),
    },
  };
};

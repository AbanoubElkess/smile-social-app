import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: string;
  keyPattern?: any;
  keyValue?: any;
  path?: string;
  value?: any;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err: AppError): CustomError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new CustomError(message, 400);
};

const handleDuplicateFieldsDB = (err: AppError): CustomError => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'unknown';
  const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
  const message = `Duplicate ${field}: ${value}. Please use another value!`;
  return new CustomError(message, 400);
};

const handleValidationErrorDB = (err: AppError): CustomError => {
  const message = `Invalid input data: ${err.message}`;
  return new CustomError(message, 400);
};

const handleJWTError = (): CustomError =>
  new CustomError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (): CustomError =>
  new CustomError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err: AppError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code && Number(error.code) === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

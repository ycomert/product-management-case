import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
  method: string;
  correlationId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId = this.generateCorrelationId();
    
    let message: string | string[];
    let error: string | undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error;
      } else {
        message = exceptionResponse.toString();
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    } else {
      message = 'Internal server error';
      error = 'UnknownError';
    }

    const errorResponse: ErrorResponse = {
      statusCode: httpStatus,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
    };

    // Log different severity levels based on status code
    if (httpStatus >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${httpStatus} - ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : 'No stack trace',
      );
    } else if (httpStatus >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${httpStatus} - ${message}`,
      );
    }

    // Don't expose internal error details in production
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      errorResponse.message = 'Internal server error';
      delete errorResponse.error;
    }

    httpAdapter.reply(response, errorResponse, httpStatus);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
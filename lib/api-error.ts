import { NextResponse } from "next/server";
import { z } from "zod";
import logger from "./logger";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}

/**
 * Wraps an API route handler with standardized error handling.
 * Catches ZodErrors, ApiErrors, and unexpected errors.
 */
export function withErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>,
  routeName?: string
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: error.flatten() },
          { status: 400 }
        );
      }

      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
          { status: error.statusCode }
        );
      }

      const ctx = routeName || "API";
      logger.error(
        error instanceof Error ? error.message : String(error),
        ctx,
        error instanceof Error ? error.stack : undefined
      );

      return NextResponse.json(
        {
          error: "Internal server error",
          ...(process.env.NODE_ENV === "development"
            ? { details: error instanceof Error ? error.message : String(error) }
            : {}),
        },
        { status: 500 }
      );
    }
  };
}

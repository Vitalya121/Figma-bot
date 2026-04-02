export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class LimitExceededError extends AppError {
  constructor() {
    super('Carousel generation limit exceeded. Upgrade your plan.', 403, 'LIMIT_EXCEEDED')
  }
}

export class FigmaApiError extends AppError {
  constructor(message: string) {
    super(`Figma API error: ${message}`, 502, 'FIGMA_API_ERROR')
  }
}

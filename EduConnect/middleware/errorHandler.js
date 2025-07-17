class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
    }
}

class RateLimitError extends Error {
    constructor(message) {
        super(message || 'Rate limit exceeded');
        this.name = 'RateLimitError';
    }
}

exports.ValidationError = ValidationError;
exports.APIError = APIError;
exports.RateLimitError = RateLimitError;

exports.errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query
    });

    if (err instanceof ValidationError) {
        return res.status(400).json({
            status: 'error',
            type: 'validation',
            message: err.message
        });
    }

    if (err instanceof RateLimitError) {
        return res.status(429).json({
            status: 'error',
            type: 'rate_limit',
            message: err.message,
            retryAfter: err.retryAfter || 60
        });
    }

    if (err instanceof APIError) {
        return res.status(err.statusCode || 500).json({
            status: 'error',
            type: 'api',
            message: err.message
        });
    }

    // Handle axios errors
    if (err.isAxiosError) {
        const statusCode = err.response?.status || 500;
        const message = err.response?.data?.message || 'External API error';
        return res.status(statusCode).json({
            status: 'error',
            type: 'external_api',
            message,
            service: err.config?.url ? new URL(err.config.url).hostname : 'unknown'
        });
    }

    // Default error response
    res.status(500).json({
        status: 'error',
        type: 'server',
        message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message
    });
}; 
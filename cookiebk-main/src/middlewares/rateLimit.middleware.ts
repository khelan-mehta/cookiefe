import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [key: string]: RateLimitStore } = {};

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) =>
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
  } = options;

  const storeName = `${windowMs}-${max}`;
  if (!stores[storeName]) {
    stores[storeName] = {};
  }
  const store = stores[storeName];

  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > max) {
      res.status(429).json({ message });
      return;
    }

    next();
  };
};

export const distressRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Too many distress calls. Please wait before creating another.',
});

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'AI rate limit exceeded. Please wait.',
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

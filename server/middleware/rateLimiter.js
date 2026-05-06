import rateLimit from 'express-rate-limit';

export const submissionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // Limit each IP to 20 submissions per day
  message: {
    message: 'Daily report limit reached. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false }
});

export const minuteRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 submissions per 10 minutes
  message: {
    message: 'Too many requests. Please try later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false }
});

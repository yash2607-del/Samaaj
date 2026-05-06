import rateLimit from 'express-rate-limit';

export const submissionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 submissions per windowMs
  message: {
    message: 'Too many reports. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false }
});

export const minuteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 submissions per minute
  message: {
    message: 'Too many reports. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false }
});

import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  browser: {
    asObject: isProd, // JSON in production, readable in dev
  },
  level: isProd ? 'info' : 'debug',
  base: { app: 'mailai-frontend' },
});

export default logger;

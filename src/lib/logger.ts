import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: isProd ? "info" : "debug",
  transport: isProd
    ? undefined // JSON brut vers stdout (Docker / Vercel le capture)
    : {
        target: "pino-pretty",
        options: { colorize: true, ignore: "pid,hostname" },
      },
  redact: [
    "password",
    "cookie",
    "headers.authorization",
    "req.headers.cookie",
  ],
});

export default logger;

import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided.",
  );
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    // In production, restrict to the known frontend origin so credentialed
    // (cookie-carrying) cross-origin requests work — e.g. a Vercel-hosted
    // frontend calling this API. Falls back to reflecting the request origin
    // in dev, where PUBLIC_APP_URL usually isn't set.
    origin: process.env.PUBLIC_APP_URL || true,
    credentials: true,
  }),
);
app.use(cookieParser(sessionSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;

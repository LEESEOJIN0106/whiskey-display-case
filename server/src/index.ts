import "dotenv/config";
import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import imagesRouter from "./routes/images.js";
import suggestRouter from "./routes/suggest.js";
import whiskiesRouter from "./routes/whiskies.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "위스키 로그 API" });
});

app.use("/api/suggest", requireAuth, suggestRouter);
app.use("/api/images", requireAuth, imagesRouter);
app.use("/api/whiskies", requireAuth, whiskiesRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`위스키 로그 API listening on http://localhost:${port}`);
});

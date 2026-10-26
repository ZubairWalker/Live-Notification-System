import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "./db/mongo.js";
import { authRouter } from "./routes/auth.js";
import { createNotificationsRouter } from "./routes/notifications.js";
import { configureSocketServer } from "./socket/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.resolve(dirname, "../public")));
app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
  });
});
app.use("/api/auth", authRouter);
app.use("/api/notifications", createNotificationsRouter(io));
configureSocketServer(io);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
async function start(): Promise<void> {
  await connectDatabase();
  server.once("error", async (error) => {
    console.error("Could not start HTTP server", error);
    await disconnectDatabase();
    process.exit(1);
  });
  server.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
}

async function shutdown(): Promise<void> {
  await disconnectDatabase();
  server.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
start().catch((error) => { console.error("Could not start server", error); process.exit(1); });

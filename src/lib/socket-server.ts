import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { reportError } from "@/lib/report-error";
import { jwtVerify } from "jose";

const port = parseInt(process.env.PORT || "3001", 10);

async function main() {
  const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  const httpServer = createServer();

  const isDev = process.env.NODE_ENV !== "production";
  const corsOrigin = isDev
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : (process.env.NEXT_PUBLIC_APP_URL || "https://cgkensan.dbwe.tech");

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true
    },
    path: "/api/socket"
  });

  io.adapter(createAdapter(pubClient, subClient));

  // Listen for Redis-published notification events and emit to rooms
  const eventsClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  await eventsClient.connect();
  eventsClient.subscribe("socket.io:events", (message) => {
    try {
      const payload = JSON.parse(message) as {
        channel: "notification";
        room: string;
        data: unknown;
      };
      if (payload.channel === "notification" && payload.room) {
        io.to(payload.room).emit("notification", payload.data);
      }
    } catch (e) {
      reportError(e, { route: "socket-server.ts", message });
    }
  });

  const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token != "string") return next(new Error("Unauthorized"));

      const { payload } = await jwtVerify(token, secret(), { audience: "socket" });
      if (!payload.sub) return next(new Error("Unauthorized"));

      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  })

  io.on("connection", (socket) => {
    socket.join(socket.data.userId);
    socket.on("disconnect", () => {});
  });

  httpServer.listen(port, () => {
    console.log(`Socket.io server ready on port ${port}`);
  });
}

main().catch((e) => {
  reportError(e, { route: "src/lib/socket-server.ts" });
  process.exit(1);
});

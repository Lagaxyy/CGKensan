import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisPublisher() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });

    await redisClient.connect();
  }

  return redisClient;
}

export interface SocketPayload {
  channel: "notification";
  room: string;
  data: unknown;
}

export async function publishSocketEvent(payload: SocketPayload): Promise<void> {
  const client = await getRedisPublisher();

  await client.publish("socket.io:events", JSON.stringify(payload));
}

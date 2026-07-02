import { env } from "../config/env.js";
import { emit, rooms } from "../realtime/io.js";

// ===== PushService =====
// Mock: loga no console e emite via socket (notificação in-app).
// Adapter real: FCM / Web Push (VAPID).

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushTarget {
  scope: "user" | "courier";
  id: string;
}

export interface PushService {
  notify(target: PushTarget, payload: PushPayload): Promise<void>;
}

class MockPushService implements PushService {
  async notify(target: PushTarget, payload: PushPayload): Promise<void> {
    console.log(`[PushService:mock] -> ${target.scope}:${target.id}`, payload.title, "-", payload.body);
    const room = target.scope === "user" ? rooms.user(target.id) : rooms.courier(target.id);
    emit(room, "push:notification", payload);
  }
}

class RealPushService extends MockPushService {
  async notify(target: PushTarget, payload: PushPayload): Promise<void> {
    // TODO(real): FCM (FCM_SERVER_KEY) ou Web Push (VAPID). Enquanto isso, mock.
    if (env.push.driver !== "mock") {
      // sem credenciais configuradas ainda -> comportamento mock
    }
    return super.notify(target, payload);
  }
}

export const pushService: PushService =
  env.push.driver === "mock" ? new MockPushService() : new RealPushService();

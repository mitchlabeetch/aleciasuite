"use client";

import { useSession } from "@alepanel/auth/client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  heartbeat,
  getActiveUsers,
  leaveDocument,
} from "@/actions/colab/presence";

const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const POLL_INTERVAL = 5000; // 5 seconds
const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

interface UsePresenceOptions {
  resourceType: "document" | "deal";
  resourceId: string;
  enabled?: boolean;
}

interface ActiveUser {
  id: string;
  userId: string;
  documentName: string;
  cursorPosition: any;
  lastSeenAt: Date | null;
}

export function usePresence({
  resourceType,
  resourceId,
  enabled = true,
}: UsePresenceOptions) {
  const { data: session, isPending } = useSession();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const documentName = `${resourceType}:${resourceId}`;
  const userId = session?.user?.id;

  const getUserColor = useCallback((userId: string) => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash |= 0;
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }, []);

  const fetchActiveUsers = useCallback(async () => {
    if (!enabled) return;

    try {
      const users = await getActiveUsers(documentName);
      setActiveUsers(users);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch active users:", error);
      setIsLoading(false);
    }
  }, [enabled, documentName]);

  const sendHeartbeat = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      await heartbeat({ documentName });
    } catch (error) {
      console.error("Presence heartbeat error:", error);
    }
  }, [userId, enabled, documentName]);

  useEffect(() => {
    if (!enabled || !userId || isPending) {
      setIsLoading(false);
      return;
    }

    sendHeartbeat();
    fetchActiveUsers();

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    pollRef.current = setInterval(fetchActiveUsers, POLL_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
      if (userId) {
        leaveDocument(documentName).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.debug("Presence cleanup error (expected on unmount):", err);
          }
        });
      }
    };
  }, [enabled, userId, isPending, sendHeartbeat, fetchActiveUsers, documentName]);

  const otherUsers = activeUsers.filter((u) => u.userId !== userId);

  return {
    activeUsers,
    otherUsers,
    isLoading,
    currentUserId: userId,
  };
}

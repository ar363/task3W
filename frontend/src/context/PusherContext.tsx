"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Pusher from "pusher-js";
import type { User, ClaimHistory } from "@/types";

interface PusherContextType {
  leaderboardUpdates?: User[];
  claimUpdates?: ClaimHistory[];
  isConnected: boolean;
}

const PusherContext = createContext<PusherContextType>({
  isConnected: false
});

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const [leaderboardUpdates, setLeaderboardUpdates] = useState<User[]>([]);
  const [claimUpdates, setClaimUpdates] = useState<ClaimHistory[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe("leaderboard-channel");

    channel.bind("pusher:subscription_succeeded", () => {
      setIsConnected(true);
    });

    channel.bind("leaderboard-update", (data: User[]) => {
      setLeaderboardUpdates(data);
    });

    channel.bind("claim-update", (data: ClaimHistory) => {
      setClaimUpdates((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("leaderboard-channel");
      pusher.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ leaderboardUpdates, claimUpdates, isConnected }}>
      {children}
    </PusherContext.Provider>
  );
}

export const usePusher = () => useContext(PusherContext);

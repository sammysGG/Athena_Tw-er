"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type State = {
  signedIn: boolean;
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  followingUserIds: Set<string>;
};

type Ctx = State & {
  refresh: () => void;
  setLiked: (postId: string, liked: boolean) => void;
  setSaved: (postId: string, saved: boolean) => void;
  setFollowing: (userId: string, following: boolean) => void;
};

const EMPTY: State = {
  signedIn: false,
  likedPostIds: new Set(),
  savedPostIds: new Set(),
  followingUserIds: new Set(),
};

const MeStateContext = createContext<Ctx>({
  ...EMPTY,
  refresh: () => {},
  setLiked: () => {},
  setSaved: () => {},
  setFollowing: () => {},
});

export function MeStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me/state", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        signedIn: boolean;
        likedPostIds: string[];
        savedPostIds: string[];
        followingUserIds: string[];
      };
      setState({
        signedIn: data.signedIn,
        likedPostIds: new Set(data.likedPostIds),
        savedPostIds: new Set(data.savedPostIds),
        followingUserIds: new Set(data.followingUserIds),
      });
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setLiked = (postId: string, liked: boolean) =>
    setState((s) => {
      const next = new Set(s.likedPostIds);
      if (liked) next.add(postId);
      else next.delete(postId);
      return { ...s, likedPostIds: next };
    });

  const setSaved = (postId: string, saved: boolean) =>
    setState((s) => {
      const next = new Set(s.savedPostIds);
      if (saved) next.add(postId);
      else next.delete(postId);
      return { ...s, savedPostIds: next };
    });

  const setFollowing = (userId: string, following: boolean) =>
    setState((s) => {
      const next = new Set(s.followingUserIds);
      if (following) next.add(userId);
      else next.delete(userId);
      return { ...s, followingUserIds: next };
    });

  return (
    <MeStateContext.Provider
      value={{ ...state, refresh, setLiked, setSaved, setFollowing }}
    >
      {children}
    </MeStateContext.Provider>
  );
}

export function useMeState() {
  return useContext(MeStateContext);
}

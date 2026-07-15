"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Business } from "@/lib/api";

const STORAGE_KEY = "threadwork:activeBusinessId";

type ActiveBusinessContextValue = {
  activeBusiness: Business | null;
  activeBusinessId: string | null;
  setActiveBusinessId: (id: string | null) => void;
  businesses: Business[];
  refreshBusinesses: () => void;
};

const ActiveBusinessContext = createContext<ActiveBusinessContextValue | null>(null);

export function ActiveBusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);

  const refreshBusinesses = () => {
    api.listBusinesses().then(setBusinesses).catch(() => {});
  };

  useEffect(() => {
    refreshBusinesses();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveBusinessIdState(saved);
  }, []);

  const setActiveBusinessId = (id: string | null) => {
    setActiveBusinessIdState(id);
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  };

  const activeBusiness = businesses.find((b) => b.id === activeBusinessId) ?? null;

  return (
    <ActiveBusinessContext.Provider
      value={{ activeBusiness, activeBusinessId, setActiveBusinessId, businesses, refreshBusinesses }}
    >
      {children}
    </ActiveBusinessContext.Provider>
  );
}

export function useActiveBusiness() {
  const ctx = useContext(ActiveBusinessContext);
  if (!ctx) throw new Error("useActiveBusiness must be used within ActiveBusinessProvider");
  return ctx;
}
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@prisma/client";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  department?: {
    name: string;
    code: string;
  } | null;
}

interface PersonaContextType {
  currentUser: DemoUser | null;
  allUsers: DemoUser[];
  switchPersona: (userId: string) => void;
  isLoading: boolean;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export function PersonaProvider({
  children,
  initialUsers,
}: {
  children: React.ReactNode;
  initialUsers: DemoUser[];
}) {
  const [allUsers] = useState<DemoUser[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(() => {
    // Default to the first member (Alex Rivera) or admin
    return initialUsers.find((u) => u.role === "MEMBER") || initialUsers[0] || null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for previously selected persona
    try {
      const savedUserId = localStorage.getItem("assetflow_active_user_id");
      if (savedUserId) {
        const found = allUsers.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          document.cookie = `assetflow_user_id=${found.id}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } else if (currentUser) {
        document.cookie = `assetflow_user_id=${currentUser.id}; path=/; max-age=2592000; SameSite=Lax`;
      }
    } catch {
      // localStorage may fail in private mode
    } finally {
      setIsLoading(false);
    }
  }, [allUsers]);

  const switchPersona = (userId: string) => {
    const found = allUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      try {
        localStorage.setItem("assetflow_active_user_id", found.id);
        document.cookie = `assetflow_user_id=${found.id}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }
  };

  return (
    <PersonaContext.Provider value={{ currentUser, allUsers, switchPersona, isLoading }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
}

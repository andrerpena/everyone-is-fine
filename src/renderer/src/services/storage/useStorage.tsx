import type React from "react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getStorageService } from "./index";
import type { StorageService } from "./types";

const StorageContext = createContext<StorageService | null>(null);

interface StorageProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function StorageProvider({
  children,
  fallback,
}: StorageProviderProps): React.ReactElement {
  const [storage, setStorage] = useState<StorageService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getStorageService()
      .then(setStorage)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <>{fallback ?? null}</>;
  }

  if (error) {
    console.error("Storage initialization error:", error);
    // Still render children - storage operations will fail gracefully
  }

  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

/**
 * Hook to access the storage service
 * @throws Error if used outside of StorageProvider
 */
export function useStorage(): StorageService {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}

/**
 * Hook to access storage service, returns null if not available
 * Useful for optional storage access without throwing
 */
export function useStorageOptional(): StorageService | null {
  return useContext(StorageContext);
}

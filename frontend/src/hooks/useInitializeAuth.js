import { useEffect } from "react";
import useAuthStore from "../store/userStore";

export function useInitializeAuth() {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    
    if (!isInitialized) {
      
      initializeAuth();
    } else {
      
    }
  }, [initializeAuth, isInitialized]);

  
  return { loading: !isInitialized };
}

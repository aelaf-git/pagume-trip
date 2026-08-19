import { useEffect, useState } from "react";
import { getOnboardingStatus } from "../services/registrationService";

export function useOnboardingStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getOnboardingStatus().then((data) => {
      if (mounted) {
        setStatus(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { status, loading };
}

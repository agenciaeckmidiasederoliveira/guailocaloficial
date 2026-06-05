import { useState, useEffect, useRef } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  cidade: string | null;
  estado: string | null;
  loading: boolean;
  error: string | null;
}

// Global cache to prevent duplicate API calls across component instances
let globalCache: GeolocationState | null = null;
let globalPromise: Promise<GeolocationState> | null = null;

function fetchGeolocation(): Promise<GeolocationState> {
  if (globalPromise) return globalPromise;

  globalPromise = new Promise<GeolocationState>((resolve) => {
    if (!navigator.geolocation) {
      const result: GeolocationState = {
        latitude: null, longitude: null, cidade: null, estado: null,
        loading: false, error: "Geolocalização não suportada",
      };
      globalCache = result;
      resolve(result);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
            { headers: { "User-Agent": "GuiaLocalBR/1.0 (contact@guialocal.com.br)" } }
          );
          const data = await response.json();
          const result: GeolocationState = {
            latitude, longitude,
            cidade: data.address?.city || data.address?.town || data.address?.municipality || null,
            estado: data.address?.state || null,
            loading: false, error: null,
          };
          globalCache = result;
          resolve(result);
        } catch {
          const result: GeolocationState = {
            latitude, longitude, cidade: null, estado: null, loading: false, error: null,
          };
          globalCache = result;
          resolve(result);
        }
      },
      (error) => {
        const result: GeolocationState = {
          latitude: null, longitude: null, cidade: null, estado: null,
          loading: false, error: error.message,
        };
        globalCache = result;
        resolve(result);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });

  return globalPromise;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(
    globalCache || {
      latitude: null, longitude: null, cidade: null, estado: null,
      loading: true, error: null,
    }
  );

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (globalCache) {
      setState(globalCache);
      return;
    }
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    fetchGeolocation().then(setState);
  }, []);

  return state;
}

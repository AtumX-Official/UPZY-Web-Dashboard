import { useState, useEffect, useCallback } from "react";

export function useDeviceState() {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const ping = useCallback(async (ip: string) => {
    try {
      const res = await fetch(`http://${ip}:143/ping`, { signal: AbortSignal.timeout(800) });
      const body = await res.text();
      return body.trim().startsWith("PONG");
    } catch { return false; }
  }, []);

  const scan = useCallback(async () => {
    setIsScanning(true);
    if (ipAddress) {
      const alive = await ping(ipAddress);
      setIsOnline(alive);
      if (!alive) setIpAddress(null);
    }
    setIsScanning(false);
  }, [ipAddress, ping]);

  useEffect(() => {
    const t = setInterval(scan, 5000);
    return () => clearInterval(t);
  }, [scan]);

  return { ipAddress, setIpAddress, isOnline, setIsOnline, isScanning, ping };
}
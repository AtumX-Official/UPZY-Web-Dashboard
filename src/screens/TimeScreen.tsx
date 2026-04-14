import { useState, useEffect } from "react";
import { COLORS } from "../constants";
import { NavBar, FieldTile, ShimmerBtn } from "../components/Shared";
import { getDatabase, ref, set } from "firebase/database";

export function TimeScreen({ device, onBack, showSnack }: { 
  device: any; 
  onBack: () => void; 
  showSnack: (msg: string, color: string) => void; 
}) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sync = async () => {
    if (!device.isOnline) { showSnack("Device is offline — searching...", COLORS.coral); return; }
    setSyncing(true);
    const d = now;
    const date = `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
    const formattedTime = `${date}|${time}`;
    try {
      // Update the formatted time in Firebase Realtime Database
      const db = getDatabase();
      await set(ref(db, `devices/${device.ipAddress}/time`), formattedTime);

      await fetch(`http://${device.ipAddress}:143/Live/${formattedTime}`, { signal: AbortSignal.timeout(3000) });
      showSnack("Time synced to Firebase & device", COLORS.teal);
      setLastSync(new Date());
    } catch { showSnack("Failed to send time", COLORS.coral); }
    setSyncing(false);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgBase }}>
      <NavBar title="Sync Time" onBack={onBack} right={null} />
      <div style={{ padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: 2, background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.coral})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}</div>
          <div className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>{now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>
        <FieldTile color={COLORS.amber}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Device", device.ipAddress || "Not connected", "💾"], ["Status", device.isOnline ? "Online" : "Offline", device.isOnline ? "✅" : "❌"]].map(([label, val, icon]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>{icon}</span>
                <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", width: 60 }}>{label}:</span>
                <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
        </FieldTile>
        <div style={{ marginTop: 20 }}>
          <ShimmerBtn label={syncing ? "SYNCING..." : "SYNC TIME NOW"} color1={COLORS.amber} color2="#F59E0B" onClick={sync} loading={syncing} />
        </div>
        <p className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 12 }}>sends current time to UPZY device</p>
      </div>
    </div>
  );
}
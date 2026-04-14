import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants";
import { NavBar } from "../components/Shared";
import { getDatabase, ref, set, remove, onValue } from "firebase/database";

export function StatusScreen({ device, onBack }: { device: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const fetch_ = useCallback(async () => {
    setLoading(true); setStatusText(""); setError("");
    if (!device.ipAddress) { setError("Device is offline.\nAuto-connecting in background..."); setLoading(false); return; }
    try {
      const db = getDatabase();
      
      // 1. Delete the old DeviceReply completely so we don't read stale data
      await remove(ref(db, `devices/${device.ipAddress}/DeviceReply`));
      
      // 2. Setup the listener BEFORE triggering (to catch very fast ESP32 replies)
      const replyPromise = new Promise<string>((resolve, reject) => {
        const replyRef = ref(db, `devices/${device.ipAddress}/DeviceReply`);
        let timeout: ReturnType<typeof setTimeout>;

        const unsubscribe = onValue(replyRef, (snap) => {
          const val = snap.val();
          if (val) {
            clearTimeout(timeout);
            unsubscribe();
            resolve(String(val));
          }
        });

        timeout = setTimeout(() => {
          unsubscribe();
          reject(new Error("timeout"));
        }, 8000); // Wait up to 8 seconds for ESP32 to respond
      });

      // 3. THEN send the trigger to the ESP32
      await set(ref(db, `devices/${device.ipAddress}/DeviceStatus`), "True");

      // 4. Wait for the ESP32 to respond
      const reply = await replyPromise;

      setStatusText(reply || "No response from device.");
      
      // 5. Cleanup the trigger
      await set(ref(db, `devices/${device.ipAddress}/DeviceStatus`), "False");

    } catch { setError("Failed to fetch status..."); }
    setLoading(false);
  }, [device.ipAddress]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const parse = () => {
    const raw: Record<string, string> = {};
    // The device sends a single line, space-separated string.
    // We convert it to a multi-line string by adding a newline before each uppercase key
    // to make it parsable line-by-line.
    const processedStatusText = statusText.replace(/\s([A-Z_]+:)/g, '\n$1');

    for (const line of processedStatusText.split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      raw[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }

    const deviceName = raw.DEVICE_NAME || "-";
    const wifiName = raw.WIFI_NAME || "-";
    const mode = raw.MODE || "-";
    const time = raw.TIME || "-";

    const reminders: { title: string; date: string; time: string }[] = [];
    if (raw.REMAINDER_TITLE && raw.REMAINDER_TITLE.trim() !== "") {
      const titles = raw.REMAINDER_TITLE.split("|").filter(Boolean);
      const dates = (raw.REMAINDER_DATE || "").split("|");
      const times = (raw.REMAINDER_TIME || "").split("|");
      
      titles.forEach((t, i) => {
        reminders.push({ title: t.trim(), date: (dates[i] || "-").trim(), time: (times[i] || "-").trim() });
      });
    }

    // Reconstruct the storage string from individual fields to display in the UI.
    const storage = `[FIRMWARE SPACE]\nUsed: ${raw.FLASH_USED || '-'}\nAvailable: ${raw.FLASH_FREE || '-'}\n\n[RAM MEMORY]\nUsed: ${raw.RAM_USED || '-'}\nAvailable: ${raw.RAM_FREE || '-'}\n\n[NVS STORAGE]\nUsed: ${raw.NVS_USED || '-'}\nAvailable: ${raw.NVS_FREE || '-'}`;

    return { deviceName, wifiName, mode, time, storage, reminders };
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgBase }}>
      <NavBar title="Device Status" onBack={onBack} right={<button onClick={loading ? undefined : () => fetch_()} style={{ opacity: loading ? 0.3 : 1, fontSize: 18 }}>🔄</button>} />
      <div style={{ padding: "18px 18px 48px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${COLORS.amber}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13 }}>Fetching from ESP32...</p>
          </div>
        ) : error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${COLORS.coral}1A`, border: `1px solid ${COLORS.coral}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📶</div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line" }}>{error}</p>
          </div>
        ) : (() => {
          const { deviceName, wifiName, mode, time, reminders } = parse();
          return (
            <>
              <div style={{ borderRadius: 20, background: `linear-gradient(135deg, ${COLORS.bgSurface}, ${COLORS.bgDeep})`, border: `1px solid ${COLORS.amber}33`, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.amber}8C, transparent)` }} />
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[["💾", "Device", deviceName], ["📶", "WiFi", wifiName], ["📡", "Mode", mode], ["⏰", "Time", time]].map(([icon, label, val]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, color: COLORS.amber }}>{icon}</span>
                      <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", width: 48 }}>{label}:</span>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <span className="mono" style={{ fontSize: 9, letterSpacing: 3, fontWeight: 600, color: "rgba(255,255,255,0.22)" }}>REMINDERS</span>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {reminders.length === 0 ? <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No reminders saved on device.</p> : reminders.map((rem, i) => (
                  <div key={i} style={{ borderRadius: 18, background: `linear-gradient(135deg, ${COLORS.bgSurface}, ${COLORS.bgDeep})`, border: `1px solid ${COLORS.violet}2E`, overflow: "hidden" }}>
                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.violet}80, transparent)` }} />
                    <div style={{ padding: 14 }}>
                      <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: COLORS.violet, background: `${COLORS.violet}1A`, border: `1px solid ${COLORS.violet}40`, borderRadius: 7, padding: "4px 10px" }}>REMINDER {String(i + 1).padStart(2, "0")}</span>
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        {[["🏷️", "Title", rem.title], ["📅", "Date", rem.date], ["⏰", "Time", rem.time]].map(([icon, label, val]) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, color: `${COLORS.violet}BF` }}>{icon}</span>
                            <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", width: 32 }}>{label}:</span>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{val?.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
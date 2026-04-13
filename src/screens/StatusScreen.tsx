import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants";
import { NavBar } from "../components/Shared";

export function StatusScreen({ device, onBack }: { device: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const fetch_ = useCallback(async () => {
    setLoading(true); setStatusText(""); setError("");
    if (!device.ipAddress) { setError("Device is offline.\nAuto-connecting in background..."); setLoading(false); return; }
    try {
      const res = await fetch(`http://${device.ipAddress}:143/status`, { signal: AbortSignal.timeout(4000) });
      const body = await res.text();
      setStatusText(body || "No response from device.");
    } catch { setError("Failed to fetch status.\nMake sure device is on the same network."); }
    setLoading(false);
  }, [device.ipAddress]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const parse = () => {
    const raw: Record<string, string> = {};
    for (const line of statusText.split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      raw[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    const deviceName = raw.DEVICE_NAME || "-";
    const wifiName = raw.WIFI_NAME || "-";
    const mode = raw.MODE || "-";
    const time = raw.TIME || "-";
    const titles = (raw.REMAINDER_TITLE || "").split("|").filter(Boolean);
    const dates = (raw.REMAINDER_DATE || "").split("|").filter(Boolean);
    const times = (raw.REMAINDER_TIME || "").split("|").filter(Boolean);
    return { deviceName, wifiName, mode, time, titles, dates, times };
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
          const { deviceName, wifiName, mode, time, titles, dates, times } = parse();
          const count = Math.min(titles.length, dates.length, times.length);
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
                {count === 0 ? <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No reminders saved on device.</p> : Array.from({ length: count }, (_, i) => (
                  <div key={i} style={{ borderRadius: 18, background: `linear-gradient(135deg, ${COLORS.bgSurface}, ${COLORS.bgDeep})`, border: `1px solid ${COLORS.violet}2E`, overflow: "hidden" }}>
                    <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.violet}80, transparent)` }} />
                    <div style={{ padding: 14 }}>
                      <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: COLORS.violet, background: `${COLORS.violet}1A`, border: `1px solid ${COLORS.violet}40`, borderRadius: 7, padding: "4px 10px" }}>REMINDER {String(i + 1).padStart(2, "0")}</span>
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        {[["🏷️", "Title", titles[i]], ["📅", "Date", dates[i]], ["⏰", "Time", times[i]]].map(([icon, label, val]) => (
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
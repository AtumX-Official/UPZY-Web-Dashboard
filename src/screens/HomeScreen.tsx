import { useState, useEffect } from "react";
import { COLORS } from "../constants";
import { OnlinePill, PingDot } from "../components/Shared";

export function HomeScreen({ device, onNav }: { device: any; onNav: (screen: string) => void }) {
  const cards = [
    { icon: "📡", label: "Scan", sub: "Find devices", color: COLORS.coral, screen: "scanner" },
    { icon: "🔔", label: "Remind", sub: "Set alert", color: COLORS.teal, screen: "reminder" },
    { icon: "⏰", label: "Time", sub: "Sync now", color: COLORS.amber, screen: "time" },
    { icon: "💓", label: "Status", sub: "Health check", color: COLORS.violet, screen: "status" },
  ];

  const [sysIp, setSysIp] = useState("Detecting...");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSysIp(prev => prev === "Detecting..." ? "Unknown" : prev);
    }, 1500);

    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      pc.onicecandidate = (ice) => {
        if (ice?.candidate?.candidate) {
          const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
          if (match) { setSysIp(match[1]); pc.close(); clearTimeout(timeout); }
        }
      };
    } catch (e) { setSysIp("Unknown"); clearTimeout(timeout); }

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgBase }}>
      <div style={{ background: COLORS.bgCard, padding: "48px 20px 16px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.coral}, ${COLORS.coralDeep})`, boxShadow: `0 0 12px ${COLORS.coral}80`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📡</div>
            <span style={{ fontSize: 20, fontWeight: 800 }}>UP<span style={{ color: COLORS.coral }}>ZY</span></span>
          </div>
          <OnlinePill online={device.isOnline} />
        </div>
      </div>

      <div style={{ padding: "20px 18px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.35)" }}>Hey there, welcome back</p>
          <span className="mono" style={{ fontSize: 9, color: COLORS.teal, background: `${COLORS.teal}1A`, padding: "4px 8px", borderRadius: 8, border: `1px solid ${COLORS.teal}33` }}>Sys IP: {sysIp}</span>
        </div>

        <div style={{ padding: "13px 16px", borderRadius: 18, background: `linear-gradient(135deg, ${COLORS.teal}12, ${COLORS.bgCard})`, border: `1px solid ${COLORS.teal}2E`, display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <PingDot online={device.isOnline} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>UPZY...</div>
            <div className="mono" style={{ fontSize: 10, color: `${COLORS.teal}A6`, marginTop: 2 }}>
              {device.ipAddress ? `${device.ipAddress} : 143` : "Searching..."}
            </div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 20 }}>›</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {cards.map((c, i) => (
            <ActionCard key={i} {...c} onClick={() => onNav(c.screen)} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps { icon: string; label: string; sub: string; color: string; onClick: () => void; }

export function ActionCard({ icon, label, sub, color, onClick }: ActionCardProps) {
  const [scale, setScale] = useState(0);
  useEffect(() => { const t = setTimeout(() => setScale(1), 80); return () => clearTimeout(t); }, []);
  return (
    <button onClick={onClick} style={{ padding: 14, borderRadius: 20, textAlign: "left", background: `linear-gradient(135deg, ${color}1A, ${color}0A)`, border: `1px solid ${color}38`, transform: `scale(${scale})`, transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", opacity: scale }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>{sub}</div>
    </button>
  );
}
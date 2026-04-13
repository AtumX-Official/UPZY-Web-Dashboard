import React, { useState, useEffect } from "react";
import { COLORS } from "../constants";

export function PingDot({ online }: { online: boolean }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 100), 20);
    return () => clearInterval(t);
  }, []);
  const color = online ? COLORS.teal : COLORS.coral;
  const ripple = Math.abs(Math.sin(pulse * 0.063));
  return (
    <div style={{ width: 20, height: 20, position: "relative", flexShrink: 0 }}>
      {online && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid ${color}`,
          opacity: 1 - ripple,
          transform: `scale(${0.4 + ripple * 0.6})`,
          transition: "none",
        }} />
      )}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 9, height: 9, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}99`,
      }} />
    </div>
  );
}

export function OnlinePill({ online }: { online: boolean }) {
  const color = online ? COLORS.teal : COLORS.coral;
  const [blink, setBlink] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setBlink(b => b === 1 ? 0.4 : 1), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 20,
      background: `${color}1A`, border: `1px solid ${color}4D`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: blink, boxShadow: online ? `0 0 6px ${color}80` : "none" }} />
      <span className="mono" style={{ fontSize: 8, fontWeight: 600, color, letterSpacing: 0.5 }}>
        {online ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}

export function Snack({ msg, color, onDone }: { msg: string; color: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: COLORS.bgSurface, border: `1px solid ${color}66`,
      borderRadius: 14, padding: "12px 20px", zIndex: 9999,
      fontFamily: "Syne", fontWeight: 600, fontSize: 13,
      boxShadow: "0 8px 32px #0008", whiteSpace: "nowrap",
    }}>{msg}</div>
  );
}

export function FieldTile({ color, children, onClick }: { color: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px",
      borderRadius: 16,
      background: `linear-gradient(135deg, ${color}12 0%, ${COLORS.bgCard} 100%)`,
      border: `1px solid ${color}38`,
      cursor: onClick ? "pointer" : "default",
    }}>
      {children}
    </div>
  );
}

export function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />
      <span className="mono" style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2.5, color: `${color}CC` }}>
        {label}
      </span>
    </div>
  );
}

export function ShimmerBtn({ label, color1, color2, onClick, disabled, loading }: { label: string; color1: string; color2: string; onClick?: () => void; disabled?: boolean; loading?: boolean }) {
  const [shimmer, setShimmer] = useState(-1);
  useEffect(() => {
    const t = setInterval(() => setShimmer(s => s >= 2 ? -1 : s + 0.015), 16);
    return () => clearInterval(t);
  }, []);
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: "100%", padding: "16px 0",
      borderRadius: 18, position: "relative", overflow: "hidden",
      background: `linear-gradient(90deg, ${color1}, ${color2})`,
      boxShadow: `0 6px 20px ${color2}59`,
      opacity: disabled ? 0.6 : 1,
      letterSpacing: 1.5, fontSize: 12, fontWeight: 700,
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15) ${(shimmer + 1) * 50}%, transparent)`,
        pointerEvents: "none",
      }} />
      {loading ? "Sending..." : label}
    </button>
  );
}

export interface NavBarProps {
  title: string;
  onBack: () => void;
  right: React.ReactNode;
}

export function NavBar({ title, onBack, right }: NavBarProps) {
  return (
    <div style={{ background: COLORS.bgCard, padding: "48px 16px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>‹</button>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{title}</span>
      {right}
    </div>
  );
}

export function ConnectModal({ onConnect, onClose }: { 
  onConnect: (ip: string) => void; 
  onClose: () => void; 
}) {
  const [ip, setIp] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, background: COLORS.bgSurface, borderRadius: 20, border: `1px solid ${COLORS.teal}4D`, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Connect to UPZY Device</h2>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20, fontFamily: "Syne" }}>Enter the IP address of your ESP32/UPZY device on your local network.</p>
        <input value={ip} onChange={e => setIp(e.target.value)} placeholder="e.g. 192.168.1.42"
          className="mono"
          style={{ width: "100%", padding: "12px 16px", background: COLORS.bgCard, border: `1px solid ${COLORS.teal}33`, borderRadius: 12, color: "white", fontSize: 13, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "Syne", fontSize: 13 }}>Cancel</button>
          <button onClick={() => { if (ip.trim()) onConnect(ip.trim()); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, background: `linear-gradient(90deg, ${COLORS.teal}, #10B981)`, fontFamily: "Syne", fontSize: 13, fontWeight: 700 }}>Connect</button>
        </div>
      </div>
    </div>
  );
}
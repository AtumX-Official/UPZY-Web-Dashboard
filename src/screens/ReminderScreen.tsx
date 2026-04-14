import { useState } from "react";
import { COLORS } from "../constants";
import { NavBar, FieldTile, ShimmerBtn } from "../components/Shared";
import { getDatabase, ref, set } from "firebase/database";

export function ReminderScreen({ device, onBack, showSnack }: { 
  device: any; 
  onBack: () => void; 
  showSnack: (msg: string, color: string) => void; 
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title || !date || !time) { showSnack("Please fill all fields", COLORS.amber); return; }
    if (!device.ipAddress) { showSnack("Device offline — connect first", COLORS.coral); return; }
    setSending(true);
    const [y, m, d_] = date.split("-");
    const formattedDate = `${d_}-${m}-${y}`;
    const [h, min] = time.split(":");
    const hNum = parseInt(h), period = hNum >= 12 ? "PM" : "AM";
    const h12 = hNum % 12 || 12;
    const formattedTime = `${h12}:${min} ${period}`;
    const payload = `Title:${title} Date:${formattedDate} Time:${time}`;

    try {
      // 1. Send via Firebase
      const db = getDatabase();
      await set(ref(db, `devices/${device.ipAddress}/Remainder`), payload);

      // 2. Try Local Network (ignore if fails)
      try { await fetch(`http://${device.ipAddress}:143/Remainder/${encodeURIComponent(title)}:${formattedDate}:${formattedTime}`, { signal: AbortSignal.timeout(3000) }); } catch (e) {} 

      showSnack("Reminder sent to Firebase & device", COLORS.teal);
      setTitle(""); setDate(""); setTime("");
    } catch { showSnack("Failed to send reminder", COLORS.coral); }
    setSending(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgBase }}>
      <NavBar title="Set Reminder" onBack={onBack} right={null} />
      <div style={{ padding: "20px 20px 48px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FieldTile color={COLORS.coral}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: COLORS.coral }}>✏️</span>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title" style={{ flex: 1, background: "none", color: "white", fontFamily: "Syne", fontSize: 13, fontWeight: 500, border: "none" }} />
            </div>
          </FieldTile>
          <FieldTile color={COLORS.violet}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: COLORS.violet }}>📅</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, background: "none", color: date ? "white" : "rgba(255,255,255,0.28)", fontFamily: "Syne", fontSize: 13, fontWeight: 500, border: "none", colorScheme: "dark" }} />
            </div>
          </FieldTile>
          <FieldTile color={COLORS.amber}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: COLORS.amber }}>⏰</span>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ flex: 1, background: "none", color: time ? "white" : "rgba(255,255,255,0.28)", fontFamily: "Syne", fontSize: 13, fontWeight: 500, border: "none", colorScheme: "dark" }} />
            </div>
          </FieldTile>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)", margin: "20px 0 16px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: `${device.isOnline ? COLORS.teal : COLORS.coral}1F`, border: `1px solid ${device.isOnline ? COLORS.teal : COLORS.coral}4D`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            {device.isOnline ? "✓" : "✗"}
          </div>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
            {device.isOnline ? "Device connected — ready to send" : "Device offline — connect first"}
          </span>
        </div>
        {sending ? <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><div style={{ width: 24, height: 24, borderRadius: "50%", border: `3px solid ${COLORS.coral}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} /></div> : <ShimmerBtn label="SEND REMINDER" color1={COLORS.coralDeep} color2={COLORS.coral} onClick={send} />}
        <p className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 12 }}>reminder syncs to UPZY device</p>
      </div>
    </div>
  );
}
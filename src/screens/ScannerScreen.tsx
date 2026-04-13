import { useState, useEffect } from "react";
import { COLORS } from "../constants";
import { NavBar } from "../components/Shared";

export function ScannerScreen({ device, onBack, showSnack }: { 
  device: any; 
  onBack: () => void; 
  showSnack: (msg: string, color: string) => void; 
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState<{ ip: string; name: string; network: string }[]>([]);
  const [status, setStatus] = useState("Ready");
  const [logs, setLogs] = useState<string[]>([]);
  const [radarAngle, setRadarAngle] = useState(0);
  const [wifiModal, setWifiModal] = useState<{ ip: string; name: string; network: string } | null>(null);
  const [ssid, setSsid] = useState("");
  const [pass, setPass] = useState("");

  useEffect(() => {
    const t = setInterval(() => setRadarAngle(a => (a + 2) % 360), 16);
    return () => clearInterval(t);
  }, []);

  const scan = async () => {
    setIsScanning(true);
    setDevices([]);
    setProgress(0);
    setLogs([]);
    setStatus("Detecting System IP...");

    let sysIp = "Unknown";
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      await new Promise<void>((resolve) => {
        pc.onicecandidate = (ice) => {
          if (ice?.candidate?.candidate) {
            const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
            if (match) { sysIp = match[1]; resolve(); }
          }
        };
        setTimeout(resolve, 1500);
      });
      pc.close();
    } catch (e) {}

    setStatus(sysIp !== "Unknown" ? `System IP: ${sysIp}` : "Scanning networks...");
    if (sysIp !== "Unknown") await new Promise(r => setTimeout(r, 1200));

    // const subnetStr = sysIp !== "Unknown" ? sysIp.split('.').slice(0, 3).join('.') + '.*' : 'subnet';

    // Build a list of IPs to scan
    const ipSet = new Set<string>();
    ipSet.add("192.168.4.1"); // Default ESP Hotspot
    if (device.ipAddress) ipSet.add(device.ipAddress); // Previously connected IP

    if (sysIp !== "Unknown") {
      const baseIp = sysIp.split('.').slice(0, 3).join('.');
      for (let i = 1; i <= 254; i++) {
        ipSet.add(`${baseIp}.${i}`);
      }
    }

    const ipsToTry = Array.from(ipSet);
    const foundList: { ip: string; name: string; network: string }[] = [];
    let completed = 0;
    setProgress(0);

    // Scan IPs in chunks to prevent browser network queue limits
    const chunkSize = 30;
    for (let i = 0; i < ipsToTry.length; i += chunkSize) {
      const chunk = ipsToTry.slice(i, i + chunkSize);
      
      // Add chunk of IPs to the top of our log list
      setLogs(prev => [...chunk, ...prev]);

      await Promise.all(chunk.map(async (ip) => {
        setStatus(`Pinging ${ip}...`);
        try {
          const res = await fetch(`http://${ip}:143/ping`, { signal: AbortSignal.timeout(2500) });
          const body = await res.text();
          if (body.trim().startsWith("PONG")) {
            const name = body.includes(":") ? body.split(":").slice(1).join(":").trim() : "UPZY Device";
            foundList.push({ ip, name, network: ip === "192.168.4.1" ? "Hotspot" : "WiFi" });
          }
        } catch {}
        
        completed++;
        setProgress(completed / ipsToTry.length);
      }));
    }

    if (foundList.length > 0) {
      setDevices(foundList);
      setStatus(`${foundList.length} device(s) found`);
    } else {
      setStatus("No UPZY devices found.");
    }
    setIsScanning(false);
  };

  const sendWifi = async (d: { ip: string }) => {
    try {
      await fetch(`http://${d.ip}:143/network`, {
        method: "POST", headers: { "Content-Type": "text/plain" },
        body: `SSID:${ssid},PASS:${pass}`,
        signal: AbortSignal.timeout(3000),
      });
      showSnack("Credentials sent! Restarting...", COLORS.teal);
    } catch { showSnack("Could not reach device", COLORS.coral); }
    setWifiModal(null); setSsid(""); setPass("");
  };

  const sendCmd = async (ip: string, endpoint: string) => {
    try {
      await fetch(`http://${ip}:143${endpoint}`, { signal: AbortSignal.timeout(3000) });
      showSnack("Command sent", COLORS.teal);
    } catch { showSnack("Failed to send command", COLORS.coral); }
  };

  const RadarCanvas = () => {
    const r = 40;
    const cx = 40, cy = 40;
    const sweep = radarAngle * Math.PI / 180;
    const sweepStart = sweep - 1.2;
    const x1 = cx + r * Math.cos(sweepStart), y1 = cy + r * Math.sin(sweepStart);
    const x2 = cx + r * Math.cos(sweep), y2 = cy + r * Math.sin(sweep);
    const hitX = cx + r * 0.55 * Math.cos(0.8), hitY = cy + r * 0.55 * Math.sin(-0.4);
    return (
      <svg width="80" height="80" viewBox="0 0 80 80">
        {[1, 0.67, 0.33].map((f, i) => <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke={COLORS.teal} strokeWidth="0.8" strokeOpacity={0.1 * f} />)}
        <line x1="0" y1={cy} x2="80" y2={cy} stroke={COLORS.teal} strokeWidth="0.5" strokeOpacity="0.07" />
        <line x1={cx} y1="0" x2={cx} y2="80" stroke={COLORS.teal} strokeWidth="0.5" strokeOpacity="0.07" />
        <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={`${COLORS.teal}40`} />
        <circle cx={hitX} cy={hitY} r="3" fill={COLORS.coral} filter="url(#glow)" />
        <defs><filter id="glow"><feGaussianBlur stdDeviation="2" /><feComposite in="SourceGraphic" /></filter></defs>
      </svg>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bgBase }}>
      <NavBar title="Network Scan" onBack={onBack} right={
        <div style={{ display: "flex", gap: 8 }}>
          {devices.length > 0 && <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: COLORS.coral, background: `${COLORS.coral}1F`, border: `1px solid ${COLORS.coral}4D`, borderRadius: 20, padding: "4px 10px" }}>{devices.length} found</span>}
          <button onClick={isScanning ? undefined : scan} style={{ opacity: isScanning ? 0.3 : 1, fontSize: 18 }}>🔄</button>
        </div>
      } />

      <div style={{ padding: 18 }}>
        {isScanning && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{status}</span>
              <span className="mono" style={{ fontSize: 10, color: COLORS.coral, fontWeight: 600 }}>{Math.floor(progress * 100)}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress * 100}%`, background: COLORS.coral, transition: "width 0.1s" }} />
            </div>
          </div>
        )}

        {devices.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${COLORS.teal}12`, border: `1px solid ${COLORS.teal}26`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, marginBottom: 18 }}>{isScanning ? "📡" : "📶"}</div>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "Syne", textAlign: "center" }}>
              {isScanning ? "Pinging all devices..." : status}
            </p>
            {!isScanning && (
              <button onClick={scan} style={{ marginTop: 20, padding: "12px 28px", borderRadius: 14, background: `linear-gradient(90deg, ${COLORS.coralDeep}, ${COLORS.coral})`, fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>START SCAN</button>
            )}
          </div>
        ) : devices.map((d, i) => (
          <div key={i} style={{ borderRadius: 20, background: `linear-gradient(135deg, ${COLORS.bgSurface}, ${COLORS.bgDeep})`, border: `1px solid ${COLORS.teal}2E`, overflow: "hidden" }}>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${COLORS.teal}8C, transparent)` }} />
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: `${COLORS.teal}1A`, border: `1px solid ${COLORS.teal}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💾</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: COLORS.teal, marginTop: 3 }}>{d.ip} : 143</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {([["ONLINE", COLORS.teal, true], [d.network, COLORS.coral, false]] as const).map(([label, color, dot], j) => (
                      <span key={j} className="mono" style={{ fontSize: 9, fontWeight: 600, color, background: `${color}1A`, border: `1px solid ${color}47`, borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: dot ? 4 : 0 }}>
                        {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />}{label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => setWifiModal(d)} style={{ width: "100%", padding: "10px 0", borderRadius: 12, background: `${COLORS.violet}14`, border: `1px solid ${COLORS.violet}47`, fontSize: 11, fontWeight: 600, color: COLORS.violet, fontFamily: "'IBM Plex Mono', monospace" }}>📶 Change WiFi</button>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["LOCAL", "🔌", COLORS.teal, "/Local"], ["NETWORK", "🌐", COLORS.amber, "/ssid"]].map(([label, icon, color, ep], j) => (
                    <button key={j} onClick={() => sendCmd(d.ip, ep)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: `${color}14`, border: `1px solid ${color}47`, fontSize: 11, fontWeight: 600, color, fontFamily: "'IBM Plex Mono', monospace" }}>{icon} {label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isScanning && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 24 }}>
            <RadarCanvas />
            <p className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>{status}</p>
            
            <div style={{ 
              width: "100%", marginTop: 16, padding: 12, 
              background: "rgba(0,0,0,0.2)", borderRadius: 12, 
              maxHeight: 140, overflowY: "auto", 
              border: `1px solid ${COLORS.teal}33` 
            }}>
              {logs.map((log, idx) => (
                <div key={idx} className="mono" style={{ fontSize: 10, color: idx < 30 ? COLORS.teal : "rgba(255,255,255,0.3)", marginBottom: 4 }}>
                  {idx < 30 ? "➜" : "✓"} Pinging {log}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {wifiModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 360, background: COLORS.bgSurface, borderRadius: 20, border: `1px solid ${COLORS.violet}4D`, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Change WiFi</h2>
            {([["ssid", "Network name (SSID)", ssid, setSsid, false], ["pass", "Password", pass, setPass, true]] as const).map(([id, placeholder, val, setter, obscure]) => (
              <input key={id} type={obscure ? "password" : "text"} placeholder={placeholder} value={val} onChange={e => (setter as any)(e.target.value)}
                style={{ width: "100%", marginBottom: 12, padding: "12px 16px", background: COLORS.bgCard, border: `1px solid ${COLORS.violet}33`, borderRadius: 12, color: "white", fontFamily: "Syne", fontSize: 13 }} />
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
              <button onClick={() => setWifiModal(null)} style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Syne" }}>Cancel</button>
              <button onClick={() => sendWifi(wifiModal)} style={{ padding: "8px 20px", borderRadius: 10, background: COLORS.violet, fontWeight: 700, fontFamily: "Syne" }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
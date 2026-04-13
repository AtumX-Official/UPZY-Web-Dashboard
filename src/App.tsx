import { useState, useEffect } from "react";
import { COLORS, css } from "./constants";
import { Snack, ConnectModal } from "./components/Shared";
import { SplashScreen } from "./screens/SplashScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import { ReminderScreen } from "./screens/ReminderScreen";
import { TimeScreen } from "./screens/TimeScreen.tsx";
import { StatusScreen } from "./screens/StatusScreen";

function useDeviceState() {
  const [ipAddress, setIpAddress] = useState<string | null>(localStorage.getItem("upzy_ip"));
  const [isOnline, setIsOnline] = useState(false);

  // App.tsx la ping function மாத்துங்க
  const ping = async (ip: string) => {
    try {
      await fetch(`http://${ip}:143/ping`, { 
        signal: AbortSignal.timeout(2000),
        mode: 'no-cors'
      });
      return true;  // request reached = device online
    } catch { 
      return false;  // timeout or network error = offline
    }
  };

  useEffect(() => {
    if (ipAddress) {
      ping(ipAddress).then(setIsOnline);
      localStorage.setItem("upzy_ip", ipAddress);
    }
  }, [ipAddress]);

  return { ipAddress, setIpAddress, isOnline, setIsOnline, ping };
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [screen, setScreen] = useState("home");
  const [snack, setSnack] = useState<{ msg: string; color: string } | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const device = useDeviceState();

  const showSnack = (msg: string, color: string) => setSnack({ msg, color });

  const handleConnect = async (ip: string) => {
    device.setIpAddress(ip);
    const alive = await device.ping(ip);
    device.setIsOnline(alive);
    if (!alive) device.setIpAddress(null);
    showSnack(alive ? `Connected to ${ip}` : "Device not responding", alive ? COLORS.teal : COLORS.coral);
    setShowConnect(false);
    if (alive) {
      // Send live time
      const now = new Date();
      const date = `${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth()+1).padStart(2,"0")}-${now.getFullYear()}`;
      const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      try { await fetch(`http://${ip}:143/Live/${date}|${time}`, { signal: AbortSignal.timeout(2000) }); } catch {}
    }
  };

  if (splash) return (
    <>
      <style>{css + `@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <SplashScreen onDone={() => setSplash(false)} />
    </>
  );

  const screens: Record<string, React.ReactNode> = {
    home: <HomeScreen device={device} onNav={(s: string) => { if (s === "time") { setScreen("time"); } else setScreen(s); }} />,
    scanner: <ScannerScreen device={device} onBack={() => setScreen("home")} showSnack={showSnack} />,
    reminder: <ReminderScreen device={device} onBack={() => setScreen("home")} showSnack={showSnack} />,
    time: <TimeScreen device={device} onBack={() => setScreen("home")} showSnack={showSnack} />,
    status: <StatusScreen device={device} onBack={() => setScreen("home")} />,
  };

  return (
    <>
      <style>{css + `@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", minHeight: "100vh" }}>
        {screens[screen] || screens.home}

        {/* Connect FAB */}
        {screen === "home" && !device.isOnline && (
          <button onClick={() => setShowConnect(true)} style={{
            position: "fixed", bottom: 24, right: 24,
            width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.coral}, ${COLORS.coralDeep})`,
            boxShadow: `0 0 20px ${COLORS.coral}60`,
            fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          }}>🔗</button>
        )}

        {showConnect && <ConnectModal onConnect={handleConnect} onClose={() => setShowConnect(false)} />}
        {snack && <Snack msg={snack.msg} color={snack.color} onDone={() => setSnack(null)} />}
      </div>
    </>
  );
}
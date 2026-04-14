import { useState, useEffect } from "react";
import { COLORS, css } from "./constants";
import { Snack, ConnectModal } from "./components/Shared";
import { SplashScreen } from "./screens/SplashScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import { ReminderScreen } from "./screens/ReminderScreen";
import { TimeScreen } from "./screens/TimeScreen.tsx";
import { StatusScreen } from "./screens/StatusScreen";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child, set } from "firebase/database"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASWAZBKP-WdKWVeoqVjkEOq5IK5b0sOtM",
  authDomain: "upzy-93cfb.firebaseapp.com",
  databaseURL: "https://upzy-93cfb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "upzy-93cfb",
  storageBucket: "upzy-93cfb.firebasestorage.app",
  messagingSenderId: "791246156859",
  appId: "1:791246156859:web:bbbcebb282e26398f5581e",
  measurementId: "G-LJC8ES4YE7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function useDeviceState() {
  const [ipAddress, setIpAddress] = useState<string | null>(localStorage.getItem("upzy_ip"));
  const [isOnline, setIsOnline] = useState(false);

  const ping = async (ip: string) => {
    try {
      // Check if device path is accessible to verify Firebase connectivity
      await get(child(ref(db), `devices/${ip}`));
      return true;
    } catch { 
      return false;
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
      try {
        await set(ref(db, `devices/${ip}/Live`), `${date}|${time}`);
      } catch {}
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
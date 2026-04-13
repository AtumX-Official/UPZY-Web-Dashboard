import { useState, useEffect } from "react";
import { COLORS } from "../constants";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [angle1, setAngle1] = useState(0);
  const [angle2, setAngle2] = useState(0);
  const [float, setFloat] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const t = (ts - start) / 2400;
      setProgress(Math.min(t, 1));
      setScale(Math.min(0.5 + t * 1.5, 1));
      setAngle1(((ts / 10000) % 1) * 360);
      setAngle2(-(((ts / 7000) % 1) * 360));
      setFloat(Math.sin(ts / 1600) * 8);
      if (t < 1) requestAnimationFrame(animate);
      else setTimeout(onDone, 400);
    };
    requestAnimationFrame(animate);
  }, [onDone]);

  const OrbitalRing = ({ size, color, angle, dotSize }: { size: number; color: string; angle: number; dotSize: number; }) => {
    const r = size / 2;
    const dx = r * Math.cos(angle * Math.PI / 180);
    const dy = r * Math.sin(angle * Math.PI / 180);
    return (
      <div style={{ position: "absolute", width: size, height: size, borderRadius: "50%", border: `1px solid ${color}1A`, top: "50%", left: "50%", transform: `translate(-50%,-50%)` }}>
        <div style={{ position: "absolute", width: dotSize, height: dotSize, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}CC`, top: "50%", left: "50%", transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` }} />
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bgBase, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {[240, 180, 120].map((size, i) => (
          <OrbitalRing key={i} size={size} color={[COLORS.coral, COLORS.teal, COLORS.amber][i]} angle={i % 2 === 0 ? angle1 : angle2} dotSize={[7, 5, 5][i]} />
        ))}
      </div>
      <div style={{ transform: `translateY(${float}px) scale(${scale})`, textAlign: "center", zIndex: 1 }}>
        <div style={{ width: 72, height: 72, borderRadius: 24, background: `linear-gradient(135deg, ${COLORS.coral}, ${COLORS.coralDeep})`, boxShadow: `0 0 28px ${COLORS.coral}80`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 34 }}>📡</div>
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 2 }}>
          UP<span style={{ color: COLORS.coral }}>ZY</span>
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 4, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>SMART DEVICE SCANNER</div>
        <div style={{ width: 160, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, margin: "52px auto 0", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: `linear-gradient(90deg, ${COLORS.coralDeep}, ${COLORS.coral}, ${COLORS.amber})`, boxShadow: `0 0 8px ${COLORS.coral}99`, transition: "width 0.1s" }} />
        </div>
        <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>{Math.floor(progress * 100)}%</div>
      </div>
    </div>
  );
}
export const COLORS = {
  coral: "#FF6B6B",
  coralDeep: "#FF3366",
  teal: "#2DD4BF",
  amber: "#FBBF24",
  violet: "#A78BFA",
  blue: "#60A5FA",
  bgBase: "#0C0C14",
  bgCard: "#131320",
  bgDeep: "#0F1018",
  bgSurface: "#141824",
};

export const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { background: ${COLORS.bgBase}; min-height: 100vh; color: white; font-family: 'Syne', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,107,107,0.3); border-radius: 2px; }
  input, textarea { outline: none; }
  button { cursor: pointer; border: none; background: none; font-family: 'Syne', sans-serif; color: white; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
`;
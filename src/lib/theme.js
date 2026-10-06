// Categorical series colors (validated colorblind-safe order). Use by slot,
// never cycle.
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
export const INK = { primary: '#0f172a', secondary: '#475569', muted: '#94a3b8', grid: '#e2e8f0' };

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: INK.secondary, fontSize: 11 },
};

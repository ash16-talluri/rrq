const KEY = "roadrescue:low-battery";

export function getLowBattery(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function setLowBattery(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, on ? "1" : "0");
  applyLowBattery(on);
}

export function applyLowBattery(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("low-battery", on);
}

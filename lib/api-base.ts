
declare global {
  interface Window {
    __WACRM_API_URL__?: string;
  }
}

export function getApiBase(): string {
  return (
    window.__WACRM_API_URL__ ||
    location.origin
  ).replace(/\/+$/, "");
}
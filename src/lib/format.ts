// Pin a fixed locale for all date/time rendering. Without this, the server
// (Node's default locale) and the browser (the visitor's locale) can format
// the same Date differently, which React flags as a hydration mismatch.
const LOCALE = "en-GB";

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString(LOCALE);
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString(LOCALE);
}

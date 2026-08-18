import type { SVGProps } from "react";
const paths: Record<string, React.ReactNode> = {
  snow: <><path d="m10 20-1.25-2.5L6 18M10 4 8.75 6.5 6 6M14 20l1.25-2.5L18 18M14 4l1.25 2.5L18 6M17 21l-3-6h-4M17 3l-3 6 1.5 3M2 12h6.5L10 9M20 10l-1.5 2 1.5 2M22 12h-6.5L14 15M4 10l1.5 2L4 14M7 21l3-6-1.5-3M7 3l3 6h4"/></>,
  fridge: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 9h12M9 5v2M9 12v3"/></>,
  washer: <><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 6h.01M11 6h6"/></>,
  flame: <path d="M12 22c4.2 0 7-2.8 7-7 0-5-4-8-6-12-1 4-3 6-5 8-1.5 1.5-3 3.5-3 6 0 3 2.7 5 7 5Zm0-3c-1.7 0-3-1-3-2.7 0-1.5 1-2.5 2-3.5.6 1.7 2 2.6 2 4.2 0 1.1-.4 2-1 2Z"/>,
  heat: <><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 7v10M12 7v10M16 7v10M7 19v2M17 19v2M20 9h2v4h-2"/></>,
  bolt: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  screen: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4m-2-12 5 3-5 3V9Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
  pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  instructor: <><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2m2-14 4 4m0-4-4 4"/></>,
  certificate: <><path d="M6 3h12v13H6z"/><path d="m9 9 2 2 4-4m-5 9-1 5 3-2 3 2-1-5"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
};
export function Icon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

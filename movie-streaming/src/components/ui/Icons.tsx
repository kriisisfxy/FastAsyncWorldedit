import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>;
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>;
export const InfoIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>;
export const SearchIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const CloseIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>;
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>;
export const StarIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>;
export const VolumeIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
export const MuteIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" /><path d="m22 9-6 6M16 9l6 6" /></svg>;
export const FullscreenIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>;
export const ExitFullscreenIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>;
export const CaptionsIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3" /></svg>;
export const BackIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
export const SkipIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M5 4v16l10-8L5 4Z" fill="currentColor" /><path d="M19 5v14" /></svg>;
export const Rewind10 = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /><text x="12" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="700">10</text></svg>;
export const Forward10 = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M20 12a8 8 0 1 1-2.4-5.7L20 8.5" /><path d="M20 4v4.5h-4.5" /><text x="12" y="15.5" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="700">10</text></svg>;
export const MenuIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
export const UserIcon = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;

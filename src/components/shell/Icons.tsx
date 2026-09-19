type IconProps = { size?: number; className?: string; strokeWidth?: number }

function base({ size = 20, className, strokeWidth = 1.75 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

export const Icon = {
  Home: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.8" />
    </svg>
  ),
  Grid: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </svg>
  ),
  Bag: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 8h14l-1 12.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8Z" />
      <path d="M8.5 10V6.8a3.5 3.5 0 1 1 7 0V10" />
    </svg>
  ),
  Receipt: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M6 2.5h12a1 1 0 0 1 1 1v18l-3-2-2.5 2-2.5-2-2.5 2L6 19.5v-16a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  User: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  Shield: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 2.8 20 6v6c0 5-3.4 8.4-8 9.4C7.4 20.4 4 17 4 12V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  ),
  CheckCircle: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  ),
  Clock: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  Upload: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 16V4.5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />
    </svg>
  ),
  Camera: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  ),
  QR: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20 14v.01M14 20v.01M17.5 20.5h3.5V17" />
    </svg>
  ),
  Chevron: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  ),
  ArrowRight: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 12h14" />
    </svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  Logout: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M14 20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h8" />
      <path d="M17 15.5 20.5 12 17 8.5M10 12h10.5" />
    </svg>
  ),
  Box: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2Z" />
      <path d="M4.2 7.2 12 11.4l7.8-4.2M12 11.4V21" />
    </svg>
  ),
  Chart: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16V11M12.5 16V7.5M17 16v-3.5" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.3a3.2 3.2 0 0 1 0 5.4M17.8 14.6A5.5 5.5 0 0 1 20.5 20" />
    </svg>
  ),
  Wallet: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18a1 1 0 0 1 1 1v1.5" />
      <path d="M3 8.5v9A2.5 2.5 0 0 0 5.5 20H19a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5.5A2.5 2.5 0 0 1 3 8.5Z" />
      <path d="M16.5 14h.01" />
    </svg>
  ),
  Tag: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3.5 11.4V4.5a1 1 0 0 1 1-1h6.9a1 1 0 0 1 .7.3l8.1 8.1a1 1 0 0 1 0 1.4l-6.9 6.9a1 1 0 0 1-1.4 0L3.8 12.1a1 1 0 0 1-.3-.7Z" />
      <path d="M7.8 7.8h.01" />
    </svg>
  ),
  Sparkle: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3.5 13.8 9 19 10.8 13.8 12.6 12 18l-1.8-5.4L5 10.8 10.2 9Z" />
      <path d="M18.5 4v3M20 5.5h-3" />
    </svg>
  ),
  Alert: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 4.5 21 19.5H3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  Download: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19h15" />
    </svg>
  ),
  Truck: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3 7.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V16H3Z" />
      <path d="M14 10h3.6a1 1 0 0 1 .84.46L21 14.2V16h-7Z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  ),
  Refresh: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v4.5h-4.5" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1v-.3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
    </svg>
  ),
}

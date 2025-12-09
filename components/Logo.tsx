export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Santa Hat */}
      <path
        d="M 50 20 L 35 45 L 65 45 Z"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="2"
      />
      <ellipse cx="50" cy="45" rx="18" ry="5" fill="#FECACA" />
      <circle cx="50" cy="18" r="6" fill="#FECACA" />

      {/* Gift Box */}
      <rect
        x="35"
        y="50"
        width="30"
        height="30"
        rx="2"
        fill="#10B981"
        stroke="#059669"
        strokeWidth="2"
      />

      {/* Ribbon Vertical */}
      <rect
        x="47"
        y="50"
        width="6"
        height="30"
        fill="#DC2626"
      />

      {/* Ribbon Horizontal */}
      <rect
        x="35"
        y="62"
        width="30"
        height="6"
        fill="#DC2626"
      />

      {/* Bow */}
      <path
        d="M 50 50 L 42 42 L 46 46 L 50 50 L 54 46 L 58 42 Z"
        fill="#DC2626"
      />
      <circle cx="50" cy="50" r="3" fill="#991B1B" />

      {/* SEO Letters - integrated into design */}
      <text
        x="50"
        y="72"
        fontFamily="Arial, sans-serif"
        fontSize="10"
        fontWeight="bold"
        fill="white"
        textAnchor="middle"
      >
        SEO
      </text>

      {/* Sparkles */}
      <circle cx="25" cy="35" r="2" fill="#FCD34D" />
      <circle cx="75" cy="40" r="2" fill="#FCD34D" />
      <circle cx="70" cy="25" r="1.5" fill="#FCD34D" />
      <circle cx="30" cy="60" r="1.5" fill="#FCD34D" />
    </svg>
  )
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="w-10 h-10" />
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white leading-none">SEO Kringle</span>
        <span className="text-xs text-white/80 leading-none">Secret Santa</span>
      </div>
    </div>
  )
}

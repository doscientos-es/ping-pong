export function CourtArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 440 280" fill="none" aria-hidden="true">
      <ellipse cx="235" cy="238" rx="170" ry="24" fill="#0b2b20" opacity=".28" />
      <path
        d="m107 138-11 81m240-88 9 88m-184-57-3 66m126-56 6 56"
        stroke="#749787"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="m64 130 158-90 160 90-158 92z" fill="#b9da9e" />
      <path d="M64 130v12l160 92 158-92v-12l-158 92z" fill="#82a887" />
      <path d="m76 130 146-82 148 82-146 84z" fill="#447c60" stroke="#e6efdb" strokeWidth="2.5" />
      <path d="m150 88 148 84m-150 0 148-84" stroke="#e6efdb" strokeWidth="2" />
      <path
        d="m141 164 166-94v28l-166 94z"
        fill="#eff5de"
        fillOpacity=".34"
        stroke="#f4f7e8"
        strokeWidth="2"
      />
      {Array.from({ length: 16 }, (_, i) => (
        <path
          key={i}
          d={`m${148 + i * 10} ${160 - i * 5.66}v25`}
          stroke="#edf4dc"
          strokeOpacity=".5"
        />
      ))}
      <path d="m141 166 166-94" stroke="#fff9e6" strokeWidth="4" />
      <path d="m134 161 7 31m166-123 4 31" stroke="#cedfc0" strokeWidth="5" />
      <g transform="rotate(28 320 176)">
        <rect x="311" y="197" width="16" height="44" rx="7" fill="#d6ac77" />
        <ellipse cx="319" cy="180" rx="32" ry="38" fill="#f4f2d7" />
        <ellipse cx="319" cy="177" rx="30" ry="35" fill="#ee925e" />
        <path d="M290 185h58" stroke="#ffc6a2" strokeWidth="2" />
      </g>
      <circle cx="125" cy="94" r="13" fill="#fff9e6" />
      <circle cx="121" cy="89" r="4" fill="white" opacity=".6" />
      <path
        d="m98 52-7-13m41 5 4-16m-65 48-17-3"
        stroke="#b9d496"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="358" cy="57" r="4" fill="#d8ef91" />
      <circle cx="74" cy="189" r="3" fill="#d8ef91" />
    </svg>
  )
}

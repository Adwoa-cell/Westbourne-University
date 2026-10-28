// Illustrated campus facade inside an arch frame. Replace with a real photograph by swapping this component for an <img>.
export default function CampusArt() {
  const columns = [150, 190, 230, 270, 310];
  return (
    <svg className="campus-art" viewBox="0 0 480 560" role="img" aria-labelledby="campus-art-title">
      <title id="campus-art-title">Illustration of the Westbourne University main building beneath an arch</title>
      <defs>
        <clipPath id="arch"><path d="M0 560V210a240 240 0 0 1 480 0v350z" /></clipPath>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14305f" />
          <stop offset="1" stopColor="#2b4f8c" />
        </linearGradient>
      </defs>
      <g clipPath="url(#arch)">
        <rect width="480" height="560" fill="url(#sky)" />
        <circle cx="380" cy="150" r="34" fill="#c8a24a" opacity="0.9" />
        <rect x="205" y="130" width="70" height="130" fill="#f2f4f8" />
        <path d="M200 130l40-46 40 46z" fill="#c8a24a" />
        <circle cx="240" cy="170" r="20" fill="#0b1b36" />
        <circle cx="240" cy="170" r="15" fill="#fff" />
        <path d="M240 170v-9M240 170l7 4" stroke="#0b1b36" strokeWidth="3" strokeLinecap="round" />
        <path d="M110 260l130-52 130 52z" fill="#f2f4f8" />
        <rect x="110" y="260" width="260" height="14" fill="#c8a24a" />
        <rect x="120" y="274" width="240" height="150" fill="#e4e9f2" />
        {columns.map((x) => (<rect key={x} x={x - 7} y="274" width="14" height="150" fill="#fff" />))}
        <rect x="205" y="350" width="70" height="74" fill="#0b1b36" />
        <path d="M205 350a35 35 0 0 1 70 0z" fill="#0b1b36" />
        <rect x="96" y="424" width="288" height="12" fill="#c8a24a" />
        <rect x="84" y="436" width="312" height="12" fill="#f2f4f8" />
        <rect x="72" y="448" width="336" height="12" fill="#dfe5f0" />
        <rect y="460" width="480" height="100" fill="#0b1b36" />
        <circle cx="52" cy="400" r="44" fill="#0e2a52" />
        <circle cx="440" cy="396" r="48" fill="#0e2a52" />
        <rect x="48" y="430" width="8" height="40" fill="#0b1b36" />
        <rect x="436" y="430" width="8" height="40" fill="#0b1b36" />
      </g>
      <path d="M0 560V210a240 240 0 0 1 480 0v350z" fill="none" stroke="#c8a24a" strokeWidth="4" />
    </svg>
  );
}

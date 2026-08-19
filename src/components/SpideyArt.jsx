export function WebOverlay({ className = "" }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* 1. TOP-LEFT DENSE SPIDER WEB */}
      <svg
        viewBox="0 0 600 600"
        className="absolute -left-12 -top-12 h-96 w-96 sm:h-[480px] sm:w-[480px] opacity-40 text-white"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6">
          {/* Radial Silk Rays from top-left anchor */}
          <line x1="0" y1="0" x2="580" y2="40" />
          <line x1="0" y1="0" x2="540" y2="120" />
          <line x1="0" y1="0" x2="480" y2="210" />
          <line x1="0" y1="0" x2="400" y2="310" />
          <line x1="0" y1="0" x2="310" y2="400" />
          <line x1="0" y1="0" x2="210" y2="480" />
          <line x1="0" y1="0" x2="120" y2="540" />
          <line x1="0" y1="0" x2="40" y2="580" />

          {/* Realistic Inward Curving Web Spiral Rings */}
          <path d="M50 4 Q35 25 25 35 Q15 45 4 50" strokeWidth="1" />
          <path d="M100 8 Q75 50 52 72 Q30 95 8 100" strokeWidth="1" />
          <path d="M150 12 Q115 75 80 110 Q45 145 12 150" strokeWidth="1.1" />
          <path d="M210 16 Q165 105 115 155 Q65 200 16 210" strokeWidth="1.2" />
          <path d="M270 20 Q215 135 150 200 Q85 260 20 270" strokeWidth="1.2" />
          <path d="M330 25 Q265 170 185 245 Q105 320 25 330" strokeWidth="1.3" />
          <path d="M400 30 Q325 210 230 300 Q130 385 30 400" strokeWidth="1.3" />
          <path d="M470 35 Q385 250 275 355 Q155 450 35 470" strokeWidth="1.4" />
          <path d="M540 40 Q445 290 320 410 Q180 520 40 540" strokeWidth="1.5" />

          {/* Drooping Anchor Silk Filaments */}
          <path d="M0 0 Q180 90 400 310 Q280 460 0 520" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="3 3" />
          <path d="M150 12 Q260 180 310 400" strokeWidth="0.9" strokeOpacity="0.5" />
        </g>
      </svg>

      {/* 2. TOP-RIGHT SPIDER WEB */}
      <svg
        viewBox="0 0 600 600"
        className="absolute -right-12 -top-12 h-96 w-96 sm:h-[480px] sm:w-[480px] opacity-35 text-red-500"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55">
          <line x1="600" y1="0" x2="20" y2="40" />
          <line x1="600" y1="0" x2="60" y2="120" />
          <line x1="600" y1="0" x2="120" y2="210" />
          <line x1="600" y1="0" x2="200" y2="310" />
          <line x1="600" y1="0" x2="290" y2="400" />
          <line x1="600" y1="0" x2="390" y2="480" />
          <line x1="600" y1="0" x2="480" y2="540" />
          <line x1="600" y1="0" x2="560" y2="580" />

          <path d="M550 4 Q565 25 575 35 Q585 45 596 50" />
          <path d="M500 8 Q525 50 548 72 Q570 95 592 100" />
          <path d="M450 12 Q485 75 520 110 Q555 145 588 150" />
          <path d="M390 16 Q435 105 485 155 Q535 200 584 210" />
          <path d="M330 20 Q385 135 450 200 Q515 260 580 270" />
          <path d="M270 25 Q335 170 415 245 Q495 320 575 330" />
          <path d="M200 30 Q275 210 370 300 Q470 385 570 400" />
          <path d="M130 35 Q215 250 325 355 Q445 450 565 470" />
          <path d="M60 40 Q155 290 280 410 Q420 520 560 540" />
        </g>
      </svg>

      {/* 3. CENTER / MID-SCREEN INTRICATE WEB (Behind Title & Center) */}
      <svg
        viewBox="0 0 700 700"
        className="absolute left-[15%] top-[10%] h-[500px] w-[500px] sm:h-[650px] sm:w-[650px] opacity-25 text-sky-400 pointer-events-none"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.4">
          {/* Central Radial Rays */}
          <line x1="350" y1="350" x2="350" y2="20" />
          <line x1="350" y1="350" x2="580" y2="80" />
          <line x1="350" y1="350" x2="680" y2="350" />
          <line x1="350" y1="350" x2="580" y2="620" />
          <line x1="350" y1="350" x2="350" y2="680" />
          <line x1="350" y1="350" x2="120" y2="620" />
          <line x1="350" y1="350" x2="20" y2="350" />
          <line x1="350" y1="350" x2="120" y2="80" />

          {/* Concentric Catenary Curved Arcs */}
          {/* Tier 1 */}
          <path d="M350 300 Q390 305 410 325 Q430 350 430 350 Q425 390 405 410 Q380 430 350 430 Q310 425 290 405 Q270 380 270 350 Q275 310 295 290 Q320 270 350 300" />
          {/* Tier 2 */}
          <path d="M350 240 Q430 250 470 280 Q510 320 510 350 Q500 420 460 460 Q420 500 350 500 Q280 490 240 450 Q200 410 190 350 Q200 280 240 240 Q290 200 350 240" strokeWidth="1.1" />
          {/* Tier 3 */}
          <path d="M350 170 Q480 185 540 230 Q600 290 590 350 Q580 470 520 530 Q460 590 350 580 Q240 570 180 510 Q120 450 110 350 Q120 240 180 180 Q250 120 350 170" strokeWidth="1.2" />
          {/* Tier 4 */}
          <path d="M350 90 Q530 110 610 170 Q690 250 670 350 Q650 520 580 590 Q500 660 350 650 Q200 640 120 570 Q50 490 40 350 Q50 200 120 120 Q210 50 350 90" strokeWidth="1.3" />
        </g>
      </svg>

      {/* 4. BOTTOM-LEFT HORIZON SPIDER WEB */}
      <svg
        viewBox="0 0 500 500"
        className="absolute -bottom-16 -left-16 h-80 w-80 sm:h-96 sm:w-96 opacity-30 text-gold"
        fill="none"
      >
        <g stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5">
          <line x1="0" y1="500" x2="480" y2="460" />
          <line x1="0" y1="500" x2="440" y2="380" />
          <line x1="0" y1="500" x2="380" y2="290" />
          <line x1="0" y1="500" x2="300" y2="200" />
          <line x1="0" y1="500" x2="200" y2="120" />
          <line x1="0" y1="500" x2="110" y2="50" />

          <path d="M70 494 Q50 465 35 450 Q20 435 6 430" />
          <path d="M140 489 Q100 435 70 405 Q40 380 11 370" />
          <path d="M210 483 Q160 400 115 350 Q70 310 17 300" />
          <path d="M280 477 Q220 365 160 290 Q95 240 23 230" />
          <path d="M350 472 Q280 330 200 230 Q120 170 28 160" />
          <path d="M420 466 Q340 295 240 170 Q145 100 34 90" />
        </g>
      </svg>

      {/* 5. DYNAMIC SHOOTING WEB STRANDS (From Spider-Man's Wrist & Action Lines) */}
      <svg
        viewBox="0 0 1200 800"
        className="absolute inset-0 h-full w-full opacity-35 text-white pointer-events-none"
        fill="none"
      >
        <g stroke="white" strokeWidth="1.2" strokeOpacity="0.45">
          {/* Dynamic Silk Shooters stretching across page */}
          <path d="M850 450 Q550 320 150 380" strokeWidth="1.6" strokeDasharray="6 3" />
          <path d="M850 450 Q600 240 50 180" strokeWidth="1.4" />
          <path d="M850 450 Q700 180 300 40" strokeWidth="1.2" />
          <path d="M850 450 Q750 600 450 750" strokeWidth="1.4" />
          <path d="M850 450 Q980 350 1150 200" strokeWidth="1.5" />
          <path d="M850 450 Q1050 480 1200 520" strokeWidth="1.3" />

          {/* Intersecting web knots */}
          <circle cx="550" cy="320" r="2.5" fill="#f5c518" />
          <circle cx="600" cy="240" r="2" fill="#fff" />
          <circle cx="700" cy="180" r="2.5" fill="#e11d2e" />
          <circle cx="750" cy="600" r="2" fill="#fff" />
        </g>
      </svg>

      {/* 6. Subtle Cyber Mesh Background Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>
  );
}

export function MaskBurst({ className = "" }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden="true">
      <ellipse cx="100" cy="110" rx="78" ry="96" fill="#e11d2e" />
      <path d="M100 18 C58 38 36 78 36 118 C36 168 64 198 100 206 C136 198 164 168 164 118 C164 78 142 38 100 18Z" fill="#071433" />
      <ellipse cx="68" cy="108" rx="26" ry="34" fill="#fff" transform="rotate(-18 68 108)" />
      <ellipse cx="132" cy="108" rx="26" ry="34" fill="#fff" transform="rotate(18 132 108)" />
      <path d="M100 28 L100 200 M52 70 Q100 92 148 70 M42 110 Q100 132 158 110 M56 156 Q100 172 144 156" stroke="#e11d2e" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function Skyline({ className = "" }) {
  return (
    <svg viewBox="0 0 640 160" className={className} aria-hidden="true">
      <path
        fill="#0a1f5c"
        d="M0 160V96h28V48h18v28h22V24h16v40h18V72h30v-40h20v52h24V36h34v60h18V80h26v-28h20v48h22V56h40v40h18V88h28v-32h22v64h18V96h36v-24h24v48h20V80h28v80z"
      />
      <path fill="#e11d2e" d="M0 150h640v10H0z" />
    </svg>
  );
}

export function FemaleMark({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 12.4 V21 M8.5 17.5 H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

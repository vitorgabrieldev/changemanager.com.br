const GRID = [0, 1, 2, 3, 4] as const;
const STEP = 11;
const OFFSET = 6;

export type LoaderVariant = "pulse" | "spiral" | "spin" | "wave";

type VariantConfig = {
  duration: number;
  easing: string;
  keyframes: string;
  delays: (number | null)[][];
};

const VARIANTS: Record<LoaderVariant, VariantConfig> = {
  pulse: {
    duration: 2200,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    keyframes: "0%{opacity:0}8%{opacity:1}36%{opacity:.05}100%{opacity:0}",
    delays: [
      [733, 733, 733, 733, 733],
      [733, 367, 367, 367, 733],
      [733, 367, 0, 367, 733],
      [733, 367, 367, 367, 733],
      [733, 733, 733, 733, 733],
    ],
  },
  spiral: {
    duration: 2800,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    keyframes: "0%{opacity:0}4%{opacity:1}26%{opacity:.08}100%{opacity:0}",
    delays: [
      [2221, 2317, 869, 966, 1062],
      [2124, 772, 97, 193, 1159],
      [2028, 676, 0, 290, 1255],
      [1931, 579, 483, 386, 1352],
      [1834, 1738, 1641, 1545, 1448],
    ],
  },
  spin: {
    duration: 2000,
    easing: "linear",
    keyframes: "0%{opacity:0}4%{opacity:1}26%{opacity:.08}100%{opacity:0}",
    delays: [
      [0, 125, 250, 375, 500],
      [1875, null, null, null, 625],
      [1750, null, null, null, 750],
      [1625, null, null, null, 875],
      [1500, 1375, 1250, 1125, 1000],
    ],
  },
  wave: {
    duration: 2400,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    keyframes: "0%{opacity:.05}20%{opacity:1}55%{opacity:.18}100%{opacity:.05}",
    delays: [
      [0, 480, 960, 1440, 1920],
      [48, 528, 1008, 1488, 1968],
      [96, 576, 1056, 1536, 2016],
      [144, 624, 1104, 1584, 2064],
      [192, 672, 1152, 1632, 2112],
    ],
  },
};

export function Loader({
  variant = "spin",
  size = 32,
  className,
}: {
  variant?: LoaderVariant;
  size?: number;
  className?: string;
}) {
  const config = VARIANTS[variant];
  const animationName = `loader-${variant}-k`;
  const dotClassName = `loader-${variant}-dot`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      role="img"
      aria-label="Carregando"
      className={className}
    >
      <style>{`
        @keyframes ${animationName} { ${config.keyframes} }
        .${dotClassName} {
          fill: currentColor;
          opacity: 0;
          animation: ${animationName} ${config.duration}ms ${config.easing} infinite both;
        }
        @media (prefers-reduced-motion: reduce) {
          .${dotClassName} { animation: none; opacity: .45; }
        }
      `}</style>
      {GRID.flatMap((row) =>
        GRID.map((col) => (
          <circle
            key={`bg-${row}-${col}`}
            cx={OFFSET + col * STEP}
            cy={OFFSET + row * STEP}
            r={2.4}
            fill="currentColor"
            opacity={0.12}
          />
        )),
      )}
      {GRID.flatMap((row) =>
        GRID.map((col) => {
          const delay = config.delays[row][col];
          if (delay === null) return null;
          return (
            <circle
              key={`dot-${row}-${col}`}
              className={dotClassName}
              cx={OFFSET + col * STEP}
              cy={OFFSET + row * STEP}
              r={3.1}
              style={{ animationDelay: `${delay}ms` }}
            />
          );
        }),
      )}
    </svg>
  );
}

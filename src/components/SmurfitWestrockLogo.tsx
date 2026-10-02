import React from 'react';

interface SmurfitWestrockLogoProps {
  className?: string;
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const SmurfitWestrockLogo: React.FC<SmurfitWestrockLogoProps> = ({
  className = '',
  theme = 'light',
  size = 'md',
  showSubtitle = true
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#002B49';
  const dividerColor = isDark ? '#38BDF8' : '#002B49';
  const cyanColor = '#009FE3';

  // Heights based on size
  const heightMap = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12'
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 380 75"
        className={`${heightMap[size]} w-auto`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Smurfit Westrock Packaging Solutions"
      >
        {/* Smurfit Westrock Dynamic Ribbon / Wave Emblem */}
        <g transform="translate(4, 5)">
          {/* Outer Rounded Stadium / Pill Border */}
          <rect
            x="2"
            y="2"
            width="80"
            height="62"
            rx="24"
            fill={isDark ? "rgba(0, 159, 227, 0.12)" : "transparent"}
            stroke={cyanColor}
            strokeWidth="7"
          />

          {/* Flowing Ribbon / Wave Graphic inside badge */}
          <path
            d="M 16 19 L 46 19 C 55 19 62 25 56 31 L 30 38 C 24 43 30 48 40 48 L 70 48"
            stroke={cyanColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 18 36 L 68 36"
            stroke={cyanColor}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>

        {/* Smurfit Westrock Text */}
        <g transform="translate(102, 0)">
          <text
            x="0"
            y="32"
            fill={textColor}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="28"
            fontWeight="800"
            letterSpacing="-0.5px"
          >
            Smurfit
          </text>
          <text
            x="0"
            y="59"
            fill={textColor}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontSize="28"
            fontWeight="800"
            letterSpacing="-0.5px"
          >
            Westrock
          </text>
        </g>

        {showSubtitle && (
          <>
            {/* Divider Line */}
            <line
              x1="228"
              y1="8"
              x2="228"
              y2="66"
              stroke={dividerColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Packaging Solutions Text */}
            <g transform="translate(244, 0)">
              <text
                x="0"
                y="32"
                fill={textColor}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="25"
                fontWeight="400"
                letterSpacing="-0.2px"
              >
                Packaging
              </text>
              <text
                x="0"
                y="59"
                fill={textColor}
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="25"
                fontWeight="400"
                letterSpacing="-0.2px"
              >
                Solutions
              </text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
};

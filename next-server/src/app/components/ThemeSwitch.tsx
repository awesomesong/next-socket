"use client";
import { FiMoon } from "react-icons/fi";
import { useState, useEffect, useId } from "react";
import { useTheme } from "next-themes";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

const moonGradientStroke = {
  stroke: "url(#scent-theme-switch-gradient)",
  fill: "none",
} as const;

/** FiSun과 동일 geometry; stroke+gradient URL은 WebKit에서 깨져 마스크+그라데이션 rect로 처리 */
function FiSunWithScentGradient(
  props: React.SVGProps<SVGSVGElement> & { maskId: string }
) {
  const { maskId, ...svgProps } = props;
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...svgProps}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <rect width="24" height="24" fill="black" />
          <g
            stroke="white"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </mask>
      </defs>
      <rect
        width="24"
        height="24"
        fill="url(#scent-theme-switch-gradient)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const sunMaskId = `theme-sun-mask-${useId().replace(/:/g, "")}`;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return <ShapesSkeleton width="22px" height="22px" radius="sm" />;

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <linearGradient
          id="scent-theme-switch-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="var(--scent-gradient-start)" />
          <stop offset="55%" stopColor="var(--scent-gradient-mid)" />
          <stop offset="100%" stopColor="var(--scent-gradient-end)" />
        </linearGradient>
      </svg>
      {resolvedTheme === "dark" ? (
        <FiSunWithScentGradient
          maskId={sunMaskId}
          onClick={() => setTheme("light")}
          tabIndex={0}
          onKeyDown={handleKeyPress}
          className="cursor-pointer drop-shadow-lg"
        />
      ) : (
        <FiMoon
          onClick={() => setTheme("dark")}
          size={22}
          tabIndex={0}
          onKeyDown={handleKeyPress}
          className="cursor-pointer drop-shadow-lg"
          {...moonGradientStroke}
        />
      )}
    </>
  );
}

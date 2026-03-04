"use client";
import { FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

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

  if (resolvedTheme === "dark") {
    // 다크모드 태양: .icon-accent (--scent-gradient-mid)
    return (
      <FiSun
        onClick={() => setTheme("light")}
        size={22}
        tabIndex={0}
        onKeyDown={handleKeyPress}
        className="icon-accent cursor-pointer drop-shadow-lg"
      />
    );
  }

  if (resolvedTheme === "light") {
    // 라이트모드 달: .icon-accent (--scent-gradient-mid)
    return (
      <FiMoon
        onClick={() => setTheme("dark")}
        size={22}
        tabIndex={0}
        onKeyDown={handleKeyPress}
        className="icon-accent cursor-pointer drop-shadow-lg"
      />
    );
  }
}


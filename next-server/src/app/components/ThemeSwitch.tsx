"use client";
import { FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const handleKeyPress = (e: any) => {
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
    return (
      <FiSun
        onClick={() => setTheme("light")}
        size={22}
        tabIndex={0}
        onKeyDown={handleKeyPress}
        className="
          cursor-pointer 
          drop-shadow-lg 
          dark:text-slate-200 
          text-neutral-950
        "
      />
    );
  }

  if (resolvedTheme === "light") {
    return (
      <FiMoon
        onClick={() => setTheme("dark")}
        size={22}
        tabIndex={0}
        onKeyDown={handleKeyPress}
        className="
          cursor-pointer 
          drop-shadow-lg 
          dark:text-slate-200 
          text-neutral-950
        "
      />
    );
  }
}

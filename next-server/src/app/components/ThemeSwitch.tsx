'use client'
import { FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Skeleton } from "@nextui-org/skeleton";
import { Card } from "@nextui-org/react";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

export default function ThemeSwitch() {
    const [ mounted, setMounted ] = useState(false);
    const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
    
    const handleKeyPress = (e: any) => {
        if(e.key !== 'Enter') return;

        if (resolvedTheme === 'dark') { 
            setTheme('light')
        } else {
            setTheme('dark')
        }
    };

    useEffect(() =>  {
        setMounted(true)
    }, []);

    if (!mounted) return (
        <ShapesSkeleton width="22px" height="22px" radius="sm" />
    )

    if (resolvedTheme === 'dark') {
        return <FiSun 
                    onClick={() => setTheme('light')} 
                    size={22} 
                    tabIndex={0}
                    onKeyDown={handleKeyPress}
                    className="cursor-pointer"
                />
    }

    if (resolvedTheme === 'light') {
        return <FiMoon 
                    onClick={() => setTheme('dark')}  
                    size={22}
                    tabIndex={0}
                    onKeyDown={handleKeyPress}
                    className="cursor-pointer"
                />
    }
};
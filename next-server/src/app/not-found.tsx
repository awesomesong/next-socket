'use client';
import { Button } from '@heroui/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
 
export default function NotFound() {
    const router = useRouter();
    return (
        <div className='
                flex 
                flex-col 
                justify-center 
                items-center 
                h-screen
            '>
            <h2 className='sr-only'>Not Found Page</h2>
            <div className='relative w-[300px] h-[300px]'>
                <Image 
                    src='/image/404_not_found.png'
                    alt=''
                    fill
                    unoptimized={true}
                    priority={true}
                    className="object-contain"
                />
            </div>

            <Button 
                onPress={() => router.back()}
                radius="full" 
                className="
                    mt-5
                    px-8
                    text-lg
                    bg-gradient-to-tr 
                    from-pink-500 
                    to-yellow-500 
                    text-white 
                    shadow-lg
                "
            >
                뒤로 이동하기
            </Button>
        </div>
    )
}
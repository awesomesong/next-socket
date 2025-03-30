import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '../src/app/lib/session'
import ButtonLogout from './ButtonLogout';
import ThemeSwitch from './ThemeSwitch';
import Navigation from './navigation/Navigation';
import ButtonLogin from './ButtonLogin';
import ButtonProfile from './ButtonProfile';

export const Header = async () => {
    const user = await getCurrentUser();

    return (
        <header className='
            shrink-0
            sticky 
            top-0 
            z-50
            h-[92px]
            px-4
            md:px-8
            bg-default/10 
            backdrop-blur-md
            shadow-sm
        '>
            <div className='
                flex 
                justify-between 
                items-center 
                max-w-[1440px]
                mx-auto
                h-full
                text-lg
            '>
                <div className='
                    flex
                    flex-row
                    items-center
                    flex-1
                    max-md:flex-row-reverse
                    max-md:justify-end
                    max-md:gap-4
                '>
                    <h1 className='shrink-0'>
                        <Link 
                            href="/"
                        >
                            <Image 
                                src='/image/songhee_logo.png'
                                alt='송희 로고'
                                width='78'
                                height='66'
                                priority={true}
                            />
                        </Link>
                    </h1>
                    <Navigation />
                </div>
                <ul className='
                        flex 
                        flex-row 
                        items-center 
                        justify-end
                        space-x-3 
                        md:min-w-[121px]
                    '>
                    {user?.name ? (
                        <>
                            <li className='flex'>
                                <ButtonProfile />
                            </li>
                            <li>
                                <ButtonLogout />
                            </li>
                        </>
                    ) : (
                        <li>
                            <ButtonLogin />
                        </li>
                    )}
                    <li>
                        <ThemeSwitch />
                    </li>
                </ul>
            </div>
        </header>
        /*
            <nav className='flex flex-col p-2 max-w-5xl mx-auto'>
                <h1 className='text-5xl  text-center'>
                    Top{" "}
                    <span className='text-nxl  text-center'>
                        Books{" "}
                    </span>
                    of All Time
                </h1>
            </nav>
        */
    )
}

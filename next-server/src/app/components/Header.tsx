import AnimatedLogo from './AnimatedLogo';
import { getCurrentUser } from '../lib/session'
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
            h-[var(--header-height)]
            box-border
            px-4
            md:px-8
            py-2
        '>
            {/* iOS Status Bar Tap-to-top bug fix: separate backdrop layer */}
            <div className='
                absolute
                inset-0
                -z-10
                bg-[var(--header-bg)]
                backdrop-blur-md
                header-border-b
                pointer-events-none
            '></div>
            <div className='
                flex 
                justify-between 
                items-center 
                max-w-[1440px]
                mx-auto
                h-full
                text-sm
                md:text-base
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
                    <AnimatedLogo />
                    <Navigation />
                </div>
                <ul className='
                        flex 
                        flex-row 
                        items-center 
                        justify-end
                        space-x-3
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
    )
}

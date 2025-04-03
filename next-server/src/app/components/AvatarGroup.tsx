"use client";
import { IUserList } from "@/src/app/types/common";
import clsx from "clsx";
import { PiUserCircleDuotone } from "react-icons/pi";
import FallbackNextImage from "./FallbackNextImage";

interface AvatarGroupProps {
    users?: IUserList[];
}

const AvatarGroup:React.FC<AvatarGroupProps> = ({
    users = []
}) => {
    const usersLength = Object.keys(users).length;
    const usersLimitNum = usersLength > 3 ? 4 : usersLength;
    const sliceUsers = users.slice(0, usersLimitNum);
    const positonMap3 = {
        0: 'top-0 left-[9px]',
        1: 'bottom-0',
        2: 'bottom-0 right-0'
    };
    const positonMap4 = {
        0: 'top-0',
        1: 'top-0 right-0',
        2: 'bottom-0',
        3: 'bottom-0 right-0'
    };

    return (
        <div className={clsx(`
            shrink
            relative
            w-10 
            h-10
        `)}>
            {sliceUsers.map((user, i) => (
                <div
                    key={user.id}
                    className={clsx(`
                        flex
                        justify-center
                        items-center
                        overflow-hidden
                        absolute
                        w-[22px]
                        h-[22px]
                        rounded-full
                        ring-1
                        ring-insert
                        ring-white
                        dark:ring-0
                    `,
                    usersLimitNum === 3 && positonMap3[i as keyof typeof positonMap3],
                    usersLimitNum === 4 && positonMap4[i as keyof typeof positonMap4]
                )}>
                    {user.image ? (
                        <FallbackNextImage
                            alt="단체 대화방 이미지"
                            src={user?.image}
                            fill
                            sizes="2rem"
                            unoptimized={false}
                            className="object-cover"
                        />
                    ) : <PiUserCircleDuotone className="scale-[1.2]" size={22}/>}
                </div>
            ))}
        </div>
    )
}

export default AvatarGroup;

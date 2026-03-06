
const ProfileModalSkeleton = () => {
    return (
        <div className="profile-modal__container skeleton-pulse">
            <div className="avatar-block__container">
                {/* Direct sizing to ensure roundness and visibility without .avatar-block__box interference */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full skeleton-bg" />
            </div>
            <div className="profile-info-wrap">
                <div className="profile-identity">
                    <div className="w-32 h-8 skeleton-bg rounded-xl" />
                    <div className="w-16 h-4 skeleton-bg-muted rounded-full" />
                </div>
                {/* Simplified to a single content block as requested */}
                <div className="w-full h-[168px] skeleton-bg-muted-80 rounded-2xl" />
            </div>
        </div>
    );
};

export default ProfileModalSkeleton;

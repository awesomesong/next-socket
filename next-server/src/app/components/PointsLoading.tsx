type PointsLoadingProps = {
    loadingMessage: string;
}

const PointsLoading = ({loadingMessage}: PointsLoadingProps) => {
    return(
        <div className="
            flex
            items-center
            justify-center
            fixed
            top-0
            bottom-0
            left-0
            right-0
            z-[500]
            bg-neutral-700/[.60]
            dark:bg-neutral-900/[.90]
        ">
            <div className="flex flex-col gap-6">
                <div className="container">
                    <div className="ball"></div>
                    <div className="ball"></div>
                    <div className="ball"></div>
                    <div className="ball"></div>
                    <div className="ball"></div>
                </div>
                <div className="text-center text-lg">
                    {loadingMessage}
                </div>
            </div>
        </div>
    )
}
export default PointsLoading;

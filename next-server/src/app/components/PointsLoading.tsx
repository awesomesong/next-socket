type PointsLoadingProps = {
    loadingMessage: string;
}

const PointsLoading = ({loadingMessage}: PointsLoadingProps) => {
    return (
        <div className="flex flex-col items-center justify-center gap-5 fixed inset-0 z-[500] points-loading-overlay">
            <div className="points-loading-balls">
                <div className="ball"></div>
                <div className="ball"></div>
                <div className="ball"></div>
                <div className="ball"></div>
                <div className="ball"></div>
            </div>
            <p className="text-center text-lg points-loading-text">
                {loadingMessage}
            </p>
        </div>
    )
}
export default PointsLoading;

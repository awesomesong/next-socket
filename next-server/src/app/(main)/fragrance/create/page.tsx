import FormFragrance from '@/src/app/components/FormFragrance';

const FragranceCreatePage = () => {
    return (
        <div className='px-4 pt-8 pb-4 md:p-8 max-w-[1440px] mx-auto min-h-screen'>
            <h2 className="text-top">
                <span className="text-gradient-scent text-center">향수 정보 추가</span>
            </h2>
            <FormFragrance isEdit={false} />
        </div>
    );
};

export default FragranceCreatePage;

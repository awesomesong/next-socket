'use client'
import AIChatButton from './AIChatButton';

type messageProps = {
  message: string;
}

const EmptyState = ({ message }: messageProps) => {
  return (
    <div 
        className="
          sm:px-6
          h-full
          flex
          justify-center
          items-center 
          px-8
        ">
        <div className='flex flex-col item-center text-center'>
            <h3 
                className='
                    mt-2
                    text-2xl
                    font-semibold
                '
            >
                {message}
            </h3>
            <div className="flex flex-col items-center">
              <h3 className="text-lg text-neutral-700 dark:text-neutral-400 mt-4 mb-2">
                  아래 버튼을 클릭해서, 하이트진로 AI와 대화를 시작해보세요.
              </h3>
              <div className="flex justify-center">
                <AIChatButton aiAgentType="assistant" />
              </div>
            </div>
        </div>
      </div>
  )
}

export default EmptyState;

'use client'
import clsx from 'clsx';
import AIChatButton from './AIChatButton';

type messageProps = {
  message: string;
  isError?: boolean;
}

const EmptyState = ({ message, isError }: messageProps) => {
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
        <h3 className='
            text-gradient-scent
            mt-2
            text-2xl
            font-semibold
          '
        >
          {message}
        </h3>
        <div className={clsx(
          "flex flex-col items-center",
          isError && "hidden"
        )}>
          <h3 className="mt-4 mb-2 text-lg text-secondary">
            아래 버튼을 클릭해서, 향수 AI와 대화를 시작해보세요.
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

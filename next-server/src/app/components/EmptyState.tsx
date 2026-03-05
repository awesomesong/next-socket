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
      <div className="flex flex-col items-center text-center">
        <h3 className="text-gradient-scent font-semibold tracking-wide text-xl">
          {message}
        </h3>
        <div className={clsx(
          "flex flex-col items-center w-full",
          isError && "hidden"
        )}>
          <p className="mt-2 mb-4 text-base text-[var(--scent-gradient-mid)] tracking-wide">
            아래 버튼을 클릭해서, 향수 AI와 대화를 시작해보세요.
          </p>
          <div className="flex justify-center">
            <AIChatButton aiAgentType="assistant" />
          </div>
          <div className="line-gradient-deco mt-5 w-24" aria-hidden />
        </div>
      </div>
    </div>
  )
}

export default EmptyState;

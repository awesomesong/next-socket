'use client'
import React, { memo } from 'react'

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
        </div>
      </div>
  )
}

export default memo(EmptyState);

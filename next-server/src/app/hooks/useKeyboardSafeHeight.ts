import { useEffect, useState } from 'react'

/**
 * 모바일 키보드가 화면을 가리지 않도록
 * 현재 visualViewport의 height를 기준으로 safe height를 반환합니다.
 * 
 * 기본적으로 키보드 올라왔을 때 height를 줄이고, 키보드가 사라지면 다시 원래 크기로 돌아갑니다.
 */
export function useKeyboardSafeHeight(offset: number = 0): number | null {
  const [safeHeight, setSafeHeight] = useState<number | null>(null)

  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport?.height
      if (vh) {
        setSafeHeight(vh - offset)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight)
      window.visualViewport.addEventListener('scroll', updateHeight) // 키보드 애니메이션 중 위치 바뀔 수 있음
    }

    updateHeight()

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight)
        window.visualViewport.removeEventListener('scroll', updateHeight)
      }
    }
  }, [offset])

  return safeHeight
}

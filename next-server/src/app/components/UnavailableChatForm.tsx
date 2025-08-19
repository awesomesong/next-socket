import { FiAlertTriangle } from "react-icons/fi"


const UnavailableChatForm = () => {
  return (
    <div className="
      flex 
      justify-center
      items-center
      gap-2
      py-4
      bg-white
      dark:bg-neutral-900
    ">
      <div className="
            flex
            justify-center
            items-center
            flex-shrink-0
            w-8
            h-8
            bg-red-100
            rounded-full
      ">
        <FiAlertTriangle className="w-5 h-5 -mt-[2px] text-red-600" />
      </div>
      대화할 수 없는 사용자입니다.
    </div>
  )
}

export default UnavailableChatForm

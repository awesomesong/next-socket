import { PiUserCircleFill } from "react-icons/pi";
import FallbackNextImage from "./FallbackNextImage";

type Props = {
  image: string;
  name: string;
};

const AvatarWithName = ({ image, name }: Props) => {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="shrink-0 w-[30px] h-[30px]">
        {image ? (
          <span
            className="
              block
              overflow-hidden
              relative
              w-full
              h-full
              rounded-full
            "
          >
            <FallbackNextImage
              src={image}
              alt={name + " 이미지"}
              fill
              sizes="100%"
              unoptimized={false}
              className="object-cover"
            />
          </span>
        ) : (
          <PiUserCircleFill className="w-full h-full" />
        )}
      </span>
      {name}
    </span>
  );
};

export default AvatarWithName;

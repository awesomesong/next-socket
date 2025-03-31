'use client';

import Image from "next/image";
import Modal from "./Modal";

interface ImageModalProps {
    src: string;
    isOpen?: boolean;
    onClose: () => void;
}

const ImageModal:React.FC<ImageModalProps> = ({
    src,
    isOpen,
    onClose, 
}) => {

    return (
        <Modal
            isOpen={isOpen}
            onCloseModal={onClose}
        >
            <div className="w-full h-full">
                <Image 
                    alt="이미지"
                    src={src}
                    width={100}
                    height={100}
                    unoptimized={false}
                    style={{ height: '100%', width: '100%' }}
                    sizes="100vw"
                />
            </div>
        </Modal>
  )
}

export default ImageModal;

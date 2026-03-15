"use client";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { uploadFileToCloudinary } from "@/src/app/lib/uploadFileToCloudinary";
import { deleteImage } from "@/src/app/lib/deleteImage";

export type PreviewImage = { name: string; src: string; isNew?: boolean };

interface UseImageUploadOptions {
    isEdit: boolean;
    onImagesChange: (urls: string[]) => void;
    onUploadComplete?: (images: PreviewImage[]) => void;
}

export function useImageUpload({ isEdit, onImagesChange, onUploadComplete }: UseImageUploadOptions) {
    const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
    const [sliderIndex, setSliderIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const selectImage = useCallback((index: number) => {
        setSliderIndex(index);
    }, []);

    const initImages = useCallback((srcs: string[]) => {
        setPreviewImages(srcs.map((src) => ({ name: "Uploaded Image", src, isNew: false })));
        setSliderIndex(0);
    }, []);

    // 상태 업데이터 외부에서 next 계산 + Promise.allSettled 병렬 업로드
    const processFiles = useCallback(async (files: FileList | null) => {
        if (!files?.length) return;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (!imageFiles.length) {
            toast.error("이미지 파일만 업로드할 수 있습니다.");
            return;
        }

        setIsUploading(true);
        try {
            const results = await Promise.allSettled(
                imageFiles.map((file) =>
                    uploadFileToCloudinary(file).then((result) => {
                        if ("error" in result) throw new Error(result.error);
                        return { src: result.url, name: file.name, isNew: true };
                    })
                )
            );

            const uploadedList: PreviewImage[] = [];
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    uploadedList.push(result.value);
                } else {
                    toast.error(result.reason?.message || "이미지 업로드에 실패했습니다.");
                }
            });

            if (uploadedList.length) {
                const next = [...previewImages, ...uploadedList];
                setPreviewImages(next);
                setSliderIndex(next.length - 1);
                onImagesChange(next.map((i) => i.src));
                if (uploadedList.length > 1) {
                    toast.success(`총 ${uploadedList.length}개 이미지를 업로드했습니다. (첫 번째가 대표 이미지)`);
                }
                onUploadComplete?.(uploadedList);
            }
        } finally {
            setIsUploading(false);
        }
    }, [previewImages, onImagesChange, onUploadComplete]);

    const handleDeleteImage = useCallback(async (index: number) => {
        if (index < 0 || index >= previewImages.length) return;
        const item = previewImages[index];

        if (!isEdit || item.isNew) {
            const success = await deleteImage(item.src);
            if (!success) {
                toast.error("이미지 삭제에 실패하였습니다.");
                return;
            }
        }

        const next = previewImages.filter((_, i) => i !== index);
        const newIndex = Math.min(sliderIndex, Math.max(0, next.length - 1));
        setPreviewImages(next);
        setSliderIndex(newIndex);
        onImagesChange(next.map((i) => i.src));
    }, [previewImages, sliderIndex, isEdit, onImagesChange]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, isDisabled: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isDisabled) return;
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    return {
        previewImages,
        sliderIndex,
        isDragging,
        isUploading,
        selectImage,
        initImages,
        processFiles,
        handleDeleteImage,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}

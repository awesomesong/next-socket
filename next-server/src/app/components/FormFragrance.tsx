"use client";
import { useState, ChangeEvent, FormEvent, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { FormSubmitActions } from "./Button";
import { ImFilesEmpty } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import toast from "react-hot-toast";

import { createFragrance } from "@/src/app/lib/createFragrance";
import { updateFragrance } from "@/src/app/lib/updateFragrance";
import { checkFragranceSlugExists } from "@/src/app/lib/getFragrances";
import { fragranceDetailKey, prependFragranceCard, upsertFragranceCardById } from "@/src/app/lib/react-query/fragranceCache";
import { useImageUpload, type PreviewImage } from "@/src/app/lib/useImageUpload";
import { analyzeFragranceImage } from "@/src/app/lib/analyzeFragranceImage";
import { validateFragranceContent } from "@/src/app/lib/validateFragranceContent";
import type { FragranceType } from "@/src/app/types/fragrance";
import PointsLoading from "./PointsLoading";
import TextField, { formClassNames } from "./TextField";
import { HiSparkles } from "react-icons/hi2";
import ImageSlider from "./ImageSlider";
import ImageModal from "./ImageModal";

const ACCEPT_IMAGE = "image/jpeg,image/jpg,image/png,image/gif,image/webp";

type FormFragranceProps =
    | { isEdit: false; id?: undefined; initialData?: undefined }
    | { isEdit: true; id: string; initialData: FragranceType };

const InitFragranceData = {
    brand: '',
    name: '',
    slug: '',
    images: [] as string[],
    description: '',
    notes: '',
};

const FormFragrance = ({ id, isEdit, initialData }: FormFragranceProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [formData, setFormData] = useState(InitFragranceData);
    const [brandError, setBrandError] = useState('');
    const [slugError, setSlugError] = useState('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const formDataRef = useRef(formData);
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    const handleAnalyzeImage = useCallback(async (src: string) => {
        if (!src) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeFragranceImage(src);
            if (!result) {
                toast.error("AI 분석에 실패했습니다.");
                return;
            }
            if (!result.isFragrance) {
                toast.error("향수 이미지가 아닙니다. 향수 제품 사진을 업로드해주세요.");
                return;
            }
            setFormData((prev) => ({
                brand: result.brand && !prev.brand ? result.brand.toUpperCase() : prev.brand,
                name: result.name && !prev.name ? result.name : prev.name,
                slug: result.slug && !prev.slug ? result.slug : prev.slug,
                images: prev.images,
                description: result.description && !prev.description ? result.description : prev.description,
                notes: result.notes && !prev.notes ? result.notes : prev.notes,
            }));
            toast.success("AI가 향수 정보를 자동으로 입력했습니다.", { icon: "✨" });
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    /** 업로드 직후 자동 AI 분석: 신규 등록이고 모든 입력이 비어 있을 때만, 새로 올라온 이미지 중 첫 번째로 1회만 분석 */
    const onUploadComplete = useCallback(
        (uploadedList: PreviewImage[]) => {
            if (uploadedList.length === 0) return;
            if (isEdit) return;
            const fd = formDataRef.current;
            const hasInput =
                (fd.brand ?? "").trim() ||
                (fd.name ?? "").trim() ||
                (fd.slug ?? "").trim() ||
                (fd.description ?? "").trim() ||
                (fd.notes ?? "").trim();
            if (hasInput) return;
            handleAnalyzeImage(uploadedList[0].src);
        },
        [isEdit, handleAnalyzeImage]
    );

    const {
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
    } = useImageUpload({
        isEdit,
        onImagesChange: (urls) => setFormData((prev) => ({ ...prev, images: urls })),
        onUploadComplete,
    });

    useEffect(() => {
        if (!initialData) return;
        setFormData({
            brand: initialData.brand,
            name: initialData.name,
            slug: initialData.slug,
            images: initialData.images,
            description: initialData.description,
            notes: initialData.notes ?? '',
        });
        if (initialData.images?.length) {
            initImages(initialData.images);
        }
    }, [initialData, initImages]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'brand') {
            const hasKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(value);
            const filtered = value.replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').toUpperCase();
            setBrandError(hasKorean ? '브랜드는 영문으로만 입력해주세요.' : '');
            setFormData(prev => ({ ...prev, brand: filtered }));
            return;
        }
        if (name === 'slug') {
            setSlugError('');
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSlugBlur = useCallback(async () => {
        const slug = formDataRef.current.slug;
        if (!slug) return;
        try {
            const { exists, id: existingId } = await checkFragranceSlugExists(slug);
            if (!exists) return;
            // 수정 모드에서 자기 자신의 슬러그인 경우 중복 아님
            if (isEdit && id && existingId === Number(id)) return;
            setSlugError('이미 사용 중인 슬러그입니다. 다른 슬러그를 입력해주세요.');
        } catch {
            // 네트워크 오류는 무시 (submit 시 서버에서 검증)
        }
    }, [isEdit, id]);

    const handleFileInputChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            processFiles(e.target.files);
            e.target.value = "";
        },
        [processFiles]
    );

    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.images.length) {
            return toast.error("향수 이미지를 업로드해주세요.");
        }
        if (!formData.brand) {
            return toast.error("향수 브랜드를 입력해주세요.");
        }
        if (!formData.name) {
            return toast.error("향수 이름을 입력해주세요.");
        }
        if (!formData.slug) {
            return toast.error("URL 슬러그를 입력해주세요.");
        }
        if (slugError) {
            return toast.error(slugError);
        }
        if (!formData.description) {
            return toast.error("향수 상세 설명을 입력해주세요.");
        }

        setIsValidating(true);
        try {
            const isFragrance = await validateFragranceContent(formData.description, formData.notes);
            if (!isFragrance) {
                toast.error("향수와 관련된 내용이 아닙니다. 향수 설명과 노트 정보를 올바르게 입력해주세요.");
                return;
            }
        } finally {
            setIsValidating(false);
        }

        setIsLoading(true);

        try {
            if (isEdit && id) {
                setLoadingMessage('향수 정보를 수정하고 있습니다.');
                const result = await updateFragrance(id, formData);
                if (result.success && result.updatedFragrance) {
                    upsertFragranceCardById(queryClient, result.updatedFragrance);
                    queryClient.invalidateQueries({ queryKey: fragranceDetailKey(id) });
                    toast.success("향수 정보가 수정되었습니다.");
                    router.push(`/fragrance/${result.updatedFragrance.slug}`);
                }
            } else {
                setLoadingMessage('새 향수를 등록하고 있습니다.');
                const result = await createFragrance(formData);
                if (result.success && result.newFragrance) {
                    prependFragranceCard(queryClient, result.newFragrance);
                    toast.success("향수가 등록되었습니다.");
                    router.push(`/fragrance/${result.newFragrance.slug}`);
                }
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "작업 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [formData, isEdit, id, queryClient, router, slugError]);

    const closeLightbox = useCallback(() => setIsLightboxOpen(false), []);

    const isDisabled = isLoading || isUploading || isAnalyzing || isValidating;

    return (
        <section className="product-layout">
            {isLoading && <PointsLoading loadingMessage={loadingMessage} />}

            <ImageModal
                src={previewImages[sliderIndex]?.src ?? ""}
                isOpen={isLightboxOpen && !!previewImages[sliderIndex]}
                onClose={closeLightbox}
                alt={previewImages[sliderIndex]?.name ?? "향수 이미지"}
            />

            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Column: Image Upload & Gallery */}
                <div className="fragrance-detail-image-box flex flex-col gap-8 w-full sm:flex-row lg:flex-col lg:mx-0 lg:flex-none lg:shrink-0 lg:w-auto sm:items-start lg:justify-start">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, isDisabled)}
                        className={clsx(
                            "fragrance-img-size transition-all duration-300 group mx-auto",
                            isDragging ? "bg-[#f1ecfe]/50 scale-[1.01]" : "bg-[#fffcfa] dark:bg-[#1a1425]"
                        )}
                    >
                        {isUploading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-white/90 dark:bg-[#1a1c23]/90 backdrop-blur-sm">
                                <div className="w-16 h-16 text-[#b094e0]">
                                    <progress className="pure-material-progress-circular w-full h-full" />
                                </div>
                                <p className="text-sm font-medium text-[#5c4a7a] dark:text-[#c8b4ff] tracking-widest uppercase">Uploading</p>
                            </div>
                        )}

                        {previewImages.length > 0 ? (
                            <ImageSlider
                                images={previewImages}
                                currentIndex={sliderIndex}
                                onSelectIndex={selectImage}
                                alt={formData.name}
                                onZoom={() => setIsLightboxOpen(true)}
                                showAnalyzeButton
                                onAnalyze={handleAnalyzeImage}
                                analyzeDisabled={isDisabled}
                                isAnalyzing={isAnalyzing}
                                variant="default"
                            />
                        ) : (
                            <button
                                type="button"
                                className="flex flex-col justify-center items-center gap-3 md:gap-6 w-full h-full border-2 border-dashed border-[#ede8f5] dark:border-[#c8b4ff40] rounded-[28px] bg-transparent text-[#b094e0] hover:bg-[#fafafc] dark:hover:bg-[#2d2040]/40 transition-colors duration-200 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isDisabled}
                            >
                                <div className="p-3 md:p-6 rounded-full bg-[#f8f6ff] dark:bg-[#2d2040] text-[#b094e0] dark:text-[#c8b4ff]">
                                    <ImFilesEmpty className="text-3xl md:text-5xl opacity-80" />
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-sm md:text-base font-light tracking-wide mb-1 dark:text-[#c8b4ff]">향수 이미지 업로드</p>
                                    <p className="text-[10px] opacity-70 dark:opacity-70 text-[#5c4a7a] dark:text-[#c8b4ff]">
                                        클릭하거나 이미지를 드래그하세요
                                        {!isEdit && <><br />첫 이미지는 AI가 자동으로 분석합니다</>}
                                    </p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* 640px~1023px: 업로드 오른쪽에 배치, 1024px+ 에서는 아래로 */}
                    <div className="flex flex-col gap-6 sm:flex-grow w-full sm:w-auto lg:w-full shrink-0 min-w-0">
                        <div className="flex justify-between items-end border-b border-[#ede8f5] dark:border-[#c8b4ff30] pb-2">
                        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[#b094e0] font-bold">등록된 이미지</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPT_IMAGE}
                            multiple
                            className="hidden"
                            onChange={handleFileInputChange}
                            disabled={isDisabled}
                        />
                        <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] uppercase tracking-widest text-[#5c4a7a] dark:text-[#c8b4ff] hover:text-[#b094e0] transition-colors font-medium"
                        >
                            {isUploading ? "이미지 업로드 중" : "+ 이미지 추가"}
                        </button>
                    </div>

                    <ul className="grid grid-cols-4 gap-3">
                        {previewImages.map((img, i) => (
                            <li
                                key={img.src}
                                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${i === sliderIndex
                                    ? "border-[#c8b4ff] shadow-md scale-[1.08] z-10"
                                    : "border-transparent opacity-50 hover:opacity-100 hover:scale-[1.03]"
                                    }`}
                                onClick={() => selectImage(i)}
                            >
                                <Image
                                    src={img.src}
                                    alt={img.name}
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(i);
                                    }}
                                    className="absolute top-1 right-1 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    aria-label="Delete"
                                >
                                    <FaTrashAlt className="w-2.5 h-2.5" />
                                </button>
                            </li>
                            ))}
                    </ul>
                    </div>
                </div>

                {/* Right Column: Information Inputs */}
                <div className="flex-grow w-full flex flex-col gap-12">
                    {isAnalyzing && (
                        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#f1ecfe] dark:bg-[#2d2040]/60 border border-[#c8b4ff40]">
                            <HiSparkles className="text-[#b094e0] w-4 h-4 shrink-0 animate-pulse" />
                            <p className="text-[0.75rem] tracking-[0.15em] uppercase text-[#5c4a7a] dark:text-[#c8b4ff] font-medium">
                                AI가 이미지를 분석하고 있습니다.
                            </p>
                        </div>
                    )}
                    <div className="space-y-10">
                        {/* Primary Info Segment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <TextField
                                name="brand"
                                label="향수 브랜드"
                                placeholder="예: DIPTYQUE"
                                value={formData.brand}
                                onChange={handleChange}
                                isRequired
                                isInvalid={!!brandError}
                                errorMessage={brandError}
                                variant="underlined"
                                classNames={formClassNames.underlined}
                            />
                            <TextField
                                name="name"
                                label="향수 이름"
                                placeholder="예: Philosykos"
                                value={formData.name}
                                onChange={handleChange}
                                isRequired
                                variant="underlined"
                                classNames={formClassNames.underlined}
                            />
                        </div>

                        <TextField
                            name="slug"
                            label="URL 슬러그"
                            placeholder="예: diptyque_philosykos"
                            value={formData.slug}
                            onChange={handleChange}
                            onBlur={handleSlugBlur}
                            isRequired
                            isInvalid={!!slugError}
                            errorMessage={slugError}
                            variant="underlined"
                            description={slugError ? undefined : "브라우저 주소창에 사용됩니다. 소문자와 언더바(_)를 사용하세요."}
                            classNames={formClassNames.underlined}
                        />

                        <div className="space-y-10">
                            <TextField
                                name="description"
                                label="제품 상세 설명"
                                placeholder="향수에 대해서 공유하고 싶은 내용을 작성하세요."
                                minRows={6}
                                value={formData.description}
                                onChange={handleChange}
                                variant="underlined"
                                className="w-full"
                                classNames={formClassNames.textarea}
                            />

                            <TextField
                                name="notes"
                                label="노트 상세 정보"
                                placeholder={"예:\nTOP: 레몬\nHEART: 우드\nBASE: 머스크"}
                                minRows={4}
                                value={formData.notes}
                                onChange={handleChange}
                                variant="underlined"
                                className="w-full"
                                classNames={formClassNames.textarea}
                            />
                        </div>
                    </div>

                    {/* Submission Actions */}
                    <FormSubmitActions
                        submitLabel={isUploading ? "이미지 업로드 중" : isAnalyzing ? "이미지 AI 분석 중" : isValidating ? "향수 정보 확인 중" : isEdit ? "변경 사항 저장" : "향수 등록하기"}
                        submitDisabled={isDisabled}
                        onCancel={() => router.back()}
                    />
                </div>
            </form>
        </section>
    );
};

export default FormFragrance;

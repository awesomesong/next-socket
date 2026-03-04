"use client";
import {
  FormEvent,
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../context/socketContext";
import {
  prependNoticeCard,
  upsertNoticeCardById,
  noticeDetailKey,
} from "@/src/app/lib/react-query/noticeCache";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { NoticeProps, CreateNoticeResponse, UpdateNoticeResponse, NoticeDetailQueryData } from "@/src/app/types/notice";
import toast from "react-hot-toast";
import PointsLoading from "./PointsLoading";
import { FormSubmitActions } from "./Button";
import { uploadImage } from "@/src/app/lib/uploadImage";
import { deleteImage as deleteCloudinaryImage } from "@/src/app/lib/deleteImage";
import { createNotice } from "@/src/app/lib/createNotice";
import { updateNotice } from "@/src/app/lib/updateNotice";
import MyQuillEditor from "./QuillEditor";
import ReactQuillOriginal from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type FormNoticeProps = {
  id?: string;
  initialData?: NoticeProps;
  isEdit: boolean;
};

type ImageProps = {
  index: number;
  url: string;
};

const inputClass = `w-full py-2 px-3 border border-gray-300 rounded-md bg-transparent
                    focus:outline-none focus:ring focus:border-blue-300`;

// Fix 5: 컴포넌트 외부 상수 (매 렌더마다 재생성 방지)
const FOLDER_NAME = "notices";

// Fix 3: useMemo 대신 모듈 레벨 순수 함수 (클로저 의존성 없음)
const extractImageUrls = (htmlContent: string) => {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const imageUrls: string[] = [];
  let regexMatch;

  while ((regexMatch = imgRegex.exec(htmlContent)) !== null) {
    imageUrls.push(regexMatch[1]);
  }

  return imageUrls.map((url, i) => ({ index: i, url }));
};

// Fix 7: 의존성 없는 배열이므로 컴포넌트 외부 상수
const formats = [
  "header", "bold", "italic", "underline", "strike", "blockquote",
  "align", "list", "color", "background",
  "link", "image", "code-block",
];

const validateNoticeData = (title: string, content: string, images: ImageProps[]): string | null => {
  if (title.trim() === "") {
    return "제목을 작성해주세요.";
  }

  const isEmpty = content.replace(/<(.|\n)*?>/g, "").trim().length === 0;
  if (isEmpty && images.length === 0) {
    return "글의 내용을 작성하거나 이미지를 첨부해주세요.";
  }

  return null;
};

const hasNoticeChanges = (
  title: string,
  content: string,
  images: ImageProps[],
  imageDelete: ImageProps[],
  initialData?: NoticeProps
): boolean => {
  if (!initialData) return true;

  const prevTitle = initialData.title || "";
  const prevContent = initialData.content || "";
  const prevImages = initialData.image?.length
    ? initialData.image.map((url, i) => ({ index: i, url }))
    : [];

  const currentImagesUrls = images.map(img => img.url).sort().join(",");
  const prevImagesUrls = prevImages.map((img: ImageProps) => img.url).sort().join(",");

  const hasContentChanged = content !== prevContent;
  const hasImagesChanged = currentImagesUrls !== prevImagesUrls || imageDelete.length > 0;

  return title !== prevTitle || hasContentChanged || hasImagesChanged;
};

export const FormNotice = ({ id, initialData, isEdit }: FormNoticeProps) => {
  const router = useRouter();
  const initialDataImage: ImageProps[] = useMemo(() => {
    if (!initialData?.image || initialData.image.length === 0) return [];
    return initialData.image.map((url, i) => ({ index: i, url }));
  }, [initialData?.image]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setloadingMessage] = useState("");
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [content, setContent] = useState<string>(initialData?.content || "");
  const [images, setImages] = useState<ImageProps[]>(initialDataImage);
  const [imageDelete, setImageDelete] = useState<ImageProps[]>([]);
  const isNavigating = useRef(false);
  const formTitle = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuillOriginal>(null);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // initialData 변경 시 상태 동기화
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");

      const newInitialImages = initialData.image?.length
        ? initialData.image.map((url, i) => ({ index: i, url }))
        : [];

      setImages(newInitialImages);
      setImageDelete([]);
    }
  }, [initialData]);

  // 이미지 업로드 핸들러
  const imageHandler = useCallback(() => {
    if (status === "unauthenticated") {
      return toast.error("로그인 후 이미지를 업로드할 수 있습니다.");
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      if (input?.files?.[0]) {
        try {
          setIsLoading(true);
          setloadingMessage("이미지 업로드 중입니다.");

          const file = input.files[0];
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ];

          if (!allowedTypes.includes(file.type)) {
            throw new Error("이미지 파일만 업로드 가능합니다.");
          }

          // Fix 5: folderName 변수 대신 모듈 상수 FOLDER_NAME 사용
          const { url, message } = await uploadImage(file, FOLDER_NAME);
          if (!url) {
            toast.error(message ?? "이미지 업로드에 실패했습니다.");
            return;
          }
          toast.success(message ?? "이미지 업로드에 성공했습니다.");

          const editor = quillRef?.current?.getEditor();
          if (editor) {
            const range = editor.getSelection(true);
            const index = range ? range.index : 0;

            editor.insertEmbed(index, "image", url, "user");
            editor.setSelection(index + 1);

            setImages((prevImages) => {
              if (prevImages.some((img) => img.url === url)) {
                return prevImages;
              }
              return [...prevImages, { index, url }];
            });
          }
        } catch {
          toast.error(
            "이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.",
          );
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, [status]); // Fix 5: folderName 의존성 제거 (FOLDER_NAME은 모듈 상수)

  // Fix 6: try/catch 추가로 deleteCloudinaryImage throw 시 unhandled rejection 방지
  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    if (!url) return false;
    try {
      const result = await deleteCloudinaryImage(url);

      if (result) {
        setImages((prev) => prev.filter((image) => image.url !== url));
        setImageDelete((prev) => prev.filter((image) => image.url !== url));
        return true;
      } else {
        toast.error("이미지 삭제 중 오류가 발생하였습니다.");
        return false;
      }
    } catch {
      toast.error("이미지 삭제 중 오류가 발생하였습니다.");
      return false;
    }
  }, []);

  // Quill link handler - 절대 URL로 변환
  const linkHandler = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    if (range) {
      const url = prompt("링크 URL을 입력하세요:");
      if (url) {
        let finalUrl = url.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`;
        }
        editor.formatText(range.index, range.length, 'link', finalUrl);
      }
    }
  }, []);

  // Quill modules 설정
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ align: ["justify", "center", "right"] }],
          [{ color: [] }, { background: [] }],
          ["link", "image", "code-block"],
        ],
        handlers: {
          image: imageHandler,
          link: linkHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
      history: {
        delay: 2000,
        maxStack: 50,
        userOnly: true,
      },
    }),
    [imageHandler, linkHandler],
  );

  // Fix 4: quillRef 대신 content 상태를 단일 소스로 사용
  const handleSubmitOrEdit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Fix 4: quillRef.current?.getEditor()?.root.innerHTML 대신 content 상태 사용
    const imagesToSave = extractImageUrls(content);

    const validationError = validateNoticeData(title, content, imagesToSave);
    if (validationError) {
      toast.error(validationError);
      if (validationError.includes("제목")) {
        formTitle.current?.focus();
      } else {
        quillRef.current?.focus();
      }
      return;
    }

    if (isEdit && !hasNoticeChanges(title, content, images, imageDelete, initialData)) {
      toast.error("변경된 내용이 없습니다.");
      return;
    }

    setIsLoading(true);
    setloadingMessage(isEdit ? "수정한 글을 저장하고 있습니다." : "작성한 글을 저장하고 있습니다.");

    try {
      const requestData = {
        title,
        content,
        image: imagesToSave.map((img) => img.url),
      };

      let result: CreateNoticeResponse | UpdateNoticeResponse;
      if (isEdit) {
        result = await updateNotice(id!, requestData);
      } else {
        result = await createNotice(requestData);
      }

      if (result.success) {
        if (isEdit) {
          const updateResult = result as UpdateNoticeResponse;
          await Promise.all(imageDelete.map((img) => deleteImage(img.url)));

          const finalImages = images.filter(img =>
            !imageDelete.some(deletedImg => deletedImg.url === img.url)
          );

          const existingCache = queryClient.getQueryData(noticeDetailKey(String(updateResult.updateNotice!.id))) as NoticeDetailQueryData;
          const updatedNotice = {
            ...updateResult.updateNotice,
            content: updateResult.updateNotice!.content,
            image: updateResult.updateNotice!.image,
            author: existingCache?.notice?.author || {
              name: session?.user?.name ?? "",
              email: session?.user?.email ?? "",
              image: session?.user?.image ?? null,
            },
            viewCount: existingCache?.notice?.viewCount || 0,
            _count: existingCache?.notice?._count || { comments: 0 },
          };

          upsertNoticeCardById(queryClient, {
            id: updateResult.updateNotice!.id,
            title: updateResult.updateNotice!.title,
            image: updateResult.updateNotice!.image,
          });

          queryClient.setQueryData(noticeDetailKey(String(updateResult.updateNotice!.id)), {
            notice: updatedNotice,
          });

          socket?.emit(SOCKET_EVENTS.NOTICE_UPDATED, {
            notice: {
              id: updateResult.updateNotice!.id,
              title: updateResult.updateNotice!.title,
              image: updateResult.updateNotice!.image,
              content,
            },
          });

          setImages(finalImages);
          setImageDelete([]);
          router.push(`/notice/${updateResult.updateNotice!.id}`);
        } else {
          const createResult = result as CreateNoticeResponse;

          const newNoticeData = {
            id: createResult.newNotice!.id,
            title: createResult.newNotice!.title,
            image: createResult.newNotice!.image,
            createdAt: createResult.newNotice!.createdAt,
            author: {
              name: session?.user?.name ?? "",
              image: session?.user?.image ?? null,
            },
            _count: { comments: 0 },
            viewCount: 0,
          };

          prependNoticeCard(queryClient, newNoticeData);

          socket?.emit(SOCKET_EVENTS.NOTICE_NEW, { notice: newNoticeData });

          setImages([]);
          setImageDelete([]);
          router.replace(`/notice/${createResult.newNotice!.id}`);
        }

        toast.success(result.message!);
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "에러가 발생하였습니다. 다시 시도해주세요.";
      if (errorMessage.includes("권한")) {
        router.push("/notice");
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    content, // Fix 4: content 추가 (quillRef 대체)
    images,
    imageDelete,
    isEdit,
    initialData,
    deleteImage,
    queryClient,
    session?.user,
    socket,
    router,
    id,
    // Fix 3: extractImageUrls 제거 (모듈 레벨 함수로 이동)
  ]);

  // Fix 2: create 모드에서 imageDelete가 아닌 images 상태의 이미지를 정리
  // (create 모드에서 편집 중 삭제된 이미지는 즉시 Cloudinary에서 삭제되므로
  //  imageDelete는 항상 비어있음 → 페이지 이탈 시 남아있는 images를 정리해야 함)
  const resetImage = useCallback(async () => {
    if (!isEdit && images.length > 0) {
      await Promise.all(images.map((img) => deleteImage(img.url)));
    }
  }, [isEdit, images, deleteImage]);

  // Fix 1: quillRef.current(non-reactive) 대신 content 상태(reactive) 사용
  const isDirtyState = useMemo(() => {
    const isTitleDirty = title !== (initialData?.title || "");
    const isContentDirty = content !== (initialData?.content || "");

    const currentImageUrlsInEditor = extractImageUrls(content).map(img => img.url);
    const initialImageUrls = initialDataImage.map((img) => img.url);

    const currentImageSet = new Set(currentImageUrlsInEditor);
    const initialImageSet = new Set(initialImageUrls);

    const isImagesDirty =
      currentImageSet.size !== initialImageSet.size ||
      [...currentImageSet].some(url => !initialImageSet.has(url)) ||
      imageDelete.length > 0;

    return isTitleDirty || isContentDirty || isImagesDirty;
  }, [
    title,
    content, // Fix 1: content 추가 (quillRef 대체)
    imageDelete.length,
    initialData?.title,
    initialData?.content,
    initialDataImage,
    // Fix 3: extractImageUrls 제거 (모듈 레벨 함수로 이동)
  ]);

  // 브라우저 뒤로가기/새로고침 시 dirty 상태 경고
  useEffect(() => {
    const isFirstEntry =
      window.history.state === null ||
      window.history.state.isDummy === undefined;
    if (isFirstEntry) {
      history.replaceState({ isDummy: true }, "", location.href);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyState) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      if (!isDirtyState || isNavigating.current) return;

      const confirmLeave = window.confirm(
        "작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?",
      );

      if (!confirmLeave) {
        history.pushState({ isDummy: true }, "", location.href);
      } else {
        isNavigating.current = true;
        resetImage();
        history.go(-1);
        // Fix 8: 네비게이션 실패 시를 대비해 플래그 리셋 (history.go(-1)은 비동기)
        setTimeout(() => { isNavigating.current = false; }, 100);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirtyState, resetImage]);

  // 내부 링크 클릭 또는 외부 이미지 클릭 시 dirty 상태 경고
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isInsideQuillEditorUI = !!target.closest(
        ".ql-toolbar, .ql-tooltip, .ql-container",
      );
      if (isInsideQuillEditorUI) return;

      const isSubmitButton = target.closest(
        'button[type="submit"], form button',
      );
      if (isSubmitButton) return;

      const linkElement = target.closest("a");
      const isImageClicked = target instanceof HTMLImageElement;

      if (!isDirtyState) return;

      if (
        linkElement ||
        (isImageClicked && !images.some((img) => target.src.includes(img.url)))
      ) {
        const confirmLeave = window.confirm(
          "작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?",
        );
        if (!confirmLeave) {
          e.preventDefault();
          history.pushState(null, "", location.href);
        } else {
          resetImage();

          if (linkElement) {
            e.preventDefault();
            window.location.href = linkElement.href;
          }
        }
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [isDirtyState, images, resetImage]);

  // handleTextChange - DOM 조작 없이 정규식으로 이미지 URL 추출
  const handleTextChange = useCallback((_delta: unknown, _oldDelta: unknown, source: string) => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    if (source === "user") {
      const currentContent = editor.root.innerHTML;

      const currentImageUrlsInContent = extractImageUrls(currentContent).map(img => img.url);
      const currentImageSet = new Set(currentImageUrlsInContent);

      const removedImagesFromEditor = images.filter(
        (img) => !currentImageSet.has(img.url),
      );

      if (removedImagesFromEditor.length > 0) {
        removedImagesFromEditor.forEach((deletedImg) => {
          if (!isEdit) {
            deleteImage(deletedImg.url);
          } else {
            setImageDelete((prev) => {
              if (prev.some((img) => img.url === deletedImg.url)) {
                return prev;
              }
              return [...prev, deletedImg];
            });
          }
        });
      }

      setImages((prev) => {
        const updatedImages: ImageProps[] = [];
        currentImageUrlsInContent.forEach((url, i) => {
          const existingImg = prev.find((img) => img.url === url);
          updatedImages.push({
            index: existingImg ? existingImg.index : i,
            url,
          });
        });
        return updatedImages;
      });
    }
  }, [images, isEdit, deleteImage]); // Fix 3: extractImageUrls 의존성 제거 (모듈 레벨 함수)

  // Quill 'text-change' 이벤트 리스너 등록
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    editor.on("text-change", handleTextChange);

    return () => {
      editor.off("text-change", handleTextChange);
    };
  }, [handleTextChange]);

  return (
    <>
      {isLoading && <PointsLoading loadingMessage={loadingMessage} />}
      <form
        onSubmit={handleSubmitOrEdit}
        className="
          flex
          flex-col
          mx-auto
          h-full
          p-4
        "
      >
        <div className="mb-4">
          <input
            className={inputClass}
            type="text"
            placeholder="Enter the title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            ref={formTitle}
          />
        </div>

        <div id="editor" className="flex flex-1 mb-4">
          <MyQuillEditor
            value={content}
            onChange={setContent}
            ref={quillRef}
            modules={modules}
            formats={formats}
          />
        </div>
        <FormSubmitActions
          submitLabel={isEdit ? "수정" : "등록"}
          submitDisabled={!session?.user?.email || isLoading}
          onCancel={() => router.back()}
        />
      </form>
    </>
  );
};

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
import { withToastParams } from "@/src/app/lib/withToastParams";
import MyQuillEditor from "./QuillEditor";
import type ReactQuillOriginal from "react-quill-new";
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

const FOLDER_NAME = "notices";

const extractImageUrls = (htmlContent: string) => {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const imageUrls: string[] = [];
  let regexMatch;

  while ((regexMatch = imgRegex.exec(htmlContent)) !== null) {
    imageUrls.push(regexMatch[1]);
  }

  return imageUrls.map((url, i) => ({ index: i, url }));
};

/** Quill 빈 상태(<p><br></p> 등)를 ""로 정규화. dirty 감지·유효성 검사에서 단일 사용 */
const normalizeContent = (html: string): string =>
  html.replace(/<[\s\S]*?>/g, "").trim().length === 0 ? "" : html;

// 이탈 확인 메시지 (popstate / 링크·이미지 클릭에서 단일 사용)
const CONFIRM_LEAVE_MESSAGE =
  "작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?";

const formats = [
  "header", "bold", "italic", "underline", "strike", "blockquote",
  "align", "list", "color", "background",
  "link", "image", "code-block",
];

const validateNoticeData = (title: string, content: string, images: ImageProps[]): string | null => {
  if (title.trim() === "") {
    return "제목을 작성해주세요.";
  }

  if (normalizeContent(content) === "" && images.length === 0) {
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
  /** 뒤로가기 후 "아니오" 선택으로 go(1) 복귀 시 발생하는 popstate에서는 confirm 생략 */
  const isReturningFromPopState = useRef(false);
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
  }, [status]);

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

  // Quill modules 설정 (resize: 에디터 내 이미지 드래그 리사이즈)
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
      resize: {
        modules: ["Resize", "DisplaySize"],
        parchment: {
          image: {
            attribute: ["width"],
            limit: { minWidth: 100, maxWidth: 1300 },
          },
        },
      },
    }),
    [imageHandler, linkHandler],
  );

  const handleSubmitOrEdit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
          router.push(withToastParams(`/notice/${updateResult.updateNotice!.id}`, "success", result.message!));
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
          router.replace(withToastParams(`/notice/${createResult.newNotice!.id}`, "success", result.message!));
        }
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "에러가 발생하였습니다. 다시 시도해주세요.";
      if (errorMessage.includes("권한")) {
        router.push("/notice");
      }
      toast.error(errorMessage);
      setIsLoading(false);
    }
  }, [
    title,
    content,
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
  ]);

  const resetImage = useCallback(async () => {
    if (!isEdit && images.length > 0) {
      await Promise.all(images.map((img) => deleteImage(img.url)));
    }
  }, [isEdit, images, deleteImage]);

  const isDirtyState = useMemo(() => {
    const isTitleDirty = title !== (initialData?.title || "");
    const isContentDirty = normalizeContent(content) !== normalizeContent(initialData?.content || "");

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
    content,
    imageDelete.length,
    initialData?.title,
    initialData?.content,
    initialDataImage,
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
      // isNavigating: 사용자가 이미 커스텀 confirm에서 "예"를 선택한 경우 브라우저 기본 다이얼로그 생략
      if (!isDirtyState || isNavigating.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      // go(1) 복귀 시 발생하는 popstate에서는 confirm 생략, isNavigating 즉시 해제
      if (isReturningFromPopState.current) {
        isReturningFromPopState.current = false;
        isNavigating.current = false; // 100ms 타임아웃 대신 즉시 해제
        return;
      }
      if (!isDirtyState || isNavigating.current) return;

      const confirmLeave = window.confirm(CONFIRM_LEAVE_MESSAGE);

      if (!confirmLeave) {
        // popstate로 이미 한 단계 뒤로 이동한 상태이므로 앞으로 이동해 복귀
        // 다음 popstate(폼 복귀)에서는 confirm 생략
        isReturningFromPopState.current = true;
        isNavigating.current = true;
        history.go(1);
        setTimeout(() => { isNavigating.current = false; }, 100);
      } else {
        // popstate 이벤트로 이미 이전 페이지로 이동 완료 - 정리만 수행
        isNavigating.current = true;
        resetImage();
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
      if (isNavigating.current) return;

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
        // 캡처 단계에서 실행되므로 confirm 전에 전파를 차단해
        // Next.js 라우터(React 이벤트 위임)의 pushState를 원천 방지
        e.stopImmediatePropagation();
        e.preventDefault();

        const confirmLeave = window.confirm(CONFIRM_LEAVE_MESSAGE);
        if (confirmLeave) {
          isNavigating.current = true;
          resetImage();
          if (linkElement) {
            window.location.href = linkElement.href;
          }
        }
      }
    };

    // capture: true — React 이벤트 위임보다 먼저 실행되어 pushState 이전에 차단 가능
    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("click", handleClick, true);
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
  }, [images, isEdit, deleteImage]);

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
            placeholder="제목을 입력해주세요"
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

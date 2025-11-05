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
  prependBlogCard,
  upsertBlogCardById,
  blogDetailKey,
} from "@/src/app/lib/react-query/blogsCache";
import { SOCKET_EVENTS } from "@/src/app/lib/react-query/utils";
import { BlogProps, CreateBlogResponse, UpdateBlogResponse, BlogDetailQueryData } from "@/src/app/types/blog";
import toast from "react-hot-toast";
import PointsLoading from "./PointsLoading";
import Button from "./Button";
import { uploadImage } from "@/src/app/lib/uploadImage";
import { deleteImage as deleteCloudinaryImage } from "@/src/app/lib/deleteImage";
import { createBlog } from "@/src/app/lib/createBlog";
import { updateBlog } from "@/src/app/lib/updateBlog";
import MyQuillEditor from "./QuillEditor";
import ReactQuillOriginal from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

type FormBlogProps = {
  id?: string;
  initialData?: BlogProps;
  isEdit: boolean;
};

type ImageProps = {
  index: number;
  url: string;
};

const inputClass = `w-full py-2 px-3 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring focus:border-blue-300`;

const validateBlogData = (title: string, content: string, images: ImageProps[]): string | null => {
  if (title.trim() === "") {
    return "제목을 작성해주세요.";
  }
  
  const isEmpty = content.replace(/<(.|\n)*?>/g, "").trim().length === 0;
  if (isEmpty && images.length === 0) {
    return "글의 내용을 작성하거나 이미지를 첨부해주세요.";
  }
  
  return null;
};

const hasBlogChanges = (
  title: string,
  content: string,
  images: ImageProps[],
  imageDelete: ImageProps[],
  initialData?: BlogProps
): boolean => {
  if (!initialData) return true;
  
  const prevTitle = initialData.title || "";
  const prevContent = initialData.content || "";
  const prevImages = initialData.image ? JSON.parse(initialData.image) : [];

  const currentImagesUrls = images.map(img => img.url).sort().join(",");
  const prevImagesUrls = prevImages.map((img: ImageProps) => img.url).sort().join(",");

  const hasContentChanged = content !== prevContent;
  const hasImagesChanged = currentImagesUrls !== prevImagesUrls || imageDelete.length > 0;

  return title !== prevTitle || hasContentChanged || hasImagesChanged;
};

export const FormBlog = ({ id, initialData, isEdit }: FormBlogProps) => {
  const folderName = "blogs";
  const router = useRouter();
  const initialDataImage: ImageProps[] = useMemo(() => {
    if (!initialData?.image) return [];
    try {
      return JSON.parse(initialData.image);
    } catch {
      return [];
    }
  }, [initialData?.image]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setloadingMessage] = useState("");
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [content, setContent] = useState<string>(initialData?.content || ""); // QuillEditor에서 onChange를 통해 업데이트
  const [images, setImages] = useState<ImageProps[]>(initialDataImage);
  const [imageDelete, setImageDelete] = useState<ImageProps[]>([]); // 삭제될 이미지 목록 (수정 모드에서만 관련)
  const isNavigating = useRef(false);
  const formTitle = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuillOriginal>(null);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // ✅ initialData 변경 시 상태 동기화
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      
      const newInitialImages = initialData.image ? 
        (() => {
          try {
            return JSON.parse(initialData.image);
          } catch {
            return [];
          }
        })() : [];
      
      setImages(newInitialImages);
      setImageDelete([]); // 수정 모드 진입 시 삭제 목록 초기화
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

          const { url, message } = await uploadImage(file, folderName);
          if (!url) {
            toast.error(message ?? "이미지 업로드에 실패했습니다.");
            return;
          }
          toast.success(message ?? "이미지 업로드에 성공했습니다.");

          const editor = quillRef?.current?.getEditor();
          if (editor) {
            const range = editor.getSelection(true); // 현재 커서 위치 또는 선택 영역
            const index = range ? range.index : 0; // 커서 위치가 없으면 문서 시작

            // Quill의 insertEmbed를 사용하여 이미지 삽입
            // 이 작업은 Quill의 내부 델타를 변경하고, `setContent`를 통해 `content` 상태를 업데이트합니다.
            editor.insertEmbed(index, "image", url, "user");
            editor.setSelection(index + 1); // 삽입 후 커서를 이미지 뒤로 이동

            // images 상태에 새로운 이미지 정보 추가.
            // 실제 이미지의 `index`는 Quill 내부에서 동적으로 변경될 수 있으므로,
            // 여기서는 초기 삽입 위치를 기록하고, 실제 제거는 `text-change` 리스너에서 관리합니다.
            setImages((prevImages) => {
              // 이미 같은 URL의 이미지가 있다면 추가하지 않음 (중복 방지)
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
  }, [status, folderName]);

  // 이미지 삭제 로직 (Cloudinary)
  const deleteImage = useCallback(async (url: string): Promise<boolean> => {
    if (!url) return false;

      const result = await deleteCloudinaryImage(url, folderName);

      if (result) {
        // images 상태에서 해당 URL 제거
        setImages((prev) => prev.filter((image) => image.url !== url));
        // imageDelete 목록에서도 제거 (만약 즉시 삭제했다면 대기 목록에서 제외)
        setImageDelete((prev) => prev.filter((image) => image.url !== url));
        return true;
      } else {
        toast.error("이미지 삭제 중 오류가 발생하였습니다.");
        return false;
      }
    },
    [folderName],
  );

  // Quill modules 설정 (imageHandler 포함)
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
    [imageHandler],
  ); // imageHandler가 변경될 때만 modules가 다시 생성됨

  // Quill formats 설정
  const formats = useMemo(() => [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "align", "list", "color", "background",
    "link", "image", "code-block" 
  ], []);


  // ✅ 이미지 URL 추출을 useMemo로 최적화
  const extractImageUrls = useMemo(() => {
    return (content: string) => {
      // 정규식으로 img 태그의 src 추출 (DOM 조작 없이)
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      const imageUrls: string[] = [];
      let regexMatch;
      
      while ((regexMatch = imgRegex.exec(content)) !== null) {
        // regexMatch[0]: 전체 매치된 문자열
        // regexMatch[1]: 첫 번째 캡처 그룹 (src 속성값)
        imageUrls.push(regexMatch[1]);
      }
      
      return imageUrls.map((url, i) => ({ index: i, url }));
    };
  }, []);

  // ✅ 글 작성/수정 제출 핸들러 최적화
  const handleSubmitOrEdit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const editorContent = quillRef.current?.getEditor()?.root.innerHTML || "";
    const imagesToSave = extractImageUrls(editorContent);

    // ✅ 빠른 유효성 검사
    const validationError = validateBlogData(title, editorContent, imagesToSave);
    if (validationError) {
      toast.error(validationError);
      if (validationError.includes("제목")) {
        formTitle.current?.focus();
      } else {
        quillRef.current?.focus();
      }
      return;
    }

    // ✅ 수정 모드 변경사항 체크 최적화
    if (isEdit && !hasBlogChanges(title, editorContent, images, imageDelete, initialData)) {
      toast.error("변경된 내용이 없습니다.");
      return;
    }

    setIsLoading(true);
    setloadingMessage(isEdit ? "수정한 글을 저장하고 있습니다." : "작성한 글을 저장하고 있습니다.");

    try {
      const requestData = {
        title,
        content: editorContent,
        image: JSON.stringify(imagesToSave),
      };

      let result: CreateBlogResponse | UpdateBlogResponse;
      if (isEdit) {
        result = await updateBlog(id!, requestData);
      } else {
        result = await createBlog(requestData);
      }

      if (result.success) {
        if (isEdit) {
          // ✅ 수정 완료 처리 최적화
          const updateResult = result as UpdateBlogResponse;
          await Promise.all(imageDelete.map((img) => deleteImage(img.url)));
          
          const finalImages = images.filter(img => 
            !imageDelete.some(deletedImg => deletedImg.url === img.url)
          );
          
          // ✅ 단일 캐시 업데이트로 통합 (중복 제거)
          const existingCache = queryClient.getQueryData(blogDetailKey(String(updateResult.updateBlog!.id))) as BlogDetailQueryData;
          const updatedBlog = {
            ...updateResult.updateBlog,
            content: updateResult.updateBlog!.content,
            image: updateResult.updateBlog!.image,
            author: existingCache?.blog?.author || {
              name: session?.user?.name ?? "",
              email: session?.user?.email ?? "",
              image: session?.user?.image ?? null,
            },
            viewCount: existingCache?.blog?.viewCount || 0,
            _count: existingCache?.blog?._count || { comments: 0 },
          };

          // ✅ 목록과 상세 캐시 동시 업데이트
          upsertBlogCardById(queryClient, {
            id: updateResult.updateBlog!.id,
            title: updateResult.updateBlog!.title,
            image: updateResult.updateBlog!.image,
          });

          queryClient.setQueryData(blogDetailKey(String(updateResult.updateBlog!.id)), {
            blog: updatedBlog,
          });

          // ✅ 소켓 브로드캐스트
          socket?.emit(SOCKET_EVENTS.BLOG_UPDATED, {
            blog: {
              id: updateResult.updateBlog!.id,
              title: updateResult.updateBlog!.title,
              image: updateResult.updateBlog!.image,
              content: editorContent,
            },
          });

          setImages(finalImages);
          setImageDelete([]);
          router.push(`/blogs/${updateResult.updateBlog!.id}`);
        } else {
          // ✅ 새 글 작성 처리 최적화
          const createResult = result as CreateBlogResponse;
          
          const newBlogData = {
            id: createResult.newBlog!.id,
            title: createResult.newBlog!.title,
            image: createResult.newBlog!.image,
            createdAt: createResult.newBlog!.createdAt,
            author: {
              name: session?.user?.name ?? "",
              image: session?.user?.image ?? null,
            },
            _count: { comments: 0 },
            viewCount: 0,
          };

          prependBlogCard(queryClient, newBlogData);

          socket?.emit(SOCKET_EVENTS.BLOG_NEW, { blog: newBlogData });

          setImages([]);
          setImageDelete([]);
          router.replace(`/blogs/${createResult.newBlog!.id}`);
        }
        
        toast.success(result.message!);
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "에러가 발생하였습니다. 다시 시도해주세요.";
      if (errorMessage.includes("권한")) {
        router.push("/blogs");
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
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
    extractImageUrls,
  ]);

  // 페이지 이탈 시 임시 이미지 정리
  const resetImage = useCallback(async () => {
    // isEdit 모드가 아니거나 (새 글 작성 중) imageDelete에 이미지가 있을 때만 실행
    if (!isEdit && imageDelete.length > 0) {
      await Promise.all(imageDelete.map((img) => deleteImage(img.url)));
      // Note: deleteImage 내부에서 setImageDelete를 업데이트하므로 여기서 추가적인 setImageDelete([])는 필요 없을 수 있음.
      // 하지만 명시적으로 초기화해도 무방.
      setImageDelete([]);
    }
  }, [isEdit, imageDelete, deleteImage]);

  // ✅ isDirty 상태 관리를 useMemo로 최적화
  const isDirtyState = useMemo(() => {
    const currentEditorContent = quillRef.current?.getEditor()?.root.innerHTML || "";
    const initialContentClean = initialData?.content || "";

    const isTitleDirty = title !== (initialData?.title || "");
    const isContentDirty = currentEditorContent !== initialContentClean;

    // ✅ 정규식으로 이미지 URL 추출 (DOM 조작 없음)
    const currentImageUrlsInEditor = extractImageUrls(currentEditorContent).map(img => img.url);
    const initialImageUrls = initialDataImage.map((img) => img.url);

    // ✅ Set을 사용한 효율적인 비교
    const currentImageSet = new Set(currentImageUrlsInEditor);
    const initialImageSet = new Set(initialImageUrls);
    
    const isImagesDirty = 
      currentImageSet.size !== initialImageSet.size ||
      [...currentImageSet].some(url => !initialImageSet.has(url)) ||
      imageDelete.length > 0;

    return isTitleDirty || isContentDirty || isImagesDirty;
  }, [
    title,
    imageDelete.length,
    initialData?.title,
    initialData?.content,
    initialDataImage,
    extractImageUrls,
  ]);

  // ✅ 브라우저 뒤로가기/새로고침 시 dirty 상태 경고 최적화
  useEffect(() => {
    // 최초 페이지 진입 시 더미 pushState 추가 (뒤로가기 버튼 감지용)
    const isFirstEntry =
      window.history.state === null ||
      window.history.state.isDummy === undefined;
    if (isFirstEntry) {
      history.replaceState({ isDummy: true }, "", location.href);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyState) return; // ✅ isDirtyState 사용
      e.preventDefault();
      e.returnValue = ""; // 표준에 따라 필요
    };

    const handlePopState = () => {
      if (!isDirtyState || isNavigating.current) return; // ✅ isDirtyState 사용

      const confirmLeave = window.confirm(
        "작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?",
      );

      if (!confirmLeave) {
        // 사용자가 취소를 누르면 현재 URL에 더미 상태를 다시 푸시하여 뒤로가기 동작을 무효화
        history.pushState({ isDummy: true }, "", location.href);
      } else {
        // 사용자가 확인을 누르면 이미지 정리 후 실제 뒤로가기 허용
        isNavigating.current = true; // 중복 실행 방지 플래그
        resetImage();
        // router.back() 대신 history.go(-1)을 사용하여 즉시 이전 상태로 이동
        // Next.js router.back()은 비동기적이라 popstate 이벤트와 충돌할 수 있음
        history.go(-1);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirtyState, resetImage]); // ✅ 의존성 최적화

  // 내부 링크 클릭 또는 외부 이미지 클릭 시 dirty 상태 경고
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Quill 내부 UI 클릭은 무시
      const isInsideQuillEditorUI = !!target.closest(
        ".ql-toolbar, .ql-tooltip, .ql-container",
      );
      if (isInsideQuillEditorUI) return;

      // 제출 버튼 클릭은 무시
      const isSubmitButton = target.closest(
        'button[type="submit"], form button',
      );
      if (isSubmitButton) return;

      const linkElement = target.closest("a");
      const isImageClicked = target instanceof HTMLImageElement; // 모든 이미지 클릭 감지

      // dirty 상태가 아니면 경고할 필요 없음
      if (!isDirtyState) return; // ✅ isDirtyState 사용

      // Quill 에디터 외부에서 링크나 이미지가 클릭된 경우에만 경고
      // 이미지 클릭 시에도 확인 필요 (새로 삽입된 이미지가 아니라면)
      if (
        linkElement ||
        (isImageClicked && !images.some((img) => target.src.includes(img.url)))
      ) {
        const confirmLeave = window.confirm(
          "작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?",
        );
        if (!confirmLeave) {
          e.preventDefault();
          // 사용자가 취소하면 현재 페이지 상태를 유지하기 위해 pushState
          history.pushState(null, "", location.href);
        } else {
          resetImage(); // 페이지 벗어날 때 임시 이미지 삭제

          // 수동 이동
          if (linkElement) {
            e.preventDefault(); // 기본 이동 막고
            window.location.href = linkElement.href; // 수동 이동
          }
        }
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [isDirtyState, images, resetImage]); // ✅ 의존성 최적화

  // ✅ handleTextChange 최적화 - DOM 조작 제거
  const handleTextChange = useCallback((_delta: unknown, _oldDelta: unknown, source: string) => {
      if (!quillRef.current) return;
      const editor = quillRef.current.getEditor();

      if (source === "user") {
        // 사용자 동작으로 인한 변경만 감지
        const currentContent = editor.root.innerHTML;

        // ✅ 정규식으로 이미지 URL 추출 (DOM 조작 없음)
        const currentImageUrlsInContent = extractImageUrls(currentContent).map(img => img.url);

        // ✅ Set을 사용한 효율적인 비교
        const currentImageSet = new Set(currentImageUrlsInContent);

        // images 상태에서 제거된 이미지 찾기
        const removedImagesFromEditor = images.filter(
          (img) => !currentImageSet.has(img.url),
        );

        if (removedImagesFromEditor.length > 0) {
          removedImagesFromEditor.forEach((deletedImg) => {
            if (!isEdit) {
              // 새 글 작성 중 삭제된 이미지는 즉시 삭제
              deleteImage(deletedImg.url);
            } else {
              // 수정 중 삭제된 이미지는 imageDelete 목록에 추가
              setImageDelete((prev) => {
                if (prev.some((img) => img.url === deletedImg.url)) {
                  return prev; // 이미 목록에 있다면 추가하지 않음
                }
                return [...prev, deletedImg];
              });
            }
          });
        }

        // ✅ 이미지 상태 업데이트 최적화 - 불필요한 정렬 제거
        setImages((prev) => {
          const updatedImages: ImageProps[] = [];
          currentImageUrlsInContent.forEach((url, i) => {
            // 기존 images 상태에 있는 이미지라면 index 유지, 아니면 새 index 부여
            const existingImg = prev.find((img) => img.url === url);
            updatedImages.push({
              index: existingImg ? existingImg.index : i,
              url,
            });
          });
          return updatedImages; // 정렬 제거로 성능 향상
        });
      }
    }, [images, isEdit, deleteImage, extractImageUrls]);

  // Quill 에디터의 'text-change' 이벤트 리스너: 이미지 추가/제거 감지 및 상태 동기화
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    editor.on("text-change", handleTextChange);

    return () => {
      editor.off("text-change", handleTextChange); // 컴포넌트 언마운트 시 리스너 제거
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
          {/* MyQuillEditor에 ref, value, onChange, modules, formats 전달 */}
          <MyQuillEditor
            value={content}
            onChange={setContent} // MyQuillEditor가 변경된 content를 반환
            ref={quillRef} // ref prop으로 변경
            modules={modules} // modules prop 전달
            formats={formats} // formats prop 전달
          />
        </div>
        <Button
          disabled={!session?.user?.email || isLoading}
          type="submit"
          color="default"
          variant="bordered"
          radius="sm"
        >
          {isEdit ? "수정" : "등록"}
        </Button>
      </form>
    </>
  );
};
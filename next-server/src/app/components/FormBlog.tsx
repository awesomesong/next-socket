'use client';
import { FormEvent, useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../context/socketContext";
import { prependBlogCard, upsertBlogCardById, upsertBlogDetailPartial } from "@/src/app/lib/blogsCache";
import { BlogProps } from "@/src/app/types/blog";
import toast from "react-hot-toast";
import PointsLoading from "./PointsLoading";
import Button from "./Button";
import { uploadImage } from "@/src/app/lib/uploadImage";
import { deleteImage as deleteCloudinaryImage } from "@/src/app/lib/deleteImage";
import MyQuillEditor from "./QuillEditor";
import ReactQuillOriginal from "react-quill-new"; 
import 'react-quill-new/dist/quill.snow.css';

type FormBlogProps = {
  id?: string;
  initialData?: BlogProps;
  message?: string;
  isEdit: boolean;
}

type ImageProps = {
  index: number;
  url: string;
}

const inputClass = `w-full py-2 px-3 border border-gray-300 rounded-md 
                    focus:outline-none focus:ring focus:border-blue-300`;

export const FormBlog = ({ id, initialData, message, isEdit }: FormBlogProps ) => {
  const folderName = 'blogs';
  const router = useRouter();
  const initialDataImage: ImageProps[] = useMemo(() => 
    initialData?.image ? JSON.parse(initialData.image) : [],
    [initialData?.image]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setloadingMessage] = useState('');

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>(''); // QuillEditor에서 onChange를 통해 업데이트
  const [images, setImages] = useState<ImageProps[]>([]); 
  const [imageDelete, setImageDelete] = useState<ImageProps[]>([]); // 삭제될 이미지 목록 (수정 모드에서만 관련)

  const [isDirty, setIsDirty] = useState(false);
  const isNavigating = useRef(false);

  const formTitle = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuillOriginal>(null);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // 초기 데이터 설정 (isEdit 모드일 때만 실행)
  useEffect(() => {
    if (isEdit && initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setImages(initialData.image ? JSON.parse(initialData.image) : []);
    }
  }, [isEdit, initialData]);

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
          setloadingMessage('이미지 업로드 중입니다.');

          const file = input.files[0];
          const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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
            editor.insertEmbed(index, 'image', url, 'user');
            editor.setSelection(index + 1); // 삽입 후 커서를 이미지 뒤로 이동

            // images 상태에 새로운 이미지 정보 추가.
            // 실제 이미지의 `index`는 Quill 내부에서 동적으로 변경될 수 있으므로,
            // 여기서는 초기 삽입 위치를 기록하고, 실제 제거는 `text-change` 리스너에서 관리합니다.
            setImages(prevImages => {
              // 이미 같은 URL의 이미지가 있다면 추가하지 않음 (중복 방지)
              if (prevImages.some(img => img.url === url)) {
                return prevImages;
              }
              return [...prevImages, { index, url }];
            });
          }

        } catch (error: any) {
          toast.error('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
          console.error(error);
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
      setImages(prev => prev.filter(image => image.url !== url));
      // imageDelete 목록에서도 제거 (만약 즉시 삭제했다면 대기 목록에서 제외)
      setImageDelete(prev => prev.filter(image => image.url !== url));
      return true;
    } else {
      toast.error('이미지 삭제 중 오류가 발생하였습니다.');
      return false;
    }
  }, [folderName]);

  // Quill modules 설정 (imageHandler 포함)
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ align: ["justify", "center", "right"] }],
        [{ color: [] }, { background: [] }],
        ["link", "image", "code-block"],
      ],
      handlers: {
        image: imageHandler 
      },
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 2000,
      maxStack: 50,
      userOnly: true
    }
  }), [imageHandler]); // imageHandler가 변경될 때만 modules가 다시 생성됨

  // Quill formats 설정
  const formats = useMemo(() => [
    "header", "bold", "italic", "underline", "strike", "blockquote",
    "align", "list", "color", "background",
    "link", "image", "code-block" 
  ], []);


  // 글 작성/수정 제출 핸들러
  const handleSubmitOrEdit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const editorContent = quillRef.current?.getEditor()?.root.innerHTML || '';
    const isEmpty = editorContent.replace(/<(.|\n)*?>/g, '').trim().length === 0;

    // 에디터 내 img 태그 기준으로 images 재구성
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    const imageUrls: string[] = [];
    Array.from(tempDiv.getElementsByTagName('img')).forEach(img => {
      if (img.src) imageUrls.push(img.src);
    });
    const imagesToSave = imageUrls.map((url, i) => ({ index: i, url }));

    if (title.trim() === '') {
      toast.error('제목을 작성해주세요.');
      return formTitle.current?.focus();
    }
    if (isEmpty && imagesToSave.length === 0) {
      toast.error('글의 내용을 작성하거나 이미지를 첨부해주세요.');
      quillRef.current?.focus();
      return;
    }

    // 수정 모드일 때 변경 사항이 있는지 확인
    if (isEdit) {
      const prevTitle = initialData?.title || '';
      const prevContent = initialData?.content || '';
      const prevImages = initialData?.image ? JSON.parse(initialData.image) : [];

      const currentImagesUrls = images.map(img => img.url).sort().join(',');
      const prevImagesUrls = prevImages.map((img: ImageProps) => img.url).sort().join(',');

      const hasContentChanged = content !== prevContent;
      const hasImagesChanged = currentImagesUrls !== prevImagesUrls || imageDelete.length > 0;

      if (title === prevTitle && !hasContentChanged && !hasImagesChanged) {
        return toast.error('변경된 내용이 없습니다.');
      }
    }

    setIsLoading(true);
    setloadingMessage(isEdit ? '수정한 글을 저장하고 있습니다.' : '작성한 글을 저장하고 있습니다.');

    try {
      const apiUrl = isEdit ? `/api/blogs/${id}` : `/api/blogs`;
      const method = isEdit ? 'PUT' : 'POST';

      // 최종적으로 Quill 에디터의 HTML content를 저장합니다.
      const requestBody = { title, content: editorContent, image: JSON.stringify(imagesToSave) };

      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          toast.error(data.message || '해당 글을 수정할 권한이 없습니다.');
          router.push('/blogs');
          return;
        }
        throw new Error(data.message || '알 수 없는 오류가 발생했습니다.');
      }

      if (res.status === 200) {
        // 성공 시 삭제 대기 중인 이미지들 처리
        if (isEdit) {
          await Promise.all(imageDelete.map(img => deleteImage(img.url)));
          // 낙관적 업데이트: 상세/목록 캐시 동기화 (추가 네트워크 호출 방지)
          try {
            const updated = data.updateBlog;
            if (updated?.id) {
              // 목록 카드 갱신 (제목/이미지 등)
              upsertBlogCardById(queryClient, {
                id: updated.id,
                title: updated.title,
                image: updated.image,
              });

              // 상세 본문/타이틀/이미지 갱신 (유틸 사용)
              upsertBlogDetailPartial(queryClient, String(updated.id), {
                title: updated.title,
                content: quillRef.current?.getEditor()?.root.innerHTML || '',
                image: JSON.stringify(images.map((it, i) => ({ index: i, url: it.url }))),
              });

              // 소켓 브로드캐스트: 블로그 수정
              try {
                const payload = {
                  blog: {
                    id: updated.id,
                    title: updated.title,
                    image: updated.image,
                    content: quillRef.current?.getEditor()?.root.innerHTML || '',
                  }
                };
                socket?.emit('blog:updated', payload);
              } catch {}
            }
          } catch {}
          setIsDirty(false);
          router.push(`/blogs/${data.updateBlog.id}`);
        } else {
          setIsDirty(false);
          // 목록 캐시에 새 글을 즉시 prepend (공통 유틸 사용)
          prependBlogCard(queryClient, {
            id: data?.newBlog?.id,
            title: data?.newBlog?.title,
            image: data?.newBlog?.image,
            createdAt: data?.newBlog?.createdAt,
            author: { name: session?.user?.name ?? '', image: session?.user?.image ?? null },
            _count: { comments: 0 },
            viewCount: 0,
          });

          // 소켓 브로드캐스트: 블로그 신규 생성 (카드용 최소 필드)
          try {
            const nb = data?.newBlog;
            const payload = {
              blog: {
                id: nb?.id,
                title: nb?.title,
                image: nb?.image,
                createdAt: nb?.createdAt,
                author: { name: session?.user?.name ?? '', image: session?.user?.image ?? null },
                _count: { comments: 0 },
                viewCount: 0,
              }
            };
            socket?.emit('blog:new', payload);
          } catch {}

          router.replace(`/blogs/${data.newBlog.id}`);
        }

        setImages([]); // 이미지 상태 초기화
        setImageDelete([]); // 삭제 이미지 목록 초기화
        toast.success(isEdit ? '글이 수정되었습니다.' : '글이 작성되었습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('에러가 발생하였습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [title, content, images, id, imageDelete, isEdit, initialData, router, deleteImage]);

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


  // isDirty 상태 관리: 제목, 내용, 이미지 목록 변경 감지
  useEffect(() => {
    const currentEditorContent = quillRef.current?.getEditor()?.root.innerHTML || '';
    const initialContentClean = initialData?.content || ''; // 초기 content가 null일 경우 빈 문자열

    const isTitleDirty = title !== (initialData?.title || '');
    const isContentDirty = currentEditorContent !== initialContentClean;

    // 현재 에디터에 있는 이미지 URL 목록
    const currentImageUrlsInEditor: string[] = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentEditorContent;
    Array.from(tempDiv.getElementsByTagName('img')).forEach(img => {
      if (img.src) currentImageUrlsInEditor.push(img.src);
    });

    // 초기 이미지 URL 목록
    const initialImageUrls: string[] = initialDataImage.map(img => img.url);

    // 이미지 목록 변경 감지
    // 현재 이미지 URL과 초기 이미지 URL의 Set을 비교하여 변경 여부 확인
    const isImagesDirty = !(
      currentImageUrlsInEditor.length === initialImageUrls.length &&
      currentImageUrlsInEditor.every(url => initialImageUrls.includes(url)) &&
      initialImageUrls.every(url => currentImageUrlsInEditor.includes(url))
    ) || imageDelete.length > 0; // 삭제 대기 이미지도 dirty에 포함

    setIsDirty(isTitleDirty || isContentDirty || isImagesDirty);
  }, [title, content, images, imageDelete, initialData?.title, initialData?.content, initialDataImage]);


  // 브라우저 뒤로가기/새로고침 시 dirty 상태 경고
  useEffect(() => {
    // 최초 페이지 진입 시 더미 pushState 추가 (뒤로가기 버튼 감지용)
    const isFirstEntry = window.history.state === null || window.history.state.isDummy === undefined;
    if (isFirstEntry) {
        history.replaceState({ isDummy: true }, '', location.href);
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ''; // 표준에 따라 필요
    };

    const handlePopState = (e: PopStateEvent) => {
      if (!isDirty || isNavigating.current) return;

      const confirmLeave = window.confirm('작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?');

      if (!confirmLeave) {
        // 사용자가 취소를 누르면 현재 URL에 더미 상태를 다시 푸시하여 뒤로가기 동작을 무효화
        history.pushState({ isDummy: true }, '', location.href);
      } else {
        // 사용자가 확인을 누르면 이미지 정리 후 실제 뒤로가기 허용
        isNavigating.current = true; // 중복 실행 방지 플래그
        resetImage();
        // router.back() 대신 history.go(-1)을 사용하여 즉시 이전 상태로 이동
        // Next.js router.back()은 비동기적이라 popstate 이벤트와 충돌할 수 있음
        history.go(-1);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, resetImage]);


  // 내부 링크 클릭 또는 외부 이미지 클릭 시 dirty 상태 경고
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Quill 내부 UI 클릭은 무시
      const isInsideQuillEditorUI = !!target.closest('.ql-toolbar, .ql-tooltip, .ql-container');
      if (isInsideQuillEditorUI) return;

      // 제출 버튼 클릭은 무시
      const isSubmitButton = target.closest('button[type="submit"], form button');
      if (isSubmitButton) return;

      const linkElement = target.closest('a');
      const isImageClicked = target instanceof HTMLImageElement; // 모든 이미지 클릭 감지

      // dirty 상태가 아니면 경고할 필요 없음
      if (!isDirty) return;

      // Quill 에디터 외부에서 링크나 이미지가 클릭된 경우에만 경고
      // 이미지 클릭 시에도 확인 필요 (새로 삽입된 이미지가 아니라면)
      if (linkElement || (isImageClicked && !images.some(img => target.src.includes(img.url)))) {
        const confirmLeave = window.confirm('작성 중인 내용이 있습니다. 페이지를 벗어나시겠습니까?');
        if (!confirmLeave) {
          e.preventDefault();
          // 사용자가 취소하면 현재 페이지 상태를 유지하기 위해 pushState
          history.pushState(null, '', location.href);
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

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [isDirty, images, resetImage]);


  // Quill 에디터의 'text-change' 이벤트 리스너: 이미지 추가/제거 감지 및 상태 동기화
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    const handleTextChange = (delta: any, oldDelta: any, source: string) => {
      if (source === 'user') { // 사용자 동작으로 인한 변경만 감지
        const currentContent = editor.root.innerHTML;

        const currentImageUrlsInContent: string[] = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentContent;
        Array.from(tempDiv.getElementsByTagName('img')).forEach(img => {
          if (img.src) {
            currentImageUrlsInContent.push(img.src);
          }
        });

        // images 상태에서 제거된 이미지 찾기
        const removedImagesFromEditor = images.filter(img => !currentImageUrlsInContent.includes(img.url));

        // images 상태에 추가된 이미지 찾기 (현재 content에는 있지만 images 상태에는 없는 경우)
        // 이 부분은 imageHandler에서 이미 추가하므로 여기서는 주로 'removedImagesFromEditor' 처리에 집중.
        // 하지만 혹시 모를 경우를 대비하여 추가적인 이미지 동기화 로직을 넣을 수 있음.
        // 예를 들어, 외부에서 paste된 이미지 URL을 여기서 감지하고 images 상태에 추가.

        if (removedImagesFromEditor.length > 0) {
          removedImagesFromEditor.forEach(deletedImg => {
            if (!isEdit) {
              // 새 글 작성 중 삭제된 이미지는 즉시 삭제
              deleteImage(deletedImg.url);
            } else {
              // 수정 중 삭제된 이미지는 imageDelete 목록에 추가
              setImageDelete(prev => {
                if (prev.some(img => img.url === deletedImg.url)) {
                  return prev; // 이미 목록에 있다면 추가하지 않음
                }
                return [...prev, deletedImg];
              });
            }
          });
        }

        // images 상태를 현재 에디터 내용에 있는 이미지로 동기화
        // index 값은 다시 부여 (여기서는 중요하지 않지만 일관성을 위해)
        setImages(prev => {
          const updatedImages: ImageProps[] = [];
          currentImageUrlsInContent.forEach((url, i) => {
            // 기존 images 상태에 있는 이미지라면 index 유지, 아니면 새 index 부여
            const existingImg = prev.find(img => img.url === url);
            updatedImages.push({ index: existingImg ? existingImg.index : i, url });
          });
          return updatedImages.sort((a, b) => a.index - b.index); // 다시 정렬 (선택 사항)
        });
      }
    };

    editor.on('text-change', handleTextChange);

    return () => {
      editor.off('text-change', handleTextChange); // 컴포넌트 언마운트 시 리스너 제거
    };
  }, [images, isEdit, deleteImage]); // `content` 대신 `images`와 `isEdit`, `deleteImage`에 의존


  // `quillRef.current?.lastDeltaChangeSet?.ops`를 사용하는 부분은 `text-change` 리스너로 대체되었으므로 삭제합니다.
  // 이 방식은 Quill의 내부 델타를 직접 파싱하는 것이라 오류 가능성이 높습니다.
  // useEffect(() => { ... }, [quillRef.current?.lastDeltaChangeSet?.ops]);


  return (
    <>
      {isLoading && <PointsLoading loadingMessage={loadingMessage} />}
      <form 
        onSubmit={handleSubmitOrEdit}
        className='
          flex
          flex-col
          mx-auto
          h-full
          p-4
        '
      >
        <div className='mb-4'>
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

        <div
          id='editor'
          className='flex flex-1 mb-4'
        >
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
          disabled={!session?.user?.name || isLoading}
          type='submit'
          color='default'
          variant='bordered'
          radius='sm'
        >
          {isEdit ? '수정' : '등록'}
        </Button>
      </form>
    </>
  );
};
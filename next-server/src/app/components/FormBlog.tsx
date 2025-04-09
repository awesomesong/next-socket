'use client';
import { FormEvent, useState, useRef, useMemo, useEffect, useCallback } from "react";
import { FormBlogData } from "@/src/app/types/blog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BlogProps } from "@/src/app/types/blog";
import toast from "react-hot-toast";
import { DynamicReactQuill as RQ } from "./DynamicReactQuill";
import ReactQuill from 'react-quill';
import hljs from 'highlight.js';
import PointsLoading from "./PointsLoading";
import Button from "./Button";
import { uploadImage } from "@/src/app/utils/cloudinary/uploadImage";
import { deleteImage as deleteCloudinaryImage } from "@/src/app/utils/cloudinary/deleteImage";

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

export const FormBlog = ({ id, initialData, message, isEdit} : FormBlogProps ) => {
  const folderName = 'blogs';
  const router = useRouter();
  const initialDataImage = initialData?.image ? JSON.parse(initialData.image) : [];
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setloadingMessage] = useState('');


  const [title, setTitle] = useState<string>(() => (isEdit ? initialData?.title! : ''));
  const [content, setContent] = useState<string>(() => (isEdit ? initialData?.content! : ''));
  const [images, setImages] = useState<ImageProps[]>(() => (isEdit ? initialDataImage : []));
  const [imageDelete, setImageDelete] = useState<ImageProps[]>([]);

  const [isDirty, setIsDirty] = useState(false);
  const isNavigating = useRef(false);

  const formTitle = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const { data : session } = useSession();

  useEffect(() => {
    setTitle(isEdit ? initialData?.title! : '');
  }, [initialData?.title!]);

  useEffect(() => {
    setContent(isEdit ? initialData?.content! : '');
  }, [initialData?.content!]);

  useEffect(() => {
    setImages(isEdit ? initialDataImage : []);
  }, [initialData?.image!]);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      if (input?.files?.[0]) {
        try {
          setIsLoading(true);
          setloadingMessage('이미지 업로드 중 입니다.');

          const file = input.files[0];
          const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

          if (!allowedTypes.includes(file.type)) {
            throw new Error("이미지 파일만 업로드 가능합니다.");
          }
          const url = await uploadImage(file, folderName);
          if(!url) return;

          const editor = quillRef?.current?.getEditor(); 
          const index = quillRef.current?.getEditor().getSelection()?.index ?? 0;
          editor?.setSelection(index, 1);
          editor?.clipboard.dangerouslyPasteHTML(index,`<img src=${url} alt="" />`);
          // const tempImages = images;
          // const setImageIndex = tempImages.map((img) => img.index === index);
          // setImage((prevImage) => [...prevImage, url]);
          // 이전과 동일한 위치에 이미지가 삽입되었을시, 변경된 이미지의 index값 수정
          setImages(images =>
            images.map(image => image.index === index ? {...image, index: image.index + 1} 
                                : image.index === (index + 1) ? {...image, index: image.index + 1} : image));
          // 새로운 이미지의 정보 추가
          setImages((prevImage) => [...prevImage, {index, url}]);
          
        } catch(error) {
          toast.error('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
          console.log(error);
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, []);

  useEffect(() => {
    setImages(prev => [...prev].sort((a, b) => a.index - b.index));
  }, []);

  const modules = useMemo(() => ({
    syntax: {
      highlight: (text: any) => hljs.highlightAuto(text).value,
    },
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ align: ["justify", "center", "right"] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image", "code-block"], 
      ],
      handlers: {
        image: imageHandler
      },
    },
    ImageResize: {
      modules: ['Resize', 'DisplaySize'],
    },
  }), [imageHandler]);

  const handleSubmitOrEdit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const isEmpty = content.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (title.trim() === '') {
      toast.error('제목을 작성해주세요.');
      return formTitle.current?.focus();
    }
    if (isEmpty && images.length === 0) {
      toast.error('글의 내용을 작성해주세요.');
      return quillRef.current?.focus();
    }
    
    if (isEdit) {
      // 기존 데이터와 변경된 데이터 비교 (수정 시)
      const prevFormData = { ...initialData };
      const updatedFormData: FormBlogData = { title, content };
    
      Object.entries(prevFormData).forEach(([key, value]) => {
        if (updatedFormData[key as keyof FormBlogData] === value) {
          delete updatedFormData[key as keyof FormBlogData];
        }
      });
    
      if (Object.keys(updatedFormData).length === 0) {
        return toast.error('변경된 내용이 없습니다.');
      }
    }
    
    setIsLoading(true);
    setloadingMessage(isEdit ? '수정한 글을 저장하고 있습니다.' : '작성한 글을 저장하고 있습니다.');
  
    try {
      const apiUrl = isEdit ? `/api/blogs/${id}` : `/api/blogs`;
      const method = isEdit ? 'PUT' : 'POST';
      const requestBody = { title, content, image: JSON.stringify(images) };
  
      const res = await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      if (res.status === 200) {
        if (isEdit) {
          await Promise.all(imageDelete.map(img => deleteImage(img.url)));
          setIsDirty(false);
          router.push(`/blogs/${data.updateBlog.id}`);
        } else {
          setIsDirty(false);
          router.replace(`/blogs/${data.newBlog.id}`);
        }
  
        setImages([]);
        toast.success(isEdit ? '글이 수정되었습니다.' : '글이 작성되었습니다.');
      }
    } catch (error) {
      console.error(error);
      toast.error('에러가 발생하였습니다. 다시 시도해주세요.');
      setIsLoading(false);
    } 
  }, [title, content, images, id, imageDelete, isEdit, initialData]);

  // useEffect(() => {
  //   const isNowDirty = (
  //     title !== (initialData?.title || '') ||
  //     content !== (initialData?.content || '') ||
  //     JSON.stringify(images) !== JSON.stringify(initialDataImage)
  //   );
  //   setIsDirty(isNowDirty);
  // }, [title, content, images, initialData?.title, initialData?.content, initialDataImage]);  

  // useEffect(() => {
  //   const isFirst = window.history.state === null;

  //   // 더미 pushState 삽입 (뒤로가기용)
  //   if (isFirst) {
  //     history.pushState({ isDummy: true }, '', location.href);
  //   }

  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (!isDirty) return;
  //     e.preventDefault();
  //     e.returnValue = ''; // 일부 브라우저에서 필요 
  //   };
  
  //   const handlePopState = (e: PopStateEvent) => {
  //     if (!isDirty || isNavigating.current) return;
  
  //     const confirmLeave = window.confirm('사이트에서 나가시겠습니까? 작성된 내용은 저장되지 않습니다.');
  
  //     if (!confirmLeave) {
  //       // stay: 원래 페이지로 되돌리기
  //       history.pushState({ isDummy: true }, '', location.href);
  //     } else {
  //       // leave: 이미지 정리하고 원래 뒤로감
  //       isNavigating.current = true;
  //       resetImage();
  
  //       // 뒤로 한 번 더 감 (실제 이전 페이지로)
  //       history.go(-1);
  //     }
  //   };
  
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   window.addEventListener('popstate', handlePopState);
  
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //     window.removeEventListener('popstate', handlePopState);
  //   };
  // }, [isDirty]);
  
  // useEffect(() => {
  //   const handleClick = (e: MouseEvent) => {
  //     const target = e.target as HTMLElement;

  //     // Quill 내부 UI 클릭은 무시
  //     const isInsideQuillEditor = !!target.closest('.ql-toolbar, .ql-tooltip, .ql-container');
  //     if (isInsideQuillEditor) return;

  //     // 등록 버튼 or submit 클릭 무시
  //     const isSubmitButton = target.closest('button[type="submit"], form');
  //     if (isSubmitButton) return;

  //     const linkElement = target.closest('a');
  //     const isExternalImg = target instanceof HTMLImageElement && !target.src.includes('blogs');
  
  //     if (!isDirty || (!linkElement && !isExternalImg)) return;
  //     const confirmLeave = window.confirm('사이트에서 나가시겠습니까? 작성된 내용은 저장되지 않습니다.');
  
  //     if (confirmLeave) {
  //       resetImage();
  //     } else {
  //       history.pushState(null, '', location.href); 
  //     }
  //   };
  
  //   window.addEventListener('click', handleClick);
  
  //   return () => {
  //     window.removeEventListener('click', handleClick);
  //   };
  // }, [isDirty]);  

  // const deleteImage = useCallback(async (url: string) => {
  //   if(!url) return;

  //   const result = await deleteCloudinaryImage(url, folderName);

  //   if (result) {
  //     setImages(prev => prev.filter(image => image.url !== url));

  //     // 수정 모드일 때 삭제된 이미지 목록에 추가
  //     if (isEdit) {
  //       setImageDelete(prev => 
  //         prev.some(img => img.url === url) 
  //           ? prev : [...prev, { index: -1, url }]
  //       );
  //     }
  //   } else {
  //     toast.error('이미지 삭제 중 오류가 발생하였습니다.');
  //   }
  // }, [isEdit, images]);

  // const resetImage = () => {
  //   if (!isEdit && imageDelete.length > 0) {
  //       imageDelete.forEach((img) => deleteImage(img.url))
  //   }
  // };

  // useEffect(() => {
  //   if (!quillRef.current) return;
  //   const editorContent = quillRef.current?.getEditor()?.root.innerHTML;

  //   const remainingImages = images.filter(img => editorContent.includes(img.url));
  //   const deletedImages = images.filter(img => !remainingImages.some(keepImg => keepImg.url === img.url));

    
  //   if (deletedImages.length > 0) {
  //     const { url } = deletedImages[0]; // 첫 번째 삭제된 이미지만 처리
  //     if (!isEdit) {
  //       deleteImage(url); // 즉시 삭제
  //       setImageDelete(prev => [...prev, { index: -1, url }]);
  //     } else {
  //       setImageDelete(prev => [...prev, { index: -1, url }]);
  //       setImages(remainingImages);
  //     }
  //   }
  // }, [content]);

  // useEffect(() => {
  //   if(images?.length > 0 ){
  //     quillRef?.current?.lastDeltaChangeSet?.ops?.map((option) => {
  //       if(option.delete !== undefined && option.delete > 0){
  //         const result = images.filter(img=> (quillRef.current?.value as string).includes(img.url));    
  //         const deletedImageName = images.filter((img1) => !result.some(img2 => img1.url === img2.url));
  //         if( !isEdit && deletedImageName.length > 0 ) {
  //           deleteImage(deletedImageName[0].url);
  //         } 
  //         if( isEdit ){
  //           setImages(result);
  //           if(deletedImageName.length > 0) {
  //             setImageDelete((prev) => [...prev, deletedImageName[0]]);
  //           }
  //         }
  //       }
  //     });
  //   }
  // }, [quillRef.current?.lastDeltaChangeSet?.ops]);

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
        {/* <FormPrompt /> */}
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
          className='flex-1 mb-4'
        >
          <RQ 
            modules={modules}
            value={content} 
            onChange={setContent} 
            readOnly={false}
            forwardedRef={quillRef}
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
  )
}

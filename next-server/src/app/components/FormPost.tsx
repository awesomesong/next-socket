"use client"
import { useState, ChangeEvent, FormEvent, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "@apollo/client";
import { Checkbox, Input, Textarea, Button, Select, SelectItem } from "@nextui-org/react";
import { ImFilesEmpty } from "react-icons/im";
import { FaTrashAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { ADD_POST, UPDATE_POST } from '@/graphql/mutations';
import { GET_POSTS, GET_POST } from '@/graphql/queries';
import { FormPostData } from '@/src/app/types/blog';
import { InitFormData } from '@/src/app/types/init';
import ImageUploadButton from './ImageUploadButton';
import { deleteImage } from "@/src/app/utils/cloudinary/deleteImage";
import PointsLoading from "./PointsLoading";

interface FormPostProps {
    id?: string;
    isEdit: boolean;
}
  
interface IPreviewImage {
    name: string;
    src: string;
}

const FormPost = ({ id, isEdit} : FormPostProps) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setloadingMessage] = useState('');
    const [formData, setFormData] = useState<FormPostData>(InitFormData);
    const [previewImages, setPreviewImages] = useState<IPreviewImage[]>([]);
    const selectRef = useRef<HTMLSelectElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { data: dataPost, loading: loadingPost, error: errorPost } = useQuery(GET_POST, {
        variables: {id},
        skip: !id,
        onCompleted: (result) => {
        },
    });

    useEffect(() => {
        if (!dataPost?.post) return;
      
        setFormData(dataPost.post);
      
        if (dataPost.post.image) {
            setPreviewImages([{
                name: dataPost.post.imageName,
                src: dataPost.post.image,
            }]);
        }
      }, [dataPost]);

    const [addPost] = useMutation(ADD_POST, {
        refetchQueries : [{query: GET_POSTS}],
        onCompleted: (result) => {
            setIsLoading(true);
            router.push(`/posts/${result.addPost.id}`);
        },
    });

    const [updatePost] = useMutation(UPDATE_POST, {
        refetchQueries: [{query: GET_POST, variables: {id}}],
        onCompleted: (result) => {
            setIsLoading(true);
            router.push(`/posts/${result.updatePost.id}`);
        },
    });

    const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement & HTMLInputElement & HTMLSelectElement>) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: name === 'published' ? checked : value,
        }));
    },[]);

    const handleUpload = useCallback((result: any) => {
        if (!result?.info?.secure_url) return;
      
        const uploaded = {
          src: result.info.secure_url,
          name: `${result.info.original_filename}.${result.info.format}`,
        };
      
        setPreviewImages([uploaded]);
        setFormData(prev => ({
          ...prev,
          image: result.info.secure_url,
          imageName: uploaded.name,
        }));
    }, []);

    const handleDeleteImage = useCallback(async () => {
        const imageToDelete = previewImages[0];
      
        if (!isEdit && imageToDelete) {
          const success = await deleteImage(imageToDelete.src ?? formData.image);
          if (!success) {
            return toast.error("이미지 삭제에 실패하였습니다.");
          }
          toast.success(`이미지 "${imageToDelete.name}" 삭제되었습니다.`);
        }
      
        setPreviewImages([]);
        setFormData(prev => ({ ...prev, image: '', imageName: '' }));
    }, [formData.image, isEdit, previewImages]);
      
    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(formData.category === "") {
            selectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return toast.error("카테고리를 선택해주세요.");
        }
        if(formData.title === "" ) {
            titleRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            titleRef?.current?.focus();
            return toast.error("제목을 입력해주세요.");
        }
        if(formData.description === "") {
            textareaRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            textareaRef?.current?.focus();
            return toast.error("내용을 입력해주세요.");
        }
        setIsLoading(true);

        const variables = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            published: Boolean(formData.published),
            image: formData.image,
            imageName: formData.imageName,
        };

        try {
            const MAX_TITLE_LENGTH = 20;

            const shortTitle = variables.title.length > MAX_TITLE_LENGTH
                ? `${variables.title.slice(0, MAX_TITLE_LENGTH)}...`
                : variables.title;

            if (isEdit) {
                setloadingMessage('수정한 글을 저장하고 있습니다.');
                await updatePost({ variables: { id, ...variables } });
                toast.success(`${shortTitle} 글이 수정되었습니다`);
                setFormData(InitFormData);
            } else {
                setloadingMessage('작성한 글을 저장하고 있습니다.');
                await addPost({ variables });
                toast.success(`${shortTitle} 글이 등록되었습니다`);
                setFormData(InitFormData);
            }
        } catch (error) {
            toast.error("작업 중 오류가 발생했습니다.");
            setIsLoading(false);
        }
    }, [formData, isEdit, id, addPost, updatePost]);

    const categories = useMemo(() => [
        "next.js 14", 
        "mongodb", 
        "prisma",
        "apollo", 
        "react",
        "웹접근성", 
        "tailwind",
        "기타",
    ], []);

    return (
        <>
            {isLoading && <PointsLoading loadingMessage={loadingMessage} />}
            <form 
                onSubmit={handleSubmit} 
                className="flex flex-col lg:flex-row gap-4 sm:gap-8 p-4 sm:p-8"
            >
                <div className="flex flex-col gap-3 w-full lg:w-[330px] shrink-0">
                    <ImageUploadButton 
                        onUploadSuccess={handleUpload} 
                        variant="default" 
                        isLoading={isLoading} 
                    />
            
                    {previewImages.length > 0 ? (
                        <>
                            <div className="relative w-full lg:w-[300px] h-[200px]">
                                <Image
                                    src={previewImages[0]?.src ?? formData?.image }
                                    alt={previewImages[0]?.name ?? formData?.imageName}
                                    fill
                                    sizes="300px"
                                    className="w-full object-cover rounded-md shadow-md"
                                />
                            </div>
                            <div className="flex items-center gap-3 mt-2 break-all">
                                {previewImages[0]?.name ?? formData?.imageName}
                                <FaTrashAlt
                                    size={18}
                                    tabIndex={0}
                                    onClick={handleDeleteImage}
                                    className="cursor-pointer"
                                />
                            </div>
                        </>
                        ) : (
                        <div className="flex flex-col justify-center items-center gap-5 w-full h-[200px] border-default rounded-md">
                            <ImFilesEmpty className="text-7xl" />
                            업로드한 이미지가 없습니다.
                        </div>
                    )}
                </div>
        
                <div className="flex-grow">
                    <div className="flex flex-col gap-4">
                        <Checkbox
                            name="published"
                            isSelected={!!formData.published}
                            onChange={handleChange}
                            disabled={isLoading}
                        >
                            {formData?.published ? '공개' : '비공개'}
                        </Checkbox>
            
                        <Select
                            ref={selectRef}
                            aria-label="카테고리"
                            name="category"
                            onChange={handleChange}
                            placeholder="카테고리를 선택해주세요."
                            selectedKeys={[formData.category]}
                            disabled={isLoading}
                            className="max-w-sm"
                            isRequired
                            showScrollIndicators
                        >
                            {categories.map((value) => (
                                <SelectItem key={value}>{value}</SelectItem>
                            ))}
                        </Select>
            
                        <Input
                            ref={titleRef}
                            name="title"
                            placeholder="제목을 입력해주세요."
                            value={formData.title}
                            onChange={handleChange}
                            disabled={isLoading}
                            isRequired
                        />

                        <Textarea
                            ref={textareaRef}
                            name="description"
                            placeholder="내용을 입력해주세요."
                            minRows={8}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={isLoading}
                            isRequired
                        />
                
                        <Button 
                            type="submit" 
                            color="primary" 
                            disabled={isLoading}
                        >
                            {isEdit ? "수정" : "확인"}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}

export default FormPost;

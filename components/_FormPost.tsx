"use client"
import { BASE_URL } from '@/config';
import { ADD_POST, UPDATE_POST } from '@/graphql/mutations';
import { GET_POSTS, GET_POST } from '@/graphql/queries';
import { ChangeEvent, FormEvent, Fragment, useRef, useState } from "react";
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ImFilesEmpty } from "react-icons/im";
import { FaFileUpload } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { Button, Checkbox, Input, Textarea } from '@nextui-org/react';
import {Select, SelectItem} from "@nextui-org/react";
import toast from 'react-hot-toast';
import { FormPostData } from '@/src/app/types/blog';
import { InitFormData } from '@/src/app/types/init';

interface selectedOptionProps {
    value: string;
    label: string;
}

interface IPreviewImage {
    name: string;
    src: string;
}

interface FormPostProps {
    id?: string; 
    initialData?: FormPostData;
    isEdit?: boolean;
}

const FormPost = ({ id, initialData, isEdit} : FormPostProps) => {
    const [ swiperIndex, setSwiperIndex] = useState(0);
    const [ isLoading, setIsLoading ] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [formData, setFormData] = useState<FormPostData>(isEdit && initialData ? initialData : InitFormData);
    const [previewImage, setPreviewImage] = useState<IPreviewImage[]>([]);
    const { data: dataPost, loading: loadingPost, error: errorPost } = useQuery(GET_POST, {
        variables: {id},
        onCompleted: (result) => {
            if(result.post){
                setFormData(result.post);
                readFiles(result.post.id);
            }
        },
    });

    const [addPost, { data, loading, error}] = useMutation(ADD_POST, {
        variables: { title : formData?.title, description: formData?.description },
        refetchQueries : [{query: GET_POSTS}],
        onCompleted: (result) => {
            if(formData.files) {
                uploadFiles(`${result.addPost.id}`);
            } else {
                router.push(`/posts/${result.addPost.id}`);
                setFormData(InitFormData);
            }
        },
    });

    const [updatePost] = useMutation(UPDATE_POST, {
        variables: {id, title: formData?.title, description: formData?.description},
        refetchQueries: [{query: GET_POST, variables: {id}}],
        onCompleted: (result) => {
            uploadFiles(`${result.updatePost.id}`);
            router.push(`/posts/${result.updatePost.id}`);
        },
    });

    const options:selectedOptionProps[] = [
        { value: 'next.js 14', label: 'option1' },
        { value: 'mongodb', label: 'option2' },
        { value: 'prisma', label: 'option3' },
        { value: 'apollo', label: 'option4' },
        { value: 'react', label: 'option5' },
        { value: '웹접근성', label: 'option6' },
        { value: 'tailwind', label: 'option7' },
    ];

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement & HTMLInputElement & HTMLSelectElement>) => {
        // e.preventDefault();
        const { name, value, checked  } = e.target;

        setFormData({
            ...formData,
            [name]: name === 'published' ?  checked : value,
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        // if (formData.title === "" || formData.description === "") return alert("Enter fields");

        await addPost({
            variables: { 
                title : formData.title, 
                description: formData.description,
                category: formData.category,
                published: formData.published,
            },
        });
    };

    const handleUpdatePost = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.title === "" || formData.description === "") return alert("Enter fields");

        await updatePost({
            variables: { 
                id, 
                title : formData.title, 
                description: formData.description,
                category: formData.category,
                published: Boolean(formData.published),
            },
        });

        setFormData(InitFormData);
    }

    const handleChangeFiles = async (e: ChangeEvent<HTMLInputElement>) => {
        const { files, name } = e.target;

        if (e.target.files !== null && files) {
            const fileLength = Object.keys(files).length;
            if(fileLength > 0 ) setPreviewImage([]);
            Object.keys(files).forEach((i: any) => {
                const file = files[i];
                const reader = new FileReader();
                reader.readAsDataURL(file); 
                // 파일을 불러오는 메서드, 종료되는 시점에 readyState는 Done(2)이 되고 onLoad 시작
                reader.onload = (e: any) => {
                    //server call for uploading or reading the files one-by-one
                    //by using 'reader.result' or 'file'
                    if(reader.readyState === 2) {
                        // 파일 onLoad가 성공하면 2, 진행 중은 1, 실패는 0 반환
                        setPreviewImage((prevState) => ([
                            ...prevState, 
                            {
                                name: file.name,
                                src: e.target.result
                            }
                        ]));
                        if(i == fileLength - 1) {
                            setFormData((prevState) => ({
                                ...prevState,
                                [name]: files
                            }));
                        }
                    }
                }
            });
            // 이미지 화면에 띄우기
            // const reader = new FileReader();
            // // // 파일을 불러오는 메서드, 종료되는 시점에 readyState는 Done(2)이 되고 onLoad 시작
            // reader.onload = (e: any) => {
            //     if(reader.readyState === 2) {
            //         // 파일 onLoad가 성공하면 2, 진행 중은 1, 실패는 0 반환
            //         setPreviewImage(e.target.result);
            //         setFormData((prevState) => ({
            //             ...prevState,
            //             [name]: files
            //         }));
            //     }
            // }
            // reader.readAsDataURL(files?.[0]);
        }

    }

    const uploadFiles = async (id : string) => {
        if(!formData.files) return;
        const formFilesData = new FormData();
        formFilesData.append("filesId", id); 

        Object.values(formData.files).map((file : any, i )  => {
            formFilesData.append(`files`, file)
        });
        try { 
            const res = await fetch(`${BASE_URL}/api/upload`, { 
                method: 'POST', body: formFilesData, 
            }); 
            // const data = res.json();
            if( res.status === 200 ) {
                setFormData(InitFormData);
                router.push(`/posts/${id}`);
                toast.success('글이 작성되었습니다.');
            }
        } catch(error){ 
            toast.error('파일을 업로드하는 중 오류가 발생하여, 업로드에 실패하였습니다.');
            console.log(error);
        } 
    }; 

    const readFiles = async (id : string) => {
        const { files, file } = await (await fetch(`${BASE_URL}/api/upload/${id}`, {
            method: 'GET',
        })).json();

        const fileURL = files.map((item: any) => ({src: item.file, name: item.name}));

        setPreviewImage(fileURL);
        setFormData((prevState) => ({
            ...prevState,
            "files": files,
        }));
    };

    const handleDelete = (e: any, idx: number, name: string) => {
        if ( e?.key === undefined || e?.key === 'Enter') {

            setPreviewImage(previewImage.filter((file, i: number) => file.name !== name));

            const files = Object.fromEntries(Object.entries<any>(formData?.files).filter(([key, value]) => {
                // console.group('value', value.name);
                if(value.name !== name){
                    return [key, value]
                }
            }));
        
            setFormData((prevState) => ({
                ...prevState,
                files
            }));
        }
    };

    const handleKeyDownDelete = (e: any) => {
        if(e.key !== 'Enter') return;

        setPreviewImage(previewImage.filter((file, i: number) => file.name !== previewImage[swiperIndex]?.name));

        const files = Object.fromEntries(Object.entries<any>(formData?.files).filter(([key, value]) => {
            // console.group('value', value.name);
            if(value.name !== previewImage[swiperIndex]?.name){
                return [key, value]
            }
        }));
    
        setFormData((prevState) => ({
            ...prevState,
            files
        }));
    };

    return (
        <>
            {id && !loadingPost && !dataPost?.post && <div>
                {id} 글을 찾지 못했습니다.
                새로운 글을 작성할 수 있습니다.
            </div>}
            <div className='
                    flex 
                    flex-col
                    lg:flex-row 
                    gap-8 
                    p-8
                '
            >
                <div className='
                    flex
                    flex-col 
                    gap-3
                    w-full
                    lg:w-[330px] 
                    shrink-0
                '>
                    <div>
                        <Button
                            onPress={() => fileRef.current?.click()}
                            disabled={isLoading}
                            type="button"
                            color='primary'
                            variant='solid'
                            className='
                                flex 
                                flex-row
                                items-center
                                gap-1
                                cursor-pointer
                            '
                        >
                            <FaFileUpload size={16}/>
                            사진 업로드
                        </Button>
                        <input 
                            disabled={isLoading}
                            multiple
                            ref={fileRef}
                            id='file'
                            name="files"
                            onChange={handleChangeFiles}
                            type="file"
                            placeholder='Enter file'
                            className='hidden'
                        />
                    </div>
                    {previewImage.length > 0 ? 
                        (
                            <>
                                {/* {previewImage.map((url) => {
                                    return <Image key={url} src={url} alt="preview-img" width={300} height={100}/>
                                })} */}
                                {/* {Object.entries(previewImage).map(([key, value]) => {
                                    return (
                                        <Fragment key={value.name}>
                                            <Image 
                                                src={value.src} 
                                                alt="preview-img" 
                                                width="300"
                                                height="50"
                                                priority={true}
                                                className='w-auto h-auto'
                                            />
                                            {value.name}
                                            <FaTrashAlt 
                                                size={18} 
                                                onClick={() => handleDelete(+key ,value.name)}
                                            />
                                        </Fragment>
                                    )
                                })} */}
                                
                                        <Swiper
                                            navigation={true}
                                            pagination={{ 
                                                type: 'fraction',
                                            }}
                                            modules={[Navigation, Pagination, A11y]}
                                            onActiveIndexChange={(index: any) => setSwiperIndex(index.activeIndex)}
                                            className="
                                                mySwiper
                                                relative
                                                w-full
                                                lg:w-[300px]
                                                lg:h-[200px]
                                                sm:h-[500px]
                                                max-sm:h-[340px]
                                            "
                                        >
                                            {Object.values(previewImage).map((item: any, i: number) => (
                                                <SwiperSlide key={item.name} >
                                                    <Image 
                                                        src={item.src} 
                                                        alt={item.name}
                                                        fill
                                                        sizes="300px"
                                                        className='w-full object-cover'
                                                        priority={true}
                                                    />
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                        <span 
                                            className='
                                                flex
                                                flex-row
                                                items-center
                                                gap-3
                                                break-all
                                            '
                                        >
                                            {previewImage[swiperIndex]?.name}
                                            <FaTrashAlt 
                                                size={18}
                                                tabIndex={0}
                                                onKeyDown={(e) => handleKeyDownDelete(e)} 
                                                onClick={() => handleDelete(null, swiperIndex ,previewImage[swiperIndex]?.name)}
                                                className='shrink-0 cursor-pointer'
                                            />
                                            <br/>
                                        </span>
                            </>
                        )
                        :
                        <div className='
                            flex
                            flex-col
                            justify-center
                            items-center
                            gap-5
                            w-full
                            h-[330px]
                            border-default
                            rounded-md
                            max-md:h-[160px]
                        '>
                            <ImFilesEmpty className='text-7xl max-md:text-5xl'/>
                            업로드한 이미지가 없습니다.
                        </div>
                    }
                </div>
                <div className='flex-grow'>
                    <form
                        onSubmit={!isEdit? handleSubmit : handleUpdatePost}
                        className='
                            flex 
                            flex-col 
                            justify-center 
                            relative 
                            gap-4
                        '
                    >
                        <Checkbox 
                            disabled={isLoading}
                            name="published"
                            // isSelected={typeof formData?.published === 'string' && formData.published === 'true' ? true : false}
                            // checked={typeof formData?.published === 'string' && formData.published === 'true' ? true : false}
                            isSelected={!isEdit ? formData?.published 
                                : typeof formData?.published === 'string' && formData.published === 'true' ? true : false}
                            checked={!isEdit ? formData?.published 
                                : typeof formData?.published === 'string' && formData.published === 'true' ? true : false}
                            onChange={handleChange}
                        >
                            {formData?.published ? '공개' : '비공개'}
                        </Checkbox>
                        <div className='
                                flex
                                items-center
                                max-md:flex-col
                                max-md:items-start
                                max-md:gap-1
                            '
                        >
                            <span className='
                                    shrink-0 
                                    w-[88px]
                            '>
                                카테고리
                            </span>
                            <Select
                                aria-label='카테고리'
                                name="category"
                                onChange={handleChange}
                                placeholder="카테고리를 선택해주세요."
                                showScrollIndicators={true}
                                className='max-w-sm'
                                disabled={isLoading}
                                selectedKeys={[formData?.category]}
                            >
                                {options.map((option) => (
                                    <SelectItem 
                                        key={option.value}
                                    >
                                        {option.value}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div className='
                            flex
                            items-center
                            max-md:flex-col
                            max-md:items-start
                            max-md:gap-1
                        '>
                            <span className='shrink-0 w-[88px]'>
                                제목
                            </span>
                            <Input
                                type="text"
                                aria-label='제목'
                                name="title"
                                placeholder="제목을 입력해주세요."
                                description=''
                                fullWidth
                                value={formData?.title}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                        {/* <input
                            disabled={isLoading}
                            name="title"
                            value={formData?.title}
                            onChange={handleChange}
                            type='text'
                            placeholder='Enter title!'
                            className='bg-transparent border p-2 rounded-lg'
                        /> */}
                        <div className='
                            flex
                            max-md:flex-col
                            max-md:items-start
                            max-md:gap-1
                        '>
                            <div 
                                className='w-[88px] shrink-0'
                            >
                                첨부파일
                            </div>
                            <div
                                className='
                                    flex
                                    flex-col
                                    grow
                                    gap-1
                                    min-h-[40px]
                                    p-2
                                    bg-[#F4F4F5]  
                                    dark:bg-[#27272A]  
                                    rounded-lg 
                                    break-all
                                    max-md:w-full
                                '
                            >
                                {formData?.files && (
                                    Object.values(formData.files).map((file : any, idx: number) => 
                                        <span 
                                            key={file.name}
                                            className='
                                                flex
                                                flex-row
                                                items-center
                                                gap-3
                                            '
                                        >
                                            {file.name} 
                                            <FaTrashAlt 
                                                size={18} 
                                                tabIndex={0}
                                                onClick={() => handleDelete(null, idx ,file.name)}
                                                onKeyDown={(e) => handleDelete(e, idx ,file.name)}
                                                className='cursor-pointer'
                                            />
                                            <br/>
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                        <div className='
                            flex
                            max-md:flex-col
                            max-md:items-start
                            max-md:gap-1
                        '>
                            <span className='shrink-0 w-[88px]'>
                                내용
                            </span>
                            <Textarea
                                disabled={isLoading}
                                minRows={8}
                                maxRows={8}
                                placeholder="내용을 입력해주세요."
                                name="description"
                                value={formData?.description}
                                onChange={handleChange}
                            />
                        </div>
                        {/* <textarea
                            disabled={isLoading}
                            name="description"
                            value={formData?.description}
                            onChange={handleChange}
                            className='p-3'
                            rows={5}
                            placeholder="Enter description"
                        >

                        </textarea> */}
                        <Button 
                            disabled={isLoading}
                            type="submit" 
                            color='primary'
                            variant='solid'
                        >
                            {!isEdit? "확인" : "수정"}
                        </Button>
                    </form>
                </div>
            </div>  
        </>
    )
}

export default FormPost;

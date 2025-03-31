'use client';
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import { CldUploadButton } from 'next-cloudinary';
import MessageTextarea from "./MessageTextarea";
import TextareaAutosize from 'react-textarea-autosize';
import { useSocket } from "../context/socketContext";
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import ImageUploadButton from "@/src/app/components/ImageUploadButton";

const Form = () => {
    const socket = useSocket();
    const [ isDisabled, setIsDisabled ] = useState(false);
    const { conversationId } = useConversation();

    const { 
        mutate, 
        data,
        isSuccess
    }  = useMutation({
        mutationFn: sendMessage,
        onSuccess: (data) => {
            setValue('message', '', { shouldValidate : true});
            if(socket) socket.emit('send:message', data);
        },
        onError: (error) => {
            toast.error(`${error.message || '대화 내용이 입력되지 못했습니다.'}`);
        },
        onSettled: () => {
            setIsDisabled(false);
        }
    });

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        trigger,
        setFocus,
        formState: {
            errors
        }
    } = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    });

    useEffect(() => {
        setFocus("message");
    }, [isSuccess]);

    const onSubmit:SubmitHandler<FieldValues> = async (data) => {
        if(!data) return;
        mutate({conversationId, data});
        if(socket) socket.emit('join:room', conversationId);
    };

    const handleUpload = async (result: any) => {
        if(!result?.info?.secure_url) return;
        mutate({conversationId, image: result?.info?.secure_url});
    };

    const handleKeyPress = async (e: any) => {
        if (e.isComposing || e.keyCode === 229) return; 
        if( e.key == 'Enter' && e.shiftKey) return; 
        if(e.key === 'Enter' && !e.shiftKey ) {
            e.preventDefault(); 
            // trigger(); // execute react-hook-form submit programmatically 
            setIsDisabled(true);
          
            const value = getValues('message'); // get user input value
            
            if(value.length > 0){
                await onSubmit({ ['message']: value }, e); // fire onSubmit() by key press
            }        
        }
    };

    return (
        <div
            className="
                flex
                items-start
                gap-2
                w-full
                px-4
                py-2
                bg-default
                border-t-default
            "
        >
            <ImageUploadButton 
                onUploadSuccess={handleUpload}
                variant="compact"
            />
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex items-center gap-2 w-full"
            >
                {/* <MessageTextarea
                    id="message"
                    register={register}
                    errors={errors}
                    required
                    placeholder="메시지를 작성해주세요."
                    onKeyDown={handleKeyPress}
                /> */}
                <TextareaAutosize
                    id="message"
                    minRows={2}
                    maxRows={4}
                    {...register('message', { required: true })}
                    placeholder="메시지를 작성해주세요."
                    onKeyDown={handleKeyPress}
                    disabled={isDisabled}
                    className='
                        w-full 
                        bg-default
                        border-default
                        rounded-lg
                        p-2
                        font-light
                        resize-none
                        focus:outline-none
                    '
                />
                <button 
                    type="submit"
                    className="
                        rounded-full
                        p-2
                        bg-sky-500
                        cursor-pointer
                        hover:bg-sky-600
                        transition
                    "
                >
                    <HiPaperAirplane 
                        size={20}
                        className="text-white"
                    />
                </button>
            </form>
        </div>
    )
}

export default Form;

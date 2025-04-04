'use client';
import useConversation from "@/src/app/hooks/useConversation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane } from "react-icons/hi2";
import MessageTextarea from "./MessageTextarea";
import TextareaAutosize from 'react-textarea-autosize';
import { useMutation } from "@tanstack/react-query";
import { sendMessage } from "@/src/app/lib/sendMessage";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import ImageUploadButton from "@/src/app/components/ImageUploadButton";
import { useSocket } from "../../context/socketContext";
import useComposition from "@/src/app/hooks/useComposition";

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

    const { ref: inputRef, ...rest } = register('message', { required: true });

    const onSubmit:SubmitHandler<FieldValues> = async (data) => {
        if(!data || isDisabled) return;

        setIsDisabled(true);

        mutate({conversationId, data});
        if(socket) socket.emit('join:room', conversationId);

        // ✅ 모바일 키보드가 계속 유지되도록 다시 포커스
        setTimeout(() => setFocus("message"), 100); // 약간의 딜레이로 안정성 ↑
    };

    const handleUpload = async (result: any) => {
        if(!result?.info?.secure_url) return;
        mutate({conversationId, image: result?.info?.secure_url});
    };

    // ✅ 조합 입력 훅 적용
    const {
        isComposing,
        handleCompositionStart,
        handleCompositionEnd
    } = useComposition();

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (isComposing()) return;
        if (e.key === 'Enter' && !e.shiftKey ) {
            e.preventDefault(); 
            if (isDisabled) return;
            // trigger(); // execute react-hook-form submit programmatically 
            
            const value = getValues('message'); // get user input value
            if (value.trim().length === 0) return; // 빈 메시지 방지

            setIsDisabled(true);
            await await onSubmit({ message: value }, e);

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
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
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
                    type="button"
                    onClick={handleSubmit(onSubmit)}
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

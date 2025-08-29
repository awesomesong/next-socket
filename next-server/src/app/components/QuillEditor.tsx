"use client";
import dynamic from "next/dynamic";
import { forwardRef, memo } from "react";
import type ReactQuillOriginal from 'react-quill-new';
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

interface MyQuillEditorProps {
  value: string;
  onChange: (content: string, delta: any, source: string, editor: any) => void;
  placeholder?: string;
  modules?: any;  
  formats?: string[];
  [key: string]: any;
}

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    const ForwardedReactQuill = forwardRef<ReactQuillOriginal, MyQuillEditorProps>((props, ref) => {
      return <RQ ref={ref} {...props} />;
    });
    ForwardedReactQuill.displayName = 'ForwardedReactQuill';
    return ForwardedReactQuill;
  },
  {
    ssr: false,
    loading: () => {
        return  (
            <div className='flex flex-1 h-full'>
                <ShapesSkeleton width='100%' height='100%' radius='md' />
            </div>
        )
    }
  }
);

const MyQuillEditor = forwardRef<ReactQuillOriginal, MyQuillEditorProps>(
    ({ value, onChange, modules, formats, placeholder, ...props }, ref) => {
  return (
    <ReactQuill
      ref={ref}
      value={value}
      onChange={onChange}
      theme="snow"
      placeholder={placeholder}
      modules={modules}
      formats={formats}
      {...props}
    />
  );
});

MyQuillEditor.displayName = 'MyQuillEditor';

export default memo(MyQuillEditor);
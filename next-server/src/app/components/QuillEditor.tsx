"use client";
import dynamic from "next/dynamic";
import { forwardRef, memo } from "react";
import type ReactQuillOriginal from 'react-quill-new';
import type { DeltaStatic, EmitterSource } from 'react-quill-new';
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

interface UnprivilegedEditor {
  getLength: () => number;
  getText: (index?: number, length?: number) => string;
  getHTML: () => string;
  getSemanticHTML: (range?: { index: number; length: number } | number, length?: number) => string;
  getBounds: (index: number | { index: number; length: number }, length?: number) => { top: number; bottom: number; left: number; right: number; width: number; height: number } | null;
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  getContents: (index?: number, length?: number) => DeltaStatic;
}

interface QuillModules {
  toolbar?: unknown;
  keyboard?: unknown;
  history?: unknown;
  clipboard?: unknown;
  [key: string]: unknown;
}

interface MyQuillEditorProps {
  value: string;
  onChange: (content: string, delta: DeltaStatic, source: EmitterSource, editor: UnprivilegedEditor) => void;
  placeholder?: string;
  modules?: QuillModules;  
  formats?: string[];
  [key: string]: unknown;
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
import dynamic from 'next/dynamic';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'quill-color-picker-enhance/dist/index.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import ShapesSkeleton from './skeleton/ShapesSkeleton';

interface ForwardedQuillComponent extends ReactQuillProps {
    forwardedRef: React.Ref<ReactQuill>;
}

export const DynamicReactQuill = dynamic( 
    async () => { 
        const { default: RQ } = await import("react-quill");
        const { SnowTheme } = await import('quill-color-picker-enhance');
        const { ImageResize } = await import('quill-image-resize-module-ts');

        RQ.Quill.register('themes/snow-quill-color-picker-enhance', SnowTheme);
        RQ.Quill.register("modules/ImageResize", ImageResize);
        hljs.configure({
            languages: ['javascript', 'CSS', 'HTML', "ruby", "python", "java", "cpp", "kotlin", "sql"],
        });

        const Quill = ({ forwardedRef, ...props }: ForwardedQuillComponent) => (
            <RQ ref={forwardedRef} {...props} />
        );
        return Quill;
    }, {
    loading: () => {
        const width = '100%';
        const height = '100%';

        return  (
            <div className='flex flex-1 h-full'>
                <ShapesSkeleton width={width} height={height} radius='md' />
            </div>
        )
    },
    ssr: false,
});
  
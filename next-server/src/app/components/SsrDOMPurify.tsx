'use client'
import clsx from "clsx";
import DOMPurify from "dompurify";

interface Props {
    content : string;
    className?: string;
}

const SsrDOMPurify = ({content, className}: Props) => {
    const cleanContent = DOMPurify.sanitize(content);

    return (
        <pre
            className={clsx(className)}
            dangerouslySetInnerHTML={{
                __html: cleanContent
            }}
        />
    )
}

export default SsrDOMPurify;
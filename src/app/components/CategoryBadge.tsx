type Props = {
    text: string;
}

const CategoryBadge = ({text}: Props) => {
    return (
        <div>
            <span className="
                inline-block
                mr-2
                px-3 
                pt-2
                pb-1.5
                bg-blue-600 
                text-neutral-200
                text-xs 
                rounded-full 
                font-medium
            ">
                카테고리
            </span>
            <span>{text}</span>
        </div>
    )
}

export default CategoryBadge

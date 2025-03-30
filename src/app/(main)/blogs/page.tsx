import Blogs from '@/components/Blogs';
import CreateBlogBtn from "@/components/CreateBlogBtn";
import { getCurrentUser } from "@/src/app/lib/session";

const BlogsPage = async () => {

    const currentUser = await getCurrentUser();

    return (
        <>
            <div className='content-wrap flex-col gap-4'>
                <div className='
                    flex 
                    flex-row
                    justify-between
                    items-center
                '>
                    <h1 className='text-3xl font-bold'>Blogs</h1>
                    {currentUser?.email && <CreateBlogBtn />}
                </div>
                <Blogs />
            </div>
           
        </>
    );
}

export default BlogsPage;
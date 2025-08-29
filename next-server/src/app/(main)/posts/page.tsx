"use client"
import { GET_POSTS } from '@/graphql/queries';
import { IPost } from '@/typings';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useRef, useState, useCallback, useMemo } from 'react';
import { Button } from '@heroui/react';
import StatusMessage from '@/src/app/components/StatusMessage';
import PostDeleteButton from '@/src/app/components/PostDeleteButton';
import Post from '@/src/app/components/Post';
import PostPreviewSkeleton from '@/src/app/components/skeleton/PostPreviewSkeleton';
import { useSession } from 'next-auth/react';

const PostsDetailpage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [checkItems, setCheckItems] = useState<string[]>([]);
  const allCheckedRef = useRef<HTMLInputElement>(null);
  
  const { data, loading, error } = useQuery(GET_POSTS);
  const posts: IPost[] = data?.posts;
  
  const HandlerCheckItem = useCallback((id : string, isChecked : boolean) => {
      if (isChecked) {
          setCheckItems((prev) => [...prev, `${id}`])
      } else {
          setCheckItems((prev) => prev.filter((item) => item !== id))
      }
  }, []);
  
  const handlerAllChecked = useCallback((e : ChangeEvent<HTMLInputElement>) => {
      const { checked } = e.target;

      if (checked) { 
          setCheckItems(posts.map((post) => post.id))
      } else {
          setCheckItems([]);
      }
  }, [posts]);

    const selectedPosts = useMemo(() => 
        posts?.filter((post) => checkItems.includes(post.id))
            .map((post) => ({
                id: post.id,
                writerEmail: post.writer.email,
            })) || [], [posts, checkItems]);

  return (
      <>
          <div className='
              content-wrap
              flex-col 
          '>
              <div className='flex justify-between mb-3'>
                  <div className='flex flex-row gap-4 min-h-10'>
                      {session?.user?.id && posts?.length > 0 && (
                          <div className='flex flex-row'>
                              <label>
                                  <input
                                      ref={allCheckedRef}
                                      disabled={loading}
                                      type='checkbox'
                                      className='hidden'
                                      id="allCheck"
                                      onChange={handlerAllChecked}
                                      checked={posts?.length > 0 && checkItems.length === posts?.length ? true : false}
                                  />
                              </label>
                              <Button
                                  isDisabled={loading}
                                  type='button'
                                  color='default'
                                  variant='bordered'
                                  radius='sm'
                                  className='btn-bg'
                                  onPress={() => allCheckedRef?.current?.click()}
                              >
                                  전체 선택
                              </Button>
                          </div>
                      )}
                      {checkItems.length > 0 
                          && <PostDeleteButton 
                                ids={checkItems} 
                                setCheckItems={setCheckItems} 
                                myEmail={session?.user?.email!}
                                selectedPosts={selectedPosts}
                            />
                      }
                  </div>
                  <div>
                    {session?.user?.id && 
                      <Button
                          isDisabled={loading}
                          type='button'
                          color='default'
                          variant='bordered'
                          radius='sm'
                          className='btn-bg'
                          onPress={() => router.push('/posts/create')}
                      >
                          글쓰기
                      </Button>
                    }
                  </div>
              </div>
              {loading && <PostPreviewSkeleton />}    
              {!loading && posts?.length > 0 && 
                <div className="layout-card--post">
                  {posts.map((post) => (
                    <Post 
                      key={post.id} 
                      post={post} 
                      HandlerCheckItem={HandlerCheckItem}
                      isChecked={checkItems.includes(post.id) ? true : false}
                    />
                  ))}
                </div>
              }
              {!loading && posts?.length === 0 && 
                  <StatusMessage message="작성된 글이 없습니다." />
              }

              {!loading && error && 
                  <StatusMessage message="해당 글을 불러오지 못했습니다." />
              }
          </div>
      </>
  )
}

export default PostsDetailpage;
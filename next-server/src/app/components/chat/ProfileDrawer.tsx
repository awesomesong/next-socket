"use client";
import { Conversation, User } from "@prisma/client";
import { useCallback, useMemo, useState } from "react";
import { IoIosExit } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import Avatar from "@/src/app/components/Avatar";
import ConfirmModal from "./ConfirmModal";
import { IUserList, IUserListOptions } from "@/src/app/types/common";
import { prioritizeArray } from "@/src/app/utils/prioritizeArray";
import { useSession } from "next-auth/react";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: Conversation & {
    users: User[];
  };
  otherUser: IUserList & IUserListOptions;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  data,
  otherUser,
}) => {
  const { data: session } = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const myEmail = session?.user?.email ?? null;
  const users = useMemo(() => data?.users ?? [], [data?.users]);
  const sortedUser = useMemo(() => prioritizeArray(users, "email", myEmail),
    [users, myEmail]
  );

  const openConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  }, []);  

  return (
    <>
      <ConfirmModal
        isOpen={confirmOpen}
        onCloseModal={() => setConfirmOpen(false)}
        name={data.name || otherUser.name}
      ></ConfirmModal>
      {!isOpen ? null : (
        <div
          className="fixed inset-0 z-[100]"
          onClick={onClose}
        >
          <div
            className="
              fixed
              inset-0
              bg-neutral-800/75
              backdrop-blur-sm
            ">
            <div
              className="
                fixed
                inset-0
                overflow-hidden
            ">
              <div
                className="
                  pointer-events-none
                  fixed
                  inset-y-0
                  right-0
                  flex
                  max-w-full
                effect-rightLeft
              ">
                <div
                  className="
                    pointer-events-auto
                    w-screen
                    max-w-md
                ">
                  <div
                    className="
                      flex
                      flex-col
                      gap-5
                      overflow-y-scroll
                      h-screen
                      py-3
                      pl-4
                      pr-2
                      sm:py-4
                      sm:pl-4
                      sm:pr-3
                      bg-default
                      shadow-xl
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="
                        flex 
                        flex-row
                        items-start
                        justify-between
                        gap-3
                      "
                    >
                      <div>
                        <span className="text-xl font-semibold">채팅방 서랍</span>
                        {data?.isGroup && (
                          <p>
                            {data.name}{" "}
                            <span className="text-gray-500">
                              ( {users.length}명 )
                            </span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={onClose}
                        type="button"
                        className="
                          rounded-md
                          hover:text-gray-500
                          focus:outline-none
                          focus:ring-2
                          focus:ring-sky-500
                          focus:ring-offset-2
                        "
                      >
                        <span className="sr-only">Close</span>
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      {data?.isAIChat ? (
                        // AI 채팅방인 경우 AI 어시스턴트 표시
                        <div className="flex flex-row items-center gap-3">
                          <div>
                            <Avatar user={otherUser} isAIChat={true} />
                          </div>
                          <div>하이트톡톡 AI 어시스턴트</div>
                        </div>
                      ) : (
                        // 일반 채팅방인 경우 기존 사용자 목록 표시
                        sortedUser.map((user, i) => (
                          <div
                            className="flex flex-row items-center gap-3"
                            key={user.id}
                          >
                            <div>
                              <Avatar user={user} />
                            </div>
                            <div className="flex flex-col">
                              <span>
                                {i === 0 && (
                                  <span
                                    className="
                                      inline-flex
                                      w-6
                                      h-6
                                      items-center
                                      justify-center
                                      mr-2
                                      bg-default-reverse 
                                      text-default-reverse
                                      rounded-lg
                                    "
                                  >
                                    나
                                  </span>
                                )}
                                {user.name}
                              </span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-center w-full my-10">
                      <div
                        onClick={openConfirm}
                        className="
                          flex
                          flex-row
                          gap-3
                          items-center
                          cursor-pointer
                          group
                      ">
                        <div
                          className="
                            w-10
                            h-10
                            bg-default-reverse
                            text-default-reverse
                            group-hover:bg-neutral-400 
                            group-hover:text-neutral-900
                            group-hover:dark:bg-neutral-500 
                            group-hover:dark:text-neutral-100
                            rounded-full
                            flex
                            items-center
                            justify-center
                        ">
                          <IoIosExit size={20} />
                        </div>
                        <div
                          className="
                            text-sm
                            font-light
                            group-hover:text-neutral-400 
                          ">
                          대화방 나가기
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDrawer;

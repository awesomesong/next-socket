import bcrypt from "bcryptjs";
import { AuthOptions, DefaultSession, DefaultUser, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/prisma/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */

    interface Session {
        user: User;
    }

    interface User {
        role? : string | undefined;
    }
}

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    // Configure one or more authentication providers
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                  prompt: "consent",
                  access_type: "offline",
                  response_type: "code"
                }
            },
            profile(profile) {
                return { 
                    id: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    image: profile.picture,
                    role: "user", 
                    provider: "google",
                }
            },
        }),
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "login",
                }
            },
            profile(profile) {
                return  { 
                    id: profile.id,
                    email: profile.kakao_account.email,
                    name: profile.kakao_account.profile.nickname,
                    image: profile.kakao_account.profile.profile_image_url,
                    role: "user",
                    provider: "kakao",
                }
            },
        }),      
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { 
                    label: 'email',
                    type: 'text'
                },
                password: {
                    label: 'password',
                    type: 'password'
                }
            },
            authorize: async (credentials) => {
                if(!credentials?.email) throw new Error('아이디를 입력해주세요.');
                if(!credentials?.password) throw new Error('비밀번호를 입력해주세요.');

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });
              
                if(!user || !user?.hashedPassword) {
                    throw new Error('아이디 또는 비밀번호를 잘못 입력했습니다. \n입력한 내용을 다시 확인해주세요.');
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                if(!isCorrectPassword) {
                    throw new Error('아이디 또는 비밀번호를 잘못 입력했습니다. \n입력한 내용을 다시 확인해주세요.');
                }

                const { id, email, name, image, role } = user;
                return { 
                    id, 
                    email: email ?? undefined, 
                    name: name ?? undefined, 
                    image: image ?? undefined, 
                    role: role ?? undefined 
                };
            }
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    debug: process.env.NODE_ENV !== "production",
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60
    },
    secret: process.env.NEXTAUTH_SECRET,
    events: {
        signIn: async (message) => { 
            /* user updated - e.g. their email was verified */ 
        },
        signOut: async (token) => {
            // add here
        },
    },
    callbacks: {
        jwt: async ({ token, account, user, trigger, session }) => {
            // 초기 로그인시 User 정보를 가공해 반환
            if (account) {
              return {
                // provider: account.provider,
                role: user?.role ?? token.role ?? "user",
                email: user?.email ?? token.email ?? "",
                id: user?.id ?? token.id ?? "",
                image: user?.image ?? token.image ?? null,
                name: user?.name ?? token.name ?? null,
              }
            }
            
            if ( trigger === 'update' && session?.name && session?.image) {
                const { name, image } = session; 
                // token의 정보를 업데이트
                token.name = name;
                token.image = image;
            }
            return token;

        },
        session: async ({ session, token }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id ? String(token.id) : "",
                    email: token.email ? String(token.email) : "",
                    name: token.name ? String(token.name) : null,
                    image: token.image ? String(token.image) : null,
                    role: token.role ? String(token.role) : "user",
                },
            };
        },
        redirect: async({ url, baseUrl }) => {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        }
    },
};
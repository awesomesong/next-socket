// apollo server
// GraphQL 엔드포인트 생성
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { PrismaClient } from "@prisma/client";
import prisma from "../../prisma/db";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/lib/auth";

// DB 연동을 위한 설정
export type Context = {
  prisma: PrismaClient;
};

// typeDefs : 애플리케이션 스키마, 엔드포인트, query할 수 있는 모든 데이터를 문서화
// resolver : 데이터를 가져오고, typeDefs 정의된 작업을 호출하기로 결정할 때 데이터베이스를 업데이트하는 함수
// apolloServer 초기화 및 인스턴스 생성, typeDefs & resolvers 개체 전달
const apolloServer = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== "production",
});

// Nextjs에서 apollo 서버를 통합해서 실행할 수 있도록 설정
// Nextjs App Router 를 지원
// GraphQL Playground 연결 (GUI)
// web framework
export default startServerAndCreateNextHandler(apolloServer, {
  context: async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    return {
      req,
      res,
      prisma,
      user: session?.user,
    };
  },
});

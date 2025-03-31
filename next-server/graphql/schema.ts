// entity 정의 
export const typeDefs = `#graphql
    # field 정의
    type User {
        id: ID!
        name: String
        email: String
        image: String
        role: String
    }

    type Post {
        id: ID!
        title: String
        description: String
        createdAt: String
        updatedAt: String
        category: String
        published: Boolean
        postComments: [PostComment]
        image: String
        imageName: String
        writer: User
    }

    type PostComment {
        id: ID!
        text: String
        postId: String
        createdAt: String
        writer: User
    }

    type Files {
        id: ID!
        name: String
        filesId: String
    }

    type Category{
        id: ID!
    }

    type Count {
        count: String!
    }

    # 특수한 유형 Query
    # 쿼리 내부의 데이터를 가져올 수 있음 
    # 클라이언트에서 실행되면, 0개 또는 여러개의 리스트를 반환
    type Query {
        post(id: ID!): Post
        posts: [Post]
        users(email: String!): [User]
    }

    # 데이터 업데이트
    type Mutation {
        addPost(title: String, description: String, category: String, published: Boolean, image: String, imageName: String): Post
        updatePost(id: ID!, title: String, description: String, category: String, published: Boolean, image: String, imageName: String): Post
        deletePost(id: [ID!]!): Count
        addPostComment(postId: ID!, text: String): PostComment
        deletePostComment(id: ID!): PostComment
    }
`;
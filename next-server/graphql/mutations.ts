import { gql } from "@apollo/client";

export const ADD_POST = gql`
  mutation AddPost(
    $title: String!
    $description: String!
    $category: String!
    $published: Boolean
    $image: String
    $imageName: String
  ) {
    addPost(
      title: $title
      description: $description
      category: $category
      published: $published
      image: $image
      imageName: $imageName
    ) {
      id
      published
    }
  }
`;

export const ADD_POST_FILES = gql`
  mutation AddPostFiles(
    $name: String
    $lastModified: Int
    $lastModifiedDate: String
    $size: Int
    $type: String
  ) {
    addPostFiles(
      name: $name
      lastModified: $lastModified
      lastModifiedDate: $lastModifiedDate
      size: $size
      type: $type
    ) {
      filesId
      name
      size
      type
    }
  }
`;

export const DELETE_POST = gql`
  mutation deletePost($id: [ID!]!) {
    deletePost(id: $id) {
      count
    }
  }
`;

export const UPDATE_POST = gql`
  mutation UpdatePost(
    $id: ID!
    $title: String
    $description: String
    $category: String
    $published: Boolean
    $image: String
    $imageName: String
  ) {
    updatePost(
      id: $id
      title: $title
      description: $description
      category: $category
      published: $published
      image: $image
      imageName: $imageName
    ) {
      id
      published
    }
  }
`;

export const ADD_POSTCOMMENT = gql`
  mutation addPostComment($postId: ID!, $text: String) {
    addPostComment(postId: $postId, text: $text) {
      id
    }
  }
`;

export const DELETE_POSTCOMMENT = gql`
  mutation deletePostComment($id: ID!) {
    deletePostComment(id: $id) {
      id
    }
  }
`;

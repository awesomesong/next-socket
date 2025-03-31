import { gql } from "@apollo/client";

export const GET_POSTS = gql`
    query Posts {
        posts {
            id
            title
            description
            createdAt
            updatedAt
            category
            published
            image
            imageName
            postComments {
                id
            }
            writer {
                name
                image
                email
            }
        }
    }
`;


export const GET_POST = gql`
	query Post($id: ID!) {
		post(id: $id) {
			postComments {
				id
				text
                createdAt
                writer {
                    name
                    image
                    email
                }
			}
			id
			title
            description
            createdAt
            updatedAt
            category
            published
            image
            imageName
            writer {
                name
                image
                email
            }
		}
	}
`;

export const GET_USERS = gql`
	query Users($email: String!) {
		users(email: $email) {
			id
            name
            email
            image
            provider
		}
	}
`;
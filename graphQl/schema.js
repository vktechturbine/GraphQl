
import {gql} from 'graphql-tag';


export const typeDefs = gql`

#     type TestData{
#        text:String!
#        values:Int!
#    }   
#    type Query{
#        hello : TestData!
#    }   
type Post{
    _id:ID!
    title:String!
    content:String!
    imageUrl:String!
    fileName:String!
    creator:User!
    createdAt:String!
    updatedAt:String!

}
type User{
    _id:ID!
    name:String!
    email:String!
    password:String!
    status:String!
    post:[Post!]!
}
input userInputData{
    email:String!
    name:String!
    password:String!
}
type AuthData{
    token:String!
    userId:String!
}
type PostsData{
    posts:[Post!]!
    totalPost:Int!
}
input postInputData{
    title:String!
    content:String!
    imageUrl:String
    fileName:String!
}
type Query{
    login(email:String!,password:String!) : AuthData!
    posts(page:Int!):PostsData!
    post(id:ID!):Post!
    user:User!
}
type Mutation{
    createUser (userInput:userInputData) : User!
    createPost(postInput:postInputData) : Post!
    updatePost(id:ID!,postInput:postInputData!):Post!
    deletePost(id:ID!) : Boolean
    updateStatus(status:String!):User!
}
   

`;




import {
    // BLOGGERS_COLLECTION_NAME,
    bloggersCollection,
    // COMMENTS_COLLECTION_NAME,
    commentsCollection,
    // POSTS_COLLECTION_NAME,
    postsCollection,
    // USERS_COLLECTION_NAME,
    usersCollection,
} from "./mongo.db";


const BLOGGERS_COLLECTION_NAME = "bloggers_collection";
const POSTS_COLLECTION_NAME = "posts_collection";
const USERS_COLLECTION_NAME = "users_collection";
const COMMENTS_COLLECTION_NAME = "comments_collection";

export enum CollectionNames {
    // Posts = POSTS_COLLECTION_NAME, // "postsCollection"
    // Blogs = BLOGGERS_COLLECTION_NAME, // "bloggersCollection"
    // Users = USERS_COLLECTION_NAME, // "usersCollection"
    // Comments = COMMENTS_COLLECTION_NAME, // "commentsCollection"
    Posts = "postsCollection",
    Blogs = "bloggersCollection",
    Users = "usersCollection",
    Comments = "commentsCollection",
}

export type Collections = {
    [CollectionNames.Posts]: typeof postsCollection;
    [CollectionNames.Blogs]: typeof bloggersCollection;
    [CollectionNames.Users]: typeof usersCollection;
    [CollectionNames.Comments]: typeof commentsCollection;
};

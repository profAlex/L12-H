import { LikeStatus } from "./comment-like-storage-model";

export type PostsLikesStorageModel = {
    postId: string;
    userId: string;
    userLogin: string;
    createdAt: Date;
    likeStatus: LikeStatus;
};
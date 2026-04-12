import { LikeStatus } from "./comment-like-storage-model";

export type LikesInfoViewModel = {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
}

export type LikesInfoStorageModel = {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
}
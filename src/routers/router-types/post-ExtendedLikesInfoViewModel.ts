import { LikeStatus } from "./comment-like-storage-model";
import { LikeDetailsViewModel } from "./post-LikeDetailsViewModel";

export type ExtendedPostViewModel = {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatus;
    newestLikes: LikeDetailsViewModel[];
}
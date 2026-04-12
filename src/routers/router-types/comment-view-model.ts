import { CommentatorInfo } from "./comment-commentator-info";
import { LikesInfoViewModel } from "./comment-likes-info-view-model";

export type CommentViewModel = {
    id: string;
    content: string;
    commentatorInfo: CommentatorInfo;
    createdAt: Date;
    likesInfo: LikesInfoViewModel;
};

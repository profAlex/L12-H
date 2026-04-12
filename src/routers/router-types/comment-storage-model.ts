import { CommentatorInfo } from "./comment-commentator-info";
import { ObjectId } from "mongodb";
import { LikesInfoViewModel } from "./comment-likes-info-view-model";

export type CommentStorageModel = {
    _id: ObjectId;
    id: string;
    relatedPostId: string;
    content: string;
    commentatorInfo: CommentatorInfo;
    createdAt: Date;
    likesInfo: LikesInfoViewModel;
};

import { ObjectId } from "mongodb";
import { ExtendedPostViewModel } from "./post-ExtendedLikesInfoViewModel";

export type PostStorageModel = {
    _id: ObjectId;
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: Date;
    extendedLikesInfo: ExtendedPostViewModel;
};
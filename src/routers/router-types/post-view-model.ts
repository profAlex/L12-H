import { ExtendedPostViewModel } from "./post-ExtendedLikesInfoViewModel";

export type PostViewModel = {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: Date;
    extendedLikesInfo: ExtendedPostViewModel;
};

export enum LikeStatus {
    None = 'None',
    Like = 'Like',
    Dislike = 'Dislike'
}

export type CommentsLikesStorageModel = {
    commentId: string;
    userId: string;
    likeStatus: LikeStatus;
    createdAt: Date;
};



export enum LikeStatus {
    None = 'None',
    Like = 'Like',
    Dislike = 'Dislike'
}

export type LikesStorageModel = {
    commentId: string;
    userId: string;
    likeStatus: LikeStatus;
    createdAt: Date;
};


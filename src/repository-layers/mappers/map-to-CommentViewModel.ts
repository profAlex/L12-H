import { CommentStorageModel } from "../../routers/router-types/comment-storage-model";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";

export const mapSingleCommentToViewModel = (
    commentInContainer: CommentStorageModel,
) => {
    return {
        id: commentInContainer._id.toString(),
        content: commentInContainer.content,
        commentatorInfo: { ...commentInContainer.commentatorInfo },
        createdAt: new Date(commentInContainer.createdAt),
        likesInfo: {
            likesCount: commentInContainer.likesInfo?.likesCount ?? 0,
            dislikesCount: commentInContainer.likesInfo?.dislikesCount ?? 0,
            myStatus: LikeStatus.None
        }
    };
};

import { PostViewModel } from "../../routers/router-types/post-view-model";
import { PostStorageModel } from "../../routers/router-types/post-storage-model";
import { PostsLikesStorageModel } from "../../routers/router-types/post-like-storage-model";
import { ObjectId } from "mongodb";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";

export const mapSinglePostCollectionToViewModel = (
    postInContainer: PostStorageModel,
    userReaction: PostsLikesStorageModel & { _id: ObjectId } | null
): PostViewModel => {
    return {
        id: postInContainer._id.toString(),
        title: postInContainer.title,
        shortDescription: postInContainer.shortDescription,
        content: postInContainer.content,
        blogId: postInContainer.blogId,
        blogName: postInContainer.blogName,
        createdAt: postInContainer.createdAt,
        extendedLikesInfo: {
            ...postInContainer.extendedLikesInfo,
            myStatus: (userReaction !== null) ? userReaction.likeStatus : LikeStatus.None
        }

    };
};

import { WithId } from "mongodb";
import { PostViewModel } from "../../routers/router-types/post-view-model";
import { PaginatedPostViewModel } from "../../routers/router-types/post-paginated-view-model";
import { PostStorageModel } from "../../routers/router-types/post-storage-model";
import { PostsLikesStorageModel } from "../../routers/router-types/post-like-storage-model";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";

export function mapToPostListPaginatedOutput(
    postsList: PostStorageModel[],
    reactionsList: PostsLikesStorageModel[],
    metaData: {
        pageNumber: number;
        pageSize: number;
        totalCount: number;
    },
): PaginatedPostViewModel {
    const reactionsMap = new Map(
        reactionsList.map((r) => [r.postId.toString(), r.likeStatus]),
    );
    return {
        pagesCount: Math.ceil(metaData.totalCount / metaData.pageSize),
        page: metaData.pageNumber,
        pageSize: metaData.pageSize,
        totalCount: metaData.totalCount,

        items: postsList.map((post): PostViewModel => {
            const myStatus = reactionsMap.get(post.id) || LikeStatus.None;
            return {
                id: post._id.toString(),
                title: post.title,
                shortDescription: post.shortDescription,
                content: post.content,
                blogId: post.blogId,
                blogName: post.blogName,
                createdAt: post.createdAt,
                extendedLikesInfo: {
                    ...post.extendedLikesInfo,
                    myStatus: myStatus,
                },
            };
        }),
    };
}

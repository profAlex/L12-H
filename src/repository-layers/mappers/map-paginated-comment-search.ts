import { CommentStorageModel } from "../../routers/router-types/comment-storage-model";
import { PaginatedCommentViewModel } from "../../routers/router-types/comment-paginated-view-model";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import {
    CommentsLikesStorageModel,
    LikeStatus,
} from "../../routers/router-types/comment-like-storage-model";

export function mapToCommentListPaginatedOutput(
    commentsList: CommentStorageModel[],
    reactionsList: CommentsLikesStorageModel[],
    metaData: { pageNumber: number; pageSize: number; totalCount: number },
): PaginatedCommentViewModel {

    // создаем Map для мгновенного поиска реакции по ID комментария (O(1))
    const reactionsMap = new Map(
        reactionsList.map(r => [r.commentId.toString(), r.likeStatus])
    );

    // Старый, длинный способ:
    // const reactionsMap = new Map();
    // reactionsList.forEach(r => {
    //     reactionsMap.set(r.commentId.toString(), r.likeStatus);
    // });
    return {
        pagesCount: Math.ceil(metaData.totalCount / metaData.pageSize),
        page: metaData.pageNumber,
        pageSize: metaData.pageSize,
        totalCount: metaData.totalCount,

        items: commentsList.map((comment): CommentViewModel => {
            // так будет цикл в цикле - сложность O(n*m), что не есть хорошо
            // const reaction = reactionsList.find(
            //     (r) => r.commentId === comment.id,
            // );

            // берем из Map без лишних циклов
            const myStatus = reactionsMap.get(comment.id.toString()) || LikeStatus.None;
            return {
                id: comment.id,
                content: comment.content,
                commentatorInfo: { ...comment.commentatorInfo },
                createdAt: new Date(comment.createdAt),
                likesInfo: {
                    ...comment.likesInfo,
                    myStatus: myStatus,
                },
            };
        }),
    };
}

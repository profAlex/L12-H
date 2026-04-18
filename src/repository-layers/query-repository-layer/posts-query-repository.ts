import "reflect-metadata";
import { inject, injectable } from "inversify";

import { InputGetCommentsQueryModel } from "../../routers/router-types/comment-search-input-query-model";
import { PaginatedCommentViewModel } from "../../routers/router-types/comment-paginated-view-model";
import { mapToCommentListPaginatedOutput } from "../mappers/map-paginated-comment-search";
import { postsCollection } from "../../db/mongo.db";
import { TYPES } from "../../composition-root/ioc-types";
import { CommentsLikesQueryRepository } from "./comments-likes-query-repository";
import { InputGetBlogPostsByIdQuery } from "../../routers/router-types/blog-search-by-id-input-model";
import { PaginatedPostViewModel } from "../../routers/router-types/post-paginated-view-model";
import { mapToPostListPaginatedOutput } from "../mappers/map-paginated-post-search";
import { PostViewModel } from "../../routers/router-types/post-view-model";
import { ObjectId } from "mongodb";
import { PostCollectionStorageModel } from "../command-repository-layer/command-repository";
import { mapSinglePostCollectionToViewModel } from "../mappers/map-to-PostViewModel";
import { CommentsQueryRepository } from "./comments-query-repository";
import { PostModel } from "../../db/mongoose-post-collection-model";
import { CustomSortDirection } from "../../routers/util-enums/sort-direction";
import { PostLikeModel } from "../../db/mongoose-posts-like-collection-model";
import { PostsLikesQueryRepository } from "./posts-likes-query-repository";

async function findPostByPrimaryKey(
    id: ObjectId,
): Promise<PostCollectionStorageModel | null> {
    return postsCollection.findOne({ _id: id });
}

@injectable()
export class PostsQueryRepository {
    constructor(
        @inject(TYPES.CommentsQueryRepository)
        protected commentsQueryRepository: CommentsQueryRepository,
        @inject(TYPES.CommentsLikesQueryRepository)
        protected commentsLikesQueryRepository: CommentsLikesQueryRepository,
        @inject(TYPES.PostsLikesQueryRepository)
        protected postsLikesQueryRepository: PostsLikesQueryRepository,
    ) {}

    async getSeveralCommentsByPostId(
        sentPostId: string,
        sentUserId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        // получаем массив комментариев к посту, а также общее количество комментов у поста
        const [commentsList, totalCount] = await Promise.all([
            this.commentsQueryRepository.getSortedComments(
                sentPostId,
                sentSanitizedQuery,
            ),
            this.commentsQueryRepository.getCommentsCount(sentPostId),
        ]);

        // укорачиваем массив всех данных до массива исключительно айдишек комментов
        const commentIds = commentsList.map((item) => item.id);
        // получаем список всех реакций для комментов, где юзер эти реакции выставил
        const reactionsListForUser =
            await this.commentsLikesQueryRepository.getReactionListForComments(
                commentIds,
                sentUserId,
            );

        // теперь нужно склеить информацию о заданных парамтерах поиска, массиве найденных комментов, дополненных информацией о реакции юзера (если был не анонимный запрос)
        // const mappedItems = items.map(comment => {
        //     const reaction = userReactions.find(r => r.commentId === comment.id);
        //     return CommentMapper.toView(comment, reaction?.likeStatus || "None");
        // });
        const { pageNumber, pageSize } = sentSanitizedQuery;

        return mapToCommentListPaginatedOutput(
            commentsList,
            reactionsListForUser,
            {
                pageNumber: pageNumber,
                pageSize: pageSize,
                totalCount: totalCount,
            },
        );

        // НИЖЕ ПРИМЕР ПЕРВОГО ВАРИАНТА - НЕОПТИМАЛЬНОГО ПОИСКА РЕАКЦИЙ: СКОЛЬКО БУДЕТ НАЙДЕНО КОММЕНТОВ - СТОЛЬКО БУДЕТ И ЗАПРОСОВ В КОЛЛЕКЦИЮ ЛАЙКОВ! ЭТО НЕЭФФЕКТИВНО!
        // const likesQueryRepository =
        //     container.get<CommentsLikesQueryRepository>(
        //         TYPES.CommentsLikesQueryRepository,
        //     );
        // const itemsWithReactions = await Promise.all(
        //     items.map(async (comment) => {
        //         // ищем реакцию в базе
        //         const reaction =
        //             await likesQueryRepository.checkIfUserAlreadyReacted(
        //                 sentUserId,
        //                 comment.id,
        //             );
        //
        //         // если реакции нет, оставляем текущий статус (None),
        //         // если есть — берем статус из базы.
        //         const newStatus = reaction
        //             ? reaction.likeStatus
        //             : comment.likesInfo.myStatus;
        //
        //         // возвращаем НОВЫЙ объект комментария
        //         return {
        //             ...comment,
        //             likesInfo: {
        //                 ...comment.likesInfo,
        //                 myStatus: newStatus,
        //             },
        //         };
        //     }),
        // );
    }

    async getSeveralCommentsByPostIdAnonimously(
        sentPostId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        // получаем массив комментариев к посту, а также общее количество комментов у поста
        const [commentsList, totalCount] = await Promise.all([
            this.commentsQueryRepository.getSortedComments(
                sentPostId,
                sentSanitizedQuery,
            ),
            this.commentsQueryRepository.getCommentsCount(sentPostId),
        ]);

        //console.warn("WE GOT INSIDE getSeveralCommentsByPostIdAnonimously");
        const { pageNumber, pageSize } = sentSanitizedQuery;

        return mapToCommentListPaginatedOutput(commentsList, [], {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount,
        });
    }

    // async getSortedComments(
    //     sentPostId: string,
    //     sentSanitizedQuery: InputGetCommentsQueryModel,
    // ): Promise<(CommentStorageModel & { _id: ObjectId})[]> {
    //     const { sortBy, sortDirection, pageNumber, pageSize } =
    //         sentSanitizedQuery;
    //
    //     const skip = (pageNumber - 1) * pageSize;
    //     return CommentModel.find({ relatedPostId: sentPostId })
    //         .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
    //         .skip(skip)
    //         .limit(pageSize)
    //         .lean();
    // }

    async getSeveralPosts(
        sentBlogId: string | null,
        sentUserId: string,
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        const skip = (pageNumber - 1) * pageSize;
        const filter = sentBlogId ? { blogId: sentBlogId } : {};

        const [postsList, totalCount] = await Promise.all([
            PostModel.find(filter)
                .sort({
                    [sortBy]:
                        sortDirection === CustomSortDirection.Ascending
                            ? 1
                            : -1,
                })
                .skip(skip)
                .limit(pageSize)
                .lean(),

            PostModel.countDocuments({filter}),
        ]);

        const postIdsList = postsList.map((post) => post.id);

        const postsReactionList =
            await this.postsLikesQueryRepository.getReactionListForPosts(
                postIdsList,
                sentUserId,
            );

        return mapToPostListPaginatedOutput(postsList, postsReactionList, {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount: totalCount,
        });
    }

    async getSeveralPostsAnonimously(
        sentBlogId: string | null,
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        //console.warn("DEFAULT SORT NUMBERS:", sortBy, sortDirection, pageNumber, pageSize);

        const skip = (pageNumber - 1) * pageSize;
        const filter = sentBlogId ? { blogId: sentBlogId } : {};

        const [postsList, totalCount] = await Promise.all([
            PostModel.find(filter)
                .sort({
                    [sortBy]:
                        sortDirection === CustomSortDirection.Ascending
                            ? 1
                            : -1,
                })
                .skip(skip)
                .limit(pageSize)
                .lean(),

            PostModel.countDocuments({filter}),
        ]);

        return mapToPostListPaginatedOutput(postsList, [], {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount: totalCount,
        });
    }

    async findSinglePost(
        postId: string,
        userId: string,
    ): Promise<PostViewModel | null> {
        const userReaction = await this.postsLikesQueryRepository.findReaction(
            postId,
            userId,
        );

        const post = await PostModel.findById(postId).lean();

        if (post) {
            return mapSinglePostCollectionToViewModel(post, userReaction);
        }

        return null;
    }

    async findSinglePostAnonimously(
        postId: string,
    ): Promise<PostViewModel | null> {
        const post = await PostModel.findById(postId).lean();

        if (post) {
            return mapSinglePostCollectionToViewModel(post, null);
        }

        return null;
    }
}

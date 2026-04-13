import "reflect-metadata";
import { inject, injectable } from "inversify";

import { InputGetCommentsQueryModel } from "../../routers/router-types/comment-search-input-query-model";
import { PaginatedCommentViewModel } from "../../routers/router-types/comment-paginated-view-model";
import { mapToCommentListPaginatedOutput } from "../mappers/map-paginated-comment-search";
import { CommentModel, postsCollection } from "../../db/mongo.db";
import { TYPES } from "../../composition-root/ioc-types";
import { container } from "../../composition-root/composition-root";
import { CommentsLikesQueryRepository } from "./comments-likes-query-repository";
import { InputGetBlogPostsByIdQuery } from "../../routers/router-types/blog-search-by-id-input-model";
import { PaginatedPostViewModel } from "../../routers/router-types/post-paginated-view-model";
import { mapToPostListPaginatedOutput } from "../mappers/map-paginated-post-search";
import { PostViewModel } from "../../routers/router-types/post-view-model";
import { ObjectId } from "mongodb";
import { PostCollectionStorageModel } from "../command-repository-layer/command-repository";
import { mapSinglePostCollectionToViewModel } from "../mappers/map-to-PostViewModel";
import { CommentsQueryRepository } from "./comments-query-repository";

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
    ) {}

    async getSeveralCommentsByPostId(
        sentPostId: string,
        sentUserId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        // получаем массив комментариев к посту, а также общее количество комментов у поста
        const [commentsList, totalCount] = await Promise.all([
            this.commentsQueryRepository.getSortedDocuments(
                sentPostId,
                sentSanitizedQuery,
            ),
            this.commentsQueryRepository.getCountDocuments(sentPostId),
        ]);

        // укорачиваем массив всех данных до массива исключительно айдишек комментов
        const commentIds = commentsList.map((item) => item.id);
        // получаем список всех реакций для комментов, где юзер эти реакции выставил
        const reactionsListForUser = await this.commentsLikesQueryRepository.getReactionListForComments(commentIds, sentUserId);


        // теперь нужно склеить информацию о заданных парамтерах поиска, массиве найденных комментов, дополненных информацией о реакции юзера (если был не анонимный запрос)
        // const mappedItems = items.map(comment => {
        //     const reaction = userReactions.find(r => r.commentId === comment.id);
        //     return CommentMapper.toView(comment, reaction?.likeStatus || "None");
        // });
        const { pageNumber, pageSize } =
            sentSanitizedQuery;

        return mapToCommentListPaginatedOutput(commentsList, reactionsListForUser, {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount,
        });

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
            this.commentsQueryRepository.getSortedDocuments(
                sentPostId,
                sentSanitizedQuery,
            ),
            this.commentsQueryRepository.getCountDocuments(sentPostId),
        ]);

        //console.warn("WE GOT INSIDE getSeveralCommentsByPostIdAnonimously");
        const { pageNumber, pageSize } =
            sentSanitizedQuery;

        return mapToCommentListPaginatedOutput(commentsList, [], {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount,
        });
    }

    async getSeveralPosts(
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        const skip = (pageNumber - 1) * pageSize;

        if (!sortBy) {
            console.error(
                "ERROR: sortBy is null or undefined inside dataQueryRepository.getSeveralPosts",
            );
            throw new Error(
                "Error: sortBy is null or undefined inside dataQueryRepository.getSeveralPosts",
            );
        }

        const items = await postsCollection
            .find({})

            // "asc" (по возрастанию), то используется 1
            // "desc" — то -1 для сортировки по убыванию. - по алфавиту от Я-А, Z-A
            .sort({ [sortBy]: sortDirection })

            // пропускаем определённое количество док. перед тем, как вернуть нужный набор данных.
            .skip(skip)

            // ограничивает количество возвращаемых документов до значения pageSize
            .limit(pageSize)
            .toArray();

        const totalCount = await postsCollection.countDocuments({});

        return mapToPostListPaginatedOutput(items, {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount,
        });
    }

    async findSinglePost(postId: string): Promise<PostViewModel | undefined> {
        if (ObjectId.isValid(postId)) {
            const post: PostCollectionStorageModel | null =
                await findPostByPrimaryKey(new ObjectId(postId));

            if (post) {
                return mapSinglePostCollectionToViewModel(post);
            }
        }

        return undefined;
    }
}

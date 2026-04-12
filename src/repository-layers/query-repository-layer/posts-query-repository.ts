import "reflect-metadata";
import { injectable } from "inversify";

import { InputGetCommentsQueryModel } from "../../routers/router-types/comment-search-input-query-model";
import { PaginatedCommentViewModel } from "../../routers/router-types/comment-paginated-view-model";
import { mapToCommentListPaginatedOutput } from "../mappers/map-paginated-comment-search";
import { CommentModel, postsCollection } from "../../db/mongo.db";
import { TYPES } from "../../composition-root/ioc-types";
import { container } from "../../composition-root/composition-root";
import { LikesQueryRepository } from "./likes-query-repository";
import { InputGetBlogPostsByIdQuery } from "../../routers/router-types/blog-search-by-id-input-model";
import { PaginatedPostViewModel } from "../../routers/router-types/post-paginated-view-model";
import { mapToPostListPaginatedOutput } from "../mappers/map-paginated-post-search";
import { PostViewModel } from "../../routers/router-types/post-view-model";
import { ObjectId } from "mongodb";
import { PostCollectionStorageModel } from "../command-repository-layer/command-repository";
import { mapSinglePostCollectionToViewModel } from "../mappers/map-to-PostViewModel";


async function findPostByPrimaryKey(
    id: ObjectId,
): Promise<PostCollectionStorageModel | null> {
    return postsCollection.findOne({ _id: id });
}

@injectable()
export class PostsQueryRepository {

    async getSeveralCommentsByPostId(
        sentPostId: string,
        sentUserId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        const skip = (pageNumber - 1) * pageSize;

        // const items = await commentsCollection
        //     .find({ relatedPostId: sentPostId })
        //
        //     // "asc" (по возрастанию), то используется 1
        //     // "desc" — то -1 для сортировки по убыванию. - по алфавиту от Я-А, Z-A
        //     .sort({ [sortBy]: sortDirection })
        //
        //     // пропускаем определённое количество док. перед тем, как вернуть нужный набор данных.
        //     .skip(skip)
        //
        //     // ограничивает количество возвращаемых документов до значения pageSize
        //     .limit(pageSize)
        //     .toArray();
        //
        // const totalCount = await commentsCollection.countDocuments({
        //     relatedPostId: sentPostId,
        // });

        const items = await CommentModel.find({ relatedPostId: sentPostId })
            .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const totalCount = await CommentModel.countDocuments({ relatedPostId: sentPostId });

        const likesQueryRepository = container.get<LikesQueryRepository>(
            TYPES.LikesQueryRepository,
        );

        const itemsWithReactions = await Promise.all(
            items.map(async (comment) => {
                // ищем реакцию в базе
                const reaction =
                    await likesQueryRepository.checkIfUserAlreadyReacted(
                        sentUserId,
                        comment.id,
                    );

                // если реакции нет, оставляем текущий статус (None),
                // если есть — берем статус из базы.
                const newStatus = reaction
                    ? reaction.likeStatus
                    : comment.likesInfo.myStatus;

                // возвращаем НОВЫЙ объект комментария
                return {
                    ...comment,
                    likesInfo: {
                        ...comment.likesInfo,
                        myStatus: newStatus,
                    },
                };
            }),
        );
        // const previousReactionResult: LikeDocument | null =
        //     await likesQueryRepository.checkIfUserAlreadyReacted(
        //         sentUserId,
        //         sentCommentId,
        //     );
        //
        // if(previousReactionResult)
        // {
        //     foundComment.likesInfo.myStatus = previousReactionResult.likeStatus;
        // }

        return mapToCommentListPaginatedOutput(itemsWithReactions, {
            pageNumber: pageNumber,
            pageSize: pageSize,
            totalCount,
        });
    }

    async getSeveralCommentsByPostIdAnonimously(
        sentPostId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        const skip = (pageNumber - 1) * pageSize;

        const items = await CommentModel.find({ relatedPostId: sentPostId })
            .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const totalCount = await CommentModel.countDocuments({ relatedPostId: sentPostId });
        // const items = await commentsCollection
        //     .find({ relatedPostId: sentPostId })
        //
        //     // "asc" (по возрастанию), то используется 1
        //     // "desc" — то -1 для сортировки по убыванию. - по алфавиту от Я-А, Z-A
        //     .sort({ [sortBy]: sortDirection })
        //
        //     // пропускаем определённое количество док. перед тем, как вернуть нужный набор данных.
        //     .skip(skip)
        //
        //     // ограничивает количество возвращаемых документов до значения pageSize
        //     .limit(pageSize)
        //     .toArray();


        // const totalCount = await commentsCollection.countDocuments({
        //     relatedPostId: sentPostId,
        // });

        //console.warn("WE GOT INSIDE getSeveralCommentsByPostIdAnonimously");
        return mapToCommentListPaginatedOutput(items, {
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
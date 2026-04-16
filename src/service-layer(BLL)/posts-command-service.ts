import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../composition-root/ioc-types";

import { CommentViewModel } from "../routers/router-types/comment-view-model";
import { CustomResult } from "../common/result-type/result-type";
import { ObjectId } from "mongodb";
import { HttpStatus } from "../common/http-statuses/http-statuses";
import {
    findBlogByPrimaryKey,
    PostsCommandRepository,
} from "../repository-layers/command-repository-layer/posts-command-repository";
import { PostInputModel } from "../routers/router-types/post-input-model";
import { CommentModel } from "../db/mongo.db";
import { CommentsCommandRepository } from "../repository-layers/command-repository-layer/comments-command-repository";
import { PostModel } from "../db/mongoose-post-collection-model";
import { CommentsLikesCommandRepository } from "../repository-layers/command-repository-layer/comments-likes-command-repository";
import { PostsLikesCommandRepository } from "../repository-layers/command-repository-layer/posts-likes-command-repository";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import {
    PostLikeDocument,
    PostLikeModel,
} from "../db/mongoose-posts-like-collection-model";
import { UsersCommandRepository } from "../repository-layers/command-repository-layer/users-command-repository";

@injectable()
export class PostsCommandService {
    constructor(
        @inject(TYPES.PostsCommandRepository)
        protected postsCommandRepository: PostsCommandRepository,
        @inject(TYPES.CommentsCommandRepository)
        protected commentsCommandRepository: CommentsCommandRepository,
        @inject(TYPES.CommentsLikesCommandRepository)
        protected commentsLikesCommandRepository: CommentsLikesCommandRepository,
        @inject(TYPES.PostsLikesCommandRepository)
        protected postsLikesCommandRepository: PostsLikesCommandRepository,
        @inject(TYPES.UsersCommandRepository)
        protected usersCommandRepository: UsersCommandRepository,
    ) {}

    async createNewComment(
        postId: string,
        content: string,
        userId: string,
    ): Promise<CustomResult<CommentViewModel>> {
        // findUserByPrimaryKey и юзера брать выше и спускать оттуда
        const user = await this.usersCommandRepository.findUserByPrimaryKey(
            new ObjectId(userId),
        );

        if (!user) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: "User not found",
                errorsMessages: [
                    {
                        field: "const user = await findUserByPrimaryKey(new ObjectId(userId));", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: "User not found",
                    },
                ],
            };
        }

        const newComment = await CommentModel.createNewComment(
            postId,
            content,
            { id: userId, login: user.login },
        );

        if (
            !(await this.commentsCommandRepository.saveNewComment(newComment))
        ) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: "User couldn't be saved",
                errorsMessages: [
                    {
                        field: "if (!(await this.commentsCommandRepository.saveNewComment(newComment)))", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: "User couldn't be saved",
                    },
                ],
            };
        }

        return {
            data: {
                id: newComment.id,
                content: newComment.content,
                commentatorInfo: newComment.commentatorInfo,
                createdAt: newComment.createdAt,
                likesInfo: newComment.likesInfo,
            },
            statusCode: HttpStatus.Created,
            errorsMessages: [
                {
                    field: null,
                    message: null,
                },
            ],
        };
    }

    async createNewPost(requestBody: PostInputModel): Promise<string | null> {
        // это тоже надо спускать из хэндлера? или из blogCommandRepository, вызывая его через инжектированный экземпляр
        try {
            const relatedBlogger = await findBlogByPrimaryKey(
                new ObjectId(requestBody.blogId),
            );
            if (!relatedBlogger) {
                console.warn("Blog not found");
                return null;
            }

            const blogName = relatedBlogger.name;

            const newPost = PostModel.createNewPost(
                blogName,
                requestBody,
            );

            if (!(await this.postsCommandRepository.savePostData(newPost))) {
                console.warn("Couldn't create new post not found");
                return null;
            }

            return newPost.id;
        } catch (error) {
            console.warn(
                `Error while creating post: ${error instanceof Error ? error.message : "unknown error"}`,
            );
            return null;
        }
    }

    async updatePost(
        postId: string,
        newData: PostInputModel,
    ): Promise<boolean | null> {
        try {
            const post = await this.postsCommandRepository.getPostById(postId);
            if (!post) return null;

            post.updatePost(newData);

            await this.postsCommandRepository.savePostData(post);

            return true;
        } catch (error) {
            console.warn(
                `Error while updating post: ${error instanceof Error ? error.message : "unknown error"}`,
            );
            return null;
        }
    }

    async deletePost(postId: string): Promise<boolean> {
        try {
            const post = await this.postsCommandRepository.getPostById(postId);
            if (!post) return false;

            // Собираем ID всех комментариев этого поста
            const commentIds =
                await this.commentsCommandRepository.getCommentIdsByPostId(
                    postId,
                );

            if (commentIds.length > 0) {
                // удаляем лайки, которые относятся к этим комментариям
                await this.commentsLikesCommandRepository.deleteLikesByCommentIds(
                    commentIds,
                );

                // уаляем сами комментарии
                await this.commentsCommandRepository.deleteManyByPostId(postId);
            }

            // удалил лайки самого поста
            await this.postsLikesCommandRepository.deleteLikesByPostId(postId);

            // в конце удаляем сам пост
            const result = await this.postsCommandRepository.deletePost(
                new ObjectId(postId),
            );
            return result;
        } catch (error) {
            console.warn(
                `Error while deleting post: ${error instanceof Error ? error.message : "unknown error"}`,
            );
            return false;
        }
    }

    async likePostById(
        sentPostId: string,
        sentUserId: string,
        sentLike: LikeStatus,
    ): Promise<CustomResult> {

        const post = await this.postsCommandRepository.getPostById(sentPostId);
        if (!post) return {
            data: null,
            statusCode: HttpStatus.InternalServerError,
            statusDescription: `Cannot find post with ID ${sentPostId} inside PostsCommandService.likePostById.`,
            errorsMessages: [
                {
                    field: "if (!post) inside PostsCommandService.likePostById.",
                    message: `Internal Server Error`,
                },
            ],
        };

        // проверяем наличие реакции на пост в коллекции пост-лайков
        const previousReactionResult =
            await this.postsLikesCommandRepository.checkIfUserAlreadyReacted(
                sentUserId,
                sentPostId,
            );

        // находим юзера, нам нужен будет от него userLogin
        const user = await this.usersCommandRepository.findUserByPrimaryKey(
            new ObjectId(sentUserId),
        );
        if (!user) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Cannot find user with ID ${sentUserId} inside PostsCommandService.likePostById.`,
                errorsMessages: [
                    {
                        field: "if (!user) inside PostsCommandService.likePostById.",
                        message: `Internal Server Error`,
                    },
                ],
            };
        }

        // если прежней реакции не найдено и новая реакция не None
        if (previousReactionResult === null && sentLike !== "None") {
            const newLikeDocument: PostLikeDocument =
                PostLikeModel.createNewPostLike(
                    sentPostId,
                    sentUserId,
                    user.login,
                    sentLike,
                );

            const ifSavingLikeSuccessful =
                await this.postsLikesCommandRepository.savePostLikeDocument(
                    newLikeDocument,
                );

            if (!ifSavingLikeSuccessful) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription: `Saving like was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                    errorsMessages: [
                        {
                            field: "if(!ifSavingLikeSuccessful) inside PostsCommandService.likePostById.",
                            message: `Internal Server Error`,
                        },
                    ],
                };
            }

            // добавляем реакцию в счетчик реакций в базе комментариев
            const ifAddReactionSuccessfull =
                await post.addPostReaction(
                    sentPostId,
                    sentLike,
                );

            if (!ifAddReactionSuccessfull) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription: `Saving like was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                    errorsMessages: [
                        {
                            field: "if(!ifAddReactionSuccessfull) inside PostsCommandService.likePostById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                            message: `Internal Server Error`,
                        },
                    ],
                };
            }
        }
        // если прежняя реакция найдена и она не равна вновь переданной
        else if (
            previousReactionResult !== null &&
            previousReactionResult.likeStatus !== sentLike
        ) {
            // дополнительное условие - если передали лайк = none - удалить запись из лайк репозитория,
            // не забыть вызвать nullifyReaction

            // если новая реакция это None, тогда надо удалить запись лайка в репозитории лайков и сбросить реакцию в комменте
            if (sentLike === "None") {

                // запоминаем какая реакция была ранее проставлена юзером
                const previousReaction: LikeStatus =
                    previousReactionResult.likeStatus;

                const result =
                    await this.postsLikesCommandRepository.deletePostLikeById(
                        previousReactionResult._id,
                    );

                if (!result) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `deleteOne() error inside PostsCommandRepository.likePostById`,

                        errorsMessages: [
                            {
                                field: "if (!result)", // это служебная и от
                                message:
                                    "Unknown error inside const result = await this.postsLikesCommandRepository.deletePostLikeById",
                            },
                        ],
                    };
                }

                // делаем декремент счетчика лайка или дизлайка
                const ifNullifyingReactionSuccessfull =
                    await post.nullifyingPostReaction(
                        sentPostId,
                        previousReaction,
                    );

                if (!ifNullifyingReactionSuccessfull) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving reaction was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside PostsCommandService.likePostById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }
                // если мы меняем реакцию на Like или Dislike (sentLike === "Like" или "Dislike")
            } else {

                // меняем реакцию в коллекции лайков на новую
                previousReactionResult.likeStatus = sentLike;

                const ifSavingLikeSuccessful =
                    await this.postsLikesCommandRepository.savePostLikeDocument(
                        previousReactionResult,
                    );

                if (!ifSavingLikeSuccessful) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving like was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside PostsCommandService.likePostById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }

                // меняем реакцию в коллекции постов на новую
                const ifSwitchReactionSuccessfull =
                    await post.switchPostReaction(
                        sentPostId,
                        sentLike,
                    );

                if (!ifSwitchReactionSuccessfull) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving reaction was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside PostsCommandService.likePostById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }
            }
        }

        // реакция изменена удачно
        // теперь обновляем последние три поста
        const refreshLastLikesstatus = await this.postsLikesCommandRepository.getLatestLikesForPost(sentPostId);
        post.updateNewestLikes(refreshLastLikesstatus);
        const result = await this.postsCommandRepository.savePostData(post);

        if (!result) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Saving refreshed like info was not successfull for post ${sentPostId} inside PostsCommandService.likePostById.`,
                errorsMessages: [
                    {
                        field: "if (!result) inside PostsCommandService.likePostById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: `Internal Server Error`,
                    },
                ],
            };
        }

        return {
            data: null,
            statusCode: HttpStatus.NoContent,
            statusDescription: "",
            errorsMessages: [
                {
                    field: "",
                    message: "",
                },
            ],
        };
    }
}

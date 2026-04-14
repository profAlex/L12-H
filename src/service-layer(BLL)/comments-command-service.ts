import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../composition-root/ioc-types";
import { CommentInputModel } from "../routers/router-types/comment-input-model";
import { CustomResult } from "../common/result-type/result-type";
import { CommentsCommandRepository } from "../repository-layers/command-repository-layer/comments-command-repository";
import { HttpStatus } from "../common/http-statuses/http-statuses";
import { CommentDocument } from "../db/mongoose-comment-collection-model";
import { CommentViewModel } from "../routers/router-types/comment-view-model";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { CommentsLikesCommandRepository } from "../repository-layers/command-repository-layer/comments-likes-command-repository";
import { CommentLikeDocument, CommentLikeModel } from "../db/mongoose-comments-like-collection-model";

@injectable()
export class CommentsCommandService {
    constructor(
        @inject(TYPES.CommentsCommandRepository)
        protected commentsCommandRepository: CommentsCommandRepository,
        @inject(TYPES.CommentsLikesCommandRepository)
        protected likesCommandRepository: CommentsLikesCommandRepository,
    ) {}

    async updateCommentById(
        sentCommentId: string,
        sentUserId: string,
        sentContent: CommentInputModel,
    ): Promise<CustomResult> {
        const comment: CommentDocument | null =
            await this.commentsCommandRepository.findCommentByPrimaryKey(
                sentCommentId,
            );

        // проверяем что коммент существует
        if (!comment) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Comment is not found by sent comment ID ${sentCommentId} inside dataCommandRepository.updateCommentById. Even though this exact ID passed existence check in middlewares previously.`,
                errorsMessages: [
                    {
                        field: "if (!comment) inside dataCommandRepository.updateCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: `Internal Server Error`,
                    },
                ],
            };
        }

        // проверяем что коммент принадлежит юзеру, который пытается его исправить
        if (sentUserId !== comment.commentatorInfo.userId) {
            return {
                data: null,
                statusCode: HttpStatus.Forbidden,
                statusDescription: `User is forbidden to change another user’s comment`,
                errorsMessages: [
                    {
                        field: "if (sentUserId !== comment.commentatorInfo.userId) inside dataCommandRepository.updateCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: `User is forbidden to change another user’s comment`,
                    },
                ],
            };
        }

        // обновляем данные
        comment.content = sentContent.content;

        // сохраняем данные через слой репозиторий (хотя можно было бы и в этом сле это делать)
        return await this.commentsCommandRepository.updateCommentById(comment);
    }

    async deleteCommentById(
        sentCommentId: string,
        sentUserId: string,
    ): Promise<CustomResult> {
        try {
            const comment: CommentViewModel | null =
                await this.commentsCommandRepository.findCommentByPrimaryKeyLean(
                    sentCommentId,
                );

            if (!comment) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription: `Comment is not found by sent comment ID ${sentCommentId} inside dataCommandRepository.deleteCommentById. Even though this exact ID passed existence check in middlewares previously.`,
                    errorsMessages: [
                        {
                            field: "if (!comment) inside dataCommandRepository.deleteCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                            message: `Internal Server Error`,
                        },
                    ],
                };
            }

            if (sentUserId !== comment.commentatorInfo.userId) {
                return {
                    data: null,
                    statusCode: HttpStatus.Forbidden,
                    statusDescription: `User is forbidden to delete another user’s comment`,
                    errorsMessages: [
                        {
                            field: "if (sentUserId !== comment.commentatorInfo.userId) inside dataCommandRepository.deleteCommentById",
                            message: `User is forbidden to delete another user’s comment`,
                        },
                    ],
                };
            }

            return await this.commentsCommandRepository.deleteCommentById(
                sentCommentId,
            );
        } catch (error) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Unknown error inside try-catch block inside CommentsCommandService.deleteCommentById: ${JSON.stringify(
                    error,
                )}`,
                errorsMessages: [
                    {
                        field: "CommentsCommandService.deleteCommentById",
                        message: `Unknown error inside try-catch block: ${JSON.stringify(error)}`,
                    },
                ],
            };
        }
    }

    async likeCommentById(
        sentCommentId: string,
        sentUserId: string,
        sentLike: LikeStatus,
    ): Promise<CustomResult> {
        const previousReactionResult: CommentLikeDocument | null =
            await this.likesCommandRepository.checkIfUserAlreadyReacted(
                sentUserId,
                sentCommentId,
            );

        // если прежней реакции не найдено и новая реакция не None
        if (previousReactionResult === null && sentLike !== "None") {
            // console.warn("DID WE GET INSIDE если прежней реакции не найдено и новая реакция не None ???");

            const newLikeDocument: CommentLikeDocument = await CommentLikeModel.create({
                commentId: sentCommentId,
                userId: sentUserId,
                likeStatus: sentLike,
            });

            const ifSavingLikeSuccessful =
                await this.likesCommandRepository.saveLikeDocument(
                    newLikeDocument,
                );

            if (!ifSavingLikeSuccessful) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription: `Saving like was not successfull for comment ${sentCommentId} inside CommentsCommandService.likeCommentById.`,
                    errorsMessages: [
                        {
                            field: "if(!ifSavingLikeSuccessful) inside CommentsCommandService.likeCommentById",
                            message: `Internal Server Error`,
                        },
                    ],
                };
            }

            // добавляем реакцию в счетчик реакций в базе комментариев
            const ifAddReactionSuccessfull =
                await this.commentsCommandRepository.addCommentReaction(
                    sentCommentId,
                    sentLike,
                );

            if (!ifAddReactionSuccessfull) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription: `Saving like was not successfull for comment ${sentCommentId} inside CommentsCommandService.likeCommentById.`,
                    errorsMessages: [
                        {
                            field: "if(!ifAddReactionSuccessfull) inside CommentsCommandService.likeCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
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
            console.warn(
                "DID WE GET INSIDE если прежняя реакция найдена и она не равна вновь переданной ???",
            );

            // дополнительное условие - если передали лайк = none - удалить запись из лайк репозитория,
            // не забыть вызвать nullifyReaction

            // если новая реакция это None, тогда надо удалить запись лайка в репозитории лайков и сбросить реакцию в комменте
            if (sentLike === "None") {
                console.warn(
                    "DID WE GET INSIDE если новая реакция это None, тогда надо удалить запись лайка в репозитории лайков и сбросить реакцию в комменте???",
                );

                // запоминаем какая реакция была ранее проставлена юзером
                const previousReaction: LikeStatus =
                    previousReactionResult.likeStatus;

                const result = await this.likesCommandRepository.deleteLikeById(
                    previousReactionResult,
                );

                if (!result) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `deleteOne() error inside CommentsCommandRepository.likeCommentById`,

                        errorsMessages: [
                            {
                                field: "CommentsCommandRepository.likeCommentById", // это служебная и от
                                message:
                                    "Unknown error inside CommentsCommandRepository.likeCommentById",
                            },
                        ],
                    };
                }

                // делаем декремент счетчика лайка или дизлайка
                const ifNullifyingReactionSuccessfull =
                    await this.commentsCommandRepository.nullifyingCommentReaction(
                        sentCommentId,
                        previousReaction,
                    );

                if (!ifNullifyingReactionSuccessfull) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving reaction was not successfull for comment ${sentCommentId} inside CommentsCommandService.likeCommentById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside CommentsCommandService.likeCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }
                // если мы меняем реакцию на Like или Dislike
            } else {
                // меняем реакцию на новую
                console.warn(
                    "DID WE GET INSIDE меняем реакцию на Like или Dislike ???",
                );

                previousReactionResult.likeStatus = sentLike;

                const ifSavingLikeSuccessful =
                    await this.likesCommandRepository.saveLikeDocument(
                        previousReactionResult,
                    );

                if (!ifSavingLikeSuccessful) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving like was not successfull for comment ${sentCommentId} inside CommentsCommandService.likeCommentById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside CommentsCommandService.likeCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }

                const ifSwitchReactionSuccessfull =
                    await this.commentsCommandRepository.switchCommentReaction(
                        sentCommentId,
                        sentLike,
                    );

                if (!ifSwitchReactionSuccessfull) {
                    return {
                        data: null,
                        statusCode: HttpStatus.InternalServerError,
                        statusDescription: `Saving reaction was not successfull for comment ${sentCommentId} inside CommentsCommandService.likeCommentById.`,
                        errorsMessages: [
                            {
                                field: "if(!ifSavingLikeSuccessful) inside CommentsCommandService.likeCommentById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                                message: `Internal Server Error`,
                            },
                        ],
                    };
                }
            }
        }

        // реакция изменена удачно
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

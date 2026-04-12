import { inject, injectable } from "inversify";
import { ObjectId } from "mongodb";
import { CommentStorageModel } from "../../routers/router-types/comment-storage-model";
import { CommentModel } from "../../db/mongo.db";
import { CommentInputModel } from "../../routers/router-types/comment-input-model";
import { CustomResult } from "../../common/result-type/result-type";
import { HttpStatus } from "../../common/http-statuses/http-statuses";
import { CommentDocument } from "../../db/mongoose-comment-collection-model";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";

@injectable()
export class CommentsCommandRepository {
    // async function findCommentByPrimaryKey(
    //     id: ObjectId,
    // ): Promise<CommentStorageModel | null> {
    //     return commentsCollection.findOne({ _id: id });
    // }

    async findCommentByPrimaryKey(id: string): Promise<CommentDocument | null> {
        return CommentModel.findById(id);
    }

    async findCommentByPrimaryKeyLean(
        id: string,
    ): Promise<CommentViewModel | null> {
        return CommentModel.findById(id).lean();
    }

    async updateCommentById(
        sentComment: CommentDocument,
    ): Promise<CustomResult> {
        try {
            await sentComment.save();

            // Если мы дошли до этой строки, значит сохранение прошло успешно.
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
        } catch (error) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Mongoose save() error inside CommentsCommandRepository.updateCommentById: ${error instanceof Error ? error.message : "Unknown error"}`,
                errorsMessages: [
                    {
                        field: "sentComment.save()",
                        message: `Unknown error while trying to update comment via save()`,
                    },
                ],
            };
        }
    }

    async deleteCommentById(sentId: string): Promise<CustomResult> {
        try {
            const result = await CommentModel.deleteOne({ _id: sentId as any });

            if (!result.acknowledged) {
                return {
                    data: null,
                    statusCode: HttpStatus.InternalServerError,
                    statusDescription:
                        "Database failed to acknowledge deletion inside CommentsCommandRepository.deleteById",
                    errorsMessages: [
                        {
                            field: "CommentsCommandRepository.deleteById",
                            message: "Deletion not acknowledged",
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
        } catch (error) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription: `Mongoose deleteOne() error inside CommentsCommandRepository.deleteById: ${error instanceof Error ? error.message : "Unknown error"}`,

                errorsMessages: [
                    {
                        field: "CommentsCommandRepository.deleteById", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: `Unknown error while trying to delete comment`,
                    },
                ],
            };
        }
    }

    async switchCommentReaction(
        sentCommentId: string,
        newStatus: LikeStatus,
    ): Promise<boolean> {
        try {
            // это не нужно, т.к. updateOne сам найдет и обновит, дополнительно это делать и проверять - лишняя операция
            // const comment: CommentDocument | null =
            //     await CommentModel.findById(sentCommentId);
            //
            // if (!comment) {
            //     console.error(
            //         `Couldn't find comment with id: ${sentCommentId} inside CommentsCommandRepository.switchCommentReaction`,
            //     );
            //
            //     return false;
            // }

            // Определяем, что прибавляем, а что отнимаем
            const isEnablingLike = newStatus === LikeStatus.Like;

            // Нужно убедиться, что dislikesCount > 0 перед вычитанием.
            const filter: any = { _id: sentCommentId };

            if (isEnablingLike) {
                filter["likesInfo.dislikesCount"] = { $gt: 0 };
            } else {
                filter["likesInfo.likesCount"] = { $gt: 0 };
            }

            const updateQuery = isEnablingLike
                ? { "likesInfo.likesCount": 1, "likesInfo.dislikesCount": -1 }
                : { "likesInfo.likesCount": -1, "likesInfo.dislikesCount": 1 };

            // используем атомарный updateOne вместо save(), чтобы избежать состояния гонки
            const result = await CommentModel.updateOne(filter, {
                $inc: updateQuery,
            });

            // result.matchedCount > 0 означает, что комментарий найден и обновлен
            if (result.matchedCount === 0) {
                console.error(
                    `Couldn't find comment with id: ${sentCommentId} inside CommentsCommandRepository.switchCommentReaction`,
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error saving comment reaction inside CommentsCommandRepository.switchCommentReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }

    async addCommentReaction(
        sentCommentId: string,
        newStatus: LikeStatus
    ): Promise<boolean> {
        try {
            const updateQuery = newStatus === LikeStatus.Like
                ? { 'likesInfo.likesCount': 1 }
                : { 'likesInfo.dislikesCount': 1 };

            // атомарный апдейт для избегания состояния гонки
            const result = await CommentModel.updateOne(
                { _id: sentCommentId as any },
                { $inc: updateQuery }
            );

            // если matchedCount === 0, значит комментария с таким ID нет в базе
            if (result.matchedCount === 0) {
                console.error(`Couldn't find comment with id: ${sentCommentId} inside CommentsCommandRepository.addReaction`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(
                ` Error inside CommentsCommandRepository.addReaction: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return false;
        }
    }


    async nullifyingCommentReaction(
        sentCommentId: string,
        oldStatus: LikeStatus,
    ): Promise<boolean> {
        try {
            const fieldToDecrement = oldStatus === LikeStatus.Like
                ? 'likesInfo.likesCount'
                : 'likesInfo.dislikesCount';

            // 2. Создаем фильтр: ищем по ID И проверяем, что в поле больше 0
            const filter: any = {
                _id: sentCommentId,
                [fieldToDecrement]: { $gt: 0 } // Защита от ухода в минус
            };

            // 3. Выполняем атомарное уменьшение
            const result = await CommentModel.updateOne(
                filter,
                { $inc: { [fieldToDecrement]: -1 } }
            );

            if (result.matchedCount === 0) {
                console.error(`Couldn't find comment with id: ${sentCommentId} inside CommentsCommandRepository.nullifyingCommentReaction`);

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error inside CommentsCommandRepository.nullifyingCommentReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }
}

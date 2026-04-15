import "reflect-metadata";
import { injectable } from "inversify";
import { CustomResult } from "../../common/result-type/result-type";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { findUserByPrimaryKey } from "../query-repository-layer/users-query-repository";
import { ObjectId } from "mongodb";
import { HttpStatus } from "../../common/http-statuses/http-statuses";
import { bloggersCollection, CommentModel, postsCollection } from "../../db/mongo.db";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";
import { PostInputModel } from "../../routers/router-types/post-input-model";
import { BloggerCollectionStorageModel } from "./command-repository";
import { CustomError } from "../utility/custom-error-class";
import { PostDocument, PostModel } from "../../db/mongoose-post-collection-model";
import { PostViewModel } from "../../routers/router-types/post-view-model";
import { mapSinglePostCollectionToViewModel } from "../mappers/map-to-PostViewModel";

export async function findBlogByPrimaryKey(
    id: ObjectId,
): Promise<BloggerCollectionStorageModel | null> {
    return bloggersCollection.findOne({ _id: id });
}

@injectable()
export class PostsCommandRepository {

    // async createNewComment(
    //     postId: string,
    //     content: string,
    //     userId: string,
    // ): Promise<CustomResult<CommentViewModel>> {
    //     try {
    //     //     //if (ObjectId.isValid(userId) && ObjectId.isValid(postId)) {
    //     //     // проверяем существует ли такой юзер и возвращаем его логин
    //     //     // ищем существует ли такой пост
    //     //     // создаем временный объект, куда записываем postId, userId, создаем и записываем id нового объекта
    //     //     const user = await findUserByPrimaryKey(new ObjectId(userId));
    //     //
    //     //     if (!user) {
    //     //         return {
    //     //             data: null,
    //     //             statusCode: HttpStatus.InternalServerError,
    //     //             statusDescription:
    //     //                 "User is not found, possibly because its token is valid but user-record was already deleted or due to an database error",
    //     //             errorsMessages: [
    //     //                 {
    //     //                     field: "dataCommandRepository.createNewComment -> findUserByPrimaryKey(new ObjectId(userId))", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
    //     //                     message: "Couldn't find User record", // ошибкам надо присваивать кода, чтобы пользователи могли сообщать номер ошибки в техподдержку
    //     //                 },
    //     //             ],
    //     //         } as CustomResult<CommentViewModel>;
    //     //     }
    //     //     const userLogin = user.login;
    //     //
    //     //     try {
    //     //         // метод create({}) заменяет сразу два метода new + save()
    //     //         const newCommentEntry = await CommentModel.create({
    //     //             relatedPostId: postId,
    //     //             content: content,
    //     //             commentatorInfo: { userId: userId, userLogin: userLogin },
    //     //             createdAt: new Date(),
    //     //             likesInfo: { myStatus: LikeStatus.None },
    //     //         });
    //     //         // console.warn("WE GOT HERE??!!");
    //     //         return {
    //     //             data: {
    //     //                 id: newCommentEntry.id,
    //     //                 content: newCommentEntry.content,
    //     //                 commentatorInfo: newCommentEntry.commentatorInfo,
    //     //                 createdAt: newCommentEntry.createdAt,
    //     //                 likesInfo: newCommentEntry.likesInfo,
    //     //             },
    //     //             statusCode: HttpStatus.Created,
    //     //             errorsMessages: [
    //     //                 {
    //     //                     field: null,
    //     //                     message: null,
    //     //                 },
    //     //             ],
    //     //         };
    //     //     } catch (error) {
    //     //         console.error(
    //     //             `Error inside dataCommandRepository.createNewComment while creating new comment: ${error instanceof Error ? error.message : "unknown error"}`,
    //     //         );
    //     //
    //     //         return {
    //     //             data: null,
    //     //             statusCode: HttpStatus.InternalServerError,
    //     //             statusDescription: "Error while inserting new comment",
    //     //             errorsMessages: [
    //     //                 {
    //     //                     field: "dataCommandRepository.createNewComment -> commentsCollection.insertOne(newCommentEntry)", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
    //     //                     message: "Error while inserting new comment",
    //     //                 },
    //     //             ],
    //     //         };
    //     //     }
    //     //
    //     //     // const tempId = new ObjectId();
    //     //     // const newCommentEntry = {
    //     //     //     _id: tempId,
    //     //     //     id: tempId.toString(),
    //     //     //     relatedPostId: postId,
    //     //     //     content: content,
    //     //     //     commentatorInfo: { userId: userId, userLogin: userLogin },
    //     //     //     createdAt: new Date(),
    //     //     // } as CommentStorageModel;
    //     //     //
    //     //     // const result = await commentsCollection.insertOne(newCommentEntry);
    //     //
    //     //     // if (!result.acknowledged) {
    //     //     //     return {
    //     //     //         data: null,
    //     //     //         statusCode: HttpStatus.InternalServerError,
    //     //     //         statusDescription: "Error while inserting new comment",
    //     //     //         errorsMessages: [
    //     //     //             {
    //     //     //                 field: "dataCommandRepository.createNewComment -> commentsCollection.insertOne(newCommentEntry)", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
    //     //     //                 message: "Error while inserting new comment",
    //     //     //             },
    //     //     //         ],
    //     //     //     } as CustomResult<CommentViewModel>;
    //     //     // }
    //     // } catch (error) {
    //     //     console.error(`Unknown error: ${JSON.stringify(error)}`);
    //     //     // throw new Error("Placeholder for an error to be rethrown and dealt with in the future in createNewUser method of dataCommandRepository");
    //     //     return {
    //     //         data: null,
    //     //         statusCode: HttpStatus.InternalServerError,
    //     //         statusDescription: `Unknown error inside try-catch block: ${JSON.stringify(error)}`,
    //     //         errorsMessages: [
    //     //             {
    //     //                 field: "dataCommandRepository.createNewComment", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
    //     //                 message: `Unknown error inside try-catch block: ${JSON.stringify(error)}`,
    //     //             },
    //     //         ],
    //     //     } as CustomResult<CommentViewModel>;
    //     // }
    // }



    async savePostData(newData: PostDocument): Promise<boolean> {
        try{
            await newData.save();

            return true;
        } catch (error){
            console.error(
                `Error inside PostsCommandRepository.savePostData: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }


    async getPostById(id: string): Promise<PostDocument | null> {
        return PostModel.findById(id); // возвращаем полноценный документ для работы с его методами, полями и последующего сохранения
    }


    // async updatePost(
    //     postId: string,
    //     newData: PostInputModel,
    // ): Promise<null | undefined> {
    //     try {
    //         if (ObjectId.isValid(postId)) {
    //             const idToCheck = new ObjectId(postId);
    //             const res = await postsCollection.updateOne(
    //                 { _id: idToCheck },
    //                 { $set: { ...newData } },
    //             );
    //
    //             if (!res.acknowledged) {
    //                 throw new CustomError({
    //                     errorMessage: {
    //                         field: "postsCollection.updateOne",
    //                         message: "attempt to update post entry failed",
    //                     },
    //                 });
    //             }
    //
    //             if (res.matchedCount === 1) {
    //                 // успешное выполнение
    //                 return null;
    //             }
    //         } else {
    //             throw new CustomError({
    //                 errorMessage: {
    //                     field: "ObjectId.isValid(postId)",
    //                     message: "invalid post ID",
    //                 },
    //             });
    //         }
    //     } catch (error) {
    //         if (error instanceof CustomError) {
    //             if (error.metaData) {
    //                 const errorData = error.metaData.errorMessage;
    //                 console.error(
    //                     `In field: ${errorData.field} - ${errorData.message}`,
    //                 );
    //             } else {
    //                 console.error(`Unknown error: ${JSON.stringify(error)}`);
    //             }
    //
    //             // throw new Error('Placeholder for an error in to be rethrown and dealt with in the future in createNewBlog method of dataCommandRepository');
    //             return undefined;
    //         } else {
    //             console.error(
    //                 `Unknown error inside dataCommandRepository.updatePost: ${JSON.stringify(error)}`,
    //             );
    //             throw new Error(
    //                 "Placeholder for an error to be rethrown and dealt with in the future in updatePost method of dataCommandRepository",
    //             );
    //         }
    //     }
    // }


    async deletePost(postId: ObjectId): Promise<boolean> {
        try {
            const result = await PostModel.deleteOne({ _id: postId });

            return result.deletedCount === 1;
        } catch (error) {
            console.error(
                `Error inside PostsCommandRepository.deletePost: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }


    async addPostReaction(
        sentPostId: string,
        newStatus: LikeStatus
    ): Promise<boolean> {
        try {
            const updateQuery = newStatus === LikeStatus.Like
                ? { 'likesInfo.likesCount': 1 }
                : { 'likesInfo.dislikesCount': 1 };

            // атомарный апдейт для избегания состояния гонки
            const result = await PostModel.updateOne(
                { _id: sentPostId as any },
                { $inc: updateQuery }
            );

            // если matchedCount === 0, значит комментария с таким ID нет в базе
            if (result.matchedCount === 0) {
                console.error(`Couldn't find post with id: ${sentPostId} inside PostsCommandRepository.addPostReaction`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(
                ` Error inside PostsCommandRepository.addPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return false;
        }
    }


    async nullifyingPostReaction(
        sentPostId: string,
        oldStatus: LikeStatus,
    ): Promise<boolean> {
        try {
            const fieldToDecrement = oldStatus === LikeStatus.Like
                ? 'likesInfo.likesCount'
                : 'likesInfo.dislikesCount';

            // создаем фильтр: ищем по ID И проверяем, что в поле больше 0
            const filter: any = {
                _id: sentPostId,
                [fieldToDecrement]: { $gt: 0 } // Защита от ухода в минус
            };

            // выполняем атомарное уменьшение
            const result = await PostModel.updateOne(
                filter,
                { $inc: { [fieldToDecrement]: -1 } }
            );

            if (result.matchedCount === 0) {
                console.error(`Couldn't find post with id: ${sentPostId} inside  PostsCommandRepository.nullifyingPostReaction`);

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error inside PostsCommandRepository.nullifyingPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }

    async switchPostReaction(
        sentPostId: string,
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
            const filter: any = { _id: sentPostId };

            if (isEnablingLike) {
                filter["likesInfo.dislikesCount"] = { $gt: 0 };
            } else {
                filter["likesInfo.likesCount"] = { $gt: 0 };
            }

            const updateQuery = isEnablingLike
                ? { "likesInfo.likesCount": 1, "likesInfo.dislikesCount": -1 }
                : { "likesInfo.likesCount": -1, "likesInfo.dislikesCount": 1 };

            // используем атомарный updateOne вместо save(), чтобы избежать состояния гонки
            const result = await PostModel.updateOne(filter, {
                $inc: updateQuery,
            });

            // result.matchedCount > 0 означает, что комментарий найден и обновлен
            if (result.matchedCount === 0) {
                console.error(
                    `Couldn't find post with id: ${sentPostId} inside PostsCommandRepository.switchPostReaction`,
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error saving post reaction inside PostsCommandRepository.switchPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    }
}
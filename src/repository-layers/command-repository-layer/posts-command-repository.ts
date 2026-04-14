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


    async updatePost(
        postId: string,
        newData: PostInputModel,
    ): Promise<null | undefined> {
        try {
            if (ObjectId.isValid(postId)) {
                const idToCheck = new ObjectId(postId);
                const res = await postsCollection.updateOne(
                    { _id: idToCheck },
                    { $set: { ...newData } },
                );

                if (!res.acknowledged) {
                    throw new CustomError({
                        errorMessage: {
                            field: "postsCollection.updateOne",
                            message: "attempt to update post entry failed",
                        },
                    });
                }

                if (res.matchedCount === 1) {
                    // успешное выполнение
                    return null;
                }
            } else {
                throw new CustomError({
                    errorMessage: {
                        field: "ObjectId.isValid(postId)",
                        message: "invalid post ID",
                    },
                });
            }
        } catch (error) {
            if (error instanceof CustomError) {
                if (error.metaData) {
                    const errorData = error.metaData.errorMessage;
                    console.error(
                        `In field: ${errorData.field} - ${errorData.message}`,
                    );
                } else {
                    console.error(`Unknown error: ${JSON.stringify(error)}`);
                }

                // throw new Error('Placeholder for an error in to be rethrown and dealt with in the future in createNewBlog method of dataCommandRepository');
                return undefined;
            } else {
                console.error(
                    `Unknown error inside dataCommandRepository.updatePost: ${JSON.stringify(error)}`,
                );
                throw new Error(
                    "Placeholder for an error to be rethrown and dealt with in the future in updatePost method of dataCommandRepository",
                );
            }
        }
    }


    async deletePost(postId: string): Promise<null | undefined> {
        try {
            if (ObjectId.isValid(postId)) {
                const idToCheck = new ObjectId(postId);
                const res = await postsCollection.deleteOne({ _id: idToCheck });

                if (!res.acknowledged) {
                    throw new CustomError({
                        errorMessage: {
                            field: "postsCollection.deleteOne",
                            message: "attempt to delete post entry failed",
                        },
                    });
                }

                if (res.deletedCount === 1) {
                    return null;
                }
            } else {
                throw new CustomError({
                    errorMessage: {
                        field: "ObjectId.isValid(postId)",
                        message: "invalid post ID",
                    },
                });
            }
        } catch (error) {
            if (error instanceof CustomError) {
                if (error.metaData) {
                    const errorData = error.metaData.errorMessage;
                    console.error(
                        `In field: ${errorData.field} - ${errorData.message}`,
                    );
                } else {
                    console.error(`Unknown error: ${JSON.stringify(error)}`);
                }

                // throw new Error('Placeholder for an error in to be rethrown and dealt with in the future in createNewBlog method of dataCommandRepository');
                return undefined;
            } else {
                console.error(
                    `Unknown error inside dataCommandRepository.deletePost: ${JSON.stringify(error)}`,
                );
                throw new Error(
                    "Placeholder for an error to be rethrown and dealt with in the future in deletePost method of dataCommandRepository",
                );
            }
        }
    }
}
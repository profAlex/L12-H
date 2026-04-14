import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../composition-root/ioc-types";

import { CommentViewModel } from "../routers/router-types/comment-view-model";
import { CustomResult } from "../common/result-type/result-type";
import { ObjectId } from "mongodb";
import { HttpStatus } from "../common/http-statuses/http-statuses";
import { PostsCommandRepository } from "../repository-layers/command-repository-layer/posts-command-repository";
import { PostInputModel } from "../routers/router-types/post-input-model";
import { CommentModel } from "../db/mongo.db";
import { findUserByPrimaryKey } from "../repository-layers/query-repository-layer/users-query-repository";
import { CommentsCommandRepository } from "../repository-layers/command-repository-layer/comments-command-repository";

@injectable()
export class PostsCommandService {
    constructor(
        @inject(TYPES.PostsCommandRepository)
        protected postsCommandRepository: PostsCommandRepository,
        @inject(TYPES.CommentsCommandRepository) protected commentsCommandRepository:CommentsCommandRepository
    ) {}

    async createNewComment(
        postId: string,
        content: string,
        userId: string,
    ): Promise<CustomResult<CommentViewModel>> {

        // findUserByPrimaryKey и юзера брать выше и спускать оттуда
        const user = await findUserByPrimaryKey(new ObjectId(userId));

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

        const newComment = await CommentModel.createNewComment(postId,
            content,
            { id: userId, login: user.login });

        if (!(await this.commentsCommandRepository.saveNewComment(newComment))) {
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

        return  {
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

    async createNewPost(newPost: PostInputModel): Promise<string | undefined> {
        return await this.postsCommandRepository.createNewPost(newPost);
    }

    async updatePost(postId: string, newData: PostInputModel) {
        return await this.postsCommandRepository.updatePost(postId, newData);
    }

    async deletePost(postId: string): Promise<null | undefined> {
        return await this.postsCommandRepository.deletePost(postId);
    }
}

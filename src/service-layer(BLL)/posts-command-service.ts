import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../composition-root/ioc-types";

import { CommentViewModel } from "../routers/router-types/comment-view-model";
import { CustomResult } from "../common/result-type/result-type";
import { ObjectId } from "mongodb";
import { HttpStatus } from "../common/http-statuses/http-statuses";
import { PostsCommandRepository } from "../repository-layers/command-repository-layer/posts-command-repository";
import { PostInputModel } from "../routers/router-types/post-input-model";

@injectable()
export class PostsCommandService {
    constructor(
        @inject(TYPES.PostsCommandRepository)
        protected postsCommandRepository: PostsCommandRepository,
    ) {}

    async createNewComment(
        postId: string,
        content: string,
        userId: string,
    ): Promise<CustomResult<CommentViewModel>> {
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId)) {
            return {
                data: null,
                statusCode: HttpStatus.InternalServerError,
                statusDescription:
                    "User ID or Post ID dont look like valid mongo ID. Need to check input data and corresponding user and post records.",
                errorsMessages: [
                    {
                        field: "createNewComment -> if (!ObjectId.isValid(userId) || !ObjectId.isValid(postId))", // это служебная и отладочная информация, к ней НЕ должен иметь доступ фронтенд, обрабатываем внутри периметра работы бэкэнда
                        message: "User ID or Post ID have invalid format",
                    },
                ],
            };
        }

        return await this.postsCommandRepository.createNewComment(
            postId,
            content,
            userId,
        );
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

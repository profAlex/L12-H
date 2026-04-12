import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../composition-root/ioc-types";
import { CommentViewModel } from "../routers/router-types/comment-view-model";
import { CommentsQueryRepository } from "../repository-layers/query-repository-layer/comments-query-repository";
import { LikesQueryRepository } from "../repository-layers/query-repository-layer/likes-query-repository";
import { LikeDocument } from "../db/mongoose-like-collection-model";

@injectable()
export class CommentsQueryService {

    constructor(@inject(TYPES.CommentsQueryRepository) protected commentsQueryRepository:CommentsQueryRepository,
                @inject(TYPES.LikesQueryRepository) protected likesQueryRepository:LikesQueryRepository,) {
    }

    async findSingleComment(sentCommentId: string, sentUserId:string): Promise<CommentViewModel | undefined> {

        const foundComment = await this.commentsQueryRepository.findSingleComment(sentCommentId);

        if(!foundComment) {
            return undefined;
        }

        // проверяем репозиторий лайков, смотрим была ли уже реакция на этот коммент от запрашивающего пользователя
        const previousReactionResult: LikeDocument | null =
            await this.likesQueryRepository.checkIfUserAlreadyReacted(
                sentUserId,
                sentCommentId,
            );

        if(previousReactionResult)
        {
            foundComment.likesInfo.myStatus = previousReactionResult.likeStatus;
        }

        return foundComment;
    }

    async findSingleCommentAnonimously(sentCommentId: string): Promise<CommentViewModel | undefined> {

        const foundComment = await this.commentsQueryRepository.findSingleComment(sentCommentId);

        if(!foundComment) {
            return undefined;
        }

        return foundComment;
    }
}
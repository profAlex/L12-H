import { inject, injectable } from "inversify";
import { mapSingleCommentToViewModel } from "../mappers/map-to-CommentViewModel";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { isValidObjectId } from "mongoose";
import { CommentModel } from "../../db/mongo.db";
import { CommentLikeDocument, CommentLikeModel } from "../../db/mongoose-comments-like-collection-model";

@injectable()
export class CommentsLikesQueryRepository {

    async checkIfUserAlreadyReacted(sentUserId: string, sentCommentId: string): Promise<CommentLikeDocument | null> {
        return CommentLikeModel.findOne({
            userId: sentUserId,
            commentId: sentCommentId
        });
    }
}

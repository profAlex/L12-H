import { inject, injectable } from "inversify";
import { mapSingleCommentToViewModel } from "../mappers/map-to-CommentViewModel";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { isValidObjectId } from "mongoose";
import { CommentModel } from "../../db/mongo.db";
import { LikeDocument, LikeModel } from "../../db/mongoose-like-collection-model";

@injectable()
export class LikesQueryRepository {

    async checkIfUserAlreadyReacted(sentUserId: string, sentCommentId: string): Promise<LikeDocument | null> {
        return LikeModel.findOne({
            userId: sentUserId,
            commentId: sentCommentId
        });
    }
}

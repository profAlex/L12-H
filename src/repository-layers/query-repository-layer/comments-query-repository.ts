import { inject, injectable } from "inversify";
import { mapSingleCommentToViewModel } from "../mappers/map-to-CommentViewModel";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { isValidObjectId } from "mongoose";
import { CommentModel } from "../../db/mongo.db";

@injectable()
export class CommentsQueryRepository {
    async findSingleComment(
        commentId: string,
    ): Promise<CommentViewModel | undefined> {

        if(!isValidObjectId(commentId)) {
            return undefined;
        }
        //console.warn("DID WE GRT INSIDE CommentsQueryRepository.findSingleComment???")

        // .lean() дает чистый JS-объект без методов Mongoose
        const comment = await CommentModel.findById(commentId).lean();

        if (comment) {
            return mapSingleCommentToViewModel(comment);
        }

        return undefined;
    }
}

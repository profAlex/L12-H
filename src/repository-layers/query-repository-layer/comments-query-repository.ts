import { inject, injectable } from "inversify";
import { mapSingleCommentToViewModel } from "../mappers/map-to-CommentViewModel";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { isValidObjectId } from "mongoose";
import { CommentModel } from "../../db/mongo.db";
import { InputGetCommentsQueryModel } from "../../routers/router-types/comment-search-input-query-model";
import { CommentStorageModel } from "../../routers/router-types/comment-storage-model";
import { ObjectId } from "mongodb";

@injectable()
export class CommentsQueryRepository {
    async findSingleComment(
        commentId: string,
    ): Promise<CommentViewModel | undefined> {
        if (!isValidObjectId(commentId)) {
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

    async getCountDocuments(sentPostId: string): Promise<number> {
        return CommentModel.countDocuments({ relatedPostId: sentPostId });
    }

    async getSortedDocuments(
        sentPostId: string,
        sentSanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<(CommentStorageModel & { _id: ObjectId})[]> {
        const { sortBy, sortDirection, pageNumber, pageSize } =
            sentSanitizedQuery;

        const skip = (pageNumber - 1) * pageSize;
        return CommentModel.find({ relatedPostId: sentPostId })
            .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();
    }
}

import { inject, injectable } from "inversify";
import { mapSingleCommentToViewModel } from "../mappers/map-to-CommentViewModel";
import { CommentViewModel } from "../../routers/router-types/comment-view-model";
import { isValidObjectId } from "mongoose";
import { CommentModel } from "../../db/mongo.db";
import {
    CommentLikeDocument,
    CommentLikeModel,
} from "../../db/mongoose-comments-like-collection-model";
import { ObjectId } from "mongodb";
import { CommentsLikesStorageModel } from "../../routers/router-types/comment-like-storage-model";

@injectable()
export class CommentsLikesQueryRepository {
    async checkIfUserAlreadyReacted(
        sentUserId: string,
        sentCommentId: string,
    ): Promise<CommentLikeDocument | null> {
        return CommentLikeModel.findOne({
            userId: sentUserId,
            commentId: sentCommentId,
        });
    }

    // метод для поиска реакций для заданного перечня комментов(выбранного по айди поста, в методе commentsQueryRepository.getSortedComments) от определенного юзера во всей коллекции лайков-дизлайков
    async getReactionListForComments(
        sentCommentIds: string[],
        sentUserId: string,
    ): Promise<(CommentsLikesStorageModel & { _id: ObjectId })[]> {
        return CommentLikeModel.find({
            userId: sentUserId,
            commentId: {
                $in: sentCommentIds, // оператор $in позволяет найти всё: за один проход по индексу выцепляет все документы, где userId строго равен "sentUserId" и commentId является любым из списка sentCommentIds
            },
        }).lean();
    }
}

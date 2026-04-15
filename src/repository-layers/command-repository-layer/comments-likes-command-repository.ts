import { inject, injectable } from "inversify";
import { CommentLikeDocument, CommentLikeModel } from "../../db/mongoose-comments-like-collection-model";
import { ObjectId } from "mongodb";

@injectable()
export class CommentsLikesCommandRepository {

    async checkIfUserAlreadyReacted(sentUserId: string, sentCommentId: string): Promise<CommentLikeDocument | null> {
        return CommentLikeModel.findOne({
            userId: sentUserId,
            commentId: sentCommentId
        });
    }

    async saveLikeDocument(sentLikeDocument: CommentLikeDocument): Promise<boolean> {
        try {
            await sentLikeDocument.save();

            return true;
        } catch (error) {
            console.error(`Error saving like document inside LikesCommandRepository.saveLikeDocument: ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }


    async deleteCommentLikeById(sentLikeId: ObjectId): Promise<boolean> {
        try {
            const result = await CommentLikeModel.deleteOne(sentLikeId);

            return result.deletedCount === 1;
        } catch (error) {
            console.error(`Error deleting like document inside CommentsLikesCommandRepository -> deleteCommentLikeById: ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }

    async deleteLikesByCommentIds(commentIds: string[]): Promise<void> {
        await CommentLikeModel.deleteMany({
            commentId: { $in: commentIds }
        });
    }
}
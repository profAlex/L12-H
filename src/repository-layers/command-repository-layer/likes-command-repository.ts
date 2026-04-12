import { inject, injectable } from "inversify";
import { LikeDocument, LikeModel } from "../../db/mongoose-like-collection-model";

@injectable()
export class LikesCommandRepository {

    async checkIfUserAlreadyReacted(sentUserId: string, sentCommentId: string): Promise<LikeDocument | null> {
        return LikeModel.findOne({
            userId: sentUserId,
            commentId: sentCommentId
        });
    }

    async saveLikeDocument(sentLikeDocument: LikeDocument): Promise<boolean> {
        try {
            await sentLikeDocument.save();

            return true;
        } catch (error) {
            console.error(`Error saving like document inside LikesCommandRepository.saveLikeDocument: ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }


    async deleteLikeById(sentLikeDocument: LikeDocument): Promise<boolean> {
        try {
            await sentLikeDocument.deleteOne();

            return true;
        } catch (error) {
            console.error(`Error deleting like document inside deleteCommentById sentLikeDocument.deleteOne(): ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }

}
import { injectable } from "inversify";
import {
    PostLikeDocument,
    PostLikeModel,
} from "../../db/mongoose-posts-like-collection-model";
import { LikeDetailsViewModel } from "../../routers/router-types/post-LikeDetailsViewModel";
import { PostModel } from "../../db/mongoose-post-collection-model";
import { LikeStatus } from "../../routers/router-types/comment-like-storage-model";
import { ObjectId } from "mongodb";

@injectable()
export class PostsLikesCommandRepository {
    async deleteLikesByPostId(postId: string): Promise<void> {
        // Используем модель лайков именно для постов
        await PostLikeModel.deleteMany({ postId });
    }

    async checkIfUserAlreadyReacted(
        sentUserId: string,
        sentPostId: string,
    ): Promise<PostLikeDocument | null> {
        return PostLikeModel.findOne({
            postId: sentPostId,
            userId: sentUserId,
        });
    }

    async getLatestLikesForPost(
        sentPostId: string,
    ): Promise<LikeDetailsViewModel[]> {
        const latestLikes = await PostLikeModel.find({
            postId: sentPostId,
            likeStatus: LikeStatus.Like,
        })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();

        return latestLikes.map((like) => {
            return {
                addedAt: like.createdAt.toISOString(),
                userId: like.userId,
                login: like.userLogin,
            };
        });
    }

    async savePostLikeDocument(sentLikeDocument: PostLikeDocument): Promise<boolean> {
        try {
            await sentLikeDocument.save();

            return true;
        } catch (error) {
            console.error(`Error saving like document inside PostsLikesCommandRepository.savePostLikeDocument: ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }

    async deletePostLikeById(sentLikeId: ObjectId): Promise<boolean> {
        try {
            const result = await PostLikeModel.deleteOne(sentLikeId);

            return result.deletedCount === 1;
        } catch (error) {
            console.error(`Error deleting like document inside PostsLikesCommandRepository -> deletePostLikeById: ${error instanceof Error ? error.message : "Unknown error"}`);

            return false;
        }
    }
}

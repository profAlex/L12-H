import { injectable } from "inversify";
import { PostLikeModel } from "../../db/mongoose-posts-like-collection-model";


@injectable()
export class PostsLikesCommandRepository {

    async deleteLikesByPostId(postId: string): Promise<void> {
        // Используем модель лайков именно для постов
        await PostLikeModel.deleteMany({ postId });
    }
}
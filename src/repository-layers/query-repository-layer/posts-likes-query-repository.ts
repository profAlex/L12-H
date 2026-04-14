import { injectable } from "inversify";
import { PostLikeModel } from "../../db/mongoose-posts-like-collection-model";
import { PostsLikesStorageModel } from "../../routers/router-types/post-like-storage-model";
import { ObjectId } from "mongodb";

@injectable()
export class PostsLikesQueryRepository {

    async getReactionListForPosts(
        sentPostIdsList: string[],
        sentUserId: string,
    ): Promise<(PostsLikesStorageModel & { _id: ObjectId })[]> {

        return  PostLikeModel.find({
            userId: sentUserId,
            postId: {
                $in: sentPostIdsList, // оператор $in позволяет найти всё: за один проход по индексу выцепляет все документы, где userId строго равен "sentUserId" и commentId является любым из списка sentCommentIds
            },
        }).lean();
    }
}
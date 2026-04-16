import { HydratedDocument, model, Model, Schema } from "mongoose";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { PostsLikesStorageModel } from "../routers/router-types/post-like-storage-model";
import {
    COMMENTS_LIKES_COLLECTION_NAME,
    POSTS_LIKES_COLLECTION_NAME,
} from "./db-collection-names";

// export enum LikeStatus {
//     None = 'None',
//     Like = 'Like',
//     Dislike = 'Dislike'
// }
//
// export type PostsLikesStorageModel = {
//     postId: string;
//     userId: string;
//     userLogin: string;
//     createdAt: Date;
//     likeStatus: LikeStatus;
// };

const postLikesMethods = {

};

type PostLikesMethods = typeof postLikesMethods;

const postLikesStatics = {
    createNewPostLike(
        sentPostId: string,
        sentUserId: string,
        sentUserLogin: string,
        sentLike: LikeStatus,
    ): PostLikeDocument {
        const newPostLike = new PostLikeModel();
        newPostLike.postId = sentPostId;
        newPostLike.userId = sentUserId;
        newPostLike.userLogin = sentUserLogin;
        newPostLike.likeStatus = sentLike;

        return newPostLike;
    },
};

type PostLikesStatics = typeof postLikesStatics;

const PostLikesSchema = new Schema<PostsLikesStorageModel>(
    {
        // Мы не объявляем _id явно, Mongoose создаст его сам
        postId: { type: String, required: true },
        userId: { type: String, required: true },
        userLogin: { type: String, required: true },
        createdAt: {
            type: Date,
            default: Date.now,
            // просто {type: Date, default: new Date()} нельзя!
            // когда пишем код схемы, Node.js выполняет его один раз при старте приложения,
            // чтобы создать объект Schema
            // ВЫЗОВ ПРОИСХОДИТ ЗДЕСЬ И СЕЙЧАС, в момент старта приложения и запоминается как дефолтный
            // нужно передавать ссылку на функцию либо Date.now либо () => new Date()
        },
        likeStatus: {
            type: String,
            enum: Object.values(LikeStatus),
            required: true,
            default: LikeStatus.None,
        },
    },
    {
        collection: POSTS_LIKES_COLLECTION_NAME,
        timestamps: false,
        // versionKey: false,
        // id: false,
        autoIndex: false,
        optimisticConcurrency: true,
    },
);

// Уникальный составной индекс для ускорения поиска
PostLikesSchema.index({ postId: 1, createdAt: -1 });
// Уникальный составной индекс: один пользователь — один лайк на один комментарий.
// Это критично, чтобы не плодить дубликаты при частых кликах.
PostLikesSchema.index({ postId: 1, userId: 1 }, { unique: true });

type PostLikeModelType = Model<PostsLikesStorageModel, {}, PostLikesMethods> &
    PostLikesStatics;
export type PostLikeDocument = HydratedDocument<
    PostsLikesStorageModel,
    PostLikesMethods
>;

export const PostLikeModel = model<PostsLikesStorageModel, PostLikeModelType>(
    "PostLikes", // Короткое имя для внутренней регистрации в Mongoose
    PostLikesSchema,
    POSTS_LIKES_COLLECTION_NAME,
);

PostLikesSchema.methods = postLikesMethods;
PostLikesSchema.statics = postLikesStatics;

import { HydratedDocument, model, Model, Schema } from "mongoose";
import {
    LikeStatus,
} from "../routers/router-types/comment-like-storage-model";
import { PostsLikesStorageModel } from "../routers/router-types/post-like-storage-model";
import { COMMENTS_LIKES_COLLECTION_NAME, POSTS_LIKES_COLLECTION_NAME } from "./db-collection-names";

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

const PostLikeSchema = new Schema<PostsLikesStorageModel>(
    {
        // Мы не объявляем _id явно, Mongoose создаст его сам
        postId: { type: String, required: true },
        userId: { type: String, required: true },
        userLogin: { type: String, required: true },
        createdAt: {
            type: Date,
            default: Date.now
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
            default: LikeStatus.None
        },
    },
    {
        collection: POSTS_LIKES_COLLECTION_NAME,
        timestamps: false,
        // versionKey: false,
        // id: false,
        autoIndex: false,
        optimisticConcurrency: true
    },
);

// Уникальный составной индекс для ускорения поиска
PostLikeSchema.index({ postId: 1, createdAt: -1 });
// Уникальный составной индекс: один пользователь — один лайк на один комментарий.
// Это критично, чтобы не плодить дубликаты при частых кликах.
PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });


type PostLikeModelType = Model<PostsLikesStorageModel>;
export type PostLikeDocument = HydratedDocument<PostsLikesStorageModel>;

export const PostLikeModel = model<PostsLikesStorageModel, PostLikeModelType>(
    "PostLike", // Короткое имя для внутренней регистрации в Mongoose
    PostLikeSchema,
    POSTS_LIKES_COLLECTION_NAME
);
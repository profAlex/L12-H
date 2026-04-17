import { HydratedDocument, model, Model, Schema } from "mongoose";
import {
    CommentsLikesStorageModel,
    LikeStatus,
} from "../routers/router-types/comment-like-storage-model";
import { COMMENTS_LIKES_COLLECTION_NAME } from "./db-collection-names";

// export enum LikeStatus {
//     None = 'None',
//     Like = 'Like',
//     Dislike = 'Dislike'
// }
//
// export type CommentsLikesStorageModel = {
//     commentId: string;
//     userId: string;
//     likeStatus: LikeStatus;
//     createdAt: Date;
// };
const commentLikesMethods = {

};

type CommentLikesMethod = typeof commentLikesMethods;

const commentLikeStatics = {

};

type CommentsLikesStatics = typeof commentLikeStatics;

const CommentLikesSchema = new Schema<CommentsLikesStorageModel>(
    {
        // Мы не объявляем _id явно, Mongoose создаст его сам
        commentId: { type: String, required: true },
        userId: { type: String, required: true },
        likeStatus: {
            type: String,
            enum: Object.values(LikeStatus),
            required: true,
            default: LikeStatus.None
        },
        createdAt: {
            type: Date,
            default: Date.now
            // просто {type: Date, default: new Date()} нельзя!
            // когда пишем код схемы, Node.js выполняет его один раз при старте приложения,
            // чтобы создать объект Schema
            // ВЫЗОВ ПРОИСХОДИТ ЗДЕСЬ И СЕЙЧАС, в момент старта приложения и запоминается как дефолтный
            // нужно передавать ссылку на функцию либо Date.now либо () => new Date()
        },
    },
    {
        collection: COMMENTS_LIKES_COLLECTION_NAME,
        timestamps: false,
        // versionKey: false,
        id: false,
        autoIndex: false,
        optimisticConcurrency: true
    },
);

// Уникальный составной индекс: один пользователь — один лайк на один комментарий.
// Это критично, чтобы не плодить дубликаты при частых кликах.
CommentLikesSchema.index({ userId: 1, commentId: 1, }, { unique: true });
CommentLikesSchema.index({ commentId: 1, });

type CommentLikeModelType = Model<CommentsLikesStorageModel, {}, CommentLikesMethod> & CommentsLikesStatics;
export type CommentLikeDocument = HydratedDocument<CommentsLikesStorageModel, CommentLikesMethod>;

CommentLikesSchema.methods = commentLikesMethods;
CommentLikesSchema.statics = commentLikeStatics;

export const CommentLikeModel = model<CommentsLikesStorageModel, CommentLikeModelType>(
    "CommentLikes", // Короткое имя для внутренней регистрации в Mongoose
    CommentLikesSchema,
    COMMENTS_LIKES_COLLECTION_NAME
);


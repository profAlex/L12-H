import { HydratedDocument, model, Model, Schema } from "mongoose";
import {
    LikesStorageModel,
    LikeStatus,
} from "../routers/router-types/comment-like-storage-model";
import { LIKES_COLLECTION_NAME } from "./db-collection-names";

// export enum LikeStatus {
//     None = 'None',
//     Like = 'Like',
//     Dislike = 'Dislike'
// }
//
// export type LikesStorageModel = {
//     commentId: string;
//     userId: string;
//     likeStatus: LikeStatus;
//     createdAt: Date;
// };

const LikeSchema = new Schema<LikesStorageModel>(
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
        collection: LIKES_COLLECTION_NAME,
        timestamps: false,
        versionKey: false,
        id: false,
        autoIndex: false
    },
);

// Уникальный составной индекс: один пользователь — один лайк на один комментарий.
// Это критично, чтобы не плодить дубликаты при частых кликах.
LikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

type LikeModelType = Model<LikesStorageModel>;
export type LikeDocument = HydratedDocument<LikesStorageModel>;

export const LikeModel = model<LikesStorageModel, LikeModelType>(
    "Like", // Короткое имя для внутренней регистрации в Mongoose
    LikeSchema,
    LIKES_COLLECTION_NAME
);

// const LikeSchema = new mongoose.Schema<LikesStorageModel>(
//     {
//         commentId: { type: String, required: true },
//         userId: { type: String, required: true },
//         likeStatus: {
//             type: String,
//             enum: Object.values(LikeStatus),
//             required: true,
//         },
//         createdAt: { type: Date, default: Date.now },
//         // просто {type: Date, default: new Date()} нельзя!
//         // когда пишем код схемы, Node.js выполняет его один раз при старте приложения,
//         // чтобы создать объект Schema
//         // ВЫЗОВ ПРОИСХОДИТ ЗДЕСЬ И СЕЙЧАС, в момент старта приложения и запоминается как дефолтный
//         // нужно передавать ссылку на функцию либо Date.now либо () => new Date()
//     },
//     {
//         collection: LIKES_COLLECTION_NAME,
//         timestamps: false,
//         versionKey: false,
//         id: false,
//         autoIndex: false
//     },
// );
//
// // для индексирования поиска и гарантии уникальности записей
// LikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });
//
// type LikeModelType = Model<LikesStorageModel>;
//
// export type LikeDocument = HydratedDocument<LikesStorageModel>;
// export const LikeModel = mongoose.model<LikesStorageModel, LikeModelType>(
//     "LikeModel",
//     LikeSchema,
// );

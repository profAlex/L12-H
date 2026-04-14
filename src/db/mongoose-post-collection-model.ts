import { CallbackError, HydratedDocument, model, Model, Schema } from "mongoose";
import { PostStorageModel } from "../routers/router-types/post-storage-model";
import { Request, Response, NextFunction, json } from "express";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { POSTS_COLLECTION_NAME } from "./db-collection-names";
import { CommentStorageModel } from "../routers/router-types/comment-storage-model";
import { InputGetCommentsQueryModel } from "../routers/router-types/comment-search-input-query-model";
import { PaginatedCommentViewModel } from "../routers/router-types/comment-paginated-view-model";
import { CommentModel } from "./mongo.db";
import { ObjectId } from "mongodb";
import { CommentViewModel } from "../routers/router-types/comment-view-model";

// export type PostStorageModel = {
//     _id: ObjectId;
//     id: string;
//     title: string;
//     shortDescription: string;
//     content: string;
//     blogId: string;
//     blogName: string;
//     createdAt: Date;
//     extendedLikesInfo: ExtendedPostViewModel;
// };
//
// export type ExtendedPostViewModel = {
//     likesCount: number;
//     dislikesCount: number;
//     myStatus: LikeStatus;
//     newestLikes: LikeDetailsViewModel[];
// }
//
// export type LikeDetailsViewModel = {
//     addedAt: string;
//     userId: string;
//     login: string;
// };

const postMethods = {


}

type PostMethods = typeof postMethods;

const postStatics = {

};

type PostStatic = typeof postStatics;

const PostSchema = new Schema<PostStorageModel>(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: {
            type: String,
            required: true,
        },
        shortDescription: { type: String, required: true },
        content: { type: String, required: true },
        blogId: { type: String, required: true },
        blogName: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        extendedLikesInfo: {
            _id: false,
            likesCount: { type: Number, required: true, default: 0, min: 0 },
            dislikesCount: { type: Number, required: true, default: 0, min: 0 },
            myStatus: {
                type: String,
                enum: Object.values(LikeStatus),
                default: LikeStatus.None,
                required: true,
            },
            newestLikes: [
                {
                    _id: false,
                    addedAt: { type: String },
                    userId: { type: String },
                    login: { type: String },
                },
            ],
        },
    },

    {
        collection: POSTS_COLLECTION_NAME,
        timestamps: false,
        id: false,
        autoIndex: false, // Индексы создаем вручную в runDB
        // настройку versionKey:false пока исключаем чтобы работал optimisticConcurrency, посмотри как поведут себя платформенные тесты
        // versionKey: false,
        optimisticConcurrency: true,
    },
);




// эта часть понадобится если платформенные тесты будут валиться изза обнаружения полей версии __v
// PostSchema.set('toJSON', {
//     transform: (doc, ret: Partial<PostStorageModel & { __v: number }>) => {
//         delete ret.__v;
//         return ret;
//     }
// });
// PostSchema.set('toObject', {
//     transform: (doc, ret: Partial<PostStorageModel & { __v: number }>) => {
//         delete ret.__v;
//         return ret;
//     }
// });

// по-большому счету хук с заполнением поля id - ненужная перестраховка - я создаю поля документа полностью самостоятельно перед .save()
// тут логичнее было бы как раз проверить создано ли поле
// и если поля нет, тогда выдать соответствующую ошибку, что свидетельствовало бы о том что в коде ошибка
PostSchema.pre("validate", async function (this: any) {
    if (!this.id) {
        throw new Error(
            "Internal architecture Error: id must be initialized before validation",
        );
    }
});

PostSchema.index({ blogId: 1, createdAt: -1 });


type PostModelType = Model<PostStorageModel>;
export type PostDocument = HydratedDocument<PostStorageModel>;

export const PostModel = model<PostStorageModel, PostModelType>("Post", PostSchema, POSTS_COLLECTION_NAME);
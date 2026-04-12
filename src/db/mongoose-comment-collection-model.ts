import { Schema, model, Model, HydratedDocument } from "mongoose";
import { CommentStorageModel } from "../routers/router-types/comment-storage-model";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { COMMENTS_COLLECTION_NAME } from "./db-collection-names";

// export type CommentStorageModel = {
//     _id: ObjectId;
//     id: string;
//     relatedPostId: string;
//     content: string;
//     commentatorInfo: CommentatorInfo;
//     createdAt: Date;
//     likesInfo: LikesInfoViewModel;
// };
//
// export type CommentatorInfo = {
//     userId: string;
//     userLogin: string;
// };

// export enum LikeStatus {
//     None = 'None',
//     Like = 'Like',
//     Dislike = 'Dislike'
// }
//
// export type LikesInfoViewModel = {
//     likesCount: number;
//     dislikesCount: number;
//     myStatus: LikeStatus;
// }

const CommentSchema = new Schema<CommentStorageModel>(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: {
            type: String,
            required: true,
            default: function (this: any) {
                return this._id ? this._id.toString() : null;
            },
        },
        relatedPostId: { type: String, required: true },
        content: { type: String, required: true },

        commentatorInfo: {
            userId: { type: String, required: true },
            userLogin: { type: String, required: true },
        },

        createdAt: { type: Date, required: true },

        likesInfo: {
            likesCount: { type: Number, required: true, default: 0, min: 0 },
            dislikesCount: { type: Number, required: true, default: 0, min: 0 },
            myStatus: {
                type: String,
                enum: Object.values(LikeStatus),
                default: LikeStatus.None,
                required: true
            },
            _id: false
        },
    },
    {
        collection: COMMENTS_COLLECTION_NAME,
        timestamps: false,
        versionKey: false,
        id: false,
        autoIndex: false, // Индексы создаем вручную в runDB
    },
);

// // явно задаем дефолтное значение для всего объекта likesInfo,
// // чтобы он всегда создавался при CommentModel.create({})
// CommentSchema.path('likesInfo').default(() => ({
//     likesCount: 0,
//     dislikesCount: 0,
//     myStatus: LikeStatus.None
// }));

// Составной индекс для быстрой пагинации (поиск по посту + сортировка по дате)
CommentSchema.index({ relatedPostId: 1, createdAt: -1 });

type CommentModelType = Model<CommentStorageModel>;
export type CommentDocument = HydratedDocument<CommentStorageModel>;

export const CommentModel = model<CommentStorageModel, CommentModelType>("Comment", CommentSchema, COMMENTS_COLLECTION_NAME);
// console.log("🔍 Actual collection name for CommentModel:", CommentModel.collection.name);



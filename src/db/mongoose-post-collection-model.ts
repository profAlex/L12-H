import { CallbackError, HydratedDocument, model, Model, Schema } from "mongoose";
import { PostStorageModel } from "../routers/router-types/post-storage-model";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { POSTS_COLLECTION_NAME } from "./db-collection-names";
import { PostInputModel } from "../routers/router-types/post-input-model";

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

    // "title": "string",
    // "shortDescription": "string",
    // "content": "string",
    // "blogId": "string"
    updatePost(bodyData: PostInputModel) {
        const { title, shortDescription, content, blogId } = bodyData;

        (this as PostDocument).title = title;
        (this as PostDocument).shortDescription = shortDescription;
        (this as PostDocument).content = content;
        (this as PostDocument).blogId = blogId;
    }

}


const postStatics = {

    // "title": "string",
    // "shortDescription": "string",
    // "content": "string",
    // "blogId": "string"
    async createNewPost (
        blogName: string,
        bodyData: PostInputModel
    ): Promise<PostDocument> {

        const {title, shortDescription, content, blogId} = bodyData;

        const newPost = new PostModel();
        newPost.id = newPost._id.toString();
        newPost.shortDescription = shortDescription;
        newPost.title = title;
        newPost.blogId = blogId;
        newPost.blogName = blogName;
        newPost.createdAt = new Date();

        return newPost;
    }
};

type PostMethods = typeof postMethods;
type PostStatics = typeof postStatics;

const PostSchema = new Schema<PostStorageModel>(
    {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: {
            type: String,
            required: true,
            default: function (this: any) {
                return this._id ? this._id.toString() : "undefined";
            },
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
            "Internal architecture Error: id in new post must be initialized before validation",
        );
    }
});

PostSchema.index({ blogId: 1, createdAt: -1 });


type PostModelType = Model<PostStorageModel, {}, PostMethods> & PostStatics;
export type PostDocument = HydratedDocument<PostStorageModel, PostMethods>;

export const PostModel = model<PostStorageModel, PostModelType>("Post", PostSchema, POSTS_COLLECTION_NAME);
PostSchema.methods = postMethods;
PostSchema.statics = postStatics;
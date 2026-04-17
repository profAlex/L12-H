import { HydratedDocument, model, Model, Schema } from "mongoose";
import { PostStorageModel } from "../routers/router-types/post-storage-model";
import { LikeStatus } from "../routers/router-types/comment-like-storage-model";
import { POSTS_COLLECTION_NAME } from "./db-collection-names";
import { PostInputModel } from "../routers/router-types/post-input-model";
import { LikeDetailsViewModel } from "../routers/router-types/post-LikeDetailsViewModel";

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
    },

    async addPostReaction(
        sentPostId: string,
        newStatus: LikeStatus
    ): Promise<boolean> {
        try {
            const updateQuery = newStatus === LikeStatus.Like
                ? { 'extendedLikesInfo.likesCount': 1 }
                : { 'extendedLikesInfo.dislikesCount': 1 };

            // атомарный апдейт для избегания состояния гонки
            const result = await PostModel.updateOne(
                { _id: sentPostId as any },
                { $inc: updateQuery }
            );

            // если matchedCount === 0, значит комментария с таким ID нет в базе
            if (result.matchedCount === 0) {
                console.error(`Couldn't find post with id: ${sentPostId} inside PostsCommandRepository.addPostReaction`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(
                ` Error inside PostsCommandRepository.addPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return false;
        }
    },

    async nullifyingPostReaction(
        sentPostId: string,
        oldStatus: LikeStatus,
    ): Promise<boolean> {
        try {
            const fieldToDecrement = oldStatus === LikeStatus.Like
                ? 'extendedLikesInfo.likesCount'
                : 'extendedLikesInfo.dislikesCount';

            // создаем фильтр: ищем по ID И проверяем, что в поле больше 0
            const filter: any = {
                _id: sentPostId,
                [fieldToDecrement]: { $gt: 0 } // Защита от ухода в минус
            };

            // выполняем атомарное уменьшение
            const result = await PostModel.updateOne(
                filter,
                { $inc: { [fieldToDecrement]: -1 } }
            );

            if (result.matchedCount === 0) {
                console.error(`Couldn't find post with id: ${sentPostId} inside  PostsCommandRepository.nullifyingPostReaction`);

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error inside PostsCommandRepository.nullifyingPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    },

    async switchPostReaction(
        sentPostId: string,
        newStatus: LikeStatus,
    ): Promise<boolean> {
        try {
            // это не нужно, т.к. updateOne сам найдет и обновит, дополнительно это делать и проверять - лишняя операция
            // const comment: CommentDocument | null =
            //     await CommentModel.findById(sentCommentId);
            //
            // if (!comment) {
            //     console.error(
            //         `Couldn't find comment with id: ${sentCommentId} inside CommentsCommandRepository.switchCommentReaction`,
            //     );
            //
            //     return false;
            // }

            // Определяем, что прибавляем, а что отнимаем
            const isEnablingLike = newStatus === LikeStatus.Like;

            // Нужно убедиться, что dislikesCount > 0 перед вычитанием.
            const filter: any = { _id: sentPostId };

            if (isEnablingLike) {
                filter["extendedLikesInfo.dislikesCount"] = { $gt: 0 };
            } else {
                filter["extendedLikesInfo.likesCount"] = { $gt: 0 };
            }

            const updateQuery = isEnablingLike
                ? { "extendedLikesInfo.likesCount": 1, "extendedLikesInfo.dislikesCount": -1 }
                : { "extendedLikesInfo.likesCount": -1, "extendedLikesInfo.dislikesCount": 1 };

            // используем атомарный updateOne вместо save(), чтобы избежать состояния гонки
            const result = await PostModel.updateOne(filter, {
                $inc: updateQuery,
            });

            // result.matchedCount > 0 означает, что комментарий найден и обновлен
            if (result.matchedCount === 0) {
                console.error(
                    `Couldn't find post with id: ${sentPostId} inside PostsCommandRepository.switchPostReaction`,
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                `Error saving post reaction inside PostsCommandRepository.switchPostReaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            );

            return false;
        }
    },

    updateNewestLikes(latestLikes: LikeDetailsViewModel[]): void {
        (this as PostDocument).extendedLikesInfo.newestLikes = latestLikes;
    }
}


const postStatics = {

    // "title": "string",
    // "shortDescription": "string",
    // "content": "string",
    // "blogId": "string"
    createNewPost (
        blogName: string,
        bodyData: PostInputModel
    ): PostDocument {

        const {title, shortDescription, content, blogId} = bodyData;

        const newPost = new PostModel();
        newPost.id = newPost._id.toString();
        newPost.shortDescription = shortDescription;
        newPost.content = content;
        newPost.title = title;
        newPost.blogId = blogId;
        newPost.blogName = blogName;
        newPost.createdAt = new Date();
        newPost.extendedLikesInfo.likesCount =0;
        newPost.extendedLikesInfo.dislikesCount =0;
        newPost.extendedLikesInfo.myStatus = LikeStatus.None;
        newPost.extendedLikesInfo.newestLikes = [];

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
        title: {type: String, required: true},
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
        // настройку versionKey:false пока исключаем, посмотри как поведут себя платформенные тесты
        // versionKey: false,
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

PostSchema.methods = postMethods;
PostSchema.statics = postStatics;
export const PostModel = model<PostStorageModel, PostModelType>("Post", PostSchema, POSTS_COLLECTION_NAME);

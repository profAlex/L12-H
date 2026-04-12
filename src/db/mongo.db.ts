import { Collection, Db, MongoClient } from "mongodb";
import { BlogViewModel } from "../routers/router-types/blog-view-model";
import { PostViewModel } from "../routers/router-types/post-view-model";
import { UserCollectionStorageModel } from "../routers/router-types/user-storage-model";
import { CommentStorageModel } from "../routers/router-types/comment-storage-model";
import { RefreshTokensStorageModel } from "../routers/router-types/refresh-tokens-storage-model";
import { SessionStorageModel } from "../routers/router-types/auth-SessionStorageModel";
import { RequestRestrictionStorageModel } from "../routers/router-types/auth-RequestRestrictionStorageModel";
import { envConfig } from "../config";

import mongoose from "mongoose";
import { SessionModel } from "./mongoose-session-collection-model";
import { CommentModel } from "./mongoose-comment-collection-model";
import { LikeModel } from "./mongoose-like-collection-model";
import {
    BLOGGERS_COLLECTION_NAME,
    COMMENTS_COLLECTION_NAME,
    POSTS_COLLECTION_NAME, REQUESTS_RESTRICTIONS_COLLECTION_NAME, SESSIONS_COLLECTION_NAME,
    USERS_COLLECTION_NAME
} from "./db-collection-names";

const DB_NAME = "bloggers_db";


// const URI ="mongodb+srv://admin:admin@learningcluster.f1zm90x.mongodb.net/?retryWrites=true&w=majority&appName=LearningCluster";
const URI = ""

let db: Db | null = null;
export let client: MongoClient | null = null;

export let bloggersCollection: Collection<BlogViewModel>;
export let postsCollection: Collection<PostViewModel>;
export let usersCollection: Collection<UserCollectionStorageModel>;
export let commentsCollection: Collection<CommentStorageModel>;
//export let refreshTokensBlackListCollection: Collection<RefreshTokensStorageModel>;

export let sessionsDataStorage: Collection<SessionStorageModel>;
export let requestsRestrictionDataStorage: Collection<RequestRestrictionStorageModel>;

export async function runDB() {
    client = new MongoClient(URI);
    db = client.db(DB_NAME);

    // // Инициализация коллекций (Native Driver)
    // bloggersCollection = db.collection<BlogViewModel>(BLOGGERS_COLLECTION_NAME);
    // postsCollection = db.collection<PostViewModel>(POSTS_COLLECTION_NAME);
    // usersCollection = db.collection<UserCollectionStorageModel>(USERS_COLLECTION_NAME);
    // //refreshTokensBlackListCollection = db.collection<RefreshTokensStorageModel>(REFRESH_TOKENS_COLLECTION_NAME);
    // commentsCollection = db.collection<CommentStorageModel>(COMMENTS_COLLECTION_NAME);
    // sessionsDataStorage = db.collection<SessionStorageModel>(SESSIONS_COLLECTION_NAME);
    // requestsRestrictionDataStorage = db.collection<RequestRestrictionStorageModel>(REQUESTS_RESTRICTIONS_COLLECTION_NAME);

    try {
        client = new MongoClient(URI);
        await client.connect(); // Сначала коннект

        db = client.db(DB_NAME);
        const nativeDb = db;

        // Инициализация коллекций (Native Driver)
        bloggersCollection = db.collection<BlogViewModel>(BLOGGERS_COLLECTION_NAME);
        postsCollection = db.collection<PostViewModel>(POSTS_COLLECTION_NAME);
        usersCollection = db.collection<UserCollectionStorageModel>(USERS_COLLECTION_NAME);
        commentsCollection = db.collection<CommentStorageModel>(COMMENTS_COLLECTION_NAME);
        sessionsDataStorage = db.collection<SessionStorageModel>(SESSIONS_COLLECTION_NAME);
        requestsRestrictionDataStorage = db.collection<RequestRestrictionStorageModel>(REQUESTS_RESTRICTIONS_COLLECTION_NAME);

        try {
            // await nativeDb.dropCollection(SESSIONS_COLLECTION_NAME);
            // console.log(`🧹 Collection ${SESSIONS_COLLECTION_NAME} dropped to reset indexes`);
            //
            // await nativeDb.dropCollection(COMMENTS_COLLECTION_NAME);
            // console.log(`🧹 Collection ${COMMENTS_COLLECTION_NAME} dropped to reset indexes`);
            //
            // await nativeDb.dropCollection(LIKES_COLLECTION_NAME);
            // console.log(`🧹 Collection ${LIKES_COLLECTION_NAME} dropped to reset indexes`);
            //
            // await nativeDb.dropCollection(REQUESTS_RESTRICTIONS_COLLECTION_NAME);
            // console.log(`🧹 Collection ${REQUESTS_RESTRICTIONS_COLLECTION_NAME} dropped to reset indexes`);
            //
            // // Даем Atlas время (1 секунда), чтобы очистить кэш
            // await new Promise(res => setTimeout(res, 1000));

            await mongoose.connect(URI, { dbName: DB_NAME });

            // дропаем индексы средствами Mongoose
            // Метод .collection.dropIndexes() обращается напрямую к коллекции через драйвер Mongoose
            console.log("🧹 Dropping indexes via Mongoose...");

            await Promise.all([
                safeMongooseDropIndexes(SessionModel),
                safeMongooseDropIndexes(CommentModel),
                safeMongooseDropIndexes(LikeModel)
            ]);

            // создаем индексы заново (синхронизируем со схемами)
            await Promise.all([
                SessionModel.createIndexes(),
                CommentModel.createIndexes(), // Создаст и твой новый составной индекс
                LikeModel.createIndexes()
            ]);

            console.log("✅ Mongoose indexes rebuilt successfully");

            // для Native коллекций оставляем пока старый хелпер
            await setupCollectionIndexes(
                requestsRestrictionDataStorage,
                REQUESTS_RESTRICTIONS_COLLECTION_NAME,
                [{ field: "dateOfRequest", name: "dateOfRequest_1", ttl: 30, description: "" }]
            );

            // console.log(`🟢 Connected to DB ${DB_NAME}`);
        } catch (e) {
            console.log("ℹ️ Collection did not exist, skipping drop");
        }

        // После dropIndexes база пустая, принудительно заставляем Mongoose применить создание индексов
        // запускаем оба асинхронных процесса параллельно
        await Promise.all([
            SessionModel.createIndexes(),
            LikeModel.createIndexes(),
            CommentModel.createIndexes()
        ]);
        console.log("✅ Fresh Mongoose indexes created successfully");

        // настройка индексов для коллекций, которые еще не в Mongoose
        // refreshTokensBlackListCollection уже deprecated, нужно будет удалить
        // await refreshTokensBlackListCollection.createIndex(
        //     { createdAt: 1 },
        //     { expireAfterSeconds: 86400 },
        // );

        // await setupCollectionIndexes(
        //     requestsRestrictionDataStorage,
        //     "requests_restrictions_collection",
        //     [
        //         {
        //             field: "dateOfRequest",
        //             name: "dateOfRequest_1",
        //             ttl: 30,
        //             description: "TTL index for requests_restrictions (30s)",
        //         },
        //     ],
        // );

        await db.command({ ping: 1 });
        console.log(`🟢 Connected to DB ${DB_NAME} (Hybrid: Native + Mongoose)`);

    } catch (error) {
        console.error("❌ Database connection error:", error);
        if (client) await client.close();
        await mongoose.disconnect();
        throw new Error(`Database not connected: ${error}`);
    }
}

export async function closeDB() {
    try {
        if (client) await client.close();
        await mongoose.disconnect();
        console.log("🛑 MongoDB & Mongoose connections closed");
    } catch (error) {
        console.error("Error during closing DB: ", error);
    }
}

async function safeMongooseDropIndexes(model: mongoose.Model<any>) {
    try {
        // collection.dropIndexes() удаляет все индексы кроме _id
        await model.collection.dropIndexes();
    } catch (e: any) {
        // Если коллекции еще нет (код 26), просто игнорируем
        if (e.code !== 26) {
            console.warn(`Note: Could not drop indexes for ${model.modelName}: ${e.message}`);
        }
    }
}

async function setupCollectionIndexes(
    collection: Collection<any>,
    collectionName: string,
    indexesToSetup: Array<{ field: string; name: string; ttl: number; description: string }>
): Promise<void> {
    for (const indexConfig of indexesToSetup) {
        try {
            let existingIndex: any = null; // Используем any для простоты в системной функции
            try {
                const existingIndexes = await collection.indexes();
                existingIndex = existingIndexes.find(idx => idx.name === indexConfig.name);
            } catch (error: any) {
                if (error.code !== 26) throw error;
            }

            // Теперь проверки пройдут успешно
            if (!existingIndex || existingIndex.expireAfterSeconds !== indexConfig.ttl) {
                if (existingIndex) await collection.dropIndex(indexConfig.name);

                await collection.createIndex(
                    { [indexConfig.field]: 1 },
                    { name: indexConfig.name, expireAfterSeconds: indexConfig.ttl }
                );
                console.log(`✓ Index ${indexConfig.name} for ${collectionName} processed`);
            }
        } catch (error) {
            console.error(`❌ Error in setupCollectionIndexes for ${collectionName}:`, error);
        }
    }
}
// // вспомогательная функция
// async function setupCollectionIndexes(
//     collection: Collection<any>,
//     collectionName: string,
//     indexesToSetup: Array<{ field: string; name: string; ttl: number; description: string }>
// ): Promise<void> {
//     for (const indexConfig of indexesToSetup) {
//         try {
//             const existingIndexes = await collection.indexes();
//             const existingIndex = existingIndexes.find(idx => idx.name === indexConfig.name);
//
//             if (!existingIndex || existingIndex.expireAfterSeconds !== indexConfig.ttl) {
//                 if (existingIndex) await collection.dropIndex(indexConfig.name);
//                 await collection.createIndex(
//                     { [indexConfig.field]: 1 },
//                     { name: indexConfig.name, expireAfterSeconds: indexConfig.ttl }
//                 );
//                 console.log(`✓ Index ${indexConfig.name} for ${collectionName} processed`);
//             }
//         } catch (error) {
//             console.error(`❌ Error in setupCollectionIndexes for ${collectionName}:`, error);
//         }
//     }
// }

export { db, SessionModel, CommentModel };
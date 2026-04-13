import { Schema, model, Model, HydratedDocument } from "mongoose";
import { envConfig } from "../config";
import { SessionStorageModel } from "../routers/router-types/auth-SessionStorageModel";
import { UUIDgeneration } from "../adapters/randomUUIDgeneration/UUIDgeneration";
import { SESSIONS_COLLECTION_NAME } from "./db-collection-names";

const SessionSchema = new Schema<SessionStorageModel>(
    {
        // _id: { type: Schema.Types.ObjectId, auto: true },

        userId: { type: String, required: true },
        deviceId: { type: String, required: true }, // Сделаем required, так как хук его заполнит

        // TTL индекс: документ удалится из базы автоматически через указанное время ПОСЛЕ issuedAt
        issuedAt: {
            type: Date,
            required: true,
            expires: envConfig.refreshTokenLifetime + 100,
        },

        deviceName: { type: String, required: true },
        deviceIp: { type: String, required: true },

        // Для бизнес-логики (сравнение дат при валидации токена)
        expiresAt: {
            type: Date,
            required: true
        },
    },
    {
        collection: SESSIONS_COLLECTION_NAME,
        versionKey: false,
        timestamps: false,
        id: false,
        autoIndex: false
    },
);

// хук перед сохранением - здесь прописываем логику конструктора, которая была в class UserSession
SessionSchema.pre<SessionDocument>("validate", async function () {
    // генерация UUID
    if (!this.deviceId) {
        this.deviceId = UUIDgeneration.generateUUID();
    }

    // Получаем текущее время в мс
    const currentTimeMs = Date.now();
    // Преобразуем в секунды с округлением вниз
    const timestampSeconds = Math.floor(currentTimeMs / 1000);
    // Создаём Date из округлённых секунд (будет кратно 1000 мс)
    if (!this.issuedAt) {
        this.issuedAt = new Date(timestampSeconds * 1000);
    }

    // расчет expiresAt
    if (!this.expiresAt) {
        this.expiresAt = new Date(
            this.issuedAt.getTime() + envConfig.refreshTokenLifetime * 1000,
        );
    }

    // В async хуках НЕ НУЖНО вызывать next()
    // next();
});

type SessionModelType = Model<SessionStorageModel>;
export type SessionDocument = HydratedDocument<SessionStorageModel>;

export const SessionModel = model<SessionStorageModel, SessionModelType>(
    "Session", // Регистрация как 'Session', чтобы избежать 'sessionmodels'
    SessionSchema,
    SESSIONS_COLLECTION_NAME
);

// структура коллекции в базе данных
// _id: ObjectId;
// userId: string;
// deviceId: string;
// issuedAt: Date;
// deviceName: string;
// deviceIp: string;
// expiresAt: Date;
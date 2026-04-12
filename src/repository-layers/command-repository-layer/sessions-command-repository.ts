import { inject, injectable } from "inversify";


import { ObjectId } from "mongodb";
import { SessionModel, sessionsDataStorage } from "../../db/mongo.db";
import { UserSession } from "../../common/classes/session-class";
import { SessionDocument } from "../../db/mongoose-session-collection-model";

@injectable()
export class SessionsCommandRepository {
    // export type SessionStorageModel = {
    //     userId: string;
    //     deviceId: string;
    //     issuedAt: Date;
    //     deviceName: string;
    //     deviceIp: string;
    //     expiresAt: Date;
    // }

    // там где этот метод используется для гварда - айдишник сессии в базе передаем через req, чтобы впоследствии можно было быстро найти данную сессию
    async findSession(
        userId: string,
        deviceId: string,
        expiresAt: Date,
        issuedAt: Date,
    ): Promise<ObjectId | null> {
        try {
            // Используем Mongoose модель
            const session = await SessionModel.findOne({
                userId: userId,
                deviceId: deviceId,
                // Важно: убедитесь, что приходящие expiresAt и issuedAt
                // имеют 0 миллисекунд, так как в базе они хранятся именно так
                expiresAt: expiresAt,
                issuedAt: issuedAt,
            })
                .select('_id') // Заменяет projection
                .lean();

            // Mongoose возвращает _id как объект ObjectId
            return session ? (session._id as ObjectId) : null;
        } catch (error) {
            console.error("Unknown error during findSession", error);
            return null;
        }
    }

    async createSession(sessionDocument: SessionDocument): Promise<boolean> {
        try {
            await sessionDocument.save();
            return true;
        } catch (error: any) {
            console.error("Unknown error during createSession", error.message);
            return false;
        }
    }

    // async updateSession(
    //     expiresAt: Date,
    //     issuedAt: Date,
    //     sessionIndexId: ObjectId,
    // ): Promise<boolean | null> {
    //     try {
    //         const result = await sessionsDataStorage.updateOne(
    //             { _id: sessionIndexId },
    //             {
    //                 $set: {
    //                     expiresAt: expiresAt,
    //                     issuedAt: issuedAt,
    //                 },
    //             },
    //         );
    //
    //         if (!result.acknowledged) {
    //             console.error("Couldn't update session inside updateSession");
    //
    //             return null;
    //         }
    //
    //         return !!result;
    //     } catch (error) {
    //         console.error("Unknown error inside findSession", error);
    //
    //         return null;
    //     }
    // }

    async updateSession(
        expiresAt: Date,
        issuedAt: Date,
        sessionIndexId: ObjectId,
    ): Promise<boolean | null> {
        try {
            // Используем Mongoose модель для обновления
            const result = await SessionModel.updateOne(
                { _id: sessionIndexId },
                {
                    $set: {
                        expiresAt: expiresAt,
                        issuedAt: issuedAt,
                    },
                },
            );

            // В Mongoose результат содержит те же поля, что и в Native Driver
            if (result.matchedCount === 0) {
                console.error("Session not found for update inside updateSession");
                return false;
            }

            return result.acknowledged;
        } catch (error) {
            console.error("Unknown error inside updateSession", error);
            return null;
        }
    }

    // async removeSessionBySessionId(sessionId: ObjectId): Promise<undefined | null> {
    //     try {
    //         const result = await sessionsDataStorage.deleteOne({
    //             _id: sessionId,
    //         });
    //
    //         if (!result.acknowledged) {
    //             console.error("Couldn't remove session inside removeSessionBySessionId");
    //
    //             return undefined;
    //         }
    //
    //         return null;
    //     }catch(error) {
    //         console.error("Unknown error inside removeSessionBySessionId", error);
    //
    //         return undefined;
    //     }
    // }
    //
    //
    // async removeSessionByDeviceId(deviceId: string): Promise<undefined | null> {
    //     try {
    //         const result = await sessionsDataStorage.deleteOne({
    //             deviceId: deviceId,
    //         });
    //
    //         if (!result.acknowledged) {
    //             console.error("Couldn't remove session inside removeSessionByDeviceId");
    //
    //             return undefined;
    //         }
    //
    //         return null;
    //     }catch(error) {
    //         console.error("Unknown error inside removeSessionByDeviceId", error);
    //
    //         return undefined;
    //     }
    // }
    //
    //
    // async removeAllButOneSession(sessionId: ObjectId, userId:string): Promise<undefined | null> {
    //     try {
    //         const result = await sessionsDataStorage.deleteMany({
    //             userId: userId,
    //             _id: { $ne: sessionId }
    //         });
    //
    //         if (!result.acknowledged) {
    //             console.error("Couldn't remove sessions inside removeAllButOneSession");
    //
    //             return undefined;
    //         }
    //
    //         return null;
    //     }catch(error) {
    //         console.error("Unknown error inside removeAllButOneSession", error);
    //
    //         return undefined;
    //     }
    // }

    async removeSessionBySessionId(sessionId: ObjectId): Promise<undefined | null> {
        try {
            // Используем Mongoose deleteOne
            const result = await SessionModel.deleteOne({
                _id: sessionId,
            });

            if (!result.acknowledged) {
                console.error("Couldn't remove session inside removeSessionBySessionId");
                return undefined;
            }

            return null;
        } catch (error) {
            console.error("Unknown error inside removeSessionBySessionId", error);
            return undefined;
        }
    }

    async removeSessionByDeviceId(deviceId: string): Promise<undefined | null> {
        try {
            // Удаление по deviceId через модель
            const result = await SessionModel.deleteOne({
                deviceId: deviceId,
            });

            if (!result.acknowledged) {
                console.error("Couldn't remove session inside removeSessionByDeviceId");
                return undefined;
            }

            return null;
        } catch (error) {
            console.error("Unknown error inside removeSessionByDeviceId", error);
            return undefined;
        }
    }

    async removeAllButOneSession(sessionId: ObjectId, userId: string): Promise<undefined | null> {
        try {
            // Mongoose deleteMany для удаления всех сессий пользователя, кроме текущей
            const result = await SessionModel.deleteMany({
                userId: userId,
                _id: { $ne: sessionId }
            });

            if (!result.acknowledged) {
                console.error("Couldn't remove sessions inside removeAllButOneSession");
                return undefined;
            }

            return null;
        } catch (error) {
            console.error("Unknown error inside removeAllButOneSession", error);
            return undefined;
        }
    }
}
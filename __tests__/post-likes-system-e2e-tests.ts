import express from "express";
import { setupApp } from "../src/setup-app";
import { closeDB, runDB } from "../src/db/mongo.db";
import request from "supertest";
import {
    AUTH_PATH,
    POSTS_PATH,
    TESTING_PATH
} from "../src/routers/pathes/router-pathes";
import { BlogInputModel } from "../src/routers/router-types/blog-input-model";
import { dataCommandRepository } from "../src/repository-layers/command-repository-layer/command-repository";
import { PostInputModel } from "../src/routers/router-types/post-input-model";
import { UserInputModel } from "../src/routers/router-types/user-input-model";
import { AccessTokenModel } from "../src/adapters/verification/auth-access-token-model";
import { HttpStatus } from "../src/common/http-statuses/http-statuses";
import { container } from "../src/composition-root/composition-root";
import { UsersCommandRepository } from "../src/repository-layers/command-repository-layer/users-command-repository";
import { TYPES } from "../src/composition-root/ioc-types";
import { UsersQueryRepository } from "../src/repository-layers/query-repository-layer/users-query-repository";
import { LikeStatus } from "../src/routers/router-types/comment-like-storage-model";
import { CommentsHandler } from "../src/routers/router-handlers/comment-router-description";
import { CommentsQueryService } from "../src/service-layer(BLL)/comments-query-service";
import { PostsCommandRepository } from "../src/repository-layers/command-repository-layer/posts-command-repository";
import { PostModel } from "../src/db/mongoose-post-collection-model";

describe("Test API for liking/disliking posts", () => {
    const testApp = express();
    setupApp(testApp);

    const usersCommandRepository = container.get<UsersCommandRepository>(
        TYPES.UsersCommandRepository
    );
    const usersQueryRepository = container.get<UsersQueryRepository>(
        TYPES.UsersQueryRepository
    );

    const commentsQueryService = container.get<CommentsQueryService>(
        TYPES.CommentsQueryService
    );
    const postsCommandRepository = container.get<PostsCommandRepository>(
        TYPES.PostsCommandRepository,
    );

    beforeAll(async () => {
        await runDB();

        // так как байндятся в .inSingletonScope(); то это будет работать и вот так с псевдосоазданием нового инстанса commentsQueryService
        jest.spyOn(commentsQueryService, "findSingleComment");

        // но надежнее шпионить через прототип
        jest.spyOn(
            CommentsQueryService.prototype,
            "findSingleCommentAnonimously"
        );

        const res = await request(testApp).delete(`${TESTING_PATH}/all-data`);
        expect(res.status).toBe(204);
    }, 25000);

    afterAll(async () => {
        const res = await request(testApp).delete(`${TESTING_PATH}/all-data`);
        expect(res.status).toBe(204);
        // Закрываем после всех тестов
        await closeDB();
    });

    let blogId_1: string | undefined = "";
    let blogId_2: string | undefined = "";

    let postId_1: string | undefined = "";
    let postId_2: string | undefined = "";
    let postId_3: string | undefined = "";
    let postId_4: string | undefined = "";

    it("Creating test base entries, directly without endpoint calls", async () => {
        const newBlog_1: BlogInputModel = {
            name: "blogger_001",
            description: "takoy sebe blogger...",
            websiteUrl: "https://takoy.blogger.com",
        };
        blogId_1 = await dataCommandRepository.createNewBlog(newBlog_1);

        if (blogId_1) {
            const newPost_1: PostInputModel = {
                title: "post blog 001",
                shortDescription: "post ni o 4em",
                content: "Eto testovoe napolnenie posta 001_001",
                blogId: blogId_1,
            };
            // const insertedPost_1 =
            //     await postsCommandRepository.createNewPost(newPost_1);

            const post_1 = await PostModel.createNewPost(newBlog_1.name, newPost_1);
            await postsCommandRepository.savePostData(post_1);
            postId_1 = post_1.id;

            if (!post_1) {
                throw new Error(
                    "Failed to createNewPost, returned undefined...",
                );
            }

            const newPost_2 = {
                title: "post blog 002",
                shortDescription: "post ni o 4em",
                content: "Eto testovoe napolnenie posta 001_002",
                blogId: blogId_1,
            };
            // const insertedPost_2 =
            //     await postsCommandRepository.createNewPost(newPost_2);

            const post_2 = await PostModel.createNewPost(newBlog_1.name, newPost_2);
            await postsCommandRepository.savePostData(post_2);
            postId_2 = post_2.id;

            if (!post_2) {
                throw new Error(
                    "Failed to createNewPost, returned undefined...",
                );
            }
        } else {
            throw new Error("Could not create new blog - newBlog_1");
        }

        const newBlog_2: BlogInputModel = {
            name: "blogger_002",
            description: "a eto klassnii blogger!",
            websiteUrl: "https://klassnii.blogger.com",
        };
        blogId_2 = await dataCommandRepository.createNewBlog(newBlog_2);

        if (blogId_2) {
            const newPost_3: PostInputModel = {
                title: "post blog 001",
                shortDescription: "horowii post",
                content: "Eto testovoe napolnenie posta 002_001",
                blogId: blogId_2,
            };

            const post_3 = await PostModel.createNewPost(newBlog_2.name, newPost_3);
            await postsCommandRepository.savePostData(post_3);
            postId_3 = post_3.id;

            if (!post_3) {
                throw new Error(
                    "Failed to createNewPost, returned undefined...",
                );
            }

            const newPost_4: PostInputModel = {
                title: "post blog 002",
                shortDescription: "horowii post",
                content: "Eto testovoe napolnenie posta 002_002",
                blogId: blogId_2,
            };

            const post_4 = await PostModel.createNewPost(newBlog_2.name, newPost_4);
            await postsCommandRepository.savePostData(post_4);
            postId_4 = post_4.id;

            if (!post_4) {
                throw new Error(
                    "Failed to createNewPost, returned undefined...",
                );
            }
        }
    }, 15000);

    let userId_1: string | undefined = "";
    let userId_2: string | undefined = "";
    let userId_3: string | undefined = "";
    let userId_4: string | undefined = "";
    let userId_5: string | undefined = "";

    it("Creating test user entries, directly without endpoint calls", async () => {
        const newUser_1: UserInputModel = {
            login: "hello_world",
            password: "hello_world",
            email: "test_email@yandex.com"
        };
        userId_1 = await usersCommandRepository.createNewUser(newUser_1);

        const newUser_2: UserInputModel = {
            login: "hello_world_2",
            password: "hello_world",
            email: "test_email_2@yandex.com"
        };
        userId_2 = await usersCommandRepository.createNewUser(newUser_2);

        const newUser_3: UserInputModel = {
            login: "hello_world_3",
            password: "hello_world",
            email: "test_email_3@yandex.com"
        };
        userId_3 = await usersCommandRepository.createNewUser(newUser_3);

        const newUser_4: UserInputModel = {
            login: "hello_world_4",
            password: "hello_world",
            email: "test_email_4@yandex.com"
        };
        userId_4 = await usersCommandRepository.createNewUser(newUser_4);
    });

    it("PUT /posts/:{postId}/like-status - test simple like, dislike reactions, proper counting and swithching reactions", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };

        // логиним предсозданного юзера
        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        // проверяем что успешно получен access-токен
        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const accessTokenValue = loginAttempt.body.accessToken;

        // проверяем что успешно получен refresh-токен
        expect(loginAttempt.header["set-cookie"]).toBeDefined();

        const setCookieValue = loginAttempt.header["set-cookie"];
        let refreshTokenCookie: string | undefined;

        if (Array.isArray(setCookieValue)) {
            refreshTokenCookie = setCookieValue.find((cookie) =>
                // имя куки refreshToken определено по ТЗ
                cookie.startsWith("refreshToken=")
            );
        } else if (typeof setCookieValue === "string") {
            refreshTokenCookie = setCookieValue.startsWith("refreshToken=")
                ? setCookieValue
                : undefined;
        }

        expect(refreshTokenCookie).toBeDefined();

        // ниже блок функции для извлечения значения куки
        const extractJwtFromCookie = (cookieString: string): string => {
            // Разделяем строку по первому знаку '='
            const parts = cookieString.split("=");
            if (parts.length < 2) {
                throw new Error("Invalid cookie format: no \"=\" found");
            }

            // Берём часть после '=' и до первого ';' (атрибуты куки)
            const jwtWithAttributes = parts[1];
            const jwt = jwtWithAttributes.split(";")[0];

            return jwt;
        };

        if (!refreshTokenCookie) {
            throw "Refresh cookie is undefined";
        }

        const refreshTokenValue = extractJwtFromCookie(refreshTokenCookie);
        expect(refreshTokenValue).toMatch(
            /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/
        ); // проверка формата JWT

        // на этом проверка токенов завершена

        const newReaction_1 = {
            likeStatus: LikeStatus.Like
        };

        // размещаем лайк к комменту commentId_1
        const puttingLikeToPostRes_1 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_1);

        expect(puttingLikeToPostRes_1.status).toBe(HttpStatus.NoContent);

        // вытаскиваем коммент postId_1 в нем должен быть 1 лайк и проверяем каунтеры, с помощью эксесс токена (залогиненого пользователя)
        const gettingPostRes_1 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_1.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_1.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_1.body.extendedLikesInfo).toHaveProperty("likesCount");
        expect(gettingPostRes_1.body.extendedLikesInfo.likesCount).toEqual(1);
        expect(gettingPostRes_1.body.extendedLikesInfo.dislikesCount).toEqual(0);

        // это структура ответа с измененым счетчиком лайков
        // {
        //     "id": "69e261cfc64dc010508d9e1e",
        //     "title": "post blog 001",
        //     "shortDescription": "post ni o 4em",
        //     "content": "Eto testovoe napolnenie posta 001_001",
        //     "blogId": "69e261cf23e977e475d5c8ac",
        //     "blogName": "blogger_001",
        //     "createdAt": "2026-04-17T16:37:35.430Z",
        //     "extendedLikesInfo": {
        //         "likesCount": 0,
        //         "dislikesCount": 0,
        //         "myStatus": "Like",
        //         "newestLikes": [
        //         {
        //             "addedAt": "2026-04-17T16:37:38.705Z",
        //             "userId": "69e261d023e977e475d5c8ae",
        //             "login": "hello_world"
        //         }
        //         ]
        //     }
        // }

        const newReaction_2 = {
            likeStatus: LikeStatus.Dislike
        };

        // размещаем дизлайк к посту postId_1
        const puttingLikeToPostRes_2 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_2);

        expect(puttingLikeToPostRes_2.status).toBe(HttpStatus.NoContent);

        // вытаскиваем пост postId_1 в нем должен быть 1 дизлайк и проверяем каунтеры, с помощью эксесс токена (залогиненого пользователя)
        const gettingPostRes_2 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_2.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_2.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_2.body.extendedLikesInfo).toHaveProperty(
            "dislikesCount"
        );
        expect(gettingPostRes_2.body.extendedLikesInfo.dislikesCount).toEqual(1);
        expect(gettingPostRes_2.body.extendedLikesInfo.likesCount).toEqual(0);


    }, 15000);

    //пытаемся разместить положительную/негативную реакцию от того же самого юзера повторно
    it("PUT /comments/:{commentId}/like-status - test multiple repeating likes and dislikes from same user, testing proper counting", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };

        // логиним предсозданного юзера
        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        // проверяем что успешно получен access-токен
        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const accessTokenValue = loginAttempt.body.accessToken;

        // проверяем что успешно получен refresh-токен
        expect(loginAttempt.header["set-cookie"]).toBeDefined();

        const setCookieValue = loginAttempt.header["set-cookie"];
        let refreshTokenCookie: string | undefined;

        if (Array.isArray(setCookieValue)) {
            refreshTokenCookie = setCookieValue.find((cookie) =>
                // имя куки refreshToken определено по ТЗ
                cookie.startsWith("refreshToken=")
            );
        } else if (typeof setCookieValue === "string") {
            refreshTokenCookie = setCookieValue.startsWith("refreshToken=")
                ? setCookieValue
                : undefined;
        }

        expect(refreshTokenCookie).toBeDefined();

        // ниже блок функции для извлечения значения куки (рефреш токена)
        const extractJwtFromCookie = (cookieString: string): string => {
            // Разделяем строку по первому знаку '='
            const parts = cookieString.split("=");
            if (parts.length < 2) {
                throw new Error("Invalid cookie format: no \"=\" found");
            }

            // Берём часть после '=' и до первого ';' (атрибуты куки)
            const jwtWithAttributes = parts[1];
            const jwt = jwtWithAttributes.split(";")[0];

            return jwt;
        };

        if (!refreshTokenCookie) {
            throw "Refresh cookie is undefined";
        }

        const refreshTokenValue = extractJwtFromCookie(refreshTokenCookie);
        expect(refreshTokenValue).toMatch(
            /^[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+$/
        ); // проверка формата JWT

        // на этом проверка токенов завершена

        const newReaction_1 = {
            likeStatus: LikeStatus.Like
        };

        // размещаем лайк к посту postId_1
        const puttingLikeToPostRes_1 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_1);

        expect(puttingLikeToPostRes_1.status).toBe(HttpStatus.NoContent);

        // вытаскиваем пост postId_1 в нем должен быть 1 лайк и проверяем каунтеры, с помощью эксесс токена (залогиненого пользователя)
        const gettingPostRes_1 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_1.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_1.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_1.body.extendedLikesInfo).toHaveProperty("likesCount");
        expect(gettingPostRes_1.body.extendedLikesInfo.likesCount).toEqual(1);

        // это структура ответа с измененым счетчиком лайков
        // {
        //     "id": "69e261cfc64dc010508d9e1e",
        //     "title": "post blog 001",
        //     "shortDescription": "post ni o 4em",
        //     "content": "Eto testovoe napolnenie posta 001_001",
        //     "blogId": "69e261cf23e977e475d5c8ac",
        //     "blogName": "blogger_001",
        //     "createdAt": "2026-04-17T16:37:35.430Z",
        //     "extendedLikesInfo": {
        //         "likesCount": 0,
        //         "dislikesCount": 0,
        //         "myStatus": "Like",
        //         "newestLikes": [
        //         {
        //             "addedAt": "2026-04-17T16:37:38.705Z",
        //             "userId": "69e261d023e977e475d5c8ae",
        //             "login": "hello_world"
        //         }
        //         ]
        //     }
        // }


        // пробуем повторно лайкнуть пост postId_1
        const puttingLikeToPostRes_2 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_1);
        expect(puttingLikeToPostRes_2.status).toBe(HttpStatus.NoContent);

        // вытаскиваем пост postId_1
        const gettingPostRes_2 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_2.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_2.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_2.body.extendedLikesInfo).toHaveProperty("likesCount");
        expect(gettingPostRes_2.body.extendedLikesInfo).toHaveProperty(
            "dislikesCount"
        );
        // в посте по-прежнему должен быть 1 лайк в каунтере
        expect(gettingPostRes_2.body.extendedLikesInfo.likesCount).toEqual(1);
        expect(gettingPostRes_2.body.extendedLikesInfo.dislikesCount).toEqual(0);




        const newReaction_2 = {
            likeStatus: LikeStatus.Dislike
        };

        // размещаем дизлайк к посту postId_1
        const puttingLikeToPostRes_3 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_2);

        expect(puttingLikeToPostRes_3.status).toBe(HttpStatus.NoContent);

        // вытаскиваем пост postId_1 в нем должен быть 1 дизлайк в каунтере, проверяем с помощью эксесс токена (залогиненого пользователя)
        const gettingPostRes_3 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_3.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_3.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_3.body.extendedLikesInfo).toHaveProperty("likesCount");
        expect(gettingPostRes_3.body.extendedLikesInfo).toHaveProperty(
            "dislikesCount");
        // теперь количество лайков должно уменьшиться, а количество дизлайков увеличиться на один
        expect(gettingPostRes_3.body.extendedLikesInfo.likesCount).toEqual(0);
        expect(gettingPostRes_3.body.extendedLikesInfo.dislikesCount).toEqual(1);

        // пробуем повторно дизлайкнуть пост postId_1
        const puttingLikeToPostRes_4 = await request(testApp)
            .put(`${POSTS_PATH}/${postId_1}/like-status`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`)
            .send(newReaction_2);
        expect(puttingLikeToPostRes_4.status).toBe(HttpStatus.NoContent);

        // вытаскиваем пост postId_1
        const gettingPostRes_4 = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}`)
            .set(`Authorization`, `Bearer ${accessTokenValue}`);

        expect(gettingPostRes_4.status).toBe(HttpStatus.Ok);
        expect(gettingPostRes_4.body).toHaveProperty("extendedLikesInfo");
        expect(gettingPostRes_4.body.extendedLikesInfo).toHaveProperty("likesCount");
        expect(gettingPostRes_4.body.extendedLikesInfo).toHaveProperty(
            "dislikesCount"
        );
        // в посте по-прежнему должен быть 1 дизлайк в каунтере
        expect(gettingPostRes_4.body.extendedLikesInfo.likesCount).toEqual(0);
        expect(gettingPostRes_4.body.extendedLikesInfo.dislikesCount).toEqual(1);

    }, 15000);

    it("PUT /comments/:{commentId}/like-status - test multiple likes and dislikes from multiple users", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };
    }, 15000);

    it("PUT /comments/:{commentId}/like-status - test cancelling multiple reactions from multiple users", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };
    }, 15000);

    it("PUT /comments/:{commentId}/like-status - test nullifying multiple reactions from multiple users", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };
    }, 15000);

    it("PUT /comments/:{commentId}/like-status - testing cases where wer attempting to make counters go below 0", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world"
        };
    }, 15000);


    // it("Creating test base entries, directly without endpoint calls", async () => {
    // },15000);
});

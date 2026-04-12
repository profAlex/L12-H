import express from "express";
import { setupApp } from "../src/setup-app";
import { closeDB, runDB } from "../src/db/mongo.db";
import request from "supertest";
import {
    AUTH_PATH,
    COMMENTS_PATH,
    POSTS_PATH,
    TESTING_PATH,
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

describe("Test API for managing comments", () => {
    const testApp = express();
    setupApp(testApp);

    const usersCommandRepository = container.get<UsersCommandRepository>(
        TYPES.UsersCommandRepository,
    );
    const usersQueryRepository = container.get<UsersQueryRepository>(
        TYPES.UsersQueryRepository,
    );
    const postsCommandRepository = container.get<PostsCommandRepository>(
        TYPES.PostsCommandRepository,
    );
    const commentsQueryService = container.get<CommentsQueryService>(
        TYPES.CommentsQueryService,
    );

    beforeAll(async () => {
        await runDB();

        // так как байндятся в .inSingletonScope(); то это будет работать и вот так с псевдосоазданием нового инстанса commentsQueryService
        jest.spyOn(commentsQueryService, "findSingleComment");

        // но надежнее шпионить через прототип
        jest.spyOn(
            CommentsQueryService.prototype,
            "findSingleCommentAnonimously",
        );

        const res = await request(testApp).delete(`${TESTING_PATH}/all-data`);
        expect(res.status).toBe(204);
    });

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
            postId_1 = await postsCommandRepository.createNewPost(newPost_1);
            if (!postId_1) {
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
            postId_2 = await postsCommandRepository.createNewPost(newPost_2);
            if (!postId_2) {
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
            postId_3 = await postsCommandRepository.createNewPost(newPost_3);
            if (!postId_3) {
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
            postId_4 = await postsCommandRepository.createNewPost(newPost_4);
            if (!postId_4) {
                throw new Error(
                    "Failed to createNewPost, returned undefined...",
                );
            }
        }
    });

    let userId_1: string | undefined = "";
    let userId_2: string | undefined = "";
    let userId_3: string | undefined = "";
    let userId_4: string | undefined = "";
    let userId_5: string | undefined = "";

    it("Creating test user entries, directly without endpoint calls", async () => {
        const newUser_1: UserInputModel = {
            login: "hello_world",
            password: "hello_world",
            email: "test_email@yandex.com",
        };
        userId_1 = await usersCommandRepository.createNewUser(newUser_1);

        const newUser_2: UserInputModel = {
            login: "hello_world_2",
            password: "hello_world",
            email: "test_email_2@yandex.com",
        };
        userId_2 = await usersCommandRepository.createNewUser(newUser_2);

        const newUser_3: UserInputModel = {
            login: "hello_world_3",
            password: "hello_world",
            email: "test_email_3@yandex.com",
        };
        userId_3 = await usersCommandRepository.createNewUser(newUser_3);

        const newUser_4: UserInputModel = {
            login: "hello_world_4",
            password: "hello_world",
            email: "test_email_4@yandex.com",
        };
        userId_4 = await usersCommandRepository.createNewUser(newUser_4);
    });

    it("POST /posts/{postId}/comments - successfully creating comment", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const comment = {
            content: "stringstringstringst",
        };

        const tokenRecieved = loginAttempt.body["accessToken"];
        const createComment = await request(testApp)
            .post(`${POSTS_PATH}/${postId_1}/comments`)
            .set("Authorization", "Bearer " + tokenRecieved.toString())
            .send(comment);

        expect(Object.entries(createComment.body).length).toBe(5);
        expect(createComment.body).toHaveProperty("id");
        expect(createComment.body).toHaveProperty("content");
        expect(createComment.body).toHaveProperty("commentatorInfo");
        expect(createComment.body).toHaveProperty("createdAt");

        expect(Object.keys(createComment.body.commentatorInfo).length).toBe(2);
        expect(createComment.body.commentatorInfo).toHaveProperty("userId");
        expect(createComment.body.commentatorInfo).toHaveProperty(
            "userLogin",
            loginCreds.loginOrEmail,
        );

        expect(createComment.status).toEqual(HttpStatus.Created);

        // const res = await request(testApp).get(
        //     `${COMMENTS_PATH}/${IdParamName.CommentId}`,
    });

    it("POST /posts/{postId}/comments - shouldn't be able to create comments due to bad input data, or wrong cred, or wrong postId", async () => {
        const wrongLoginCreds = {
            loginOrEmail: "hello_world",
            password: "helo_world",
        };

        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(wrongLoginCreds);

        expect(loginAttempt.status).toEqual(HttpStatus.Unauthorized);

        const anotherLoginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(anotherLoginAttempt.body).length).toBe(1);
        expect(Object.keys(anotherLoginAttempt.body).length).toBe(1);
        expect(anotherLoginAttempt.body).toHaveProperty("accessToken");

        const wrongComment = {
            conten: "stringstringstringst", // wrong name of the field - should be "content"
        };

        const tokenRecieved = anotherLoginAttempt.body["accessToken"];
        const createComment = await request(testApp)
            .post(`${POSTS_PATH}/${postId_1}/comments`)
            .set("Authorization", "Bearer " + tokenRecieved.toString())
            .send(wrongComment);

        expect(createComment.status).toEqual(HttpStatus.BadRequest);
    });

    let commentId: string = "";
    it("GET /posts/{postId}/comments - successfully retrieving comments without being logged in", async () => {
        // const loginCreds = {
        //     loginOrEmail: "hello_world",
        //     password: "hello_world",
        // };
        //
        // const loginAttempt = await request(testApp)
        //     .post(`${AUTH_PATH}/login`)
        //     .send(loginCreds);
        //
        // expect(Object.entries(loginAttempt.body).length).toBe(1);
        // expect(Object.keys(loginAttempt.body).length).toBe(1);
        // expect(loginAttempt.body).toHaveProperty("accessToken");
        //
        // const tokenRecieved = loginAttempt.body["accessToken"];

        const retrieveComment = await request(testApp).get(
            `${POSTS_PATH}/${postId_1}/comments`,
        );
        // .set("Authorization", "Bearer " + tokenRecieved.toString());

        expect(Object.keys(retrieveComment.body).length).toBe(5);

        expect(retrieveComment.body).toHaveProperty("items");

        commentId = retrieveComment.body.items[0].id;
        const content = retrieveComment.body.items[0].content;
        expect(content).toEqual("stringstringstringst");

        expect(retrieveComment.status).toEqual(HttpStatus.Ok);
    });

    it("GET /posts/{postId}/comments - successfully retrieving comments being logged in", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const tokenRecieved = loginAttempt.body["accessToken"];

        const retrieveComment = await request(testApp)
            .get(`${POSTS_PATH}/${postId_1}/comments`)
            .set("Authorization", "Bearer " + tokenRecieved.toString());

        expect(Object.keys(retrieveComment.body).length).toBe(5);

        expect(retrieveComment.body).toHaveProperty("items");

        commentId = retrieveComment.body.items[0].id;
        const content = retrieveComment.body.items[0].content;
        expect(content).toEqual("stringstringstringst");

        expect(retrieveComment.status).toEqual(HttpStatus.Ok);
    });

    it("GET /comments/{commentId}/ - successful retrieving comment not being logged in", async () => {
        // const loginCreds = {
        //     loginOrEmail: "hello_world",
        //     password: "hello_world",
        // };
        //
        // const loginAttempt = await request(testApp)
        //     .post(`${AUTH_PATH}/login`)
        //     .send(loginCreds);
        //
        // expect(Object.entries(loginAttempt.body).length).toBe(1);
        // expect(Object.keys(loginAttempt.body).length).toBe(1);
        // expect(loginAttempt.body).toHaveProperty("accessToken");
        //
        // const tokenRecieved = loginAttempt.body["accessToken"];

        const retrieveComment = await request(testApp).get(
            `${COMMENTS_PATH}/${commentId}/`,
        );
        // .set("Authorization", "Bearer " + tokenRecieved.toString());

        expect(Object.keys(retrieveComment.body).length).toBe(5);

        expect(retrieveComment.status).toEqual(HttpStatus.Ok);

        expect(
            CommentsQueryService.prototype.findSingleCommentAnonimously,
        ).toHaveBeenCalledTimes(1);
    });

    it("GET /comments/{commentId}/ - successful retrieving comment being logged in", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const tokenRecieved = loginAttempt.body["accessToken"];

        const retrieveComment = await request(testApp)
            .get(`${COMMENTS_PATH}/${commentId}/`)
            .set("Authorization", "Bearer " + tokenRecieved.toString());

        expect(Object.keys(retrieveComment.body).length).toBe(5);

        expect(retrieveComment.body).toHaveProperty("likesInfo");
        expect(retrieveComment.body).toHaveProperty("commentatorInfo");

        expect(retrieveComment.body.likesInfo.myStatus).toEqual(
            LikeStatus.None,
        );
        expect(retrieveComment.body.content).toEqual("stringstringstringst");

        expect(retrieveComment.status).toEqual(HttpStatus.Ok);

        // expect(
        //     CommentsQueryService.prototype.findSingleComment,
        // ).toHaveBeenCalledTimes(1);

        expect(commentsQueryService.findSingleComment).toHaveBeenCalledTimes(1);
    });

    it("PUT /comments/{commentId}/ - successful modifying comment", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        //изобретаем задержку на 10 секунд, чтобы не срабатывал блок по количеству логинов в единицу времени
        const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));
        await delay(10000); // задержка 10 секунд
        console.log("Прошло 10 секунд");

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const tokenRecieved = loginAttempt.body["accessToken"];
        const modifiedComment = {
            content: "modified stringstringstringst",
        };

        const resultModifiedComment = await request(testApp)
            .put(`${COMMENTS_PATH}/${commentId}/`)
            .set("Authorization", "Bearer " + tokenRecieved.toString())
            .send(modifiedComment);

        expect(resultModifiedComment.status).toEqual(HttpStatus.NoContent);

        const retrieveModifiedComment = await request(testApp).get(
            `${COMMENTS_PATH}/${commentId}/`,
        );
        expect(Object.keys(retrieveModifiedComment.body).length).toBe(5);
        expect(retrieveModifiedComment.body).toHaveProperty("content");

        const content = retrieveModifiedComment.body.content;
        expect(content).toEqual("modified stringstringstringst");

        expect(retrieveModifiedComment.status).toEqual(HttpStatus.Ok);
    }, 15000);

    it("DELETE /comments/{commentId}/ - successful deleting comment", async () => {
        const loginCreds = {
            loginOrEmail: "hello_world",
            password: "hello_world",
        };

        // //изобретаем задержку на 10 секунд, чтобы не срабатывал блок по количеству логинов в единицу времени
        // const delay = (ms: number) =>
        //     new Promise((resolve) => setTimeout(resolve, ms));
        // await delay(10000); // задержка 10 секунд
        // console.log("Прошло 10 секунд");

        const loginAttempt = await request(testApp)
            .post(`${AUTH_PATH}/login`)
            .send(loginCreds);

        expect(Object.entries(loginAttempt.body).length).toBe(1);
        expect(Object.keys(loginAttempt.body).length).toBe(1);
        expect(loginAttempt.body).toHaveProperty("accessToken");

        const tokenRecieved = loginAttempt.body["accessToken"];

        const retrieveComment = await request(testApp)
            .delete(`${COMMENTS_PATH}/${commentId}/`)
            .set("Authorization", "Bearer " + tokenRecieved.toString());

        expect(retrieveComment.status).toEqual(HttpStatus.NoContent);

        const retrieveModifiedComment = await request(testApp).get(
            `${COMMENTS_PATH}/${commentId}/`,
        );

        expect(retrieveModifiedComment.status).toEqual(HttpStatus.NotFound);
    }, 15000);
});

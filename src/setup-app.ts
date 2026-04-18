import express, { Request, Response, Express } from "express";
import cookieParser from "cookie-parser";
import { container } from "./composition-root/composition-root";
import { TYPES } from "./composition-root/ioc-types";
import {
    AUTH_PATH,
    BLOGS_PATH,
    COMMENTS_PATH,
    POSTS_PATH, SECURITY_DEVICES_PATH,
    TESTING_PATH,
    USERS_PATH
} from "./routers/pathes/router-pathes";

// Импортируем ФУНКЦИИ-ФАБРИКИ
import { getCommentsRouter } from "./routers/comments-router";
import { getPostsRouter } from "./routers/posts-router";

// прочие роутеры пока импортируем по-старому
import { testingRouter } from "./routers/testing-router";
import { authRouter } from "./routers/auth-router";
import { usersRouter } from "./routers/users-router";
import { securityDevicesRouter } from "./routers/security-devices-router";
import { PostsHandler } from "./routers/router-handlers/post-router-description";
import { CommentsHandler } from "./routers/router-handlers/comment-router-description";
import { BlogsHandler } from "./routers/router-handlers/blog-router-description";
import { getBlogsRouter } from "./routers/blogs-router";

export const setupApp = (app: Express) => {
    app.use(express.json());
    app.use(cookieParser());

    // перенесли гет-вызов контейнера сюда, чтобы гарантированно сначала собрался контейнер а затем уже создавались руты
    const commentsHandler = container.get<CommentsHandler>(TYPES.CommentsHandler);
    const postsHandler = container.get<PostsHandler>(TYPES.PostsHandler);
    const blogsHandler = container.get<BlogsHandler>(TYPES.BlogsHandler);


    // а здесь уже создаем руты (пока только один, самый конфликтный рут) через фабрики
    const commentsRouter = getCommentsRouter(commentsHandler);
    const postsRouter = getPostsRouter(postsHandler);
    const blogsRouter = getBlogsRouter(blogsHandler);


    // подключаем к приложению
    app.use(COMMENTS_PATH, commentsRouter);
    app.use(POSTS_PATH, postsRouter);

    // Остальные роутеры (пока оставляем как есть или переводим на фабрики)
    app.use(BLOGS_PATH, blogsRouter);
    app.use(TESTING_PATH, testingRouter);
    app.use(AUTH_PATH, authRouter);
    app.use(USERS_PATH, usersRouter);
    app.use(SECURITY_DEVICES_PATH, securityDevicesRouter);

    app.get("/", (req: Request, res: Response) => {
        res.status(200).send("All good!");
    });

    return app;
};

// // старый работающий вариант
// import { commentsRouter } from "./routers/comments-router";
// import { blogsRouter } from "./routers/blogs-router";
// import { postsRouter } from "./routers/posts-router";
// import { testingRouter } from "./routers/testing-router";
// import { authRouter } from "./routers/auth-router";
// import { usersRouter } from "./routers/users-router";
// import { securityDevicesRouter } from "./routers/security-devices-router";
//
// export const setupApp = (app: Express) => {
//     app.use(express.json());
//     app.use(cookieParser());
//
//     app.use(BLOGS_PATH, blogsRouter);
//     app.use(POSTS_PATH, postsRouter);
//     app.use(TESTING_PATH, testingRouter);
//     app.use(AUTH_PATH, authRouter);
//     app.use(USERS_PATH, usersRouter);
//     app.use(COMMENTS_PATH, commentsRouter);
//     app.use(SECURITY_DEVICES_PATH, securityDevicesRouter);
//
//     app.get("/", (req: Request, res: Response) => {
//         res.status(200).send("All good!");
//     });
//
//     return app;
// };

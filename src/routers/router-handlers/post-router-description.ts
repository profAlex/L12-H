import "reflect-metadata";
import { inject, injectable } from "inversify";

import { Request, Response } from "express";
import { HttpStatus } from "../../common/http-statuses/http-statuses";
import { InputGetPostsQuery } from "../router-types/post-search-input-model";
import { matchedData } from "express-validator";
import { UserIdType } from "../router-types/user-id-type";
import {
    RequestWithParamsAndBody,
    RequestWithParamsAndBodyAndUserId,
    RequestWithParamsAndQuery,
} from "../request-types/request-types";
import { CommentInputModel } from "../router-types/comment-input-model";
import { IdParamName } from "../util-enums/id-names";
import { PaginatedCommentViewModel } from "../router-types/comment-paginated-view-model";
import { InputGetCommentsQueryModel } from "../router-types/comment-search-input-query-model";
import { TYPES } from "../../composition-root/ioc-types";
import { PostsQueryService } from "../../service-layer(BLL)/posts-query-service";
import { PostsCommandService } from "../../service-layer(BLL)/posts-command-service";
import { PaginatedPostViewModel } from "../router-types/post-paginated-view-model";
import { PostLikeInputModel } from "../router-types/posts-like-input-model";

@injectable()
export class PostsHandler {
    constructor(
        @inject(TYPES.PostsQueryService)
        protected postsQueryService: PostsQueryService,
        @inject(TYPES.PostsCommandService)
        protected postsCommandService: PostsCommandService,
    ) {}

    public getSeveralCommentsByPostId = async (
        req: RequestWithParamsAndQuery<
            { [IdParamName.PostId]: string },
            any //InputGetCommentsQueryModel
        >,
        res: Response,
    ) => {
        const sanitizedQuery = matchedData<InputGetCommentsQueryModel>(req, {
            locations: ["query"],
            includeOptionals: true,
        }); //утилита для извечения трансформированных значений после валидатара
        //в req.query остаются сырые квери параметры (строки)

        const postId = req.params[IdParamName.PostId];
        if (!postId) {
            console.error(
                "postId seems to be missing in Request inside getSeveralPostsFromBlog, even though it successfully passed middleware checks",
            );

            return res.status(HttpStatus.InternalServerError).json({
                error: "Internal Server Error",
            }); // какие-то коды надо передавать, чтобы пользователи могли сообщать их техподдержке
        }

        if (req.user === undefined || req.user.userId === undefined) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside getSeveralCommentsByPostId in post-router-description.ts",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        // проверка - null возвращается из гварда, если обращение идет от незалогиненого пользователя, этот случай обрабатывается отдельно
        if (req.user.userId === null) {
            // console.warn();
            const commentsListOutput: PaginatedCommentViewModel =
                await this.postsQueryService.getSeveralCommentsByPostIdAnonimously(
                    postId,
                    sanitizedQuery,
                );

            return res.status(HttpStatus.Ok).send(commentsListOutput!);
        } else {
            //console.warn("NOW WE GOT INSIDE NOT ANONIMOUSLY CALLED ROUTE")
            const commentsListOutput: PaginatedCommentViewModel =
                await this.postsQueryService.getSeveralCommentsByPostId(
                    postId,
                    req.user.userId,
                    sanitizedQuery,
                );

            return res.status(HttpStatus.Ok).send(commentsListOutput!);
        }
    };

    public createNewComment = async (
        req: RequestWithParamsAndBodyAndUserId<
            { [IdParamName.PostId]: string },
            CommentInputModel,
            UserIdType
        >,
        res: Response,
    ) => {
        const postId = req.params[IdParamName.PostId];
        const { content } = req.body;

        // проверка наличия userId в структуре req
        if (!req.user || !req.user.userId) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside createNewComment handler",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                errorsMessages: [
                    {
                        message: "Internal server error",
                        field: "",
                    },
                ],
            });
        }

        const userId = req.user.userId;

        const newCommentResult =
            await this.postsCommandService.createNewComment(
                postId,
                content,
                userId,
            );

        if (!newCommentResult.data) {
            console.error(
                "Error description: ",
                newCommentResult?.statusDescription,
                JSON.stringify(newCommentResult.errorsMessages),
            );

            return res
                .status(newCommentResult.statusCode)
                .json({ errorsMessages: newCommentResult.errorsMessages });
        }

        return res
            .status(newCommentResult.statusCode)
            .send(newCommentResult.data);
    };

    public getSeveralPosts = async (req: Request, res: Response) => {
        const sanitizedQuery = matchedData<InputGetPostsQuery>(req, {
            locations: ["query"],
            includeOptionals: true,
        }); //утилита для извечения трансформированных значений после валидатара
        //в req.query остаются сырые квери параметры (строки)

        // const postsListOutput =
        //     await this.postsQueryService.getSeveralPosts(sanitizedQuery);

        // проверка - null возвращается из гварда, если обращение идет от незалогиненого пользователя, этот случай обрабатывается отдельно
        if (req.user!.userId === null) {
            // console.warn();
            const postsListOutput: PaginatedPostViewModel =
                await this.postsQueryService.getSeveralPostsAnonimously(
                    sanitizedQuery,
                );

            res.status(HttpStatus.Ok).send(postsListOutput);
        } else {
            const postsListOutput: PaginatedPostViewModel =
                await this.postsQueryService.getSeveralPosts(
                    req.user!.userId,
                    sanitizedQuery,
                );

            res.status(HttpStatus.Ok).send(postsListOutput);
        }
    };

    // немного другой способ создания поста, делает то же что и createNewBlogPost, но другой способ передачи blog ID - он передается внутри req.body
    public createNewPost = async (req: Request, res: Response) => {
        const insertedId = await this.postsCommandService.createNewPost(
            req.body,
        );

        if (insertedId) {
            // а вот здесь уже идем в PostsQueryService с айдишником который нам вернул this.postsCommandService.createNewPost
            const result =
                await this.postsQueryService.findSinglePostAnonimously(
                    insertedId,
                );

            if (result) {
                res.status(HttpStatus.Created).json(result);
                return;
            }
        }

        res.status(HttpStatus.InternalServerError).send(
            "Unknown error while attempting to create new post or couldn't return created post from Query Database.",
        );
        return;
    };

    public findSinglePost = async (req: Request, res: Response) => {
        const postId: string =
            typeof req.params[IdParamName.PostId] === "string"
                ? req.params[IdParamName.PostId]
                : req.params[IdParamName.PostId][0];

        // проверка - null возвращается из гварда, если обращение идет от незалогиненого пользователя, этот случай обрабатывается отдельно
        if (req.user!.userId === null) {
            const searchResult =
                await this.postsQueryService.findSinglePostAnonimously(postId);

            if (searchResult === null) {
                res.sendStatus(HttpStatus.NotFound);
            }

            res.status(HttpStatus.Ok).json(searchResult);
        } else {
            const searchResult = await this.postsQueryService.findSinglePost(
                postId,
                req.user!.userId,
            );

            if (searchResult === null) {
                res.sendStatus(HttpStatus.NotFound);
            }

            res.status(HttpStatus.Ok).json(searchResult);
        }
    };

    public updatePost = async (req: Request, res: Response) => {
        const postId: string =
            typeof req.params[IdParamName.PostId] === "string"
                ? req.params[IdParamName.PostId]
                : req.params[IdParamName.PostId][0];

        const result = await this.postsCommandService.updatePost(
            postId,
            req.body,
        );

        if (result === null) {
            res.sendStatus(HttpStatus.NotFound);
        }

        res.sendStatus(HttpStatus.NoContent);
    };

    public deletePost = async (req: Request, res: Response) => {
        const postId: string =
            typeof req.params[IdParamName.PostId] === "string"
                ? req.params[IdParamName.PostId]
                : req.params[IdParamName.PostId][0];

        const result = await this.postsCommandService.deletePost(postId);

        if (result === false) {
            res.sendStatus(HttpStatus.NotFound);
        }

        res.sendStatus(HttpStatus.NoContent);
    };

    public likePostById = async (
        req: RequestWithParamsAndBody<
            {
                [IdParamName.PostId]: string;
            },
            PostLikeInputModel
        >,
        res: Response,
    ) => {
        if (!req.user || !req.user.userId) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside ComentsHandler.likeCommentById",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        const result = await this.postsCommandService.likePostById(
            req.params[IdParamName.PostId],
            req.user.userId,
            req.body.likeStatus,
        );

        if (result.statusCode !== HttpStatus.NoContent) {
            return res.status(result.statusCode).json(result.errorsMessages);
        }

        return res.sendStatus(result.statusCode);
    };
}

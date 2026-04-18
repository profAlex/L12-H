import "reflect-metadata";
import { inject, injectable } from "inversify";

import { Request, Response } from "express";
import { HttpStatus } from "../../common/http-statuses/http-statuses";
import { blogsService } from "../../service-layer(BLL)/blogs-service";
import { InputGetBlogsQuery } from "../router-types/blog-search-input-model";
import { matchedData } from "express-validator";
import { InputGetBlogPostsByIdQuery } from "../router-types/blog-search-by-id-input-model";
import { dataQueryRepository } from "../../repository-layers/query-repository-layer/query-repository";
import { IdParamName } from "../util-enums/id-names";
import { TYPES } from "../../composition-root/ioc-types";
import { PostsCommandService } from "../../service-layer(BLL)/posts-command-service";
import { PaginatedPostViewModel } from "../router-types/post-paginated-view-model";
import { PostsQueryService } from "../../service-layer(BLL)/posts-query-service";

@injectable()
export class BlogsHandler {
    constructor(
        @inject(TYPES.PostsCommandService)
        protected postsCommandService: PostsCommandService,
        @inject(TYPES.PostsQueryService)
        protected postsQueryService: PostsQueryService,
    ) {}

    public getSeveralBlogs = async (req: Request, res: Response) => {
        const sanitizedQuery = matchedData<InputGetBlogsQuery>(req, {
            locations: ["query"],
            includeOptionals: true,
        }); //утилита для извечения трансформированных значений после валидатара
        //в req.query остаются сырые квери параметры (строки)

        const driversListOutput =
            await dataQueryRepository.getSeveralBlogs(sanitizedQuery);

        res.status(HttpStatus.Ok).send(driversListOutput);
        return;
    };

    public createNewBlog = async (req: Request, res: Response) => {
        const insertedId = await blogsService.createNewBlog(req.body);

        if (insertedId) {
            // а вот здесь уже идем в query repo с айдишником который нам вернул command repo
            const result = await dataQueryRepository.findSingleBlog(insertedId);

            if (result) {
                res.status(HttpStatus.Created).json(result);
                return;
            }
        }

        res.status(HttpStatus.InternalServerError).send(
            "Unknown error while attempting to create new blog or couldn't return created blog from Query Database.",
        );
        return;
    };

    public getSeveralPostsFromBlog = async (req: Request, res: Response) => {
        const sanitizedQuery = matchedData<InputGetBlogPostsByIdQuery>(req, {
            locations: ["query"],
            includeOptionals: true,
        }); //утилита для извечения трансформированных значений после валидатара
        //в req.query остаются сырые квери параметры (строки)

        // const blogId: string = req.params[IdParamName.BlogId];
        const blogId: string =
            typeof req.params[IdParamName.BlogId] === "string"
                ? req.params[IdParamName.BlogId]
                : req.params[IdParamName.BlogId][0];
        if (!blogId) {
            console.error(
                "blogId seems to be missing in Request inside getSeveralPostsFromBlog, even though it successfully passed middleware checks",
            );

            return res.status(HttpStatus.InternalServerError).json({
                error: "Internal Server Error",
            }); // какие-то коды надо передавать, чтобы пользователи могли сообщать их техподдержке
        }

        if (req.user === undefined || req.user.userId === undefined) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside getSeveralPostsFromBlog in blog-router-description.ts",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        // ////////////////////////////////////////////////////////
        // const postListOutput = await dataQueryRepository.getSeveralPostsById(
        //     blogId,
        //     sanitizedQuery,
        // );
        // ////////////////////////////////////////////////////////


        // используем инстанс сервиса поста
        if (req.user.userId === null) {
            // console.warn();
            const postsListOutput: PaginatedPostViewModel =
                await this.postsQueryService.getSeveralPostsByBlogIdAnonimously(
                    blogId,
                    sanitizedQuery,
                );

            res.status(HttpStatus.Ok).send(postsListOutput);
        } else {
            const postsListOutput: PaginatedPostViewModel =
                await this.postsQueryService.getSeveralPostsByBlogId(
                    blogId,
                    req.user.userId,
                    sanitizedQuery,
                );

            res.status(HttpStatus.Ok).send(postsListOutput);
        }
    };


    public createNewBlogPost = async (req: Request, res: Response) => {

        const blogId: string =
            typeof req.params[IdParamName.BlogId] === "string"
                ? req.params[IdParamName.BlogId]
                : req.params[IdParamName.BlogId][0];

        // используем для создания поста уже имеющийся сервис в постах
        const insertedId = await this.postsCommandService.createNewPost(
            {
                title: req.body.title,
                shortDescription: req.body.shortDescription,
                content: req.body.content,
                blogId: blogId,
            },
        );

        if (insertedId) {
            // а вот здесь уже идем в query repo с айдишником который нам вернул command repo
            // это нарушение CQRS? Надо сделать такой же метод в dataCommandRepo или надо еще выше поднимать
            // insertedId и делать отдельный хэндлер?
            const result = await dataQueryRepository.findSinglePost(insertedId);

            if (result) {
                res.status(HttpStatus.Created).json(result);
                return;
            }
        }

        res.status(HttpStatus.InternalServerError).send(
            "Unknown error while attempting to create new blog-post or couldn't return created blog-post from Query Database.",
        );
        return;
    };

    public findSingleBlog = async (req: Request, res: Response) => {
        // console.warn("<-------LOOK ID_3: ", req.params[IdParamName.BlogId]);

        const blogId: string =
            typeof req.params[IdParamName.BlogId] === "string"
                ? req.params[IdParamName.BlogId]
                : req.params[IdParamName.BlogId][0];
        const result = await dataQueryRepository.findSingleBlog(blogId);

        // console.warn("<-------ID WAS FOUND??", result);

        if (result === undefined) {
            res.sendStatus(HttpStatus.NotFound);
            return;
        }

        res.status(HttpStatus.Ok).json(result);
        return;
    };

    public updateBlog = async (req: Request, res: Response) => {
        const blogId: string =
            typeof req.params[IdParamName.BlogId] === "string"
                ? req.params[IdParamName.BlogId]
                : req.params[IdParamName.BlogId][0];
        const result = await blogsService.updateBlog(blogId, req.body);

        if (result === undefined) {
            res.sendStatus(HttpStatus.NotFound);
            return;
        }

        res.sendStatus(HttpStatus.NoContent);
        return;
    };

    public deleteBlog = async (req: Request, res: Response) => {
        const blogId: string =
            typeof req.params[IdParamName.BlogId] === "string"
                ? req.params[IdParamName.BlogId]
                : req.params[IdParamName.BlogId][0];
        const result = await blogsService.deleteBlog(blogId);

        if (result === undefined) {
            res.sendStatus(HttpStatus.NotFound);
            return;
        }

        res.sendStatus(HttpStatus.NoContent);
        return;
    };
}

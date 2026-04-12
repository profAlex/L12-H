import "reflect-metadata";
import { inject, injectable } from "inversify";
import { TYPES } from "../../composition-root/ioc-types";

import { Response } from "express";
import { IdParamName } from "../util-enums/id-names";
import {
    RequestWithParams,
    RequestWithParamsAndBody,
} from "../request-types/request-types";
import { HttpStatus } from "../../common/http-statuses/http-statuses";
import { CommentInputModel } from "../router-types/comment-input-model";
import { CommentsQueryService } from "../../service-layer(BLL)/comments-query-service";
import { CommentsCommandService } from "../../service-layer(BLL)/comments-command-service";
import { LikeInputModel } from "../router-types/comments-like-input-model";

@injectable()
export class CommentsHandler {
    constructor(
        @inject(TYPES.CommentsQueryService)
        protected commentsQueryService: CommentsQueryService,
        @inject(TYPES.CommentsCommandService)
        protected commentsCommandService: CommentsCommandService,
    ) {}

    public getCommentById = async (
        req: RequestWithParams<{ [IdParamName.CommentId]: string }>,
        res: Response,
    ) => {
        // console.warn("DID WE GRT INSIDE CommentsHander.getCommentById???");

        if (req.user === undefined || req.user.userId === undefined) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside CommentsHandler.getCommentById",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        // console.warn("DID WE GRT INSIDE CommentsHander.getCommentById???");
        if (req.user.userId === null) {
            // console.warn();

            const result =
                await this.commentsQueryService.findSingleCommentAnonimously(
                    req.params[IdParamName.CommentId],
                );

            if (!result) {
                return res.sendStatus(HttpStatus.NotFound);
            }

            return res.status(HttpStatus.Ok).send(result);
        } else {
            const result = await this.commentsQueryService.findSingleComment(
                req.params[IdParamName.CommentId],
                req.user.userId,
            );

            if (!result) {
                return res.sendStatus(HttpStatus.NotFound);
            }

            return res.status(HttpStatus.Ok).send(result);
        }
    };

    public updateCommentById = async (
        req: RequestWithParamsAndBody<
            { [IdParamName.CommentId]: string },
            CommentInputModel
        >,
        res: Response,
    ) => {
        // проверка наличия userId в структуре req
        if (!req.user || !req.user.userId) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside updateCommentById handler",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        const result = await this.commentsCommandService.updateCommentById(
            req.params[IdParamName.CommentId],
            req.user.userId,
            req.body,
        );

        if (result.statusCode !== HttpStatus.NoContent) {
            return res.status(result.statusCode).json(result.errorsMessages);
        }

        return res.sendStatus(result.statusCode);
    };

    public deleteCommentById = async (
        req: RequestWithParams<{ [IdParamName.CommentId]: string }>,
        res: Response,
    ) => {
        // проверка наличия userId в структуре req
        if (!req.user || !req.user.userId) {
            console.error({
                message:
                    "Required parameter is missing: 'req.user or req.user.userId' inside deleteCommentById handler",
                field: "'if (!req.user || !req.user.userId)' check failed",
            });

            return res.status(HttpStatus.InternalServerError).json({
                message: "Internal server error",
                field: "",
            });
        }

        const result = await this.commentsCommandService.deleteCommentById(
            req.params[IdParamName.CommentId],
            req.user.userId,
        );

        if (result.statusCode !== HttpStatus.NoContent) {
            return res.status(result.statusCode).json(result.errorsMessages);
        }

        return res.sendStatus(result.statusCode);
    };

    public likeCommentById = async (
        req: RequestWithParamsAndBody<
            { [IdParamName.CommentId]: string },
            LikeInputModel
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

        const result = await this.commentsCommandService.likeCommentById(
            req.params[IdParamName.CommentId],
            req.user.userId,
            req.body.likeStatus,
        );

        if (result.statusCode !== HttpStatus.NoContent) {
            return res.status(result.statusCode).json(result.errorsMessages);
        }

        return res.sendStatus(result.statusCode);
    };
}

import { Request, Response, Router } from "express";
import { PostsHandler } from "./router-handlers/post-router-description";

import { postInputModelValidation } from "./validation-middleware/PostInputModel-validation-middleware";
import { inputErrorManagementMiddleware } from "./validation-middleware/error-management-validation-middleware";
import { superAdminGuardMiddleware } from "./validation-middleware/base64-auth-guard_middleware";
import { IdParamName } from "./util-enums/id-names";
import { CollectionNames } from "../db/collection-names";
import { createIdValidator } from "./validation-middleware/id-verification-and-validation";
import {
    inputPaginationValidatorForComments,
    inputPaginationValidatorForPosts,
} from "./validation-middleware/pagination-validators";
import {
    CommentsSortListEnum,
    PostsSortListEnum,
} from "./util-enums/fields-for-sorting";
import { accessTokenGuard } from "./guard-middleware/access-token-guard";
import { commentInputModelValidation } from "./validation-middleware/comment-input-model-validation";
import { optionalAccessTokenGuard } from "./guard-middleware/optional-access-token-guard";


export const getPostsRouter = (postsHandler: PostsHandler) => {
    const postsRouter = Router();

    const validateParameterPostId = createIdValidator(
        IdParamName.PostId,
        CollectionNames.Posts,
    );

    // // make like/unlike/dislike/undislike operation
    // postsRouter.put(
    //     `/:${IdParamName.PostId}/like-status`, // здесь было просто id
    //     superAdminGuardMiddleware,
    //     validateParameterPostId,
    //     /*inputErrorManagementMiddleware,*/ postInputModelValidation,
    //     inputErrorManagementMiddleware,
    //     postsHandler.likePostById,
    // );

    // requests a list of comments for specified postId
    postsRouter.get(
        `/:${IdParamName.PostId}/comments`,
        optionalAccessTokenGuard,
        validateParameterPostId,
        inputPaginationValidatorForComments(CommentsSortListEnum),
        inputErrorManagementMiddleware,
        postsHandler.getSeveralCommentsByPostId,
    );

    // creates new comment
    postsRouter.post(
        `/:${IdParamName.PostId}/comments`,
        accessTokenGuard,
        validateParameterPostId,
        commentInputModelValidation,
        inputErrorManagementMiddleware,
        postsHandler.createNewComment,
    );

    // Returns all posts
    postsRouter.get(
        "/",
        inputPaginationValidatorForPosts(PostsSortListEnum),
        inputErrorManagementMiddleware,
        postsHandler.getSeveralPosts,
    );

    // auth guarded, Creates new post
    postsRouter.post(
        "/",
        superAdminGuardMiddleware,
        postInputModelValidation,
        inputErrorManagementMiddleware,
        postsHandler.createNewPost,
    );

    // return post by post-id
    postsRouter.get(
        `/:${IdParamName.PostId}`, // здесь было просто id
        validateParameterPostId,
        inputErrorManagementMiddleware,
        postsHandler.findSinglePost,
    );

    // auth guarded, Update existing post by post-id with InputModel
    postsRouter.put(
        `/:${IdParamName.PostId}`, // здесь было просто id
        superAdminGuardMiddleware,
        validateParameterPostId,
        /*inputErrorManagementMiddleware,*/ postInputModelValidation,
        inputErrorManagementMiddleware,
        postsHandler.updatePost,
    );

    // auth guarded, Delete post specified by post-id
    postsRouter.delete(
        `/:${IdParamName.PostId}`, // здесь было просто id
        superAdminGuardMiddleware,
        validateParameterPostId,
        inputErrorManagementMiddleware,
        postsHandler.deletePost,
    );

    return postsRouter;
};

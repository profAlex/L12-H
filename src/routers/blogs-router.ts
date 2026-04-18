import { Request, Response, Router } from "express";
import {
    BlogsHandler
} from "./router-handlers/blog-router-description";
import { blogInputModelValidation } from "./validation-middleware/BlogInputModel-validation-middleware";
import { inputErrorManagementMiddleware } from "./validation-middleware/error-management-validation-middleware";
import { superAdminGuardMiddleware } from "./validation-middleware/base64-auth-guard_middleware";
import {
    BlogsSortListEnum,
    PostsSortListEnum,
} from "./util-enums/fields-for-sorting";
import {
    inputPaginationValidatorForBlogs,
    inputPaginationValidatorForPosts,
} from "./validation-middleware/pagination-validators";
import {
    blogRoutesPostInputModelValidation,
    postInputModelValidation,
} from "./validation-middleware/PostInputModel-validation-middleware";
import { CollectionNames } from "../db/collection-names";
import { createIdValidator } from "./validation-middleware/id-verification-and-validation";
import { InputGetBlogPostsByIdQuery } from "./router-types/blog-search-by-id-input-model";
import { IdParamName } from "./util-enums/id-names";
import { optionalAccessTokenGuard } from "./guard-middleware/optional-access-token-guard";

export const getBlogsRouter = (blogsHandler: BlogsHandler) => {
    const blogsRouter = Router();

    const validateBlogId = createIdValidator(
        IdParamName.BlogId,
        CollectionNames.Blogs,
    );

    const validatePostIdForGeneralCRUDEndpoints = createIdValidator(
        IdParamName.PostId,
        CollectionNames.Blogs,
    );

    // Returns blogs with paging
    blogsRouter.get(
        "/",
        inputPaginationValidatorForBlogs(BlogsSortListEnum),
        inputErrorManagementMiddleware,
        blogsHandler.getSeveralBlogs,
    );

    // auth guarded, Creates new blog
    blogsRouter.post(
        "/",
        superAdminGuardMiddleware,
        blogInputModelValidation,
        inputErrorManagementMiddleware,
        blogsHandler.createNewBlog,
    );

    // Returns all posts for specified blog
    blogsRouter.get(
        `/:${IdParamName.BlogId}/posts`,
        optionalAccessTokenGuard,
        validateBlogId,
        inputPaginationValidatorForPosts(PostsSortListEnum),
        inputErrorManagementMiddleware,
        blogsHandler.getSeveralPostsFromBlog,
    );

    // auth guarded, Creates new post for specific blog
    blogsRouter.post(
        `/:${IdParamName.BlogId}/posts`,
        superAdminGuardMiddleware,
        validateBlogId,
        blogRoutesPostInputModelValidation,
        inputErrorManagementMiddleware,
        blogsHandler.createNewBlogPost,
    );

    // Returns blog by id
    blogsRouter.get(
        `/:blogId`,
        validateBlogId,
        inputErrorManagementMiddleware,
        blogsHandler.findSingleBlog,
    );

    // auth guarded, Update existing Blog by id with InputModel
    blogsRouter.put(
        `/:${IdParamName.BlogId}`,
        superAdminGuardMiddleware,
        validateBlogId,
        blogInputModelValidation,
        inputErrorManagementMiddleware,
        blogsHandler.updateBlog,
    );

    // auth guarded, Deletes blog specified by id
    blogsRouter.delete(
        `/:${IdParamName.BlogId}`,
        superAdminGuardMiddleware,
        validateBlogId,
        inputErrorManagementMiddleware,
        blogsHandler.deleteBlog,
    );

    return blogsRouter;
};

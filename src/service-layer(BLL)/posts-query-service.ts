import "reflect-metadata";
import { inject, injectable } from "inversify";
import { PostsQueryRepository } from "../repository-layers/query-repository-layer/posts-query-repository";
import { TYPES } from "../composition-root/ioc-types";
import { PaginatedCommentViewModel } from "../routers/router-types/comment-paginated-view-model";
import { InputGetCommentsQueryModel } from "../routers/router-types/comment-search-input-query-model";
import { postsCollection } from "../db/mongo.db";
import { mapToPostListPaginatedOutput } from "../repository-layers/mappers/map-paginated-post-search";
import { InputGetBlogPostsByIdQuery } from "../routers/router-types/blog-search-by-id-input-model";
import { PaginatedPostViewModel } from "../routers/router-types/post-paginated-view-model";
import { PostViewModel } from "../routers/router-types/post-view-model";

@injectable()
export class PostsQueryService {
    constructor(
        @inject(TYPES.PostsQueryRepository)
        protected postsQueryRepository: PostsQueryRepository,
    ) {}

    async getSeveralCommentsByPostIdAnonimously(
        postId: string,
        sanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        return this.postsQueryRepository.getSeveralCommentsByPostIdAnonimously(
            postId,
            sanitizedQuery,
        );
    }

    async getSeveralCommentsByPostId(
        postId: string,
        userId: string,
        sanitizedQuery: InputGetCommentsQueryModel,
    ): Promise<PaginatedCommentViewModel> {
        return this.postsQueryRepository.getSeveralCommentsByPostId(
            postId,
            userId,
            sanitizedQuery,
        );
    }

    async getSeveralPostsAnonimously(
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        return this.postsQueryRepository.getSeveralPostsAnonimously(
            null,
            sentSanitizedQuery,
        );
    }

    async getSeveralPosts(
        sentUserId: string,
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        return this.postsQueryRepository.getSeveralPosts(
            null,
            sentUserId,
            sentSanitizedQuery,
        );
    }

    async getSeveralPostsByBlogIdAnonimously(
        sentBlogId: string,
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        return this.postsQueryRepository.getSeveralPostsAnonimously(
            sentBlogId,
            sentSanitizedQuery,
        );
    }

    async getSeveralPostsByBlogId(
        sentBlogId: string,
        sentUserId: string,
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        return this.postsQueryRepository.getSeveralPosts(
            sentBlogId,
            sentUserId,
            sentSanitizedQuery,
        );
    }

    async findSinglePostAnonimously(
        postId: string,
    ): Promise<PostViewModel | null> {
        return this.postsQueryRepository.findSinglePostAnonimously(postId);
    }

    async findSinglePost(
        postId: string,
        userId: string,
    ): Promise<PostViewModel | null> {
        return this.postsQueryRepository.findSinglePost(postId, userId);
    }


}

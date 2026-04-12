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

    async getSeveralPosts(
        sentSanitizedQuery: InputGetBlogPostsByIdQuery,
    ): Promise<PaginatedPostViewModel> {
        return this.postsQueryRepository.getSeveralPosts(sentSanitizedQuery);
    }

    async findSinglePost(postId: string): Promise<PostViewModel | undefined> {
        return this.postsQueryRepository.findSinglePost(postId);
    }
}

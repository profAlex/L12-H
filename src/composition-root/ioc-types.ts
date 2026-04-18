export const TYPES = {
    // Services
    BcryptService: Symbol.for("BcryptService"),
    AuthCommandService: Symbol.for("AuthCommandService"),
    UsersCommandService: Symbol.for("UsersCommandService"),
    UsersQueryService: Symbol.for("UsersQueryService"),
    SecurityDevicesCommandService: Symbol.for("SecurityDevicesCommandService"),
    CommentsQueryService: Symbol.for("CommentsQueryService"),
    CommentsCommandService: Symbol.for("CommentsCommandService"),
    PostsCommandService: Symbol.for("PostsCommandService"),
    PostsQueryService: Symbol.for("PostsQueryService"),

    // Repositories
    SessionsCommandRepository: Symbol.for("SessionsCommandRepository"),
    UsersQueryRepository: Symbol.for("UsersQueryRepository"),
    UsersCommandRepository: Symbol.for("UsersCommandRepository"),
    CommentsQueryRepository: Symbol.for("CommentsQueryRepository"),
    CommentsCommandRepository: Symbol.for("CommentsCommandRepository"),
    CommentsLikesCommandRepository: Symbol.for("CommentsLikesCommandRepository"),
    CommentsLikesQueryRepository: Symbol.for("CommentsLikesQueryRepository"),
    PostsCommandRepository: Symbol.for("PostsCommandRepository"),
    PostsQueryRepository: Symbol.for("PostsQueryRepository"),
    PostsLikesCommandRepository: Symbol.for("PostsLikesCommandRepository"),
    PostsLikesQueryRepository: Symbol.for("PostsLikesQueryRepository"),

    // Handlers (Controller logic)
    UsersHandler: Symbol.for("UsersHandler"),
    SecurityDevicesHandler: Symbol.for("SecurityDevicesHandler"),
    AuthHandler: Symbol.for("AuthHandler"),
    CommentsHandler: Symbol.for("CommentsHandler"),
    PostsHandler: Symbol.for("PostsHandler"),
    BlogsHandler: Symbol.for("BlogsHandler"),

    // Guards / Middlewares
    RefreshTokenGuard: Symbol.for("RefreshTokenGuard"),
};

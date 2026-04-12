import { body } from "express-validator";
import { LikeStatus } from "../router-types/comment-like-storage-model";

const likeStatusValidation = body("likeStatus")
    .exists()
    .withMessage("Field likeStatus must be specified")
    .isString()
    .withMessage("Incorrect content type (must be string)")
    .trim()
    .isIn(Object.values(LikeStatus))
    .withMessage(`Invalid likeStatus values sent. Allowed values: ${Object.values(LikeStatus).join(", ")}`);

export const likeStatusInputModelValidation = [likeStatusValidation];

import { ApiErrorResponse } from "../utils/handleApiResponse.js";

// vaildate by zod schema
const validate = (schema) => (req, res, next) => {
    try {
        const { data, error } = schema.safeParse(req.body);

        if (error) {
            throw ApiErrorResponse.fromZodError(error);
        }

        req.body = data;
        next();
    } catch (error) {
        next(error);
    }
};

export { validate };

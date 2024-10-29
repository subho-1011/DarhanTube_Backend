class ApiSuccessResponse {
    constructor(status, message, data = undefined, success = true) {
        this.status = status;
        this.message = message;
        this.data = data;
        this.success = success;
    }
}

class ApiReridectResponse {
    constructor(status, message, url) {
        this.status = status;
        this.message = message;
        this.url = url;
    }
}

class ApiErrorResponse {
    constructor(status, message, errors = null, stack = null, success = false) {
        // super(message);

        this.message = message;
        this.status = status;
        this.success = success;
        if (errors) {
            this.errors = errors;
        }
        if (stack) {
            this.stack = stack;
        }
    }

    static fromZodError(error) {
        const errors = error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
        }));

        if (error?.issues) {
            return new ApiErrorResponse(400, errors[0].message, error.errors, error.issues);
        }

        return new ApiErrorResponse(400, error.message, errors);
    }
}

export { ApiSuccessResponse, ApiReridectResponse, ApiErrorResponse };

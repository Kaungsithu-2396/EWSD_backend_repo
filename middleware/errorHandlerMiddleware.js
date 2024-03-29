const errorHandler = (error, req, resp, next) => {
    const statusCode = resp.statusCode || 500;
    resp.status(statusCode).send({
        status: "fail",
        message:
            process.env.DEV_ENV === "development" ? error.stack : error.message,
    });
    next();
};
module.exports = errorHandler;

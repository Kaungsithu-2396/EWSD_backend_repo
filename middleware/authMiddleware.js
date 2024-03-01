const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const studentModel = require("../Models/studentModel");
const verifiedAuthorizedUser = asyncHandler(async (req, resp, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decode = await jwt.verify(token, process.env.SECRET_KEY);
            req.student = await studentModel
                .findById(decode.id)
                .select("-password");
        } catch (error) {
            resp.status(401);
            throw new Error("unauthorized user");
        }
    }

    next();
});
module.exports = verifiedAuthorizedUser;

const asyncHandler = require("express-async-handler");
const studentModel = require("../Models/studentModel");
const jwt = require("jsonwebtoken");
const getSpecificData = asyncHandler(async (req, resp) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decode = await jwt.verify(token, process.env.SECRET_KEY);
            const dataForUser = await studentModel
                .findById(decode.id)
                .select("-password");
            resp.status(200).send({
                status: "success",
                data: dataForUser,
            });
        } catch (error) {
            resp.status(401);
            throw new Error("invalid token");
        }
    } else {
        resp.status(401);
        throw new Error("no token found");
    }
});
module.exports = getSpecificData;

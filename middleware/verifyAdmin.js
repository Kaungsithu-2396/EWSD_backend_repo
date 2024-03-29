const asyncHandler = require("express-async-handler");
const verifyAdmin = asyncHandler(async (req, resp, next) => {
    const { role } = req.student;
    if (role !== "admin") {
        resp.status(401);
        throw new Error("Authorized users only");
    }
    next();
});
module.exports = verifyAdmin;

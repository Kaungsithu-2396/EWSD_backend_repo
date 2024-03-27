const asyncHandler = require("express-async-handler");
const verifyMarketingManager = asyncHandler(async (req, resp, next) => {
    const { role } = req.student;
    if (role !== "admin" && role !== "marketing manager") {
        resp.status(401);
        throw new Error("authorized user only");
    }
    next();
});
module.exports = verifyMarketingManager;

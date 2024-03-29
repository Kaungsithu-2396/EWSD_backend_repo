const express = require("express");
const app = express();
const dotenv = require("dotenv").config({ path: "./config.env" });
const connectDB = require("./util/dbConnect");
const PORT = process.env.PORT || 4000;
const studentRouter = require("./routes/studentRoutes");
const commentRouter = require("./routes/commentRoutes");
const errorHandler = require("./middleware/errorHandlerMiddleware");
const academicRouter = require("./routes/academicRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const dateSettingRouter = require("./routes/dateSettingRoute");
const cors = require("cors");
connectDB();
app.use(cors());
app.use(express.json());
app.use("/api/v1", studentRouter);

app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/academicYear", academicRouter);
app.use("/api/v1/faculty", facultyRoutes);
app.use("/api/v1/dateSetting", dateSettingRouter);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`app starts running on ${PORT}`);
});

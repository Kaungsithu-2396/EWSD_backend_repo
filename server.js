const express = require("express");
const app = express();
const dotenv = require("dotenv").config({ path: "./config.env" });
const connectDB = require("./util/dbConnect");
const PORT = process.env.PORT || 4000;
const studentRouter = require("./routes/studentRoutes");
const errorHandler = require("./middleware/errorHandlerMiddleware");
connectDB();
app.use(express.json());
app.use("/api/v1", studentRouter);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`app starts running on ${PORT}`);
});

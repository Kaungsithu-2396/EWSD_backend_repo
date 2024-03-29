const connectDB = () => {
    const mongoose = require("mongoose");
    const URL = process.env.DB_URL.replace("<password>", process.env.DB_PWD);
    mongoose
        .connect(URL)
        .then((doc) => {
            console.log("connection success");
        })
        .catch((error) => {
            console.log(error);
        });
};
module.exports = connectDB;

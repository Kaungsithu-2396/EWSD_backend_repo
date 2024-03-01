const nodemailer = require("nodemailer");
const sendMailtoClient = async (toemail, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        await transporter.sendMail({
            from: "ewsdgp9@gmail.com",
            to: toemail,
            subject,
            text,
        });
        console.log("Email have been delivered successfully");
    } catch (error) {
        throw new Error(error);
    }
};
module.exports = sendMailtoClient;

import nodemailer from "nodemailer";

async function sendMail({
    to,
    subject,
    htmlTemplate,
    fileBase64,
    fileName,
}) {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html: htmlTemplate,
            attachments: [],
        };

        // Base64 Attachment Handler
        if (fileBase64) {
            const cleanBase64 = fileBase64.replace(/^data:.+;base64,/, "");

            mailOptions.attachments.push({
                filename: fileName || "User_Resume.pdf",
                content: Buffer.from(cleanBase64, "base64"),
            });
        }

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error("Nodemailer Util Error:", error);
        return { success: false, error: error.message };
    }
}

export default sendMail;
import nodemailer from "nodemailer";
import { loadEnvFile } from "process";

if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASS,
  },
});

const mailConfig = (toEmail, subject, htmlContent) => ({
  from: "service@tasksync.com",
  to: toEmail,
  subject: subject,
  html: htmlContent,
});

export const sendingMail = transporter.sendMail(mailConfig);

import config from '../config.json';
import nodemailer from 'nodemailer';

export default async function sendEmail({to, subject, html, from = config.emailFrom}){
    const transporter = nodemailer.createTransport(config.smtpOptions);
    await transporter.sendMail({from, to, subject, html});
}
/*
    This helper does 3 things:
    1. Connects to your email provider
    2. Prepares the email details
    3. Sends the email
*/
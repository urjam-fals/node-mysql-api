import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

type FileConfig = {
    emailFrom?: string;

    smtpOptions?: {
        host: string;
        port: number;

        secure?: boolean;

        auth?: {
            user: string;
            pass: string;
        };
    };
};

function loadFileConfig(): FileConfig {

    try {

        const configPath =
            path.join(__dirname, '../config.json');

        const raw =
            fs.readFileSync(configPath, 'utf8');

        return JSON.parse(raw);

    } catch {

        return {};
    }
}

const fileConfig: FileConfig =
    process.env.NODE_ENV === 'production'
        ? {}
        : loadFileConfig();

function getSmtpOptions() {

    if (
        process.env.NODE_ENV === 'production' &&
        !process.env.SMTP_HOST
    ) {
        throw new Error(
            'SMTP_HOST environment variable is required in production to send emails'
        );
    }

    if (process.env.SMTP_HOST) {

        return {
            host: process.env.SMTP_HOST,

            port: process.env.SMTP_PORT
                ? parseInt(process.env.SMTP_PORT, 10)
                : 587,

            secure:
                process.env.SMTP_SECURE === 'true',

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };
    }

    if (!fileConfig.smtpOptions) {
        throw new Error('SMTP configuration is missing');
    }

    return fileConfig.smtpOptions;
}

function getEmailFrom() {

    return (
        process.env.EMAIL_FROM ||
        fileConfig.emailFrom ||
        'no-reply@example.com'
    );
}

async function sendWithResend({
    to,
    subject,
    html,
    from
}: any) {

    // placeholder for future Resend support
    throw new Error('Resend API not implemented');
}

export default async function sendEmail({
    to,
    subject,
    html,
    from = getEmailFrom()
}: any) {

    const hasResend =
        !!process.env.RESEND_API_KEY;

    if (hasResend) {

        return await sendWithResend({
            to,
            subject,
            html,
            from
        });
    }

    const transporter =
        nodemailer.createTransport(
            getSmtpOptions()
        );

    await transporter.sendMail({
        from: from || getEmailFrom(),
        to,
        subject,
        html
    });
}
/*
    This helper does 3 things:
    1. Connects to your email provider
    2. Prepares the email details
    3. Sends the email
*/
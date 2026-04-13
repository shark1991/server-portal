const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
}

async function sendSignupNotification(email, firstName, lastName) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.log('No ADMIN_EMAIL configured, skipping notification');
        return;
    }

    const transporter = getTransporter();
    
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6366f1;">New User Signup Request</h2>
            <p>A new user is requesting access to the server portal.</p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Name:</strong> ${firstName || ''} ${lastName || ''}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Log in to the <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}">Admin Panel</a> to approve or deny this request.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: adminEmail,
            subject: 'New Server Portal Signup Request',
            html: htmlContent
        });
        console.log('Signup notification sent for:', email);
    } catch (error) {
        console.error('Failed to send signup notification:', error);
    }
}

module.exports = {
    sendSignupNotification
};
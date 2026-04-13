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

async function sendUserCreatedNotification(email, firstName, tempPassword) {
    const transporter = getTransporter();
    
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6366f1;">Welcome to Server Portal</h2>
            <p>Hello ${firstName || 'there'},</p>
            <p>Your account has been created by the administrator.</p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            
            <p>Please <a href="https://portal.eakin.cloud">log in</a> using your email and the temporary password above.</p>
            <p><strong>Important:</strong> For security, please change your password after logging in.</p>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">If you have any questions, contact the administrator.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Your Server Portal Account',
            html: htmlContent
        });
        console.log('User created notification sent to:', email);
    } catch (error) {
        console.error('Failed to send user created notification:', error);
    }
}

async function sendApprovalNotification(email, firstName) {
    const transporter = getTransporter();
    
    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Your Account Has Been Approved</h2>
            <p>Hello ${firstName || 'there'},</p>
            <p>Great news! Your account has been approved and you now have full access to the Server Portal.</p>
            
            <p><a href="https://portal.eakin.cloud" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Log In Now</a></p>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">If you have any questions, contact the administrator.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: 'Your Server Portal Account Has Been Approved',
            html: htmlContent
        });
        console.log('Approval notification sent to:', email);
    } catch (error) {
        console.error('Failed to send approval notification:', error);
    }
}

module.exports = {
    sendSignupNotification,
    sendUserCreatedNotification,
    sendApprovalNotification
};
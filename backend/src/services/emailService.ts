import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service configuration error:', error);
      } else {
        logger.info('Email service is ready to send messages');
      }
    });
  }

  private async sendEmail(to: string, subject: string, html: string, text?: string) {
    const mailOptions = {
      from: `"SMILE App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, code: string, firstName: string) {
    const subject = 'Verify Your SMILE Account';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to SMILE! 😊</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thank you for joining SMILE! We're excited to have you in our community.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            To complete your registration, please verify your email address by entering the code below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #667eea; color: white; font-size: 24px; font-weight: bold; 
                        padding: 15px 30px; display: inline-block; border-radius: 8px; letter-spacing: 3px;">
              ${code}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This verification code will expire in 24 hours.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you didn't create an account with SMILE, please ignore this email.
          </p>
        </div>
        
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 SMILE App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, code: string, firstName: string) {
    const subject = 'Reset Your SMILE Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            We received a request to reset your SMILE account password.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Use the code below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #e74c3c; color: white; font-size: 24px; font-weight: bold; 
                        padding: 15px 30px; display: inline-block; border-radius: 8px; letter-spacing: 3px;">
              ${code}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            This reset code will expire in 15 minutes for security reasons.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 SMILE App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const subject = 'Welcome to SMILE - Let\'s Get Started! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to SMILE! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${firstName}!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Congratulations! Your SMILE account has been successfully verified and you're now part of our amazing community.
          </p>
          
          <h3 style="color: #333;">What's Next?</h3>
          
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li>Complete your profile to personalize your experience</li>
            <li>Discover and interact with AI influencers</li>
            <li>Create your first post and start connecting</li>
            <li>Explore the AI Agent Marketplace</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background-color: #667eea; color: white; text-decoration: none; 
                      padding: 15px 30px; display: inline-block; border-radius: 8px; font-weight: bold;">
              Get Started Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.5;">
            Need help? Check out our <a href="${process.env.FRONTEND_URL}/help" style="color: #667eea;">Help Center</a> 
            or reach out to our support team.
          </p>
        </div>
        
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 SMILE App. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendNotificationEmail(email: string, firstName: string, title: string, message: string) {
    const subject = `SMILE Notification: ${title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SMILE Notification</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${firstName}!</h2>
          
          <h3 style="color: #667eea;">${title}</h3>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            ${message}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/notifications" 
               style="background-color: #667eea; color: white; text-decoration: none; 
                      padding: 15px 30px; display: inline-block; border-radius: 8px; font-weight: bold;">
              View All Notifications
            </a>
          </div>
        </div>
        
        <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2024 SMILE App. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/settings/notifications" style="color: #ccc;">
              Update notification preferences
            </a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

const nodemailer = require('nodemailer');

// Create the transporter outside of the class
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'naveen.carinasoftlabs@gmail.com',
    pass: 'hledgerwbgzoyuty'
    // pass: 'ppwcczfbbaziupzf'
  }
});

module.exports = class Email {
  constructor(user, password, url) {
    this.to = user.email;
    this.name = user.name;
    this.email = user.email;
    this.password = password;
    this.url = url;
    this.from = 'naveen.carinasoftlabs@gmail.com';
  }

  async sendForgotPasswordEmail() {
    try {
      await transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: 'Password Reset',
        html: `
          <h2>Password Reset</h2>
          <p>Dear ${this.name},</p>
          <p>We received a request to reset your password for your account. If you did not make this request, please ignore this email.</p>
          <p>To reset your password, click on the following link:</p>
          <p>${this.url}</p>
          <p>If you are having any issues or need further assistance, please contact our support team at [Support Email/Phone].</p>
          <p style="font-size:12px"><b>NOTE: </b> The above activation link expires in 15 minutes.</p>
          <p>Thank you.</p>
        `
      });
      console.log('Forgot password email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendVerificationEmail() {
    try {
      const expirationTimeInMinutes = 10;
      const expirationTimeInSeconds = expirationTimeInMinutes * 60;
      const expirationDate = new Date(Date.now() + expirationTimeInSeconds * 1000);
  
      await transporter.sendMail({
        from: this.from,
        to: this.to,
        subject: 'Account Verification',
        html: `
          <h2>Account Verification</h2>
          <p>Dear ${this.name},</p>
          <p>Thank you for signing up with Metaverse. Please click on the following link to verify your email address:</p>
          <p>${this.url}</p>
          <p>This link will expire on ${expirationDate.toLocaleString()}.</p>
          <p>If you did not create an account with Metaverse, please ignore this email.</p>
          <p>If you have any questions or need assistance, please contact our support team at [Support Email/Phone].</p>
          <p>Thank you.</p>
        `
      });
      console.log('Verification email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
  
};

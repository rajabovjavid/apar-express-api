const nodemailer = require("nodemailer");
// const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user) {
    this.to = user.email;
    this.firstName = user.name_surname.split(" ")[0];
    this.from = process.env.EMAIL_FROM; // `Gönder-Getsin <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendWelcome() {
    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: "Welcome Gonder-Getsin",
      text: `Hi ${this.firstName}, welcome to the Gonder-Getsin Family!`,
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmailVerification(url) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: "Email Verification",
      text: `Hi ${this.firstName}. Click this ${url} to verify your email`,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordReset(resetUrl) {
    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: "Password Reset",
      text: `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`,
    };

    // Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
};

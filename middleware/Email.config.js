import nodemailer from 'nodemailer'
import dotenv from "dotenv";
dotenv.config();


export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "vk92636312@gmail.com",
    pass: process.env.PRIVATE_KEY
  },
});



export const sendEmail = async (email, verification) => {

  try {
      const info = await transporter.sendMail({
    from: '"StrangerTalk" <vk92636312@gmail.com>',
    to: email,
    subject: "Verification code",
    text: `Your verification code is ${verification}`, // plain‑text body
    html: `<p>Your verification code is <strong>${verification}</strong></p>`, // HTML body
  });
    return info;
  } catch (error) {
    console.error('email error', error)
    throw error;
  }
}


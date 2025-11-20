
import { Verification_Email_Template } from "../Libs/emailTemplate.js";
import{ transporter} from "./Email.config.js"


export const send = async(email,verifaction) =>{
   try {
    const info = await transporter.sendMail({
    from: '"StrangerTalk" <vk92636312@gmail.com>',
    to: email,
    subject: "Verifeaction code",
    text: "Your verifaction Code is", // plain‑text body
    html: Verification_Email_Template.replace("{verification}",verifaction), // HTML body
  });
  console.log("email send successfully")
   } catch (error) {
    console.log('email error')
   }
}


import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   
   name:{type:String,required:true},
   email:{type:String,required:true,},
   password:{type:String,required:true,},
   token:{
      type:String,
      default:''
   },
   
   isVerified:{
      type:Boolean,
      default:false
   },
   verifaction:String
   
})

export const User = mongoose.model("user",userSchema)
import 'dotenv/config'
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import {User} from './models/user.js'
import {send} from './middleware/email.js'
import { error, trace } from 'console';
import { Session, url } from 'inspector';
import { name } from 'ejs';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer'
import Randomstring from 'randomstring';



const app = express();
const server = createServer(app); 
const io = new Server(server);

app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.set("view engine", "ejs")
app.set('trust proxy',1)

app.use(session({
secret :process.env.session_secret||'secret123',
resave : false,
saveUninitialized: false,
rolling:true,
cookie:{
    httpOnly:true,
    maxAge:1000*60*60*24,
    secure:false,
    sameSite:'lax'
}

}))

mongoose.connect(process.env.MONGO_URL,{
    "dbName":"stranger"
}).then(()=>console.log("mongooseDB connected..")).catch((err)=>console.log(err))


const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static("public"));

const port = process.env.PORT||PORT;

app.use(express.static(join(__dirname, 'public')));


let checkLogin = (req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect('login.ejs')
    }
}


app.get("/", (req, res) => {
  res.render("login.ejs")

});


app.get("/register",(req,res)=>{
    res.render("register.ejs",{url:null})
})

app.get('/home',checkLogin,(req,res)=>{
  res.sendFile(join(__dirname , 'app' ,'index.html'));
})

app.get("/forgot-password", (req, res) => {
  res.render("forget.ejs", { msg: null }); // Renders this UI
});

app.post('/forgot-password',async(req,res)=>{
    const {email}  = req.body
    const findUser  =  await User.findOne({email})
   if(!findUser){
    return res.status(400).json({ success: false, message: "Invalid Email" });
   }
await send(email,verifaction)
    res.render('verify.ejs')
})


app.post('/verifyOTP', async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findOne({ verifaction:otp });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or Expired code" });
        }

       else{
         user.isVerified = true;
        user.verifaction = undefined;
        await user.save();
       res.sendFile(join(__dirname , 'app' ,'index.html'));
       }
       
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});


const verifaction = Math.floor(100000 + Math.random() * 900000).toString()

app.post("/register", async (req, res) => {

try {
     const { name, email, password } = req.body;

    const ExistUser = await User.findOne({email})
    if(ExistUser){
        return res.status(400).json({success:false,message:"User Already Exits please Login"})
    }

   else{
      const hash = await bcrypt.hash(password, 10)
    const user = await User.create({name,email,password:hash,verifaction})
    req.session.user = user._id;
    res.redirect('/home');
   }

} catch (error) {
    console.error(error)
    res.status(500).json({ error: "Registration failed" })
}

})


app.post("/login",async (req,res)=>{
    const {email,password} = req.body
    let user =  await User.findOne({email})
    if(!user)   res.render('login.ejs')
    
const isMatch = await bcrypt.compare(password,user.password)
  if(!isMatch) return res.render('login.ejs',{error:'invaild password'})
   
    
     req.session.user = name
   
    
    res.redirect('/home')

    
})



/* ---------------- MATCHMAKING STORAGE ---------------- */
const users = new Map();        // socket.id -> user object
const waitingPool = new Set();  // waiting users list

/* ---------------- HELPER FUNCTIONS ---------------- */

function matchUser(id) {
    const me = users.get(id);
    if (!me || !me.looking) return;

    const candidates = [...waitingPool].filter(uid => uid !== id);

    if (candidates.length === 0) {
        io.to(id).emit("waiting");
        return;
    }

    const partnerId = candidates[Math.floor(Math.random() * candidates.length)];
    const partner = users.get(partnerId);

    me.peerId = partnerId;
    partner.peerId = id;
    me.looking = false;
    partner.looking = false;

    waitingPool.delete(id);
    waitingPool.delete(partnerId);

    io.to(id).emit("matched", { peerID: partnerId });
    io.to(partnerId).emit("matched", { peerID: id });

    console.log(`Matched: ${id} <--> ${partnerId}`);
}

function disconnectPair(id) {
    const me = users.get(id);
    if (!me || !me.peerId) return;

    const partner = users.get(me.peerId);

    if (partner) {
        partner.peerId = null;
        partner.looking = true;
        waitingPool.add(partner.id);
        io.to(partner.id).emit("peer-left");
    }

    me.peerId = null;
    me.looking = false;
    waitingPool.delete(id);
}

/* ---------------- SOCKET.IO MAIN LOGIC ---------------- */

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    users.set(socket.id, {
        id: socket.id,
        looking: false,
        peerId: null
    });

    
    socket.on("find", () => {
        const me = users.get(socket.id);
        if (!me || me.peerId) return;
        me.looking = true;
        waitingPool.add(socket.id);
        matchUser(socket.id);
    });

    
    socket.on("next", () => {
        disconnectPair(socket.id);
        socket.emit("find");
    });

    
    socket.on("stop", () => {
        disconnectPair(socket.id);
        socket.emit("stopped");
    });

    socket.on("signal", (data) => {
        const me = users.get(socket.id);
        if (me?.peerId) io.to(me.peerId).emit("signal", data);
    });

    socket.on("disconnect", () => {
        disconnectPair(socket.id);
        users.delete(socket.id);
        waitingPool.delete(socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });

    socket.on("chat", (payload = {}) => {
  const me = users.get(socket.id);
  if (!me || !me.peerId) return; //

  const text = String(payload.text || "").slice(0, 1000); 
  if (!text.trim()) return;

  io.to(me.peerId).emit("chat", {
    from: socket.id,
    text,
    ts: Date.now(),
  }); 
});

});


server.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}}`);
});

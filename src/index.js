// import mongoose from "mongoose";
// require('dotenv').config({path:'./env'});
import dotenv from "dotenv"
import {connectdb} from "./DB/index.js"
// 🔴 OLD: import app from "./app.js";
// 🟢 NEW: Import 'server' from the file where you setup socket.io
import { server } from "./app.js"; 
import { startCronJobs } from "./cron/weeklyReset.js";

dotenv.config({
    path:'../.env'
})

const PORT = process.env.PORT || 8000;

connectdb()
.then(()=>{
    startCronJobs();
    
    server.listen(PORT,()=>{
        console.log(`in server side running prot is a : ${PORT}`)
        console.log(`Socket.io is initialized! 🔌`)
    })
})
.catch((error)=>{
    console.log(`Error id fount in express app side `,error);
})
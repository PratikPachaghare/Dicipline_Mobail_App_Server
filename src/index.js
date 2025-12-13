// import mongoose from "mongoose";
// require('dotenv').config({path:'./env'});
import dotenv from "dotenv"
import {connectdb} from "./DB/index.js"
import app from "./app.js";

const PORT = process.env.PORT || 8000;

dotenv.config({
    path:'./env'
})

connectdb()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`in server side running prot is a : ${PORT}`)
    })
})
.catch((error)=>{
    console.log(`Error id fount in express app side `,error);
})






// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
//         app.on("error" , (error) =>{
//             console.log("error: ",error);
//             throw error
//         })
        
    
//     }catch (error){
//         console.log("error: ",error);
//         throw error
//     }
// })()
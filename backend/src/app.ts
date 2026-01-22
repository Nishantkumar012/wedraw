import express from 'express';
// import cors from 'cors';
import {prisma} from "./lib/prisma"
import boardRoutes from "./routes/boardRoutes"
import userRoutes from "./routes/userRoutes"
import devRoutes from "./routes/devRoutes"
import cookieParser from "cookie-parser"
import cors from 'cors'


const app = express();
app.use(cookieParser());

// app.use(cors({
//     origin: ["http://localhost:5173" , "https://wedraw-hbbh8bqo6-nishants-projects-a6a81365.vercel.app"],
//     credentials: true
// }))

app.use(cors({
  origin: "*"
}));

app.use(express.json());
// this uis app.ts


app.use("/boards",boardRoutes);
app.use("/user",userRoutes);
app.use("/dev",devRoutes);



app.get("/", (req,res) => {
    res.send("Hello From express");
})


export {app};

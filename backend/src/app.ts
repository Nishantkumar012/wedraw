import express from 'express';
// import cors from 'cors';
import {prisma} from "./lib/prisma"
import boardRoutes from "./routes/boardRoutes"
import userRoutes from "./routes/userRoutes"
import devRoutes from "./routes/devRoutes"
import cors from 'cors'


const app = express();

app.use(cors({
    origin: ["http://localhost:5173" , "https://wedraw-f0f7.onrender.com"],
    credentials: true
}))

app.use(express.json());


app.use("/boards",boardRoutes);
app.use("/user",userRoutes);
app.use("/dev",devRoutes);



app.get("/", (req,res) => {
    res.send("Hello From express");
})


export {app};

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import {auth} from "../authmiddleware/auth"
import { authMiddleware } from "../authmiddleware/auth.js";

const router = Router();

/**
 * POST /users/register
 * Body: { name, email, password }
 */
router.post("/register", async (req, res) => {
            
       const {name,email,password} = req.body;
         
          if(!name || !email || !password){
              return res.status(400).json({error: "All fields are necessary"});
          }

          try {
            
          const existedUser = await prisma.user.findUnique({
              where:{email}
          })

            if(existedUser) {
                return res.status(409).json({error: "user already exists"})
            }

            const hash = await bcrypt.hash(password,10);

            const user = await prisma.user.create({
                 
                data:{
                     name,
                     email,
                     password:hash
                     
                }
            })

            return res.json({ message: "User registered", user });
              
        
          } catch (error) {
              return res.status(500).json({ error: "Server error" });
          }

         
});

/**
 * POST /users/login
 * Body: { email, password }
 */
            router.post("/login", async (req, res) => {
                
                 const {email,password} = req.body;

                     if(!email || !password){
                          return res.status(400).json({error: "all fields are neccessary"});
                     }

                     try {
                        
                     
                     const user = await prisma.user.findUnique({
                           where:{email}
                     })

                     if(!user){
                         return res.status(404).json({error: "user does not exist"});
                     }

                      const match  = await bcrypt.compare(password,user.password);

                      if(!match){
                          return res.status(401).json({error: "Password is incorrect"});
                      }

                        const token = jwt.sign({userId:user.id},
                            process.env.JWT_SECRET as string)
                            //  {expiresIn: "7d"});


                                // 4️⃣ SET COOKIE  ← यही जगह है ✅
                                const isProd = process.env.NODE_ENV === "production";

                                res.cookie("token", token, {
                                    httpOnly: true,
                                    secure: isProd,
                                    sameSite: isProd ? "none" : "lax"
                                });

                             return res.json({message:"Login successfull", token});

                             } catch (error) {
                                      return res.status(500).json({ error: "Server error" });
                     }
             });



                router.get("/me", authMiddleware, async (req, res) => {
                            try {
                                const user = await prisma.user.findUnique({
                                where: { id: req.userId },
                                select: { id: true, name: true, email: true }
                                });

                                return res.json({ user });
                            } catch (err) {
                                return res.status(500).json({ error: "Server error" });
                            }
                        })


export default router;

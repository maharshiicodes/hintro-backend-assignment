import  { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/config.js'; 
import { users } from '../db/schema.js'; 


const router = Router();


const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req, res)  => {
  try {
  
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ traceId : req.traceId, success: false, error: parsedData.error.flatten().fieldErrors});
      return;
    }

    const { email, password } = parsedData.data;

    
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      res.status(400).json({ traceId : req.traceId ,success: false, error: 'User already exists' });
      return;
    }

   
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

   
    const newUser = await db.insert(users).values({
      email,
      passwordHash,
    }).returning(); 

    res.status(201).json({
      traceId : req.traceId,
      success: true,
      data: {
        id: newUser[0].id,
        email: newUser[0].email,
      }
    });
  } catch (error) {
    next(error); 
  }
});


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req ,res) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ traceId : req.traceId, success: false, error: parsedData.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsedData.data;

 
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length === 0) {
      
      res.status(401).json({ traceId : req.traceId, success: false, error: 'Invalid credentials' });
      return;
    }

    const user = existingUser[0];

   
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ traceId : req.traceId, success: false, error: 'Invalid credentials' });
      return;
    }

    
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

   
    res.status(200).json({
      traceId : req.traceId,
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      }
    });

  } catch (error) {
    next(error);
  }
});
export default router;
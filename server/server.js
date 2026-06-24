import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js';
import { clerkMiddleware } from "@clerk/express";

import { serve } from "inngest/express";
import {inngest, functions} from './Inngest/index.js'
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';

const app = express();

await connectDB();

app.use(express.json());
app.use(cors())
app.use(clerkMiddleware())

//creating routes..
app.get('/', (req, res) => res.send('Server is running')) //home route
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
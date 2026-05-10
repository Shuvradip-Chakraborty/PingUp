import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js';
import { clerkMiddleware } from "@clerk/express";

import { serve } from "inngest/express";
import {inngest, functions} from './Inngest/index.js'

const app = express();

await connectDB();

app.use(express.json());
app.use(cors())
app.use(clerkMiddleware())

//creating routes..
app.get('/', (req, res) => res.send('Server is running')) //home route
app.use("/api/inngest", serve({ client: inngest, functions }));


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scheduleRouter from './routes/schedule.js';
import emailsRouter from './routes/emails.js';
import searchRouter from './routes/search.js';
import authSyncRouter from './routes/authSync.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './config/queue';
dotenv.config();
import './services/emailWorker.ts';
const app = express();
app.use(cors());
app.use(express.json());

// API to schedule an email
app.use('/api', scheduleRouter);
app.use('/api', emailsRouter);
app.use('/api', searchRouter);
app.use('/api',authSyncRouter);

// Bull-board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import { Worker, Job, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import axios from 'axios'; 
import { redisConnection } from '../config/queue.js';
import prisma from '../../prisma/prismaConfig.js';

dotenv.config();


// Configure Ethereal Test SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER || 'your-ethereal-user',
    pass: process.env.ETHEREAL_PASS || 'your-ethereal-pass',
  },
});

export const emailWorker = new Worker(
  'email-queue', 
  async (job: Job) => {
    const { jobId, userId, recipient, subject, body } = job.data;

    try {
      // 1. IDEMPOTENCY CHECK
      const existingJob = await prisma.emailJob.findUnique({
        where: { id: jobId },
      });

      if (!existingJob) throw new Error('Email job record not found in DB');
      if (existingJob.status === 'SENT') {
        console.log(`Job ${jobId} already sent. Skipping to maintain idempotency.`);
        return; 
      }

      // 2. Fetch user to check limits and Slack webhook
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found for this job');

      // 3. Hourly Rate Limit Check
      const currentHour = new Date().toISOString().slice(0, 13); 
      const currentHourKey = `rate-limit:${userId}:${currentHour}`;
      
      const currentCountStr = await redisConnection.get(currentHourKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

      // 4. Use hourly limit from job data (frontend config) OR fallback to user default
      const hourlyLimit = job.data.hourlyLimit || user.hourlyLimit || 200;

      if (currentCount >= hourlyLimit) {
        console.log(`Rate limit (${hourlyLimit}/hr) reached for user ${userId}. Rescheduling...`);
        
        // 5. Slack Webhook Logic (Throttled to 1 message per hour)
        if (user.slackWebhookUrl) {
          const slackAlertKey = `slack-alerted:${userId}:${currentHour}`;
          const alreadyAlerted = await redisConnection.get(slackAlertKey);
          
          if (!alreadyAlerted) {
            await axios.post(user.slackWebhookUrl, {
              text: `🚨 *Rate Limit Alert*\nYour account has reached the hourly limit of ${hourlyLimit} emails. Future emails are automatically delayed to the next hour.`
            }).catch(err => console.error('Slack webhook failed:', err.message));
            
            await redisConnection.set(slackAlertKey, '1', 'EX', 3600);
          }
        }

        // 6. Calculate time until next hour window starts
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0); 
        const delayUntil = nextHour.getTime();
        
        // 7. Properly move job back to delayed queue in BullMQ
        await job.moveToDelayed(delayUntil, job.token!);
        throw new DelayedError(); 
      }

      // 8. Send Email via Ethereal
      const info = await transporter.sendMail({
        from: '"ReachInbox Scheduler" <assignment@outboxlabs.com>',
        to: recipient,
        subject,
        text: body,
        html: `<p>${body}</p>`,
      });

      console.log('Message sent: %s', info.messageId);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // 9. Update Database status to SENT
      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // 10. Increment rate limit counter in Redis (expires in 1 hour)
      await redisConnection.incr(currentHourKey);
      await redisConnection.expire(currentHourKey, 3600);

    } catch (error: any) {
      if (error instanceof DelayedError) {
        throw error; 
      }

      console.error(`Failed to process job ${jobId}:`, error.message);
      
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: 'FAILED' },
      });
      
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: {
      max: 1, 
      duration: 2000,
    }
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully!`);
});

emailWorker.on('failed', (job, err) => {
  if (!(err instanceof DelayedError)) {
    console.log(`Job ${job?.id} failed with error: ${err.message}`);
  }
});
import { esClient } from "../config/elasticsearch.js";
import { emailQueue } from "../config/queue.js";
import prisma from "../../prisma/prismaConfig.js";

const handleScheduleEmail = async (req: any, res: any): Promise<any> => {
  try {
    const { userId, recipients, subject, body, delay, hourlyLimit, scheduledTime } = req.body;

    // 1. Validation
    if (!userId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Valid User ID and Recipients array are required' });
    }
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and Body are required' });
    }

  
    const baseTime = scheduledTime ? new Date(scheduledTime).getTime() : Date.now();
    const delayInMs = (parseInt(delay) || 0) * 60 * 1000;

    const scheduledJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i];

      const jobTimeMs = baseTime + (i * delayInMs);
      const scheduledDate = new Date(jobTimeMs);
      
      const queueDelay = Math.max(0, jobTimeMs - Date.now()); 

      const emailJob = await prisma.emailJob.create({
        data: {
          userId,
          recipient: recipientEmail, 
          subject,
          body,
          status: 'SCHEDULED',
          scheduledAt: scheduledDate,
        },
      });

      try {
        await esClient.index({
          index: 'emails', 
          id: emailJob.id, 
          document: {
            id: emailJob.id,
            userId: emailJob.userId,
            recipient: emailJob.recipient,
            subject: emailJob.subject,
            body: emailJob.body,
            status: emailJob.status,
            scheduledAt: emailJob.scheduledAt,
          },
        });
      } catch (esError) {
        console.error(`Elasticsearch Indexing Error for ${recipientEmail}:`, esError);
      }

      await emailQueue.add(
        'send-email',
        { jobId: emailJob.id, userId, recipient: recipientEmail, subject, body },
        { delay: queueDelay } 
      );

      scheduledJobs.push(emailJob);
    }

    return res.status(201).json({ 
      message: 'Bulk emails scheduled successfully', 
      count: scheduledJobs.length,
      jobs: scheduledJobs 
    });

  } catch (error) {
    console.error('Error scheduling emails:', error);
    return res.status(500).json({ error: 'Failed to schedule emails' });
  }
}

export default handleScheduleEmail;
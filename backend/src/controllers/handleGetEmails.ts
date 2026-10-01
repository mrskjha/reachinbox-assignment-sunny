import prisma from "../../prisma/prismaConfig.js";

const handleGetEmails = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    
    const emails = await prisma.emailJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, 
    });

    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}

export default handleGetEmails;
import prisma from "../../prisma/prismaConfig.js";

const handleAuthSync = async (req: any, res: any) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
       return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email }
    });

    // Create user if they don't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId: googleId || email, 
          hourlyLimit: 200 
        }
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
}

const handlewebHookSync = async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: "Webhook URL is required" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { slackWebhookUrl: webhookUrl },
    });

    res.status(200).json({ message: "Slack connected successfully!", user: updatedUser });
  } catch (error) {
    console.error("Error saving Slack webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
export default handleAuthSync;
export { handlewebHookSync };
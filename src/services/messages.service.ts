import { User } from "../models/User";
import { Message } from "../models/Message";

export const sendPrivateMessage = async (
  userId: string,
  toUserId: string,
  content: string,
) => {
  // 1. Verify if the content is not empty
  if (!content || content.trim() === "") {
    throw new Error("Message content cannot be empty.");
  }

  // 2. Verify sender and receiver exist
  const sender = await User.findById(userId);
  const receiverExists = await User.exists({ _id: toUserId });

  if (!sender) {
    throw new Error("Sender user not found.");
  }
  if (!receiverExists) {
    throw new Error("Receiver user not found.");
  }

  // Check if toUserId is in sender's friends list
  // Assuming sender.friends stores an array of Mongoose ObjectIds
  const isFriend = sender.friends.some(
    (friendId) => friendId.toString() === toUserId.toString(),
  );

  if (!isFriend) {
    throw new Error("You can only send messages to friends.");
  }

  // 3. Create and save the private message
  const newMessage = new Message({
    from: userId,
    to: toUserId,
    content,
  });

  await newMessage.save();

  // Construct the message object to return, avoiding extra DB call
  const messageForClient = {
    _id: newMessage._id,
    from: {
      _id: sender._id,
      username: sender.username,
      discriminator: sender.discriminator,
    },
    to: {
      _id: toUserId,
      // We don't have receiver's username/discriminator here unless fetched earlier
      // Consider fetching receiver's basic info if absolutely needed for display
      // Or let the client fetch it on its own if not immediately critical
    },
    content: newMessage.content,
    createdAt: newMessage.createdAt,
  };

  return messageForClient;
};

// Get conversation between two users
export const getConversation = async (userId: string, friendId: string) => {
  const messages = await Message.find({
    $or: [
      { from: userId, to: friendId },
      { from: friendId, to: userId },
    ],
  })
    .sort({ createdAt: -1 }) // from newest to oldest
    .limit(50) // Limit the number of messages to retrieve
    .populate("from", "username _id discriminator") // Populate sender's username and ID
    .populate("to", "username _id discriminator"); // Populate receiver's username and ID

  // newest to oldest
  return messages.reverse();
};

import { User } from "../models/User";
import mongoose from "mongoose";

export const sendFriendRequest = async (
  senderId: string,
  username: string,
  discriminator: string,
) => {
  // Validate parameters
  if (!username || !discriminator)
    return {
      status: 400,
      message: "Username and discriminator are required",
    };

  // Look for target user
  const targetUser = await findUserByTag(username, discriminator);
  if (!targetUser)
    return {
      status: 404,
      message: "User not found",
    };

  // Check if the sender is sending a friend request to himself
  if (targetUser._id.toString() === senderId) {
    return {
      status: 400,
      message: "You can't send a friend request to yourself",
    };
  }

  // Determine if receiver is already a friend
  const sender = await User.findById(senderId);
  if (!sender)
    throw {
      status: 404,
      message: "Sender not found",
    };

  // Check if the sender is already friends with the receiver
  if (alreadyFriends(sender, targetUser._id)) {
    return {
      status: 400,
      message: "You are already friends with this user",
    };
  }

  // Check if sender already sent a request to target (check target's received requests)
  if (hasPendingRequest(targetUser, senderId)) {
    return {
      status: 400,
      message: "You have already sent a friend request to this user",
    };
  }

  // Check if sender already has target in sentFriendRequests (double check)
  if (
    sender.sentFriendRequests.some((id: mongoose.Types.ObjectId) =>
      id.equals(targetUser._id),
    )
  ) {
    return {
      status: 400,
      message: "You have already sent a friend request to this user",
    };
  }

  // Check if target already sent a request to sender (bidirectional check)
  if (hasPendingRequest(sender, targetUser._id.toString())) {
    return {
      status: 400,
      message:
        "This user has already sent you a friend request. Please respond to it instead.",
    };
  }

  // Add request to the target
  targetUser.friendRequests.push({
    from: sender._id,
    to: targetUser._id,
    status: "pending",
    createdAt: new Date(),
  });

  // Add to sent requests
  sender.sentFriendRequests.push(targetUser._id);

  await Promise.all([targetUser.save(), sender.save()]);

  return { message: "Friend request sent successfully" };
};

export async function getFriendRequests(userId: string) {
  const user = await User.findById(userId).populate(
    "friendRequests.from",
    "username discriminator",
  );
  if (!user)
    throw {
      status: 404,
      message: "User not found",
    };

  // Return only pending requests
  return user.friendRequests.filter((req) => req.status === "pending");
}

export async function respondToFriendRequest(
  userId: string,
  senderId: string,
  accept: boolean,
) {
  const user = await User.findById(userId);
  const sender = await User.findById(senderId);

  if (!user || !sender) throw { status: 404, message: "User not found" };

  // Find the request
  const requestIndex = user.friendRequests.findIndex(
    (req) => req.from.toString() === senderId && req.status === "pending",
  );

  if (requestIndex === -1) {
    throw { status: 404, message: "Friend request not found" };
  }

  if (accept) {
    // Accept: Add to friends
    if (!user.friends.includes(sender._id)) user.friends.push(sender._id);
    if (!sender.friends.includes(user._id)) sender.friends.push(user._id);
  }

  // Remove the accepted/declined request from the user's requests
  removeFriendRequest(user, senderId);

  // Remove from sent requests
  removeSentRequest(sender, userId);

  await Promise.all([user.save(), sender.save()]);

  return {
    message: accept ? "Friend request accepted" : "Friend request declined",
  };
}

export async function getFriendsList(userId: string) {
  const user = await User.findById(userId).populate(
    "friends",
    // Get username, discriminator, but exclude _id
    "username discriminator -_id",
  );
  if (!user)
    throw {
      status: 404,
      message: "User not found",
    };
  return user.friends;
}

export async function removeFriend(userId: string, friendId: string) {
  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend) throw { status: 404, message: "User not found" };

  // Remove from both lists
  user.friends = user.friends.filter((id) => id.toString() !== friendId);
  friend.friends = friend.friends.filter((id) => id.toString() !== userId);

  await Promise.all([user.save(), friend.save()]);

  return { message: "Friend removed successfully" };
}

// Helper functions
async function findUserByTag(username: string, discriminator: string) {
  return User.findOne({ username, discriminator });
}

function alreadyFriends(user: any, friendId: mongoose.Types.ObjectId) {
  return user.friends.some((id: mongoose.Types.ObjectId) =>
    id.equals(friendId),
  );
}

function hasPendingRequest(receiver: any, senderId: string) {
  return receiver.friendRequests.some(
    (req: any) => req.from.toString() === senderId && req.status === "pending",
  );
}

function removeSentRequest(user: any, targetId: string) {
  user.sentFriendRequests = user.sentFriendRequests.filter(
    (id: mongoose.Types.ObjectId) => !id.equals(targetId),
  );
}

function removeFriendRequest(user: any, fromId: string) {
  user.friendRequests = user.friendRequests.filter(
    (req: any) => req.from.toString() !== fromId,
  );
}

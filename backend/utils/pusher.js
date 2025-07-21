const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "your_app_id",
  key: process.env.PUSHER_KEY || "your_key", 
  secret: process.env.PUSHER_SECRET || "your_secret",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true
});

const triggerLeaderboardUpdate = async (users) => {
  await pusher.trigger("leaderboard-channel", "leaderboard-update", users);
};

const triggerClaimUpdate = async (claim) => {
  await pusher.trigger("leaderboard-channel", "claim-update", claim);
};

module.exports = {
  pusher,
  triggerLeaderboardUpdate,
  triggerClaimUpdate
};

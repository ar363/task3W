const Pusher = require("pusher");

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

const triggerLeaderboardUpdate = async (users: any) => {
  await pusher.trigger("leaderboard-channel", "leaderboard-update", users);
};

const triggerClaimUpdate = async (claim: any) => {
  await pusher.trigger("leaderboard-channel", "claim-update", claim);
};

module.exports = {
  pusher,
  triggerLeaderboardUpdate,
  triggerClaimUpdate
};

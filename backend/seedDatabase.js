const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const initialUsers = [
  { name: 'Rahul', totalPoints: 0 },
  { name: 'Kamal', totalPoints: 0 },
  { name: 'Sanak', totalPoints: 0 },
  { name: 'Priya', totalPoints: 0 },
  { name: 'Amit', totalPoints: 0 },
  { name: 'Neha', totalPoints: 0 },
  { name: 'Raj', totalPoints: 0 },
  { name: 'Pooja', totalPoints: 0 },
  { name: 'Vikram', totalPoints: 0 },
  { name: 'Anita', totalPoints: 0 }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Insert initial users with ranks
    const usersWithRanks = initialUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    const createdUsers = await User.insertMany(usersWithRanks);
    console.log('✅ Successfully created initial users:');
    
    createdUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (ID: ${user._id})`);
    });

    console.log(`\n🎉 Database seeded with ${createdUsers.length} users!`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.disconnect();
    console.log('📪 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Check if this script is run directly
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers, initialUsers };

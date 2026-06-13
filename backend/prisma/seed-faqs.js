const {
  disconnectSeedDatabase,
  seedFaqs,
} = require("./seed");

seedFaqs()
  .then(disconnectSeedDatabase)
  .catch(async (error) => {
    console.error(error);
    await disconnectSeedDatabase();
    process.exit(1);
  });

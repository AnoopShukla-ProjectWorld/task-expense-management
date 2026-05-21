const bcrypt = require("bcrypt");

const generateHash = async () => {
  const hash = await bcrypt.hash(
    "Admin@123",
    10
  );

  console.log(hash);
};

generateHash();
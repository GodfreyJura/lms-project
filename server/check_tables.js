require("dotenv").config();
const pool = require("./src/config/db");

pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  .then(r => {
    console.log(r.rows);
    process.exit();
  })
  .catch(e => {
    console.error(e.message);
    process.exit();
  });
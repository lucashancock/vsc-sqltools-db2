import Db2Driver from "../ls/driver"; // Adjust path as necessary

const credentials = {
  database: "your_db_name",
  server: "your_server_name", // Use actual server address
  port: 50000, // Change this to your actual Db2 port
  name: "name",
  driver: "driver",
  id: "id",
  isConnected: false,
  isActive: false,
  username: "your_username",
  password: "your_password",
};

const dbDriver = new Db2Driver(credentials, null);

async function testConnection() {
  try {
    console.log("Testing database connection...");

    // Open the connection to the DB2 server
    const connection = await dbDriver.open();
    console.log("Connection established:", connection);

    // Perform any quick test queries if needed (optional)
    // const results = await dbDriver.query('SELECT 1');
    // console.log('Query results:', results);

    // Now close the connection
    await dbDriver.close();
    console.log("Connection closed successfully.");
  } catch (error) {
    console.error("Error during connection test:", error);
  }
}

// Execute the test
testConnection();

import { connectDb } from "./src/config/db.js";
import { app, logger } from "./src/app.js";

const PORT = Number(process.env.PORT || 5000);

async function start() {
  await connectDb(process.env.MONGODB_URI);
  logger.info("MongoDB connected");
  app.listen(PORT, () => {
    logger.info(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});

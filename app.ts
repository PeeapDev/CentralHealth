import express from 'express';
import path from 'path';
import cors from 'cors';
import { loadModules } from './loadModules';

async function bootServer() {
  // Create Express app
  const app = express();
  const port = process.env.PORT || 4000;

  // Configure middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files
  app.use(express.static(path.join(__dirname, 'public')));

  // Basic route for testing
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Load and initialize modules
  try {
    const loadedModules = await loadModules(app);
    console.log(`Server initialized with ${loadedModules.length} modules`);
  } catch (error) {
    console.error('Error loading modules:', error);
  }

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
  });

  return app;
}

// Boot the server
if (require.main === module) {
  bootServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default bootServer;

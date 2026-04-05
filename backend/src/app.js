import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { verifyToken } from './middleware/verifyToken.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import enseignementRoutes from './routes/enseignement.routes.js';
import rhRoutes from './routes/rh.routes.js';
import encadrementRoutes from './routes/encadrement.routes.js';
import satisfactionRoutes from './routes/satisfaction.routes.js';
import rayonnementRoutes from './routes/rayonnement.routes.js';
import exportRoutes from './routes/export.routes.js';
import { startWeeklyCron } from './cron/weeklyReport.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: false,
}));
app.use(express.json());

// ─── Health check (no auth) ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Protected routes ───────────────────────────────────
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/enseignement', verifyToken, enseignementRoutes);
app.use('/api/rh', verifyToken, rhRoutes);
app.use('/api/encadrement', verifyToken, encadrementRoutes);
app.use('/api/satisfaction', verifyToken, satisfactionRoutes);
app.use('/api/rayonnement', verifyToken, rayonnementRoutes);
app.use('/api/export', verifyToken, exportRoutes);

// ─── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
  });
});

// ─── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Dashboard GI Backend running on port ${PORT}`);
  startWeeklyCron();
});

export default app;

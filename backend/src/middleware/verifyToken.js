import supabase from '../config/supabase.js';

/**
 * verifyToken — Validates Supabase JWT from Authorization header.
 * Attaches req.user = { id, role, email, nom, id_enseignant }
 */
export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Extract role and info from user_metadata
    const metadata = user.user_metadata || {};
    req.user = {
      id: user.id,
      email: user.email,
      role: metadata.role || 'permanent',
      nom: metadata.nom || '',
      prenom: metadata.prenom || '',
      id_enseignant: metadata.id_enseignant || null,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
}

/**
 * requireRole — Middleware factory for role-gating routes.
 * Usage: router.get('/admin', requireRole('chef_dept'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé — rôle insuffisant' });
    }
    next();
  };
}

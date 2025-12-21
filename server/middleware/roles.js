const requireRole = (allowed) => {
  // allowed can be string or array of strings
  const allowedList = Array.isArray(allowed) ? allowed.map(a => String(a).toLowerCase()) : [String(allowed).toLowerCase()];
  return (req, res, next) => {
    try {
      const role = String(req.user?.role || '').toLowerCase();
      if (!role) return res.status(403).json({ error: 'Role required' });
      if (!allowedList.includes(role)) return res.status(403).json({ error: 'Forbidden: role not allowed' });
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'Role check failed' });
    }
  };
};

export default requireRole;

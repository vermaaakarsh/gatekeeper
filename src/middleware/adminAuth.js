export function adminAuth(req, res, next) {
  const adminSecret = process.env.ADMIN_SECRET;
  const provided = req.header("X-Admin-Secret");

  if (!adminSecret || provided !== adminSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

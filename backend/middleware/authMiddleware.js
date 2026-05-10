import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: "No token" });
    }

    const decoded = jwt.verify(token, "secretkey");

    req.admin = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export default protect;
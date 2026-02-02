import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Gatekeeper API running on port ${PORT}`);
});

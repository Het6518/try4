const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  requireAdmin,
  requireClerk,
  requireClient,
  requireClerkOrAdmin,
} = require("../middleware/roleMiddleware");

const {
  submitTransaction,
  getMyTransactions,
  getPendingTransactions,
  reviewTransaction,
  getAllTransactions,
  getTransactionById,
  getDashboardStats,
  reanalyzeTransaction,
  getAllUsers,
  getReviews,
} = require("../controllers/transactionController");

// ── CLIENT routes ────────────────────────────────────────────────────────────
router.post("/", auth, requireClient, submitTransaction);
router.get("/my", auth, requireClient, getMyTransactions);

// ── CLERK routes ─────────────────────────────────────────────────────────────
router.get("/pending", auth, requireClerk, getPendingTransactions);
router.put("/:id/review", auth, requireClerk, reviewTransaction);

// ── ADMIN routes ─────────────────────────────────────────────────────────────

// NOTE: /stats and /users must be declared BEFORE /:id to avoid param capture
router.get("/stats", auth, requireAdmin, getDashboardStats);
router.get("/users", auth, requireAdmin, getAllUsers);
router.get("/", auth, requireAdmin, getAllTransactions);
router.post("/:id/reanalyze", auth, requireAdmin, reanalyzeTransaction);

// ── CLERK + ADMIN — review history ──────────────────────────────────────────
router.get("/reviews", auth, requireClerkOrAdmin, getReviews);

// ── Any auth — single transaction (role-filtered inside controller) ──────────
router.get("/:id", auth, getTransactionById);

module.exports = router;

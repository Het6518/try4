/**
 * transactionController.js
 * Handles all transaction-related API logic for the fraud-detection platform.
 *
 * Roles:
 *  CLIENT  — submit transactions, view own history
 *  CLERK   — review pending/high-risk transactions
 *  ADMIN   — full visibility, dashboard stats, user management helpers
 */

const prisma = require("../config/db");
const { analyzeTransaction } = require("../services/mlService");

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Full include block reused across queries */
const TX_INCLUDE = {
  cardTransaction: true,
  upiTransaction: true,
  bankTransfer: true,
  fraudReview: {
    include: { clerk: { select: { id: true, email: true, role: true } } },
  },
  user: { select: { id: true, email: true, role: true } },
};

/** Tiny helper to create an HTTP error */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT — Submit Transaction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/transactions
 *
 * Body shape:
 * {
 *   type: "CARD" | "UPI" | "BANK_TRANSFER",
 *   amount: number,
 *   time: ISO-8601 string,
 *   card?: { ...CardTransaction fields (minus id, transactionId) },
 *   upi?: { ...UPITransaction fields },
 *   bank?: { ...BankTransfer fields }
 * }
 */
exports.submitTransaction = async (req, res, next) => {
  try {
    const { type, amount, time, card, upi, bank } = req.body;

    if (!type || !amount || !time) {
      return next(createError("type, amount, and time are required."));
    }

    const validTypes = ["CARD", "UPI", "BANK_TRANSFER"];
    if (!validTypes.includes(type)) {
      return next(createError(`type must be one of: ${validTypes.join(", ")}`));
    }

    if (type === "CARD" && !card) {
      return next(createError("Card transaction details (card) are required for type CARD."));
    }
    if (type === "UPI" && !upi) {
      return next(createError("UPI transaction details (upi) are required for type UPI."));
    }
    if (type === "BANK_TRANSFER" && !bank) {
      return next(createError("Bank transfer details (bank) are required for type BANK_TRANSFER."));
    }

    // ── 1. Create the base transaction record ──────────────────────────────
    const transaction = await prisma.transaction.create({
      data: {
        userId: req.user.userId,
        type,
        amount: parseFloat(amount),
        time: new Date(time),
        status: "PENDING",
        ...(type === "CARD" && {
          cardTransaction: { create: { ...card } },
        }),
        ...(type === "UPI" && {
          upiTransaction: { create: { ...upi } },
        }),
        ...(type === "BANK_TRANSFER" && {
          bankTransfer: { create: { ...bank } },
        }),
      },
      include: TX_INCLUDE,
    });

    // ── 2. Run fraud analysis (ML or rule-based) ───────────────────────────
    const riskResult = await analyzeTransaction(transaction);

    // ── 3. Persist risk scores + decide status ─────────────────────────────
    // Auto-flag CRITICAL/HIGH risk transactions for clerk review
    const autoStatus =
      riskResult.riskLevel === "CRITICAL" || riskResult.riskLevel === "HIGH"
        ? "UNDER_REVIEW"
        : "PENDING";

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        category: riskResult.category,
        explanation: riskResult.explanation,
        status: autoStatus,
      },
      include: TX_INCLUDE,
    });

    res.status(201).json({
      success: true,
      message: "Transaction submitted successfully.",
      transaction: updated,
      riskAnalysis: {
        score: riskResult.riskScore,
        level: riskResult.riskLevel,
        category: riskResult.category,
        explanation: riskResult.explanation,
        source: riskResult.source,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT — Get Own Transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/my
 * Query: page, limit, status, type
 */
exports.getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.userId,
      ...(status && { status }),
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: TX_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLERK — Get Pending / Under-Review Transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/pending
 * Supports filters: type, riskLevel, page, limit
 */
exports.getPendingTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, riskLevel } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: { in: ["PENDING", "UNDER_REVIEW"] },
      ...(type && { type }),
      ...(riskLevel && { riskLevel }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: TX_INCLUDE,
        orderBy: [{ riskScore: "desc" }, { createdAt: "asc" }],
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLERK — Review a Transaction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/transactions/:id/review
 * Body: { decision: "APPROVED" | "REJECTED", notes?: string }
 */
exports.reviewTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return next(createError('decision must be "APPROVED" or "REJECTED".'));
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      return next(createError("Transaction not found.", 404));
    }

    if (!["PENDING", "UNDER_REVIEW"].includes(transaction.status)) {
      return next(
        createError(
          `Transaction has already been resolved (status: ${transaction.status}).`,
          409
        )
      );
    }

    // Check if a review already exists
    const existingReview = await prisma.fraudReview.findUnique({
      where: { transactionId: id },
    });

    if (existingReview) {
      return next(createError("This transaction has already been reviewed.", 409));
    }

    // ── Atomic: create review + update transaction status ──────────────────
    const [review, updatedTx] = await prisma.$transaction([
      prisma.fraudReview.create({
        data: {
          transactionId: id,
          clerkId: req.user.userId,
          decision,
          notes: notes || null,
        },
      }),
      prisma.transaction.update({
        where: { id },
        data: { status: decision === "APPROVED" ? "APPROVED" : "REJECTED" },
        include: TX_INCLUDE,
      }),
    ]);

    res.json({
      success: true,
      message: `Transaction ${decision.toLowerCase()} successfully.`,
      review,
      transaction: updatedTx,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Get All Transactions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions
 * Query: page, limit, status, type, riskLevel, userId, dateFrom, dateTo, sortBy, sortOrder
 */
exports.getAllTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      riskLevel,
      userId,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const allowedSort = ["createdAt", "amount", "riskScore", "time"];
    const orderField = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const where = {
      ...(status && { status }),
      ...(type && { type }),
      ...(riskLevel && { riskLevel }),
      ...(userId && { userId }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: TX_INCLUDE,
        orderBy: { [orderField]: sortOrder === "asc" ? "asc" : "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANY AUTH — Get Single Transaction by ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/:id
 * CLIENTs can only access their own transactions.
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: TX_INCLUDE,
    });

    if (!transaction) {
      return next(createError("Transaction not found.", 404));
    }

    // CLIENTs may only view their own transactions
    if (
      req.user.role === "CLIENT" &&
      transaction.userId !== req.user.userId
    ) {
      return next(createError("Access denied.", 403));
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Dashboard Statistics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/stats
 * Returns high-level aggregated metrics for the admin dashboard.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      total,
      byStatus,
      byType,
      riskAgg,
      highRisk,
      recentTransactions,
      clerksActivity,
    ] = await Promise.all([
      // Total count
      prisma.transaction.count(),

      // Count by status
      prisma.transaction.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Count by type
      prisma.transaction.groupBy({
        by: ["type"],
        _count: { type: true },
      }),

      // Average + min + max risk score
      prisma.transaction.aggregate({
        _avg: { riskScore: true },
        _max: { riskScore: true },
        _min: { riskScore: true },
      }),

      // High-risk count (HIGH or CRITICAL)
      prisma.transaction.count({
        where: { riskLevel: { in: ["HIGH", "CRITICAL"] } },
      }),

      // 5 most recent transactions
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { id: true, email: true } },
          fraudReview: true,
        },
      }),

      // Clerk review activity
      prisma.fraudReview.groupBy({
        by: ["clerkId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    // Shape status map
    const statusMap = {};
    byStatus.forEach((s) => {
      statusMap[s.status] = s._count.status;
    });

    // Shape type map
    const typeMap = {};
    byType.forEach((t) => {
      typeMap[t.type] = t._count.type;
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        byType: typeMap,
        riskScore: {
          avg: riskAgg._avg.riskScore
            ? parseFloat(riskAgg._avg.riskScore.toFixed(2))
            : null,
          max: riskAgg._max.riskScore,
          min: riskAgg._min.riskScore,
        },
        highRiskCount: highRisk,
        recentTransactions,
        clerksActivity,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Re-analyze a Transaction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/transactions/:id/reanalyze
 * Re-runs ML (or rule-based) scoring on an existing transaction.
 * Useful when the ML model is updated.
 */
exports.reanalyzeTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: TX_INCLUDE,
    });

    if (!transaction) return next(createError("Transaction not found.", 404));

    const riskResult = await analyzeTransaction(transaction);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        category: riskResult.category,
        explanation: riskResult.explanation,
      },
      include: TX_INCLUDE,
    });

    res.json({
      success: true,
      message: "Transaction re-analyzed.",
      transaction: updated,
      riskAnalysis: riskResult,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — Get All Users (lightweight list)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/users  (admin convenience endpoint)
 * Returns all users (id, email, role, createdAt, transaction count).
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { ...(role && { role }) };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { transactions: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CLERK/ADMIN — Get Reviews Made by a Clerk
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/transactions/reviews
 * CLERK  → their own reviews
 * ADMIN  → can filter by clerkId query param
 */
exports.getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, clerkId, decision } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // CLERK can only see their own reviews; ADMIN can filter by anyone
    const resolvedClerkId =
      req.user.role === "CLERK" ? req.user.userId : clerkId || undefined;

    const where = {
      ...(resolvedClerkId && { clerkId: resolvedClerkId }),
      ...(decision && { decision }),
    };

    const [reviews, total] = await Promise.all([
      prisma.fraudReview.findMany({
        where,
        include: {
          transaction: { include: TX_INCLUDE },
          clerk: { select: { id: true, email: true } },
        },
        orderBy: { reviewedAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.fraudReview.count({ where }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

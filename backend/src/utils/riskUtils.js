/**
 * riskUtils.js
 * Rule-based fraud risk scoring (used as ML fallback and pre-check).
 * All scores are in the range 0–100.
 */

const HIGH_RISK_AMOUNT = {
  CARD: 50000,
  UPI: 100000,
  BANK_TRANSFER: 500000,
};

const MEDIUM_RISK_AMOUNT = {
  CARD: 10000,
  UPI: 25000,
  BANK_TRANSFER: 100000,
};

/**
 * Determine if a given UTC hour is "night" (23:00 – 05:00 UTC).
 */
function isNightTime(date) {
  const hour = new Date(date).getUTCHours();
  return hour >= 23 || hour < 5;
}

/**
 * Main rule-based scorer.
 * @param {Object} tx - Prisma transaction + nested fields flattened
 * @returns {number} score 0–100
 */
function computeBaseRiskScore(tx) {
  let score = 0;
  const { type, amount, time } = tx;

  // ── Amount rules ───────────────────────────────────────────────────────────
  if (amount >= HIGH_RISK_AMOUNT[type]) {
    score += 40;
  } else if (amount >= MEDIUM_RISK_AMOUNT[type]) {
    score += 20;
  } else if (amount >= MEDIUM_RISK_AMOUNT[type] / 2) {
    score += 10;
  }

  // ── Time-of-day ────────────────────────────────────────────────────────────
  if (time && isNightTime(time)) {
    score += 15;
  }

  // ── Type-specific rules ───────────────────────────────────────────────────
  if (type === "CARD" && tx.cardTransaction) {
    const c = tx.cardTransaction;

    // Billing vs shipping mismatch
    if (
      c.billingCountry !== c.shippingCountry ||
      c.billingState !== c.shippingState
    ) {
      score += 15;
    }

    // International card
    if (c.billingCountry && c.billingCountry.toUpperCase() !== "IN") {
      score += 10;
    }

    // CVV not entered
    if (!c.cvvEntered) {
      score += 20;
    }

    // AVS mismatch
    if (c.avsResult && c.avsResult.toUpperCase().includes("FAIL")) {
      score += 10;
    }
  }

  if (type === "UPI" && tx.upiTransaction) {
    const u = tx.upiTransaction;

    // Auth method — weak methods get higher score
    const weakAuth = ["NONE", "STATIC_QR"];
    if (u.authenticationMethod && weakAuth.includes(u.authenticationMethod.toUpperCase())) {
      score += 15;
    }
  }

  if (type === "BANK_TRANSFER" && tx.bankTransfer) {
    const b = tx.bankTransfer;

    // Cross-border transfer
    if (
      b.senderCountry &&
      b.receiverCountry &&
      b.senderCountry.toUpperCase() !== b.receiverCountry.toUpperCase()
    ) {
      score += 25;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Map numeric score to a string risk level.
 * @param {number} score
 * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
function getRiskLevel(score) {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

/**
 * Generate a human-readable risk category.
 * @param {number} score
 * @param {string} type  - CARD | UPI | BANK_TRANSFER
 * @returns {string}
 */
function getRiskCategory(score, type) {
  const level = getRiskLevel(score);

  const categoryMap = {
    CRITICAL: `Potential ${type} fraud — immediate review required`,
    HIGH: `Suspicious ${type} transaction — elevated risk`,
    MEDIUM: `Moderate-risk ${type} transaction — review advised`,
    LOW: `Low-risk ${type} transaction — likely legitimate`,
  };

  return categoryMap[level];
}

/**
 * Build a brief plain-English explanation from rule triggers.
 * @param {Object} tx
 * @returns {string}
 */
function buildExplanation(tx) {
  const reasons = [];
  const { type, amount, time } = tx;

  if (amount >= HIGH_RISK_AMOUNT[type]) {
    reasons.push("very high transaction amount");
  } else if (amount >= MEDIUM_RISK_AMOUNT[type]) {
    reasons.push("high transaction amount");
  }

  if (time && isNightTime(time)) {
    reasons.push("transaction initiated during off-hours");
  }

  if (type === "CARD" && tx.cardTransaction) {
    const c = tx.cardTransaction;
    if (c.billingCountry !== c.shippingCountry) reasons.push("billing/shipping country mismatch");
    if (!c.cvvEntered) reasons.push("CVV not entered");
    if (c.avsResult && c.avsResult.toUpperCase().includes("FAIL")) reasons.push("AVS check failed");
    if (c.billingCountry && c.billingCountry.toUpperCase() !== "IN") reasons.push("international card");
  }

  if (type === "UPI" && tx.upiTransaction) {
    const u = tx.upiTransaction;
    const weakAuth = ["NONE", "STATIC_QR"];
    if (u.authenticationMethod && weakAuth.includes(u.authenticationMethod.toUpperCase())) {
      reasons.push("weak UPI authentication method");
    }
  }

  if (type === "BANK_TRANSFER" && tx.bankTransfer) {
    const b = tx.bankTransfer;
    if (b.senderCountry && b.receiverCountry && b.senderCountry !== b.receiverCountry) {
      reasons.push("cross-border bank transfer");
    }
  }

  if (reasons.length === 0) return "No significant risk indicators detected.";
  return `Flagged due to: ${reasons.join(", ")}.`;
}

module.exports = {
  computeBaseRiskScore,
  getRiskLevel,
  getRiskCategory,
  buildExplanation,
};

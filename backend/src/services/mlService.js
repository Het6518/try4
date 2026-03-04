/**
 * mlService.js
 * Thin wrapper around the external ML microservice for fraud prediction.
 * Gracefully falls back to local rule-based scoring if the service is offline.
 */

const axios = require("axios");
const {
  computeBaseRiskScore,
  getRiskLevel,
  getRiskCategory,
  buildExplanation,
} = require("../utils/riskUtils");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_TIMEOUT_MS = 5000; // 5-second timeout

/**
 * Call ML service to get risk prediction.
 * Falls back to local rule-based scoring on any error.
 *
 * @param {Object} tx - Full transaction object with nested relations
 * @returns {{ riskScore: number, riskLevel: string, category: string, explanation: string, source: string }}
 */
async function analyzeTransaction(tx) {
  // Build the payload the ML service expects
  const payload = {
    transactionId: tx.id,
    type: tx.type,
    amount: tx.amount,
    time: tx.time,
    // Flatten nested fields for ML model
    ...(tx.cardTransaction && {
      cardholderName: tx.cardTransaction.cardholderName,
      cardNetwork: tx.cardTransaction.cardNetwork,
      cardType: tx.cardTransaction.cardType,
      billingCountry: tx.cardTransaction.billingCountry,
      shippingCountry: tx.cardTransaction.shippingCountry,
      cvvEntered: tx.cardTransaction.cvvEntered,
      avsResult: tx.cardTransaction.avsResult,
      deviceType: tx.cardTransaction.deviceType,
      deviceOS: tx.cardTransaction.deviceOS,
      ipAddress: tx.cardTransaction.ipAddress,
    }),
    ...(tx.upiTransaction && {
      upiProvider: tx.upiTransaction.upiProvider,
      linkedBankName: tx.upiTransaction.linkedBankName,
      authenticationMethod: tx.upiTransaction.authenticationMethod,
      deviceType: tx.upiTransaction.deviceType,
      deviceOS: tx.upiTransaction.deviceOS,
      ipAddress: tx.upiTransaction.ipAddress,
    }),
    ...(tx.bankTransfer && {
      transferType: tx.bankTransfer.transferType,
      senderCountry: tx.bankTransfer.senderCountry,
      receiverCountry: tx.bankTransfer.receiverCountry,
      deviceType: tx.bankTransfer.deviceType,
      deviceOS: tx.bankTransfer.deviceOS,
      ipAddress: tx.bankTransfer.ipAddress,
    }),
  };

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, payload, {
      timeout: ML_TIMEOUT_MS,
    });

    const { riskScore, riskLevel, category, explanation } = response.data;

    return {
      riskScore: Number(riskScore),
      riskLevel: riskLevel || getRiskLevel(riskScore),
      category: category || getRiskCategory(riskScore, tx.type),
      explanation: explanation || buildExplanation(tx),
      source: "ml_model",
    };
  } catch (err) {
    console.warn(
      `[mlService] ML service unavailable (${err.message}). Using local rules.`
    );

    // ── Local fallback ─────────────────────────────────────────────────────
    const riskScore = computeBaseRiskScore(tx);
    const riskLevel = getRiskLevel(riskScore);
    const category = getRiskCategory(riskScore, tx.type);
    const explanation = buildExplanation(tx);

    return { riskScore, riskLevel, category, explanation, source: "rule_engine" };
  }
}

module.exports = { analyzeTransaction };

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  paymentAmountMatchesOrder,
  verifyMercadoPagoSignature,
  mapPaymentStatusToOrderStatus,
} from "./mercadopago";
import {
  canUpdateOrderStatus,
  pendingCutoffDate,
  shouldRestoreStockOnStatusChange,
} from "./orders";
import { getPendingPaymentTtlMinutes } from "./constants";

function sign(secret: string, manifest: string) {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

describe("verifyMercadoPagoSignature", () => {
  it("acepta firma válida", () => {
    const secret = "test-secret";
    const dataId = "123456";
    const requestId = "req-abc";
    const ts = "1704908010";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = sign(secret, manifest);
    const ok = verifyMercadoPagoSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataId,
      secret,
    });
    assert.equal(ok, true);
  });

  it("rechaza firma inválida", () => {
    const ok = verifyMercadoPagoSignature({
      xSignature: "ts=1704908010,v1=deadbeef",
      xRequestId: "req-abc",
      dataId: "123",
      secret: "test-secret",
    });
    assert.equal(ok, false);
  });

  it("rechaza sin secret o sin signature", () => {
    assert.equal(
      verifyMercadoPagoSignature({
        xSignature: null,
        xRequestId: "r",
        dataId: "1",
        secret: "s",
      }),
      false
    );
    assert.equal(
      verifyMercadoPagoSignature({
        xSignature: "ts=1,v1=abc",
        xRequestId: "r",
        dataId: "1",
        secret: "",
      }),
      false
    );
  });
});

describe("paymentAmountMatchesOrder", () => {
  it("acepta montos iguales con redondeo", () => {
    assert.equal(paymentAmountMatchesOrder(100.1, 100.1), true);
    assert.equal(paymentAmountMatchesOrder(99.999, 100), true);
  });

  it("rechaza monto incorrecto o ausente", () => {
    assert.equal(paymentAmountMatchesOrder(150, 100), false);
    assert.equal(paymentAmountMatchesOrder(100, undefined), false);
  });
});

describe("mapPaymentStatusToOrderStatus", () => {
  it("mapea estados MP", () => {
    assert.equal(mapPaymentStatusToOrderStatus("approved"), "confirmed");
    assert.equal(mapPaymentStatusToOrderStatus("pending"), "pending_payment");
    assert.equal(mapPaymentStatusToOrderStatus("cancelled"), "cancelled");
    assert.equal(mapPaymentStatusToOrderStatus("refunded"), "refunded");
  });
});

describe("order status helpers", () => {
  it("restaura stock solo desde pending", () => {
    assert.equal(
      shouldRestoreStockOnStatusChange("pending_payment", "cancelled"),
      true
    );
    assert.equal(
      shouldRestoreStockOnStatusChange("confirmed", "cancelled"),
      false
    );
  });

  it("permite confirmed → shipped", () => {
    assert.equal(canUpdateOrderStatus("confirmed", "shipped"), true);
    assert.equal(canUpdateOrderStatus("cancelled", "shipped"), false);
  });

  it("calcula cutoff con TTL", () => {
    process.env.MERCADOPAGO_PENDING_TTL_MINUTES = "30";
    const now = new Date("2026-01-01T12:00:00.000Z");
    const cutoff = pendingCutoffDate(now);
    assert.equal(cutoff.toISOString(), "2026-01-01T11:30:00.000Z");
    assert.equal(getPendingPaymentTtlMinutes(), 30);
  });
});

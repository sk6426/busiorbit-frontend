// src/auth/__tests__/access.test.ts
import { describe, it, expect } from "@jest/globals";
import { canUseFeature } from "../access";

describe("canUseFeature", () => {
  it("returns true when no requirements provided", () => {
    expect(
      canUseFeature({
        role: "business",
        availableFeatures: { Messaging: true },
        required: undefined,
      })
    ).toBe(true);
  });

  it("superadmin bypasses everything", () => {
    expect(
      canUseFeature({
        role: "superadmin",
        availableFeatures: {},
        required: { role: ["admin"], featureKeys: ["PlanManager"] },
      })
    ).toBe(true);
  });

  it("role-gated allow (role included)", () => {
    expect(
      canUseFeature({
        role: "admin",
        availableFeatures: {},
        required: { role: ["admin", "superadmin"] },
      })
    ).toBe(true);
  });

  it("role-gated deny (role not included)", () => {
    expect(
      canUseFeature({
        role: "business",
        availableFeatures: { PlanManager: true },
        required: { role: ["admin"] },
      })
    ).toBe(false);
  });

  it("feature-gated allow (single feature present)", () => {
    expect(
      canUseFeature({
        role: "admin",
        availableFeatures: { BulkMessaging: true },
        required: { featureKeys: ["BulkMessaging"] },
      })
    ).toBe(true);
  });

  it("feature-gated deny when missing", () => {
    expect(
      canUseFeature({
        role: "admin",
        availableFeatures: {},
        required: { featureKeys: ["BulkMessaging"] },
      })
    ).toBe(false);
  });

  it("multi-feature gating requires all features", () => {
    expect(
      canUseFeature({
        role: "admin",
        availableFeatures: { A: true, B: false },
        required: { featureKeys: ["A", "B"] },
      })
    ).toBe(false);

    expect(
      canUseFeature({
        role: "admin",
        availableFeatures: { A: true, B: true },
        required: { featureKeys: ["A", "B"] },
      })
    ).toBe(true);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "../src/app.js";

describe("API", () => {
  describe("GET /api/v1/health", () => {
    it("returns 200 and status ok", async () => {
      const res = await request(app).get("/api/v1/health");
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.success, true);
      assert.strictEqual(res.body?.data?.status, "ok");
    });
  });

  describe("404", () => {
    it("returns 404 and NOT_FOUND for unknown route", async () => {
      const res = await request(app).get("/api/v1/nonexistent");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body?.success, false);
      assert.strictEqual(res.body?.error?.code, "NOT_FOUND");
    });
  });

  describe("Protected routes", () => {
    it("GET /api/v1/addresses without auth returns 401", async () => {
      const res = await request(app).get("/api/v1/addresses");
      assert.strictEqual(res.status, 401);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma";
import { canManageProfile } from "./profileAccess";

vi.mock("../prisma", () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

const findUnique = vi.mocked(prisma.profile.findUnique);

function profile(overrides: Partial<{ id: string; userId: string; isPrimary: boolean }>) {
  return { id: "p1", userId: "u1", isPrimary: false, ...overrides } as never;
}

describe("canManageProfile", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("allows a profile to manage itself without hitting the database", async () => {
    const result = await canManageProfile("u1", "p1", "p1");

    expect(result).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("allows the primary profile to manage a sibling profile on the same account", async () => {
    findUnique
      .mockResolvedValueOnce(profile({ id: "primary", userId: "u1", isPrimary: true }))
      .mockResolvedValueOnce(profile({ id: "sibling", userId: "u1" }));

    const result = await canManageProfile("u1", "primary", "sibling");

    expect(result).toBe(true);
  });

  it("denies a non-primary profile from managing a sibling profile", async () => {
    findUnique
      .mockResolvedValueOnce(profile({ id: "active", userId: "u1", isPrimary: false }))
      .mockResolvedValueOnce(profile({ id: "sibling", userId: "u1" }));

    const result = await canManageProfile("u1", "active", "sibling");

    expect(result).toBe(false);
  });

  it("denies a primary profile from managing a profile on a different account", async () => {
    findUnique
      .mockResolvedValueOnce(profile({ id: "primary", userId: "u1", isPrimary: true }))
      .mockResolvedValueOnce(profile({ id: "other-account", userId: "u2" }));

    const result = await canManageProfile("u1", "primary", "other-account");

    expect(result).toBe(false);
  });

  it("denies access when the target profile no longer exists", async () => {
    findUnique
      .mockResolvedValueOnce(profile({ id: "primary", userId: "u1", isPrimary: true }))
      .mockResolvedValueOnce(null);

    const result = await canManageProfile("u1", "primary", "deleted-profile");

    expect(result).toBe(false);
  });
});

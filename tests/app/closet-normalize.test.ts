import { normalizeClosetFromUser } from "@/src/types/closet";

describe("normalizeClosetFromUser", () => {
  test("returns empty when closet is nullish or not an object", () => {
    expect(normalizeClosetFromUser(undefined)).toEqual({
      baseProductIds: [],
      racks: [],
    });
    expect(normalizeClosetFromUser(null)).toEqual({
      baseProductIds: [],
      racks: [],
    });
    expect(normalizeClosetFromUser("x")).toEqual({
      baseProductIds: [],
      racks: [],
    });
  });

  test("normalizes base product ids and filters racks without id or name", () => {
    const out = normalizeClosetFromUser({
      base: { productIds: ["a", "b"] },
      racks: [
        { id: "r1", name: "One", productIds: ["a"], createdAt: 200 },
        { id: "", name: "Bad" },
        { id: "r2", name: "Two", productIds: [], createdAt: 100 },
        { name: "No id" },
      ],
    });
    expect(out.baseProductIds).toEqual(["a", "b"]);
    expect(out.racks).toHaveLength(2);
    expect(out.racks.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(out.racks[0].productIds).toEqual(["a"]);
    expect(out.racks[1].productIds).toEqual([]);
  });

  test("sorting by createdAt is left to consumer; preserves createdAt on racks", () => {
    const out = normalizeClosetFromUser({
      racks: [{ id: "x", name: "X", createdAt: 5 }],
    });
    expect(out.racks[0].createdAt).toBe(5);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const guard = vi.hoisted(() => vi.fn());
const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
vi.mock("@/lib/guards", () => ({ requireSuperAdminSession: () => guard() }));
vi.mock("@/lib/prisma", () => ({ prisma: { premio: {
  findUnique: (...args: unknown[]) => findUnique(...args),
  update: (...args: unknown[]) => update(...args),
} } }));

import { POST } from "@/app/api/admin/premios/[id]/imagen/route";
import { GET } from "@/app/api/premios/imagen/[id]/route";

const params = { params: Promise.resolve({ id: "premio-1" }) };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);

function upload(bytes: Uint8Array, type: string) {
  const form = new FormData();
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  form.set("imagen", new File([buffer], "premio.png", { type }));
  return new Request("http://localhost/api/admin/premios/premio-1/imagen", { method: "POST", body: form });
}

beforeEach(() => {
  guard.mockReset().mockResolvedValue({ ok: true, session: { id: "admin-1", role: "SUPER_ADMIN" } });
  findUnique.mockReset().mockResolvedValue({ id: "premio-1" });
  update.mockReset().mockResolvedValue({});
});

describe("imagen de premio", () => {
  it("requiere sesión de administrador para subirla", async () => {
    guard.mockResolvedValue({ ok: false, response: NextResponse.json({ success: false }, { status: 403 }) });
    expect((await POST(upload(png, "image/png"), params)).status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it("rechaza contenido que no corresponde al tipo declarado", async () => {
    expect((await POST(upload(new Uint8Array([1, 2, 3]), "image/png"), params)).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("guarda una imagen válida y la sirve con su tipo correcto", async () => {
    const response = await POST(upload(png, "image/png"), params);
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "premio-1" },
      data: expect.objectContaining({ imagenMime: "image/png", imagenData: png }),
    }));

    findUnique.mockResolvedValue({ imagenData: png, imagenMime: "image/png" });
    const image = await GET(new Request("http://localhost/api/premios/imagen/premio-1"), params);
    expect(image.status).toBe(200);
    expect(image.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(png);
  });
});

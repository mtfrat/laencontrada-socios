import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { canjePremio: db } }));
vi.mock("@/lib/guards", () => ({
  requireSocioSession: async () => ({ ok: true, session: { id: "socio-1" } }),
}));
import { GET, DELETE } from "@/app/api/socio/canje/[id]/route";

const request = new Request("http://localhost/api/socio/canje/coupon-1");
const params = { params: Promise.resolve({ id: "coupon-1" }) };
const pending = () => ({
  id: "coupon-1", socioId: "socio-1", estado: "PENDIENTE", codigoQR: "CANJE-TEST",
  fechaExpiracion: new Date(Date.now() - 1000), puntosGastados: 100,
  fechaCanje: null, validadoPor: null, premio: { id: "premio-1", titulo: "Postre" },
});

beforeEach(() => { vi.resetAllMocks(); });

describe("transiciones del cupón frente a validaciones simultáneas", () => {
  it("cancelar no pisa un cupón que el mozo acaba de completar", async () => {
    db.findUnique.mockResolvedValue(pending());
    // Between the read and write, the waiter commits COMPLETADO.
    db.updateMany.mockImplementation(async ({ where }) => ({ count: where.estado === "PENDIENTE" ? 0 : 1 }));
    const response = await DELETE(request, params);
    expect(response.status).toBe(409);
    expect(db.updateMany).toHaveBeenCalledWith({
      where: { id: "coupon-1", socioId: "socio-1", estado: "PENDIENTE" },
      data: { estado: "CANCELADO" },
    });
  });

  it("expirar devuelve la validación ganadora y conserva sus datos", async () => {
    const completed = { ...pending(), estado: "COMPLETADO", validadoPor: { nombre: "Mozo" }, fechaCanje: new Date() };
    db.findUnique.mockResolvedValueOnce(pending()).mockResolvedValueOnce(completed);
    db.updateMany.mockImplementation(async ({ where }) => ({ count: where.estado === "PENDIENTE" ? 0 : 1 }));
    const response = await GET(request, params);
    const data = await response.json();
    expect(data.canje.estado).toBe("COMPLETADO");
    expect(data.canje.validadoPor).toBe("Mozo");
    expect(data.canje.segundosRestantes).toBe(0);
  });

  it("expira un cupón pendiente vencido", async () => {
    db.findUnique.mockResolvedValue(pending());
    db.updateMany.mockResolvedValue({ count: 1 });
    expect((await (await GET(request, params)).json()).canje.estado).toBe("EXPIRADO");
  });

  it("cancela un cupón pendiente propio", async () => {
    db.findUnique.mockResolvedValue(pending());
    db.updateMany.mockResolvedValue({ count: 1 });
    expect((await DELETE(request, params)).status).toBe(200);
  });

  it("rechaza modificar un cupón de otro socio", async () => {
    db.findUnique.mockResolvedValue({ ...pending(), socioId: "another-member" });
    expect((await DELETE(request, params)).status).toBe(404);
    expect((await GET(request, params)).status).toBe(404);
    expect(db.updateMany).not.toHaveBeenCalled();
  });
});

import { readMaxirestPdf } from "@/lib/maxirest-cierre";

export async function parseUploadedCierre(request: Request) {
  const form = await request.formData();
  const archivo = form.get("archivo");
  if (!(archivo instanceof File) || !archivo.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Seleccioná un archivo PDF de cierre de turno.");
  }
  if (archivo.size > 5 * 1024 * 1024) {
    throw new Error("El PDF no puede superar 5 MB.");
  }
  const cierre = await readMaxirestPdf(new Uint8Array(await archivo.arrayBuffer()));
  return { form, cierre };
}

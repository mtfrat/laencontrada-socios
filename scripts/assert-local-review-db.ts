export function assertLocalReviewDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Falta DATABASE_URL para la base local de revisión.");

  const target = new URL(databaseUrl);
  if (!(["127.0.0.1", "localhost"].includes(target.hostname) && target.pathname === "/laencontrada_review")) {
    throw new Error("Este script solo se puede ejecutar en la base local laencontrada_review.");
  }
}

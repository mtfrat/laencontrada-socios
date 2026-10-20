type Row = Record<string, any>;

export interface FakeState {
  socios: Row[];
  usuarios: Row[];
  premios: Row[];
  canjes: Row[];
  transacciones: Row[];
  visitas: Row[];
  platos: Row[];
  tickets: Row[];
  respuestas: Row[];
  respuestaItems: Row[];
  preguntas: Row[];
  config: Row | null;
}

function emptyState(): FakeState {
  return {
    socios: [],
    usuarios: [],
    premios: [],
    canjes: [],
    transacciones: [],
    visitas: [],
    platos: [],
    tickets: [],
    respuestas: [],
    respuestaItems: [],
    preguntas: [],
    config: null,
  };
}

const MODEL_TABLES: Record<string, keyof FakeState> = {
  socio: "socios",
  usuario: "usuarios",
  premio: "premios",
  canjePremio: "canjes",
  transaccionPuntos: "transacciones",
  visitaConsumo: "visitas",
  itemPlatoConsumido: "platos",
  ticketAdjunto: "tickets",
  respuestaEncuesta: "respuestas",
  itemRespuestaEncuesta: "respuestaItems",
  preguntaEncuesta: "preguntas",
};

const UNIQUE_FIELDS: Record<string, string[]> = {
  socio: ["dni", "numeroSocio"],
  canjePremio: ["codigoQR"],
  respuestaEncuesta: ["visitaConsumoId"],
  ticketAdjunto: ["visitaConsumoId"],
};

const RELATIONS: Record<
  string,
  { table: keyof FakeState; fk?: string; reverseFk?: string; many?: boolean }
> = {
  socio: { table: "socios", fk: "socioId" },
  registradoPor: { table: "usuarios", fk: "registradoPorId" },
  premio: { table: "premios", fk: "premioId" },
  respuestaEncuesta: { table: "respuestas", reverseFk: "visitaConsumoId" },
  platos: { table: "platos", reverseFk: "visitaConsumoId", many: true },
  ticketAdjunto: { table: "tickets", reverseFk: "visitaConsumoId" },
};

function eq(a: any, b: any): boolean {
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  return a === b;
}

function toComparable(value: any): any {
  return value instanceof Date ? value.getTime() : value;
}

function matchesCondition(value: any, condition: any): boolean {
  if (
    condition !== null &&
    typeof condition === "object" &&
    !(condition instanceof Date)
  ) {
    return Object.entries(condition).every(([operator, expected]) => {
      const actual = toComparable(value);
      const target = toComparable(expected);
      switch (operator) {
        case "gt":
          return actual > target;
        case "gte":
          return actual >= target;
        case "lt":
          return actual < target;
        case "lte":
          return actual <= target;
        case "not":
          return !eq(value, expected);
        case "in":
          return (expected as any[]).some((item) => eq(value, item));
        default:
          throw new Error(`Operador no soportado en fake prisma: ${operator}`);
      }
    });
  }
  return eq(value, condition);
}

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, condition]) =>
    matchesCondition(row[key], condition)
  );
}

function applyData(row: Row, data: Row): void {
  for (const [key, value] of Object.entries(data)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !Array.isArray(value)
    ) {
      if ("increment" in (value as Row)) {
        row[key] = (row[key] as number) + (value as Row).increment;
        continue;
      }
      if ("decrement" in (value as Row)) {
        row[key] = (row[key] as number) - (value as Row).decrement;
        continue;
      }
    }
    row[key] = value;
  }
}

function jitter(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 6))
  );
}

function project(row: Row, select?: Row): Row {
  if (!select) return { ...row };
  const picked: Row = {};
  for (const key of Object.keys(select)) {
    if (select[key] && key in row) {
      picked[key] = row[key];
    }
  }
  return picked;
}

function attach(
  row: Row,
  args: { include?: Row } | undefined,
  readState: () => FakeState
): Row {
  if (!args?.include) return { ...row };
  const copy: Row = { ...row };
  for (const key of Object.keys(args.include)) {
    const relation = RELATIONS[key];
    if (!relation) {
      throw new Error(`Include no soportado en fake prisma: ${key}`);
    }
    const includeSpec = (args.include as Row)[key];
    const table = readState()[relation.table] as Row[];
    let related: Row | Row[] | null = null;
    if (relation.reverseFk) {
      const reverseFk = relation.reverseFk;
      const found = table.filter(
        (candidate) => candidate[reverseFk] === row.id
      );
      if (relation.many) {
        related = found.map((entry) => ({ ...entry }));
      } else {
        related = found[0] ? { ...found[0] } : null;
      }
    } else {
      const foreignKey = row[relation.fk as string];
      const target = table.find((candidate) => candidate.id === foreignKey);
      related = target ? { ...target } : null;
    }
    if (
      related !== null &&
      !Array.isArray(related) &&
      includeSpec &&
      typeof includeSpec === "object" &&
      (includeSpec as Row).select
    ) {
      const picked: Row = {};
      for (const field of Object.keys((includeSpec as Row).select)) {
        if (field in related) {
          picked[field] = related[field];
        }
      }
      related = picked;
    }
    copy[key] = related;
  }
  return copy;
}

let state: FakeState = emptyState();
let txQueue: Promise<void> = Promise.resolve();

function readCurrent(): FakeState {
  return state;
}

function makeModel(model: string, readState: () => FakeState) {
  const rows = (): Row[] => readState()[MODEL_TABLES[model]] as Row[];

  return {
    async findUnique(args: Row) {
      await jitter();
      const row = rows().find((candidate) => matches(candidate, args.where));
      return row ? attach(row, args, readState) : null;
    },
    async findFirst(args: Row = {}) {
      await jitter();
      const row = rows().find((candidate) =>
        matches(candidate, args.where ?? {})
      );
      return row ? attach(row, args, readState) : null;
    },
    async updateMany(args: Row) {
      await jitter();
      let count = 0;
      for (const row of rows()) {
        if (matches(row, args.where)) {
          applyData(row, args.data);
          count += 1;
        }
      }
      return { count };
    },
    async update(args: Row) {
      await jitter();
      const row = rows().find((candidate) => matches(candidate, args.where));
      if (!row) {
        throw Object.assign(new Error("Registro no encontrado"), {
          code: "P2025",
        });
      }
      applyData(row, args.data);
      return { ...row };
    },
    async create(args: Row) {
      await jitter();
      for (const field of UNIQUE_FIELDS[model] ?? []) {
        const value = args.data?.[field];
        if (value !== undefined) {
          const duplicated = rows().some((candidate) =>
            eq(candidate[field], value)
          );
          if (duplicated) {
            throw Object.assign(new Error("Unique constraint failed"), {
              code: "P2002",
            });
          }
        }
      }
      const row: Row = {
        id: globalThis.crypto.randomUUID(),
        createdAt: new Date(),
        ...args.data,
      };
      rows().push(row);
      return project(row, args.select);
    },
    async createMany(args: Row) {
      await jitter();
      const data = args.data as Row[];
      for (const entry of data) {
        rows().push({
          id: globalThis.crypto.randomUUID(),
          createdAt: new Date(),
          ...entry,
        });
      }
      return { count: data.length };
    },
    async count(args: Row = {}) {
      await jitter();
      return rows().filter((candidate) => matches(candidate, args.where ?? {}))
        .length;
    },
    async deleteMany(args: Row) {
      await jitter();
      const remaining: Row[] = [];
      let count = 0;
      for (const row of rows()) {
        if (matches(row, args.where)) {
          count += 1;
        } else {
          remaining.push(row);
        }
      }
      rows().splice(0, rows().length, ...remaining);
      return { count };
    },
    async upsert(args: Row) {
      await jitter();
      const row = rows().find((candidate) => matches(candidate, args.where));
      if (row) {
        applyData(row, args.update);
        return { ...row };
      }
      const created: Row = {
        id: globalThis.crypto.randomUUID(),
        createdAt: new Date(),
        ...args.create,
      };
      rows().push(created);
      return { ...created };
    },
    async findMany(args: Row = {}) {
      await jitter();
      const found = rows().filter((candidate) =>
        matches(candidate, args.where ?? {})
      );
      return found.map((row) => attach(row, args, readState));
    },
  };
}

function makeApi(readState: () => FakeState) {
  return {
    socio: makeModel("socio", readState),
    usuario: makeModel("usuario", readState),
    premio: makeModel("premio", readState),
    canjePremio: makeModel("canjePremio", readState),
    transaccionPuntos: makeModel("transaccionPuntos", readState),
    visitaConsumo: makeModel("visitaConsumo", readState),
    itemPlatoConsumido: makeModel("itemPlatoConsumido", readState),
    ticketAdjunto: makeModel("ticketAdjunto", readState),
    respuestaEncuesta: makeModel("respuestaEncuesta", readState),
    itemRespuestaEncuesta: makeModel("itemRespuestaEncuesta", readState),
    preguntaEncuesta: makeModel("preguntaEncuesta", readState),
    configuracionPuntos: {
      async findFirst() {
        await jitter();
        const current = readState();
        return current.config ? { ...current.config } : null;
      },
    },
  };
}

export const fakePrisma = {
  ...makeApi(readCurrent),

  async $transaction(fn: (tx: ReturnType<typeof makeApi>) => Promise<any>) {
    const previous = txQueue;
    let release!: () => void;
    txQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;

    const staging = structuredClone(state);
    try {
      const result = await fn(makeApi(() => staging));
      state = staging;
      return result;
    } finally {
      release();
    }
  },

  __reset(seed?: Partial<FakeState>) {
    state = { ...emptyState(), ...seed };
  },

  __getState(): FakeState {
    return structuredClone(state);
  },
};

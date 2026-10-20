import { NextResponse } from "next/server";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;

  constructor(
    status: number,
    code: string,
    message: string,
    extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function errorResponse(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: error.code,
      error: error.message,
      ...error.extra,
    },
    { status: error.status }
  );
}

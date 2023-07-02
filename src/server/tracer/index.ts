import { type Tracer, trace } from "@opentelemetry/api";

// This is a helper function that instantiates OpenTelemetry Tracer
const instantiateTracer = () => trace.getTracer("server");

const globalForTracer = globalThis as unknown as {
  tracer: Tracer | undefined;
};

export const tracer = globalForTracer.tracer ?? instantiateTracer();

if (process.env.NODE_ENV !== "production") globalForTracer.tracer = tracer;

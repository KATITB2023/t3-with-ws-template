import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { PrismaInstrumentation } from "@prisma/instrumentation";
import { Resource } from "@opentelemetry/resources";
import { context } from "@opentelemetry/api";
import { env } from "~/env.cjs";

export const otelSetup = () => {
  const contextManager = new AsyncHooksContextManager().enable();
  context.setGlobalContextManager(contextManager);

  // Configure the console exporter
  const consoleExporter = new ConsoleSpanExporter();

  // Configure the trace provider
  const provider = new BasicTracerProvider({
    // Sampling with set percentage of traces in production
    sampler: new TraceIdRatioBasedSampler(
      env.NODE_ENV === "production" ? env.SAMPLER_RATIO : 1
    ),
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "test-tracing-service",
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    }),
  });

  // Configure how spans are processed and exported
  if (env.NODE_ENV === "production") {
    provider.addSpanProcessor(new BatchSpanProcessor(consoleExporter));
  } else {
    provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));
  }

  // Register your auto-instrumentors
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new PrismaInstrumentation({ middleware: true })],
  });

  // Register the provider
  provider.register();
};

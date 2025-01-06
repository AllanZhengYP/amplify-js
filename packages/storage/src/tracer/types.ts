export interface SpanContext {
	traceId: string;
	spanId: string;
}

export interface Attributes {
	[attributeKey: string]: any;
}

export interface Link {
  context: SpanContext;
  attributes?: Attributes;
}

/**
 * An enumeration of status codes.
 *
 */
export enum SpanStatusCode {
  /**
   * The default status.
   */
  UNSET = 0,
  /**
   * The operation has been validated by an Application developer or
   * Operator to have completed successfully.
   */
  OK = 1,
  /**
   * The operation contains an error.
   */
  ERROR = 2,
}

export interface SpanStatus {
  /** The status code of this message. */
  code: SpanStatusCode;
  /** A developer-facing error message. */
  message?: string;
}

/**
 * Defines High-Resolution Time.
 *
 * The first number, HrTime[0], is UNIX Epoch time in seconds since 00:00:00 UTC on 1 January 1970.
 * The second number, HrTime[1], represents the partial second elapsed since Unix Epoch time represented by first number in nanoseconds.
 * For example, 2021-01-01T12:30:10.150Z in UNIX Epoch time in milliseconds is represented as 1609504210150.
 * The first number is calculated by converting and truncating the Epoch time in milliseconds to seconds:
 * HrTime[0] = Math.trunc(1609504210150 / 1000) = 1609504210.
 * The second number is calculated by converting the digits after the decimal point of the subtraction, (1609504210150 / 1000) - HrTime[0], to nanoseconds:
 * HrTime[1] = Number((1609504210.150 - HrTime[0]).toFixed(9)) * 1e9 = 150000000.
 * This is represented in HrTime format as [1609504210, 150000000].
 *
 */
export type HrTime = [number, number];

export type TimeInput = HrTime | number | Date;

export enum SpanKind {
  /** Default value. Indicates that the span is used internally. */
  INTERNAL = 0,

  /**
   * Indicates that the span covers server-side handling of an RPC or other
   * remote request.
   */
  SERVER = 1,

  /**
   * Indicates that the span covers the client-side wrapper around an RPC or
   * other remote request.
   */
  CLIENT = 2,

  /**
   * Indicates that the span describes producer sending a message to a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  PRODUCER = 3,

  /**
   * Indicates that the span describes consumer receiving a message from a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  CONSUMER = 4,
}

export interface SpanOptions {
  /**
   * The SpanKind of a span
   * @default {@link SpanKind.INTERNAL}
   */
  kind?: SpanKind;

  /** A span's attributes */
  attributes?: Attributes;

  /** {@link Link}s span to other spans */
  links?: Link[];

  /** A manually specified start time for the created `Span` object. */
  startTime?: TimeInput;
}


export interface Span {
	spanContext(): SpanContext;
	setAttributes(attributes: Attributes): void;
	addEvent(name: string, attributes?: Attributes): void;
	addLink(link: Link): void;
	setStatus(status: SpanStatus): void;
	end(): void;
	recordException(exception: Error): void;
	isRecording(): boolean;
}

export interface Tracer {
	startSpan(name: string, options?: SpanOptions): Span;
}
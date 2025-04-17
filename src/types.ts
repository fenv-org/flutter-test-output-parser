/**
 * Represents the parsed output of a Flutter test command.
 */
export type FlutterTestOutput = {
  trees: Map<number, SuiteTree | GroupTree | TestTree>;
  allEvents: Event[];
  totalDurationInSeconds: number;
};

/**
 * Represents a suite in the Flutter test output.
 */
export type SuiteTree = SuiteEvent & {
  children: (GroupTree | TestTree)[];
};

/**
 * Represents a group in the Flutter test output.
 */
export type GroupTree = GroupEvent & {
  parent?: GroupTree | SuiteTree;
  children: (GroupTree | TestTree)[];
};

/**
 * Represents a test in the Flutter test output.
 */
export type TestTree = TestStartEvent & {
  suite: SuiteTree;
  parent: GroupTree[];
  done?: TestDoneEvent;
  print?: MessageEvent[];
  error?: ErrorEvent[];
};

/**
 * Represents an element in the Flutter test output.
 */
export type Event =
  | StartEvent
  | SuiteEvent
  | TestEvent
  | GroupEvent
  | TestStartEvent
  | MessageEvent
  | TestDoneEvent
  | AllSuitesEvent
  | ErrorEvent
  | DoneEvent;

type EventCommon = {
  type: string;
  time?: number;
};

/**
 * Represents the metadata of an event.
 *
 * @deprecated
 */
type Metadata = {
  skip: boolean;
  skipReason: string | null;
};

/**
 * Represents the start of a Flutter test run.
 */
export type StartEvent = EventCommon & {
  type: "start";
  protocolVersion: string;
  runnerVersion: string;
  pid: number;
};

/**
 * Represents a suite element in the Flutter test output.
 */
export type SuiteEvent = EventCommon & {
  type: "suite";
  suite: {
    id: number;
    platform: string;
    path: string;
  };
};

/**
 * Represents the start of a test in the Flutter test output.
 */
export type TestStartEvent = EventCommon & Metadata & {
  type: "testStart";
  test: {
    id: number;
    name: string;
    suiteID: number;
    groupIDs: number[];
    line: number | null;
    column: number | null;
    url: string | null;
    root_line?: number;
    root_column?: number;
    root_url?: string;
  };
};

/**
 * Represents the count of all suites in the Flutter test output.
 */
export type AllSuitesEvent = EventCommon & {
  type: "allSuites";
  count: number;
};

/**
 * Represents the completion of a test in the Flutter test output.
 */
export type TestDoneEvent = EventCommon & {
  type: "testDone";
  testID: number;
  result: "success" | "error" | "failure";
  skipped: boolean;
  hidden: boolean;
};

/**
 * Represents a group element in the Flutter test output.
 */
export type GroupEvent = EventCommon & Metadata & {
  type: "group";
  group: {
    id: number;
    suiteID: number;
    parentID: number | null;
    name: string;
    testCount: number;
    line: number | null;
    column: number | null;
    url: string | null;
  };
};

/**
 * Represents a print message in the Flutter test output.
 */
export type MessageEvent = EventCommon & {
  type: "print";
  testID: number;
  messageType: "print";
  message: string;
};

/**
 * Represents a test element in the Flutter test output.
 */
export type TestEvent = EventCommon & {
  type: "test";
  error?: string;
  stackTrace?: string;
  isFailure?: boolean;
};

/**
 * Represents an error in the Flutter test output.
 */
export type ErrorEvent = EventCommon & {
  type: "error";
  testID: number;
  error: string;
  stackTrace: string;
  isFailure: boolean;
};

/**
 * Represents the completion of a Flutter test run.
 */
export type DoneEvent = EventCommon & {
  type: "done";
  success: boolean;
};

export type FutureEvent = EventCommon & {
  type: string;
  [key: string]: unknown;
};

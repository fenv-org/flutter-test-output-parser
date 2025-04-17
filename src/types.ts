/**
 * Represents the parsed output of a Flutter test command.
 */
export type FlutterTestOutput = {
  trees: Map<number, SuiteTree | GroupTree | TestTree>;
  totalDurationInSeconds: number;
};

/**
 * Represents a suite in the Flutter test output.
 */
export type SuiteTree = ElementSuite & {
  children: (GroupTree | TestTree)[];
};

/**
 * Represents a group in the Flutter test output.
 */
export type GroupTree = ElementGroup & {
  parent?: GroupTree | SuiteTree;
  children: (GroupTree | TestTree)[];
};

/**
 * Represents a test in the Flutter test output.
 */
export type TestTree = ElementTestStart & {
  suite: SuiteTree;
  parent: GroupTree[];
  done?: ElementTestDone;
  print?: ElementPrint[];
  error?: ElementError[];
};

/**
 * Represents an element in the Flutter test output.
 */
export type Element =
  | ElementStart
  | ElementSuite
  | ElementTest
  | ElementGroup
  | ElementTestStart
  | ElementPrint
  | ElementTestDone
  | ElementAllSuites
  | ElementError
  | ElementDone;

/**
 * Represents the start of a Flutter test run.
 */
export type ElementStart = {
  type: "start";
  protocolVersion: string;
  runnerVersion: string;
  pid: number;
  time: number;
};

/**
 * Represents a suite element in the Flutter test output.
 */
export type ElementSuite = {
  type: "suite";
  suite: {
    id: number;
    platform: string;
    path: string;
  };
  time: number;
};

/**
 * Represents the start of a test in the Flutter test output.
 */
export type ElementTestStart = {
  type: "testStart";
  test: {
    id: number;
    name: string;
    suiteID: number;
    groupIDs: number[];
    metadata: {
      skip: boolean;
      skipReason: null | string;
    };
    line: number | null;
    column: number | null;
    url: string | null;
    root_line?: number;
    root_column?: number;
    root_url?: string;
  };
  time: number;
};

/**
 * Represents the count of all suites in the Flutter test output.
 */
export type ElementAllSuites = {
  type: "allSuites";
  count: number;
  time: number;
};

/**
 * Represents the completion of a test in the Flutter test output.
 */
export type ElementTestDone = {
  type: "testDone";
  testID: number;
  result: "success" | "error" | "failure";
  skipped: boolean;
  hidden: boolean;
  time: number;
};

/**
 * Represents a group element in the Flutter test output.
 */
export type ElementGroup = {
  type: "group";
  group: {
    id: number;
    suiteID: number;
    parentID: number | null;
    name: string;
    metadata: {
      skip: boolean;
      skipReason: null | string;
    };
    testCount: number;
    line: number | null;
    column: number | null;
    url: string | null;
  };
  time: number;
};

/**
 * Represents a print message in the Flutter test output.
 */
export type ElementPrint = {
  type: "print";
  testID: number;
  messageType: "print";
  message: string;
  time: number;
};

/**
 * Represents a test element in the Flutter test output.
 */
export type ElementTest = {
  type: "test";
  error?: string;
  stackTrace?: string;
  isFailure?: boolean;
};

/**
 * Represents an error in the Flutter test output.
 */
export type ElementError = {
  type: "error";
  testID: number;
  error: string;
  stackTrace: string;
  isFailure: boolean;
  time: number;
};

/**
 * Represents the completion of a Flutter test run.
 */
export type ElementDone = {
  type: "done";
  success: boolean;
  time: number;
};

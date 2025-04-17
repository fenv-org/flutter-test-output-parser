export type FlutterTestOutput = {
  trees: Map<number, SuiteTree | GroupTree | TestTree>;
  totalDurationInSeconds: number;
};

export type SuiteTree = ElementSuite & {
  children: (GroupTree | TestTree)[];
};

export type GroupTree = ElementGroup & {
  parent?: GroupTree | SuiteTree;
  children: (GroupTree | TestTree)[];
};

export type TestTree = ElementTestStart & {
  suite: SuiteTree;
  parent: GroupTree[];
  done?: ElementTestDone;
  print?: ElementPrint[];
  error?: ElementError[];
};

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

export type ElementStart = {
  type: "start";
  protocolVersion: string;
  runnerVersion: string;
  pid: number;
  time: number;
};

export type ElementSuite = {
  type: "suite";
  suite: {
    id: number;
    platform: string;
    path: string;
  };
  time: number;
};

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

export type ElementAllSuites = {
  type: "allSuites";
  count: number;
  time: number;
};

export type ElementTestDone = {
  type: "testDone";
  testID: number;
  result: "success" | "error" | "failure";
  skipped: boolean;
  hidden: boolean;
  time: number;
};

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

export type ElementPrint = {
  type: "print";
  testID: number;
  messageType: "print";
  message: string;
  time: number;
};

export type ElementTest = {
  type: "test";
  error?: string;
  stackTrace?: string;
  isFailure?: boolean;
};

export type ElementError = {
  type: "error";
  testID: number;
  error: string;
  stackTrace: string;
  isFailure: boolean;
  time: number;
};

export type ElementDone = {
  type: "done";
  success: boolean;
  time: number;
};

import type {
  Element,
  FlutterTestOutput,
  GroupTree,
  SuiteTree,
  TestTree,
} from "./types.ts";
import { TextLineStream } from "@std/streams";

/**
 * Parses the output of the Flutter test command.
 *
 * The output must be the output of the `json` reporter of `flutter test`.
 * We can get this output by running the following command:
 *
 * ```bash
 * flutter test --reporter json
 * ```
 *
 * or
 *
 * ```bash
 * flutter test --file-reporter json:<filepath>
 * ```
 *
 * For more information, see `flutter test --help`.
 *
 * @param output The output of the Flutter test command. It can be a full text,
 * a list of lines, or a generator of lines.
 * @returns The parsed output of the Flutter test command.
 */
export function parseSync(
  output: string | string[] | Generator<string>,
): FlutterTestOutput {
  const trees = new Map<number, SuiteTree | GroupTree | TestTree>();
  let totalDurationInSeconds = -1;

  if (typeof output === "string") {
    output = output.split("\n");
  }

  for (const line of output) {
    const element = JSON.parse(line) as Element;
    addElementToTrees(trees, element);
    if (element.type === "done") {
      totalDurationInSeconds = element.time / 1000;
    }
  }

  return { trees, totalDurationInSeconds };
}

/**
 * Parses the output of the Flutter test command asynchronously.
 *
 * The output must be the output of the `json` reporter of `flutter test`.
 * We can get this output by running the following command:
 *
 * ```bash
 * flutter test --reporter json
 * ```
 *
 * or
 *
 * ```bash
 * flutter test --file-reporter json:<filepath>
 * ```
 *
 * For more information, see `flutter test --help`.
 *
 * @param filePathOrStream The output of the Flutter test command. It can be a
 * file path or a stream of octets encoded in UTF-8.
 * @returns The parsed output of the Flutter test command.
 */
export async function parseAsync(
  filePathOrStream: string | ReadableStream<Uint8Array<ArrayBuffer>>,
): Promise<FlutterTestOutput> {
  const trees = new Map<number, SuiteTree | GroupTree | TestTree>();
  let totalDurationInSeconds = -1;

  const stream = typeof filePathOrStream === "string"
    ? (await Deno.open(filePathOrStream)).readable
    : filePathOrStream;
  for await (
    const line of stream
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
  ) {
    const element = JSON.parse(line) as Element;
    addElementToTrees(trees, element);
    if (element.type === "done") {
      totalDurationInSeconds = element.time / 1000;
    }
  }

  return { trees, totalDurationInSeconds };
}

function addElementToTrees(
  trees: Map<number, SuiteTree | GroupTree | TestTree>,
  element: Element,
) {
  switch (element.type) {
    case "start":
      break;

    case "suite": {
      const suiteTree: SuiteTree = {
        ...element,
        children: [],
      };
      trees.set(element.suite.id, suiteTree);
      break;
    }

    case "group": {
      const groupTree: GroupTree = {
        ...element,
        children: [],
      };
      trees.set(element.group.id, groupTree);
      if (element.group.parentID) {
        const parent = trees.get(element.group.parentID);
        if (parent?.type === "suite" || parent?.type === "group") {
          groupTree.parent = parent;
          parent.children.push(groupTree);
        }
      } else {
        const parent = trees.get(element.group.suiteID);
        if (parent?.type === "suite") {
          groupTree.parent = parent;
          parent.children.push(groupTree);
        }
      }
      break;
    }

    case "testStart": {
      const testTree: TestTree = {
        ...element,
        suite: trees.get(element.test.suiteID) as SuiteTree,
        parent: [],
      };
      trees.set(element.test.id, testTree);
      for (const groupID of element.test.groupIDs) {
        const group = trees.get(groupID);
        if (group?.type === "group") {
          testTree.parent.push(group);
        }
      }
      break;
    }

    case "testDone": {
      const testCandidate = trees.get(element.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.done = element;
      }
      break;
    }

    case "print": {
      const testCandidate = trees.get(element.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.print = testCandidate.print || [];
        testCandidate.print.push(element);
      }
      break;
    }

    case "error": {
      const testCandidate = trees.get(element.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.error = testCandidate.error
          ? [...testCandidate.error, element]
          : [element];
      }
      break;
    }

    case "allSuites":
      break;
  }
}

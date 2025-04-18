import type {
  Event,
  FlutterTestOutput,
  GroupNode,
  SuiteNode,
  TestNode,
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
  const trees = new Map<number, SuiteNode | GroupNode | TestNode>();
  const allEvents: Event[] = [];
  let totalDurationInSeconds = -1;

  if (typeof output === "string") {
    output = output.split("\n");
  }

  for (const line of output) {
    const event = JSON.parse(line) as Event;
    addEventToTrees(trees, event);
    if (event.type === "done") {
      totalDurationInSeconds = (event.time ?? 0) / 1000;
    }
    allEvents.push(event);
  }

  return { trees, totalDurationInSeconds, allEvents };
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
  const trees = new Map<number, SuiteNode | GroupNode | TestNode>();
  const allEvents: Event[] = [];
  let totalDurationInSeconds = -1;

  const stream = typeof filePathOrStream === "string"
    ? (await Deno.open(filePathOrStream)).readable
    : filePathOrStream;
  for await (
    const line of stream
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream())
  ) {
    const event = JSON.parse(line) as Event;
    addEventToTrees(trees, event);
    if (event.type === "done") {
      totalDurationInSeconds = (event.time ?? 0) / 1000;
    }
    allEvents.push(event);
  }

  return { trees, totalDurationInSeconds, allEvents };
}

function addEventToTrees(
  trees: Map<number, SuiteNode | GroupNode | TestNode>,
  event: Event,
) {
  switch (event.type) {
    case "start":
      break;

    case "suite": {
      const suiteTree: SuiteNode = {
        ...event,
        children: [],
      };
      trees.set(event.suite.id, suiteTree);
      break;
    }

    case "group": {
      const groupTree: GroupNode = {
        ...event,
        suite: trees.get(event.group.suiteID) as SuiteNode,
        children: [],
      };
      trees.set(event.group.id, groupTree);
      if (event.group.parentID) {
        const parent = trees.get(event.group.parentID);
        if (parent?.type === "suite" || parent?.type === "group") {
          groupTree.parent = parent;
          parent.children.push(groupTree);
        }
      } else {
        const parent = trees.get(event.group.suiteID);
        if (parent?.type === "suite") {
          groupTree.parent = parent;
          parent.children.push(groupTree);
        }
      }
      break;
    }

    case "testStart": {
      const node: TestNode = {
        ...event,
        suite: trees.get(event.test.suiteID) as SuiteNode,
        parent: [],
      };
      trees.set(event.test.id, node);
      for (const groupID of event.test.groupIDs) {
        const group = trees.get(groupID);
        if (group?.type === "group") {
          node.parent.push(group);
        }
      }
      break;
    }

    case "testDone": {
      const testCandidate = trees.get(event.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.done = event;
      }
      break;
    }

    case "print": {
      const testCandidate = trees.get(event.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.print = testCandidate.print || [];
        testCandidate.print.push(event);
      }
      break;
    }

    case "error": {
      const testCandidate = trees.get(event.testID);
      if (testCandidate?.type === "testStart") {
        testCandidate.error = testCandidate.error
          ? [...testCandidate.error, event]
          : [event];
      }
      break;
    }

    case "allSuites":
      break;
  }
}

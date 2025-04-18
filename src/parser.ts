import type {
  DoneEvent,
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
  const trees: { [id: number]: SuiteNode | GroupNode | TestNode } = {};
  const allEvents: Event[] = [];

  if (typeof output === "string") {
    output = output.split("\n");
  }

  let doneEvent: DoneEvent | null = null;
  for (const line of output) {
    const event = JSON.parse(line) as Event;
    addEventToTrees(trees, event);
    if (event.type === "done") {
      doneEvent = event;
    }
    allEvents.push(event);
  }

  return { table: trees, allEvents, doneEvent: doneEvent! };
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
  const trees: { [id: number]: SuiteNode | GroupNode | TestNode } = {};
  const allEvents: Event[] = [];
  let doneEvent: DoneEvent | null = null;

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
      doneEvent = event;
    }
    allEvents.push(event);
  }

  return { table: trees, allEvents, doneEvent: doneEvent! };
}

function addEventToTrees(
  trees: { [id: number]: SuiteNode | GroupNode | TestNode },
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
      trees[event.suite.id] = suiteTree;
      break;
    }

    case "group": {
      const groupTree: GroupNode = {
        ...event,
        children: [],
      };
      trees[event.group.id] = groupTree;
      break;
    }

    case "testStart": {
      const node: TestNode = {
        ...event,
      };
      trees[event.test.id] = node;
      break;
    }

    case "testDone": {
      const testCandidate = trees[event.testID];
      if (testCandidate?.type === "testStart") {
        testCandidate.done = event;
      }
      break;
    }

    case "print": {
      const testCandidate = trees[event.testID];
      if (testCandidate?.type === "testStart") {
        testCandidate.print = testCandidate.print || [];
        testCandidate.print.push(event);
      }
      break;
    }

    case "error": {
      const testCandidate = trees[event.testID];
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

# Flutter Test Output Parser

A Deno library for parsing Flutter test JSON output into a structured format.

## Overview

The Flutter Test Output Parser is designed to convert the JSON output from
Flutter tests into a structured object format, making it easier to analyze and
process test results programmatically.

## Installation

```bash
# Import from JSR
import { parseSync, parseAsync } from "jsr:@fenv-org/flutter-test-output-parser";
```

## Usage

### Generating Flutter Test JSON Output

First, you need to run your Flutter tests with the JSON reporter:

```bash
# Output to stdout
flutter test --reporter json

# Or output to a file
flutter test --file-reporter json:test_output.json
```

### Parsing Test Output

#### Synchronous Parsing

```typescript
import { parseSync } from "@fenv-org/flutter-test-output-parser";

// Parse from a string
const testOutput = `...JSON output from Flutter tests...`;
const result = parseSync(testOutput);

// Parse from an array of lines
const lines = testOutput.split("\n");
const result = parseSync(lines);

// Parse from a generator
function* generateLines() {
  for (const line of lines) {
    yield line;
  }
}
const result = parseSync(generateLines());
```

#### Asynchronous Parsing

```typescript
import { parseAsync } from "@fenv-org/flutter-test-output-parser";

// Parse from a file path
const result = await parseAsync("path/to/test_output.json");

// Parse from a stream
const fileStream = (await Deno.open("path/to/test_output.json")).readable;
const result = await parseAsync(fileStream);
```

### Working with Parsed Output

The parser returns a `FlutterTestOutput` object with the following structure:

```typescript
type FlutterTestOutput = {
  trees: Map<number, SuiteTree | GroupTree | TestTree>;
  totalDurationInSeconds: number;
};
```

Example:

```typescript
import { parseSync } from "@fenv-org/flutter-test-output-parser";

const result = parseSync(testOutput);

// Get total test duration
console.log(`Tests took ${result.totalDurationInSeconds} seconds`);

// Iterate through test trees
for (const [id, tree] of result.trees.entries()) {
  if (tree.type === "suite") {
    console.log(`Suite: ${tree.suite.path}`);
  } else if (tree.type === "testStart" && tree.done) {
    console.log(`Test: ${tree.test.name}, Result: ${tree.done.result}`);
  }
}
```

## API Reference

### Functions

- `parseSync(output)`: Parses Flutter test output synchronously
- `parseAsync(filePathOrStream)`: Parses Flutter test output asynchronously

### Types

The library exports various TypeScript types for working with the parsed output
structure. Refer to the source code for detailed type definitions.

## License

This package is licensed under the MIT License.

import { jsonParser } from "./jsonParser.js";

interface TestData {
  hello: string;
  count: number;
}

describe("jsonParser", () => {
  it("parses a valid JSON block", () => {
    const input = `
Some text before

\`\`\`json
{
  "hello": "world",
  "count": 42
}
\`\`\`

Some text after
`;
    const result = jsonParser<TestData>(input);
    expect(result).toEqual({
      hello: "world",
      count: 42,
    });
  });

  it("parses a JSON block without language specifier", () => {
    const input = `
\`\`\`
{
  "hello": "world",
  "count": 42
}
\`\`\`
`;
    const result = jsonParser<TestData>(input);
    expect(result).toEqual({
      hello: "world",
      count: 42,
    });
  });

  it("returns undefined for invalid JSON", () => {
    const input = `
\`\`\`json
{
  "hello": "world",
  invalid json here
}
\`\`\`
`;
    const result = jsonParser<TestData>(input);
    expect(result).toBeUndefined();
  });

  it("returns undefined when no JSON block is found", () => {
    const input = "Just some regular text without any code blocks";
    const result = jsonParser<TestData>(input);
    expect(result).toBeUndefined();
  });

  it("returns undefined for empty JSON block", () => {
    const input = `
\`\`\`json

\`\`\`
`;
    const result = jsonParser<TestData>(input);
    expect(result).toBeUndefined();
  });

  it("handles arrays", () => {
    const input = `
\`\`\`json
[1, 2, 3, 4]
\`\`\`
`;
    const result = jsonParser<number[]>(input);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it("handles nested objects", () => {
    const input = `
\`\`\`json
{
  "user": {
    "name": "John",
    "age": 30,
    "hobbies": ["reading", "gaming"]
  }
}
\`\`\`
`;
    interface User {
      user: {
        name: string;
        age: number;
        hobbies: string[];
      };
    }
    const result = jsonParser<User>(input);
    expect(result).toEqual({
      user: {
        name: "John",
        age: 30,
        hobbies: ["reading", "gaming"],
      },
    });
  });
});

/**
 * Base class for all CodeSpin specific errors
 */
export class CodeSpinError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends CodeSpinError {}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(provider: string) {
    super(`Invalid credentials or key for ${provider}`);
  }
}

export class ClientInitializationError extends AuthenticationError {
  constructor(provider: string) {
    super(`Failed to initialize ${provider} client`);
  }
}

// /**
//  * Configuration errors
//  */
export class ConfigurationError extends CodeSpinError {}

export class MissingOpenAIEnvVarError extends ConfigurationError {
  constructor() {
    super("OPENAI_API_KEY environment variable is not set");
  }
}

export class MissingAnthropicEnvVarError extends ConfigurationError {
  constructor() {
    super("ANTHROPIC_API_KEY environment variable is not set");
  }
}

// /**
//  * Parsing errors
//  */
export class ParseError extends CodeSpinError {}

export class MissingCodeBlockError extends ParseError {
  constructor() {
    super("No valid markdown code block found");
  }
}

// /**
//  * Provider errors
//  */
export class ProviderError extends CodeSpinError {}

export class InvalidProviderError extends ProviderError {
  constructor() {
    super("Only OpenAI and Anthropic are supported as of now");
  }
}

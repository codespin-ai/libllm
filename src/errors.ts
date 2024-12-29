/**
 * Base class for all LIBLLM specific errors
 */
export class LIBLLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends LIBLLMError {}

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
export class ConfigurationError extends LIBLLMError {}

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
export class ParseError extends LIBLLMError {}

export class MissingCodeBlockError extends ParseError {
  constructor() {
    super("No valid markdown code block found");
  }
}

// /**
//  * Provider errors
//  */
export class ProviderError extends LIBLLMError {}

export class InvalidProviderError extends ProviderError {
  constructor(name: string) {
    super(`Invalid provider: ${name}`);
  }
}

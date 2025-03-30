# Contributing to JFrog MCP Server

Thank you for your interest in contributing to the JFrog MCP Server! This document provides guidelines and instructions to help you contribute effectively.

## Development Environment

### Prerequisites

- **Node.js**: v16.x or later (v18.x recommended)
- **npm**: v8.x or later
- **Docker**: Latest stable version (for containerized testing)
- **JFrog Platform**: Access to a JFrog Platform instance for testing

### Environment Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   export JFROG_URL="https://your-instance.jfrog.io"
   export JFROG_ACCESS_TOKEN="your-access-token"
   ```

## Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards

3. Test your changes:
   ```bash
   npm test
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

5. Submit a pull request

## Coding Standards

- Follow the existing code style
- Write clean, maintainable, and testable code
- Include comments for complex logic
- Use meaningful variable and function names
- Avoid code duplication

## Testing Guidelines

- Write unit tests for new functionality
- Ensure all tests pass before submitting a PR
- Include integration tests for API changes

## Pull Request Process

1. Ensure your code adheres to our coding standards
2. Update documentation to reflect any changes
3. Include relevant test cases
4. Fill out the PR template with all required information
5. Sign the Contributor License Agreement (CLA)
6. Submit your PR for review

## Contributor License Agreement

Before your contribution can be accepted, you must sign our Contributor License Agreement (CLA). The CLA ensures that the project has the necessary rights to use and distribute your contributions.

You will be prompted to sign the CLA when you submit your first pull request.

## Release Process

Releases are managed by the core team. We follow semantic versioning (SEMVER) for our releases.

## Documentation

If your changes require documentation updates, please include those changes in your PR. Documentation should be clear, concise, and include examples where appropriate.

## Getting Help

If you have questions or need help, please:
- Open an issue on GitHub
- Reach out to the maintainers
- Refer to existing documentation and examples

## Code of Conduct

Please follow our code of conduct in all your interactions with the project. Be respectful, inclusive, and considerate of others.

Thank you for contributing to the JFrog MCP Server! 
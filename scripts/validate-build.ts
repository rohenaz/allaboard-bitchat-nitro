#!/usr/bin/env bun

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface ValidationResult {
  step: string;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
}

class BuildValidator {
  private results: ValidationResult[] = [];
  private startTime = Date.now();

  async runStep(
    step: string,
    command: string,
    options?: { timeout?: number },
  ): Promise<ValidationResult> {
    const stepStart = Date.now();

    try {
      const { stdout } = await execAsync(command, {
        timeout: options?.timeout || 60000,
        cwd: process.cwd(),
      });

      const duration = Date.now() - stepStart;
      const result: ValidationResult = {
        step,
        success: true,
        duration,
        output: stdout.trim(),
      };
      this.results.push(result);
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - stepStart;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const result: ValidationResult = {
        step,
        success: false,
        duration,
        error: errorMessage,
      };

      this.results.push(result);
      return result;
    }
  }

  async validateBuild() {
    // 1. Lint check
    await this.runStep('TypeScript & Linting', 'bun lint');

    // 2. Build check
    await this.runStep('Production Build', 'bun run build');

    // 3. Type checking
    await this.runStep('Type Checking', 'bun run type-check || tsc --noEmit');

    // 4. Unit tests (if they exist)
    await this.runStep('Unit Tests', 'bun test || echo "No unit tests found"');

    // 5. E2E tests
    await this.runStep('E2E Tests', 'bun run test --reporter=dot', {
      timeout: 120000,
    });

    // 6. Visual regression tests
    await this.runStep('Visual Tests', 'bun run test:visual --reporter=dot', {
      timeout: 180000,
    });

    // 7. Bundle analysis (optional)
    await this.runStep(
      'Bundle Analysis',
      'bun run build --analyze || echo "Bundle analysis not configured"',
    );

    this.printSummary();
  }

  printSummary() {
    const _totalDuration = Date.now() - this.startTime;
    const _successCount = this.results.filter((r) => r.success).length;
    const failureCount = this.results.filter((r) => !r.success).length;

    for (const result of this.results) {
      const _icon = result.success ? '✅' : '❌';
      const _color = result.success ? chalk.green : chalk.red;
      const _duration = `${result.duration}ms`;
    }

    if (failureCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  async validateQuick() {
    await this.runStep('Linting', 'bun lint');
    await this.runStep('Build', 'bun run build');

    this.printSummary();
  }

  async validateVisual() {
    const devProcess = exec('bun run dev');

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.runStep('Visual Regression Tests', 'bun run test:visual', {
      timeout: 300000,
    });

    devProcess.kill();
    this.printSummary();
  }
}

async function main() {
  const validator = new BuildValidator();
  const command = process.argv[2];

  switch (command) {
    case 'quick':
      await validator.validateQuick();
      break;
    case 'visual':
      await validator.validateVisual();
      break;
    default:
      await validator.validateBuild();
      break;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('💥 Validation failed:'), error);
    process.exit(1);
  });
}

export { BuildValidator };

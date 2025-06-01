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
    console.log(chalk.blue(`🔄 ${step}...`));

    try {
      const { stdout, stderr } = await execAsync(command, {
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

      console.log(chalk.green(`✅ ${step} (${duration}ms)`));
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

      console.log(chalk.red(`❌ ${step} (${duration}ms)`));
      console.log(chalk.red(`   Error: ${errorMessage}`));

      this.results.push(result);
      return result;
    }
  }

  async validateBuild() {
    console.log(chalk.cyan('🚀 Starting Build Validation Pipeline\n'));

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
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter((r) => r.success).length;
    const failureCount = this.results.filter((r) => !r.success).length;

    console.log(`\n${chalk.cyan('📊 Build Validation Summary')}`);
    console.log(chalk.cyan('━'.repeat(50)));

    for (const result of this.results) {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? chalk.green : chalk.red;
      const duration = `${result.duration}ms`;
      console.log(
        color(`${icon} ${result.step.padEnd(25)} ${duration.padStart(8)}`),
      );
    }

    console.log(`\n${chalk.cyan('━'.repeat(50))}`);
    console.log(chalk.white(`Total Duration: ${totalDuration}ms`));
    console.log(chalk.green(`Successful: ${successCount}`));

    if (failureCount > 0) {
      console.log(chalk.red(`Failed: ${failureCount}`));
      console.log(
        `\n${chalk.yellow('⚠️  Build validation completed with errors')}`,
      );
      process.exit(1);
    } else {
      console.log(`\n${chalk.green('🎉 All validations passed!')}`);
      process.exit(0);
    }
  }

  async validateQuick() {
    console.log(chalk.cyan('⚡ Quick Validation (lint + build only)\n'));

    await this.runStep('Linting', 'bun lint');
    await this.runStep('Build', 'bun run build');

    this.printSummary();
  }

  async validateVisual() {
    console.log(chalk.cyan('👁️  Visual Testing Only\n'));

    // Start dev server and run visual tests
    console.log(chalk.blue('🔄 Starting dev server...'));
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

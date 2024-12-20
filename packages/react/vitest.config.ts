import {coverageConfigDefaults, defineConfig} from 'vitest/config'
import {storybookTest} from '@storybook/experimental-addon-test/vitest-plugin'

// More info at: https://storybook.js.org/docs/writing-tests/vitest-plugin
export default defineConfig({
  plugins: [
    // See options at: https://storybook.js.org/docs/writing-tests/vitest-plugin#storybooktest
    storybookTest({configDir: '.storybook'}),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      name: 'chromium',
      provider: 'playwright',
    },
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        // This pattern must align with the `stories` property of your `.storybook/main.ts` config
        '**/*.stories.*',
        '**/*.figma.*',
        // This pattern must align with the output directory of `storybook build`
        'storybook-static/**',
        '.storybook/**',
      ],
    },
    // Make sure to adjust this pattern to match your stories files.
    // include: ['**/*.stories.?(m)[jt]s?(x)'],
    setupFiles: ['.storybook/vitest.setup.ts'],
  },
})

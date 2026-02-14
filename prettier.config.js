/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,

  plugins: ['prettier-plugin-groovy'],

  overrides: [
    {
      files: 'Jenkinsfile*',
      options: {
        parser: 'groovy',
      },
    },
  ],
};

export default config;

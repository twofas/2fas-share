# Contributing to 2FAS Share

Thank you for considering contributing to the 2FAS Share. Your support is greatly appreciated and will help us make this project even better. There are many ways you can help, from reporting bugs and improving the documentation to contributing code changes.

## Reporting Bugs

Before you submit a bug report, please search the [existing issues](https://github.com/twofas/2fas-share/issues) to see if the problem has already been reported. If it has, please add any additional information you have to the existing issue.

If you can't find an existing issue for your problem, please open a new issue and include the following information:

- A clear and descriptive title for the issue
- A description of the problem, including any error messages or logs
- Steps to reproduce the problem
- Any relevant details about your setup, such as the version of Android you are using

## Contributing Code

We welcome code contributions to the 2FAS Share. If you are interested in contributing, please follow these steps:

1. Fork this repository to your own GitHub account
2. Clone the repository to your local machine
3. Create a new branch for your changes (e.g. `feature/new-login-screen`)
4. Follow the [Project Setup](#project-setup)
5. Make your changes and commit them to your branch
6. Push your branch to your fork on GitHub
7. Open a pull request from your branch to the `develop` branch of this repository

Please make sure your pull request includes the following:

- A clear and descriptive title
- A description of the changes you have made
- Any relevant issue numbers (e.g. "Fixes #123")
- A list of any dependencies your changes require
- Tests for any new or changed code

We will review your pull request and provide feedback as soon as possible. Thank you for your contribution!

### Project setup

#### Requirements

- Node.js 22 (see [.nvmrc](.nvmrc))
- Yarn 4 (enabled via Corepack)

#### Steps

1. Enable Corepack and install dependencies:

   ```bash
   corepack enable
   yarn install
   ```

2. Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

   Available variables:

   - `VITE_API_BASE_URL` — base URL of the 2FAS Share API server
   - `VITE_UNIVERSAL_LINK_PROTOCOL` — protocol used for universal links

3. Start the development server:

   ```bash
   yarn dev
   ```

#### Available commands

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `yarn dev`      | Start the Vite dev server               |
| `yarn build`    | Build the production bundle to `dist/`  |
| `yarn preview`  | Preview the production build locally    |
| `yarn start`    | Run the Express server (`server.js`)    |
| `yarn lint`     | Run ESLint                              |
| `yarn lint:fix` | Run ESLint with auto-fix                |

Before opening a pull request, make sure `yarn lint` and `yarn build` pass.

By sharing ideas and code with the 2FAS community, either through GitHub or Discord, you agree that these contributions become the property of the 2FAS community and may be implemented into the 2FAS open source code.

# zoterocite

## Overview

**zoterocite** is a citation connector plugin designed to enhance your citation management workflow within Visual Studio Code.

## Prerequisites

Before using **zoterocite**, ensure you have the [Better Bibtex](https://github.com/retorquere/zotero-better-bibtex) plugin installed in Zotero. This plugin is essential!


## Features

- **Citation Picker**: Quickly pick citations using the command `zoterocite.showCitationPicker` (shortcut: `ctrl+shift+z`).
- **Toggle Bibtex Handling**: Easily toggle Bibtex handling with the command `zoterocite.toggleBibtexHandling`.
- **Activity Bar Integration**: Access your citations directly from the activity bar with dedicated views for Bibtex and Zotero citations.

## Commands

- `zoterocite.showCitationPicker`: Opens an input box to pick citations.
- `zoterocite.toggleBibtexHandling`: Toggles the handling of Bibtex citations.

## Keybindings

- `ctrl+shift+z`: Opens the citation picker when the editor text is focused.

## Views

- **Bibtex Citations view**: Manage and view your Bibtex citations.
- **Zotero Citations view**: Manage and view your Zotero citations.

## Installation

To install the plugin, ensure you have Visual Studio Code version 1.93.0 or higher.

## Development


### Dependencies

- **Development**: TypeScript, ESLint, Mocha, and VS Code test utilities.
- **Runtime**: Axios, Bibtex-parse, Glob, and Node-fetch.

## Contributing

Contributions are welcome! Please follow the standard guidelines for contributing to open-source projects.

## License

This project is licensed under the MIT License.
# 2FAS Share

**Zero-knowledge, end-to-end encrypted data sharing.
Live at [share.2fas.com](https://share.2fas.com).**

**2FAS Share** lets you securely share short pieces of text - like passwords, logins, or card details - using a single link. Your data is encrypted on your device before it is sent, so it stays private during transfer and storage. It is designed to make sharing sensitive information safer and more convenient.

2FAS Share is part of the [2FAS](https://2fas.com) family of open-source security tools, alongside [2FAS Pass](https://github.com/twofas/2fas-pass-ios) (Password Manager) and [2FAS Auth](https://github.com/twofas/2fas-ios) (Authenticator).

## Highlights

- **Zero-knowledge by design** - encryption happens on the sender's device. The decryption key never reaches the server
- **AES-256-GCM** - authenticated encryption
- **One-time or time-limited** - self-destruct after first view (default), or a custom time (max 30 days)
- **Optional password protection** - as an additional layer of security
- **No accounts, no tracking** - no analytics, no third-party JavaScript, no user profiling.
- **Self-hostable** - full source is open
- **Docker image** - coming soon for easier self-hosting

## How it works

A user encrypts data locally using 2FAS Share, uploads the encrypted blob, and gets back a link that can be sent to anyone. The recipient opens the link and decrypts the data in their browser. At no point in this flow can anyone other than the recipient read the content - the decryption key travels inside the URL fragment (`#...`), which browsers never send to servers, so the server only ever sees an opaque ciphertext.

Password protection is optional and adds a second layer: even if a link is intercepted, the attacker also needs the password (shared through a separate channel) to decrypt the data.

## Self-hosting

The full source of the API server and the web frontend is in this repository. You can build and run your own instance on your own infrastructure.

## Contributing

We welcome contributions to 2FAS Share. If you would like to contribute, please follow the steps described in [CONTRIBUTING.md](CONTRIBUTING.md). We will review your pull request and, if approved, merge it into the main codebase.

By sharing ideas and code with the 2FAS community, either through GitHub or Discord, you agree that these contributions become the property of the 2FAS community and may be implemented into the 2FAS open source code.

## Bug Reporting

We use GitHub for bug reports. Please visit the [2FAS Share issues page](https://github.com/twofas/2fas-share/issues) to search for and report any bugs you may have found. Before adding a new issue, please search for existing issues to avoid duplicates.

For reporting security issues only, please send a detailed description of the vulnerability to [security@2fas.com](mailto:security@2fas.com). Do not use this address for general inquiries or bug reports unrelated to security concerns.

## Donations

If you would like to support the development of the Open Source 2FAS project, you can [make a donation](https://2fas.com/donate). All donations will be used to support the ongoing development and maintenance of the project.

We appreciate your support!

## License

2FAS Share is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).

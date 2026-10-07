# Hide Call Buttons

A [Revenge](https://github.com/revenge-mod) plugin that hides call buttons from DMs, user profiles and voice channels.

This is a rewrite of [HideCallButtons](https://github.com/janisslsm/vdplugins/tree/master/plugins/HideCallButtons) by janisslsm.
It ships two builds from the same button-hiding code:

- `plugins/hide-call-buttons/js` for the Revenge Next plugin API.
- `plugins/hide-call-buttons/classic` for Revenge Classic, which uses the Vendetta plugin API.

## Features

Each option can be toggled in **Settings** > **Revenge** > **Hide Call Buttons**.

| Section      | Option                  | Default |
| ------------ | ----------------------- | ------- |
| User Profile | Hide call button        | On      |
| User Profile | Hide video button       | On      |
| DMs          | Hide call button        | Off     |
| DMs          | Hide video button       | Off     |
| Other        | Hide video button in VC | Off     |

Buttons are matched by their icons first.
If no icon matches, the plugin falls back to the button positions the original plugin used.

## Install

### Revenge Classic

Revenge Manager and RevengeXposed install Revenge Classic.
Open the **Plugins** page in Revenge settings, use the install button, and paste:

```
https://piotrdeda.github.io/hide-call-buttons/classic/hide-call-buttons/
```

### Revenge Next

Add this repository in Revenge:

```
https://piotrdeda.github.io/hide-call-buttons
```

Then install **Hide Call Buttons** from the repository browser.

You can also download a ZIP from the `pool` folder of the `gh-pages` branch, and install it with **Install from file**.

## Develop

The repository uses the layout of [revenge-plugin-template](https://github.com/revenge-mod/revenge-plugin-template).
The plugin lives in `plugins/hide-call-buttons`.

```sh
bun install
bun run build              # JS bundle -> plugins/hide-call-buttons/build/js/index.js
bun run build:classic      # Classic bundle -> plugins/hide-call-buttons/build/classic/
bun run lint               # Biome
bun run lint:types         # TypeScript
./gradlew packageAllPlugins  # ZIP -> build/dist/<id>@<version>.zip
bun run serve              # serve a local repository for device testing
```

`./gradlew` needs a JDK. The Android SDK is only needed for native plugins.

## Release

A push to `main` runs two workflows:

- **Release plugins** publishes every plugin whose `manifest.json` version is not in the pool yet, and regenerates `index.json` on the `gh-pages` branch.
- **Publish Classic builds** publishes the Classic build to `classic/<plugin>/` on the `gh-pages` branch. Revenge Classic checks the hash in its manifest for updates, so no version bump is needed.

To release a new Revenge Next version:

1. Bump `version` in `plugins/hide-call-buttons/manifest.json`.
2. Push to `main`.

Enable GitHub Pages for the `gh-pages` branch once, so the URLs above work.

## License

The plugin is licensed under the [BSD 3-Clause License](LICENSE), like the original plugin.
The build tooling and workflows come from [revenge-plugin-template](https://github.com/revenge-mod/revenge-plugin-template), which is licensed under GPL-3.0.

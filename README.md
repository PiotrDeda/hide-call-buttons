# Hide Call Buttons

A [Revenge](https://github.com/revenge-mod/revenge-bundle) plugin that hides call buttons from DMs, user profiles and voice channels.

This is a rewrite of [HideCallButtons](https://github.com/janisslsm/vdplugins/tree/master/plugins/HideCallButtons) by janisslsm.
It targets Revenge Classic, which Revenge Manager and RevengeXposed install, and uses the Vendetta plugin API.

## Install

Open the **Plugins** page in Revenge settings, use the install button, and paste:

```
https://piotrdeda.github.io/hide-call-buttons/
```

## Features

Each option can be toggled in the plugin settings.

| Section      | Option                  | Default |
| ------------ | ----------------------- | ------- |
| User Profile | Hide call button        | On      |
| User Profile | Hide video button       | On      |
| DMs          | Hide call button        | Off     |
| DMs          | Hide video button       | Off     |
| Other        | Hide video button in VC | Off     |

Buttons are matched by their icons first.
If no icon matches, the plugin falls back to the button positions the original plugin used.

## Develop

```sh
npm install
npm run build        # dist/manifest.json and dist/index.js
npm run lint         # Biome
npm run lint:types   # TypeScript
npm run serve        # serve dist/ on port 3000
```

To test on a device, install `http://<your-lan-ip>:3000/` as a plugin.

## Deploy

A push to `main` runs the **Build and deploy** workflow. It builds the plugin and publishes `dist/` to the `gh-pages` branch.
Revenge Classic compares the hash in `manifest.json` to find updates, so no version bump is needed.

Enable GitHub Pages for the `gh-pages` branch once, so the install URL works.

## License

[BSD 3-Clause License](LICENSE), like the original plugin.

[vite-plugin-relay](https://github.com/oscartbeaumont/vite-plugin-relay) does not currently support Vite 3 and has some other issues, like missing support for a custom `artifactDirectory`.

I have submitted a PR that addresses these issues, but it has not been merged yet: https://github.com/oscartbeaumont/vite-plugin-relay/pull/424

With the plugin being unusable you currently need to configure it yourself manually.

1. Copy the following into your `vite.config.js` or `vite.config.ts`.

```typescript
import type { PluginOption } from "vite";
import { transformSync } from "@babel/core";

const relay: PluginOption = {
  name: "vite:relay",
  transform(src, id) {
    let code = src;

    if (/.(t|j)sx?/.test(id) && src.includes("graphql`")) {
      const out = transformSync(src, {
        plugins: [["babel-plugin-relay"]],
        code: true,
        filename: id,
      });

      if (!out?.code) {
        throw new Error(`vite-plugin-relay: Failed to transform ${id}`);
      }

      code = out.code;
    }

    return {
      code,
      map: null,
    };
  },
};
```

> ⚠️ Warning:
>
> - If you are not using Typescript, remove the `PluginOption` import as well as its usage.
> - If you are using an ECMAScript standard below ES6 you need to replace the `src.includes("graphql")` with `src.indexOf("graphql") !== -1`.

2. Configure the plugin in the `plugins` on `defineConfig`:

```diff
export default defineConfig({
- plugins: [react()],
+ plugins: [relay, react()],
});
```

3. Your full configuration file should now look something like this:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { transformSync } from "@babel/core";

const relay: PluginOption = {
  name: "vite:relay",
  transform(src, id) {
    let code = src;

    if (/.(t|j)sx?/.test(id) && src.includes("graphql`")) {
      const out = transformSync(src, {
        plugins: [["babel-plugin-relay"]],
        code: true,
        filename: id,
      });

      if (!out?.code) {
        throw new Error(`vite-plugin-relay: Failed to transform ${id}`);
      }

      code = out.code;
    }

    return {
      code,
      map: null,
    };
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [relay, react()],
});
```

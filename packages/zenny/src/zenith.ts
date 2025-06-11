#!/usr/bin/env bun

import { runInit } from "./commands/init";
import { runCreateModule } from "./commands/create-module";
import {listModules} from "./commands/list-modules";
import {login} from "./commands/login";
import {publishModule} from "./commands/publish-module";
import {signManifest} from "./commands/sign-manifest";
import {loginZK} from "./commands/login-zk";
import {listSystems} from "./commands/list-systems";
import {showHelp} from "./commands/help";
import {openDocs} from "./commands/docs";
import { bundlePack } from "./commands/bundle/pack";
import { hydrateLocalHydra, hydrateRemoteHydra } from "./commands/hydrate";
import { createHydra } from "./commands/create-hydra";
import { publishManifestToQDHT } from "./commands/publish-manifest-qdht";

const [cmd, ...rest] = Bun.argv.slice(2);

// Fix bundle command handling
if (cmd === "bundle") {
    const subcmd = rest[0];
    if (subcmd === "pack") {
        await bundlePack(rest[1], rest[2]);
    } else {
        showHelp();
    }
}
else if (cmd === "--help" || !cmd) {
    showHelp();
} else if (cmd === "sign" && rest[0] === "manifest") {
    await signManifest(rest[1]);
} else if (cmd === "login" && rest[0] === "--token") {
    // @ts-ignore
    await login(rest[0]);
} else if (cmd === "list" && rest[0] === "systems") {
    await listSystems();
} else if (cmd === "login" && rest[0] === "--zk") {
    await loginZK();
} else if (cmd === "create" && rest[0] === "module") {
    await runCreateModule();
} else if (cmd === "create" && rest[0] === "hydra") {
    // Handle create hydra command
    await createHydra(rest[1]);
} else if (cmd === "publish" && rest[0] === "manifest" && rest[1] === "--qdht") {
    if (!rest[2]) {
        console.error("❌ Error: Manifest path is required for publishing to qDHT.");
        showHelp();
        process.exit(1);
    }
    await publishManifestToQDHT(rest[2]);
} else if (cmd === "init") {
    await runInit();
} else if (cmd === "list" && rest[0] === "modules") {
    await listModules();
} else if (cmd === "publish" && rest[0] === "module") {
    await publishModule(rest[1]);
} else if (cmd === "docs") {
    openDocs();
} else if (cmd === "hydra" && rest[0] === "local") {
    await hydrateLocalHydra(rest[1], { verbose: rest.includes("--verbose") });
} else if (cmd === "hydra" && rest[0] === "remote") {
    await hydrateRemoteHydra(rest[1]);
} else {
    showHelp()
}


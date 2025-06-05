import {runQuantumPipeline} from "./pipeline";

const { zk } = await runQuantumPipeline(new TextEncoder().encode("test"));
console.log("ZK Valid:", zk.valid);
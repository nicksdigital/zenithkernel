import {runQuantumPipeline} from "quantum-zkp-sdk";

const { zk } = await runQuantumPipeline(new TextEncoder().encode("test"));
console.log("ZK Valid:", zk.valid);
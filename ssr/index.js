export * from "../spa/index.js";

export * from "./SSREnvironment.js";
export * from "./TemplateCompilerSSR.js";
export * from "./SSRWorker.js";
export * from "./SSRWorkerThread.js";

import { setEnvProvider } from "../core/Environment.js";
import { SSREnvironment } from "./SSREnvironment.js";

let env = new SSREnvironment();
setEnvProvider(() => env);

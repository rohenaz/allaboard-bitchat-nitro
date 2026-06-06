import { defineComponent } from "convex/server";

// Local Better Auth component — required to support plugins (admin) whose tables
// aren't in the stock NPM component schema. Schema is generated into schema.ts.
const component = defineComponent("betterAuth");

export default component;

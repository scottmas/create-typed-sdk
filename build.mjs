import esbuild from "esbuild";
import yargs from "yargs-parser";
const { _, ...argv } = yargs(process.argv.slice(2)) || {};

console.log(argv);

esbuild.build({
  entryPoints: ["./src/index.ts", "./src/server.ts"],
  bundle: true,
  minify: false,
  platform: "neutral",
  sourcemap: true,
  external: ["react-query"],
  ...argv,
});

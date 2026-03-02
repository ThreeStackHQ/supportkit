import * as esbuild from "esbuild";
import { gzipSync } from "zlib";
import { readFileSync, mkdirSync } from "fs";

mkdirSync("dist", { recursive: true });

const result = await esbuild.build({
  entryPoints: ["src/widget.ts"],
  bundle: true,
  format: "iife",
  globalName: "SupportKit",
  outfile: "dist/widget.js",
  minify: true,
  target: ["es2017"],
  metafile: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

const bundle = readFileSync("dist/widget.js");
const gzipped = gzipSync(bundle);
const kb = (gzipped.length / 1024).toFixed(2);

console.log(`✅ Widget built: ${bundle.length} bytes (${kb} KB gzipped)`);

if (gzipped.length > 5 * 1024) {
  console.warn(`⚠️  Bundle is ${kb}KB gzipped (target: <5KB)`);
} else {
  console.log(`✅ Under 5KB target`);
}

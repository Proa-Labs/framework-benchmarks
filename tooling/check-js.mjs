// Parse tooling sources without executing servers or browser entry points.
for (const path of process.argv.slice(2)) {
  const transpiler = new Bun.Transpiler({
    loader: path.endsWith(".tsx") ? "tsx" : "js",
  });
  transpiler.transformSync(await Bun.file(path).text());
}
console.log(`Parsed ${process.argv.length - 2} JavaScript files with Bun`);

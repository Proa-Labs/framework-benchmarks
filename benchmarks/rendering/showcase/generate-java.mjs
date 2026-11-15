// Ahead-of-time native Java templates and prepared data, emitted only at build.
import assert from "node:assert/strict";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nativeTemplate } from "./emit-template.mjs";
import { fixtures, loadFixture } from "./fixture.mjs";

const root = fileURLToPath(new URL("../external/", import.meta.url));
const quote = JSON.stringify;
const className = (id) =>
  id
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("");
function inputSource(id) {
  const { definition, records } = loadFixture(id),
    name = className(id),
    initializers = [];
  for (const phase of ["texts", "groups"])
    for (let start = 0; start < records.length; start += 80) {
      const lines = [];
      for (let i = start; i < Math.min(start + 80, records.length); i++) {
        const r = records[i];
        lines.push(
          phase === "texts"
            ? `p[${i}]=new Input.Data(new String[]{${r.texts.map(quote).join(",")}},new int[]{${r.variants.join(",")}});`
            : `p[${i}].groups=new Input.Data[][]{${r.groups.map((g) => `{${g.map((id) => `p[${id}]`).join(",")}}`).join(",")}};`,
        );
      }
      initializers.push(
        `static void init${initializers.length}(Input.Data[] p){${lines.join("\n")}}`,
      );
    }
  const c = definition.controls;
  return `package proa.bench.showcase; public final class ${name}{
${initializers.join("\n")}
public static Input.Data create(String probe){Input.Data[] p=new Input.Data[${records.length}];${initializers.map((_, i) => `init${i}(p);`).join("")}
String changed=${quote('</span><img id="escaped-probe" src=x> & < > " \' ✓')};
switch(probe){case "baseline":break;case "title":p[0].texts[${c.titleIndex}]=changed;break;case "text":p[${c.text.record}].texts[${c.text.slot}]=changed;break;case "request":p[0].texts[${c.requestIndex}]=changed;break;default:throw new IllegalArgumentException(probe);}return p[0];}
public static final int REQUEST=${c.requestIndex};}`;
}
export function generateJava(engine) {
  assert.ok(["jte", "rocker"].includes(engine));
  const directory = join(root, engine, "build/showcase"),
    sources = join(directory, "java/proa/bench/showcase"),
    templates = join(directory, "templates");
  mkdirSync(sources, { recursive: true });
  mkdirSync(templates, { recursive: true });
  cpSync(join(root, engine, "src/main", engine), templates, {
    recursive: true,
  });
  writeFileSync(
    join(sources, "Input.java"),
    "package proa.bench.showcase; public final class Input{public static final class Data{public final String[] texts;public final int[] variants;public Data[][] groups;public Data(String[] t,int[] v){texts=t;variants=v;}}}",
  );
  const renderCases = [],
    dataCases = [],
    styleCases = [];
  for (const { id } of fixtures) {
    const { definition } = loadFixture(id),
      name = className(id),
      styles = [];
    const stem = `showcase_${id.replaceAll("-", "_")}`;
    const call = (index, data) =>
      engine === "jte"
        ? `@template.${stem}_c${index}(data=${data},request=request,styles=styles)`
        : `@views.${stem}_c${index}.template(${data},request,styles)`;
    const options = { stylePool: styles, componentCall: call };
    const { markup } = nativeTemplate(definition, engine, options);
    writeFileSync(join(sources, `${name}.java`), inputSource(id));
    const filename =
      engine === "jte"
        ? `showcase_${id.replaceAll("-", "_")}.jte`
        : `views/showcase_${id.replaceAll("-", "_")}.rocker.html`;
    const path = join(templates, filename);
    mkdirSync(dirname(path), { recursive: true });
    const header =
      engine === "jte"
        ? "@import proa.bench.showcase.Input.Data\n@import gg.jte.Content\n@param Data data\n@param String request\n@param Content[] styles\n"
        : "@import proa.bench.showcase.Input.Data\n@args (Data data, String request, String[] styles)\n";
    writeFileSync(path, `${header}<!DOCTYPE html>${markup}`);
    for (const [index, entry] of definition.templates.entries()) {
      const partial = join(
        templates,
        engine === "jte"
          ? `${stem}_c${index}.jte`
          : `views/${stem}_c${index}.rocker.html`,
      );
      writeFileSync(
        partial,
        header +
          nativeTemplate(definition, engine, {
            ...options,
            entry,
            entryIsRoot: false,
          }).markup,
      );
    }
    dataCases.push(
      `case ${quote(id)}:data=${name}.create(probe);request=data.texts[${name}.REQUEST];break;`,
    );
    styleCases.push(
      `case ${quote(id)}:styles=new ${engine === "jte" ? "Content" : "String"}[]{${styles.map((s) => (engine === "jte" ? `new FixedCss(${quote(s)})` : quote(s))).join(",")}};break;`,
    );
    renderCases.push(
      engine === "jte"
        ? `case ${quote(id)}:engine.render(${quote(filename)},java.util.Map.of("data",data,"request",request,"styles",styles),output);break;`
        : `case ${quote(id)}:html=views.showcase_${id.replaceAll("-", "_")}.template(data,request,styles).render().toString();break;`,
    );
  }
  const imports =
    engine === "jte"
      ? "import gg.jte.*;import gg.jte.output.Utf8ByteOutput;"
      : "";
  const setup =
    engine === "jte"
      ? 'var engine=TemplateEngine.createPrecompiled(Path.of("build/jte-classes"),ContentType.Html);'
      : "";
  const renderBody =
    engine === "jte"
      ? `var output=new Utf8ByteOutput();switch(id){${renderCases.join("")}default:throw new IllegalArgumentException(id);}return output;`
      : `String html;switch(id){${renderCases.join("")}default:throw new IllegalArgumentException(id);}return html;`;
  const dump =
    engine === "jte"
      ? 'var output=(Utf8ByteOutput)previous;var bytes=new java.io.ByteArrayOutputStream(output.getContentLength());output.writeTo(bytes);Files.write(Path.of(options.get("--dump")),bytes.toByteArray());'
      : 'Files.writeString(Path.of(options.get("--dump")),(String)previous,StandardCharsets.UTF_8);';
  const length =
    engine === "jte"
      ? "((Utf8ByteOutput)previous).getContentLength()"
      : "((String)previous).getBytes(StandardCharsets.UTF_8).length";
  writeFileSync(
    join(sources, "Admission.java"),
    `package proa.bench.showcase;
import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.util.*;${imports}
public final class Admission{
private static volatile Object sink;
${engine === "jte" ? "record FixedCss(String css) implements Content{public void writeTo(TemplateOutput output){output.writeContent(css);}}" : ""}
public static void main(String[] args)throws Exception{var options=new HashMap<String,String>();for(int i=0;i<args.length;i++){String key=args[i];options.put(key,key.equals("--dump-only")?"true":args[++i]);}String id=options.get("--workload"),probe=options.getOrDefault("--probe","baseline");Input.Data data;String request;
switch(id){${dataCases.join("")}default:throw new IllegalArgumentException(id);}
${engine === "jte" ? "Content" : "String"}[] styles;switch(id){${styleCases.join("")}default:throw new IllegalArgumentException(id);}
${setup}
java.util.function.Supplier<Object> renderer=()->{${renderBody}};
Object previous=renderer.get();
if(options.containsKey("--dump")){${dump}}
if(options.containsKey("--out")&&!options.containsKey("--dump-only")){
int iterations=Integer.parseInt(options.getOrDefault("--iterations","100")),warmup=Integer.parseInt(options.getOrDefault("--warmup","10"));if(iterations<1||warmup<0)throw new IllegalArgumentException("Invalid sample counts");
for(int i=0;i<warmup;i++){previous=renderer.get();sink=previous;}
double[] samples=new double[iterations];
for(int i=0;i<iterations;i++){long started=System.nanoTime();Object output=renderer.get();double elapsed=(System.nanoTime()-started)/1000.0;previous=output;sink=output;samples[i]=elapsed;}
String json="{\\"framework_id\\":\\"${engine}\\",\\"allocation_policy\\":\\"native precompiled ${engine} template; fresh owned HTML output\\",\\"iterations\\":"+iterations+",\\"warmup\\":"+warmup+",\\"output_bytes\\":"+${length}+",\\"samples_us\\":"+Arrays.toString(samples)+"}";
Files.writeString(Path.of(options.get("--out")),json,StandardCharsets.UTF_8);
}
}}
`,
  );
}
if (import.meta.main)
  generateJava(process.argv[process.argv.indexOf("--engine") + 1]);

import { renderToReadableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import { App } from "./App.jsx";

export async function render(url) {
  const stream = await renderToReadableStream(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
  await stream.allReady;
  return new Response(stream).text();
}

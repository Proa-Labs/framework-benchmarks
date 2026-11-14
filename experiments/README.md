# Separate experiments

These investigations have their own contracts and evidence. They do not add
measurements to the five active publication suites automatically.

| Directory | Purpose |
| --- | --- |
| [`agent-chain/`](agent-chain/README.md) | Deterministic browser-agent request chain |
| [`travel-agent/`](travel-agent/README.md) | Multi-site browser workflow, document delivery and JavaScript analysis |
| [`showcase/`](showcase/README.md) | Application-shaped SSR, client-JavaScript, allocation and memcpy controls |
| [`sveltekit-streaming/`](sveltekit-streaming/README.md) | Historical Proa/SvelteKit streaming and browser-completion comparison |

The SvelteKit experiment contains its runner, observer, selected captures and
figure. The SvelteKit application implementation lives under
[`benchmarks/rendering/external/sveltekit/`](../benchmarks/rendering/external/sveltekit/).
This distinction keeps framework code separate from a particular investigation.

Results retain their original dates, versions and timing boundaries. Consult
each experiment's README before running it. General engineering notes are in
[`docs/engineering/`](../docs/engineering/README.md).

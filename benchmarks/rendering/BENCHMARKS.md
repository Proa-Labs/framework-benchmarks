# Rendering benchmark index

The public renderer comparison is the canonical suite documented in [`protocol.md`](protocol.md). Its sole result source is [`results/latest.json`](results/latest.json), and its only full-run command is:

```sh
./rendering/run-all
```

For implementation investigations, use the [`engineering/`](../../docs/engineering/) reports and the specialized commands retained in [`run_all.sh`](run_all.sh). Those results must not be combined with the canonical scoreboard.

Superseded reports are available in Git history. See [`MIGRATION.md`](MIGRATION.md) for the current evidence layout.

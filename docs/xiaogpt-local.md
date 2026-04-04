# xiaogpt Local Check

This repo includes helper scripts for validating a local `xiaogpt` setup without Docker.

## Local environment

Create and use the isolated virtual environment:

```bash
python3 -m venv .venv-xiaogpt-local
.venv-xiaogpt-local/bin/pip install 'xiaogpt==3.10' 'langchain==0.3.3' 'langchain-community==0.3.2' 'openai==1.51.2' 'miservice-fork==2.7.1'
```

## Private config placement

The repo now prefers a repo-local private config file:

```bash
mkdir -p runtime/xiaogpt
cp runtime/xiaogpt/config.yaml.example runtime/xiaogpt/config.yaml
```

Then edit `runtime/xiaogpt/config.yaml` with the Xiaomi account credentials that should not be committed.

If the source machine already has a working Xiaomi login cache, copy that too:

```bash
cp ~/.mi.token runtime/xiaogpt/.mi.token
```

Fallback behavior:

- first: `runtime/xiaogpt/config.yaml`
- then: `~/.xiaogpt/config.yaml`

Token cache lookup order:

- first: `runtime/xiaogpt/.mi.token`
- then: `~/.mi.token`

You can still override the path explicitly with `XIAOGPT_CONFIG_PATH=/path/to/config.yaml`.
You can still override the token path explicitly with `XIAOGPT_TOKEN_PATH=/path/to/.mi.token`.

## Verify recent XiaoAi conversations

The helper reads Xiaomi credentials from the repo-local private config by default and then fetches the latest records for a target speaker.

```bash
.venv-xiaogpt-local/bin/python scripts/xiaogpt_local_check.py --hardware L05B --mi-did 2116704058
```

Optional full JSON output:

```bash
.venv-xiaogpt-local/bin/python scripts/xiaogpt_local_check.py --hardware L05B --mi-did 2116704058 --verbose-json
```

## Notes

- The current verified speaker is `小爱音箱Play`.
- The verified `hardware` is `L05B`.
- The verified `mi_did` is `2116704058`.
- `runtime/xiaogpt/config.yaml` is gitignored so Linux or macOS machines can each copy in their own private credentials after cloning.
- `runtime/xiaogpt/.mi.token` is also gitignored and is preferred over `~/.mi.token` when present.
- Keeping Xiaomi credentials in plain YAML is still risky. If this grows beyond a personal setup, move them to a safer secret store.

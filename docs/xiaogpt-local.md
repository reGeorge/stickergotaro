# xiaogpt Local Check

This repo now includes a small helper script for validating a local `xiaogpt` setup without Docker.

## Local environment

Create and use the isolated virtual environment:

```bash
python3 -m venv .venv-xiaogpt-local
.venv-xiaogpt-local/bin/pip install 'xiaogpt==3.10' 'langchain==0.3.3' 'langchain-community==0.3.2' 'openai==1.51.2' 'miservice-fork==2.7.1'
```

## Verify recent XiaoAi conversations

The helper reads Xiaomi credentials from `~/.xiaogpt/config.yaml` and then fetches the latest records for a target speaker.

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
- Keeping Xiaomi credentials in plain YAML is risky. Prefer moving them to a safer secret store before building the logging pipeline.

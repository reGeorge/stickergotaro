#!/usr/bin/env python3
import argparse
import asyncio
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator

import yaml
from dotenv import load_dotenv

from xiaogpt.config import Config, WAKEUP_KEYWORD
from xiaogpt.xiaogpt import MiGPT


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Listen to XiaoAi conversations locally and append them to daily Markdown files."
    )
    parser.add_argument(
        "--config-path",
        default=str(Path.home() / ".xiaogpt" / "config.yaml"),
        help="Path to the existing xiaogpt YAML config.",
    )
    parser.add_argument("--hardware", default="L05B", help="Target XiaoAi hardware.")
    parser.add_argument("--mi-did", default="2116704058", help="Target XiaoAi mi_did.")
    parser.add_argument(
        "--bot",
        default="glm",
        choices=[
            "chatgptapi",
            "glm",
            "gemini",
            "qwen",
            "doubao",
            "moonshot",
            "yi",
            "llama",
        ],
        help="LLM provider used when the query should be answered by xiaogpt.",
    )
    parser.add_argument(
        "--output-dir",
        default="data/raw",
        help="Directory used for daily Markdown logs.",
    )
    parser.add_argument(
        "--env-file",
        default=".env.local",
        help="Optional dotenv file that contains LLM API keys.",
    )
    parser.add_argument(
        "--keyword",
        action="append",
        default=None,
        help="Custom wake words that trigger LLM replies. Repeatable.",
    )
    parser.add_argument(
        "--prompt",
        default="以下请用300字以内回答，请只回答文字不要带链接",
        help="Prompt suffix used for the first turn.",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Use the model's stream mode when supported.",
    )
    parser.add_argument(
        "--speak",
        action="store_true",
        help="Speak the generated LLM answer back through the target speaker.",
    )
    parser.add_argument(
        "--record-only",
        action="store_true",
        help="Only record XiaoAi conversations and skip all LLM answering.",
    )
    parser.add_argument(
        "--mute-xiaoai",
        action="store_true",
        help="Pause the built-in XiaoAi answer before sending the LLM answer.",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="count",
        default=0,
        help="Increase logging verbosity.",
    )
    return parser.parse_args()


@dataclass
class MarkdownJournal:
    root: Path

    def __post_init__(self) -> None:
        self.root.mkdir(parents=True, exist_ok=True)

    def append_entry(
        self,
        happened_at_ms: int,
        *,
        mode: str,
        query: str,
        answer: str,
        hardware: str,
        mi_did: str,
        request_id: str,
        answer_source: str,
        in_conversation: bool,
        raw_answer: str = "",
    ) -> Path:
        dt = datetime.fromtimestamp(happened_at_ms / 1000)
        target = self.root / f"{dt:%Y-%m-%d}.md"
        block = [
            f"## {dt:%Y-%m-%d %H:%M:%S}",
            "- source: xiaogpt-local",
            f"- mode: {mode}",
            f"- hardware: {hardware}",
            f"- mi_did: {mi_did}",
            f"- request_id: {request_id or ''}",
            f"- in_conversation: {str(in_conversation).lower()}",
            f"- answer_source: {answer_source}",
            f"- query: {self._sanitize_line(query)}",
            f"- answer: {self._sanitize_line(answer)}",
            f"- raw_answer: {self._sanitize_line(raw_answer)}",
            "",
        ]
        with target.open("a", encoding="utf-8") as f:
            f.write("\n".join(block))
        return target

    @staticmethod
    def _sanitize_line(value: str) -> str:
        cleaned = (value or "").replace("\r", " ").replace("\n", " ").strip()
        return cleaned


class LoggedMiGPT(MiGPT):
    def __init__(
        self,
        config: Config,
        journal: MarkdownJournal,
        speak_answers: bool,
        record_only: bool,
    ):
        super().__init__(config)
        self.journal = journal
        self.speak_answers = speak_answers
        self.record_only = record_only

    async def _single_text_stream(self, text: str) -> AsyncIterator[str]:
        yield text

    async def _generate_answer(self, query: str) -> str:
        if not self.config.stream:
            if self.config.bot == "glm":
                answer = self.chatbot.ask(query, **self.config.gpt_options)
            else:
                answer = await self.chatbot.ask(query, **self.config.gpt_options)
            return self._normalize(answer or "")

        parts: list[str] = []
        async for chunk in self.ask_gpt(query):
            parts.append(chunk)
        return "".join(parts).strip()

    @staticmethod
    def _extract_native_answer(record: dict) -> str:
        answers = record.get("answers", [])
        if not answers:
            return ""
        return answers[0].get("tts", {}).get("text", "") or ""

    async def log_record(
        self,
        record: dict,
        *,
        mode: str,
        answer: str,
        answer_source: str,
    ) -> None:
        self.journal.append_entry(
            record.get("time") or int(datetime.now().timestamp() * 1000),
            mode=mode,
            query=record.get("query", "").strip(),
            answer=answer,
            hardware=self.config.hardware,
            mi_did=str(self.config.mi_did),
            request_id=record.get("requestId", ""),
            answer_source=answer_source,
            in_conversation=self.in_conversation,
            raw_answer=self._extract_native_answer(record),
        )

    async def run_logged_forever(self) -> None:
        await self.init_all_data()
        task = asyncio.create_task(self.poll_latest_ask())
        assert task is not None
        print(f"Listening on hardware={self.config.hardware}, mi_did={self.config.mi_did}")
        print(f"Logging to {self.journal.root}")
        while True:
            self.polling_event.set()
            new_record = await self.last_record.get()
            self.polling_event.clear()
            query = new_record.get("query", "").strip()

            if query == self.config.start_conversation:
                if not self.in_conversation:
                    self.in_conversation = True
                    await self.wakeup_xiaoai()
                await self.log_record(
                    new_record,
                    mode="control",
                    answer="开始持续对话",
                    answer_source="control",
                )
                if self.config.mute_xiaoai:
                    await self.stop_if_xiaoai_is_playing()
                continue

            if query == self.config.end_conversation:
                if self.in_conversation:
                    self.in_conversation = False
                await self.log_record(
                    new_record,
                    mode="control",
                    answer="结束持续对话",
                    answer_source="control",
                )
                if self.config.mute_xiaoai:
                    await self.stop_if_xiaoai_is_playing()
                continue

            if self.need_change_prompt(new_record):
                self._change_prompt(query)

            if self.record_only or not self.need_ask_gpt(new_record):
                await self.log_record(
                    new_record,
                    mode="native" if not self.record_only else "record-only",
                    answer=self._extract_native_answer(new_record),
                    answer_source="xiaoai" if not self.record_only else "record-only",
                )
                continue

            query_for_model = re.sub(
                rf"^({'|'.join(self.config.keyword)})", "", query
            ).strip()
            if self.config.bot == "llama":
                query_for_model = (
                    "你是一个基于llama3 的智能助手，请你跟我对话时，一定使用中文，"
                    "不要夹杂英文单词。问题是："
                    f"{query_for_model}"
                )
            elif not self.chatbot.has_history():
                query_for_model = f"{query_for_model}，{self.config.prompt}"

            if self.config.mute_xiaoai:
                await self.stop_if_xiaoai_is_playing()

            answer = ""
            answer_source = self.config.bot
            try:
                answer = await self._generate_answer(query_for_model)
            except Exception as exc:
                answer_source = "error"
                answer = f"ERROR: {exc}"

            if answer and self.speak_answers and answer_source != "error":
                await self.speak(self._single_text_stream(answer))

            await self.log_record(
                new_record,
                mode="llm",
                answer=answer,
                answer_source=answer_source,
            )

            if self.in_conversation:
                await self.wakeup_xiaoai()


async def main() -> None:
    args = parse_args()
    env_path = Path(args.env_file)
    if env_path.exists():
        load_dotenv(env_path)

    cfg = yaml.safe_load(Path(args.config_path).read_text())
    keywords = tuple(args.keyword) if args.keyword else ("帮我", "请")
    config = Config(
        account=cfg["account"],
        password=cfg["password"],
        hardware=args.hardware,
        mi_did=args.mi_did,
        keyword=keywords,
        bot=args.bot,
        prompt=args.prompt,
        stream=args.stream,
        mute_xiaoai=args.mute_xiaoai,
        verbose=args.verbose,
    )
    journal = MarkdownJournal(Path(args.output_dir))
    listener = LoggedMiGPT(
        config,
        journal,
        speak_answers=args.speak,
        record_only=args.record_only,
    )
    try:
        await listener.run_logged_forever()
    finally:
        await listener.close()


if __name__ == "__main__":
    asyncio.run(main())

# Lobster Message Templates

这份文档提供给龙虾使用的纯文字群聊模板。

适用前提：

- 先刷新最新数据
- 再生成日报 / 周报 / 月报
- 最终在群聊里发送“文字摘要 + 页面链接”

项目根目录：

`/Users/regeorge/Documents/codeStore/stickergotaro`

固定刷新入口：

`/Users/regeorge/Documents/codeStore/stickergotaro/scripts/run_nightly_pipeline.py`

当前局域网访问地址：

- 日报：`http://192.168.0.154:8765/report/daily`
- 周报：`http://192.168.0.154:8765/report/weekly`
- 月报：`http://192.168.0.154:8765/report/monthly`

注意：

- `192.168.0.154` 是当前局域网 IP
- 如果要长期稳定，建议在路由器里把这台 Mac 的地址保留成静态分配

## Execution Rule

当用户说“发日报 / 发周报 / 发月报”时，龙虾应先执行：

```text
/Users/regeorge/Documents/codeStore/stickergotaro/.venv-xiaogpt-local/bin/python /Users/regeorge/Documents/codeStore/stickergotaro/scripts/run_nightly_pipeline.py
```

然后再读取最新报告文件，最后按下面模板输出。

## Daily Template

```text
小满日报
日期：{date}
今日记录：{count} 条
今日磁贴：{magnet_total} 个

今日亮点：
1. {highlight_1}
2. {highlight_2}
3. {highlight_3}

查看详情：
http://192.168.0.154:8765/report/daily
```

## Daily Empty Template

```text
小满日报
日期：{date}

今天暂无新的相关记录。

查看详情：
http://192.168.0.154:8765/report/daily
```

## Weekly Template

```text
小满周报
周期：{week_label}
本周记录：{count} 条
本周磁贴：{magnet_total} 个

本周亮点：
1. {highlight_1}
2. {highlight_2}
3. {highlight_3}

查看详情：
http://192.168.0.154:8765/report/weekly
```

## Weekly Empty Template

```text
小满周报
周期：{week_label}

本周暂无新的相关记录。

查看详情：
http://192.168.0.154:8765/report/weekly
```

## Monthly Template

```text
小满月报
月份：{month_label}
本月记录：{count} 条
本月磁贴：{magnet_total} 个

本月代表性场景：
1. {highlight_1}
2. {highlight_2}
3. {highlight_3}

查看详情：
http://192.168.0.154:8765/report/monthly
```

## Monthly Empty Template

```text
小满月报
月份：{month_label}

本月暂无新的相关记录。

查看详情：
http://192.168.0.154:8765/report/monthly
```

## Output Rules

- 文案尽量简短
- 不要输出 HTML
- 不要输出 Markdown 表格
- 不要写技术实现细节
- 默认附页面链接
- 如果用户明确说“不要链接”，才可以省略链接

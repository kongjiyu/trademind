# TradeMind — AI-Powered Crypto Trading Companion

## Product Overview

**What is this product?**
TradeMind is an AI-powered crypto trading companion that guides beginners through Smart Money Concept (SMC) trading strategies. Users receive trade suggestions with visual chart overlays, enter their own trading plans, and get AI feedback on their entries, take-profit (TP), and stop-loss (SL) levels.

**Who is it for?**
Beginner to intermediate crypto traders (1+ years experience) who want to learn institutional-grade trading strategies without overwhelming complexity.

**What does it do?**
- Identifies Smart Money Concept (SMC) signals on crypto charts
- Displays visual overlays (order blocks, FVGs, liquidity zones) on the chart
- Notifies users via Telegram when trading signals are detected
- Allows users to input their own trading plans (entry, TP, SL)
- Provides AI feedback comparing user plans against optimal SMC-based recommendations

---

## Objectives

1. **Primary** — Help beginners make more informed trading decisions by translating complex SMC analysis into actionable, visual guidance
2. **Secondary** — Educate users on *why* certain trades are suggested, not just *what* to trade
3. **Tertiary** — Build a scalable platform that can support real trading integration in future

---

## User Stories

| As a... | I want... | So that... |
| ------- | -------- | --------- |
| Beginner trader | To see trading signals on crypto | I know when a potential opportunity exists |
| Beginner trader | To understand why a trade is suggested | I can learn and improve my trading skills |
| Beginner trader | To check if my own trading plan is reasonable | I don't enter bad trades |
| Beginner trader | To get notified when signals appear | I don't need to constantly watch the chart |
| Experienced trader | To quickly see SMC zones on the chart | I can validate my own analysis |

---

## Core Features

### Must have (MVP)

1. **Crypto Chart Display**
   - Display BTC/USDT price chart (TradingView-style)
   - Timeframe selection (15m, 1h, 4h, 1d)
   - Candlestick chart with zoom/pan

2. **SMC Signal Detection**
   - Detect and highlight Order Blocks (bullish & bearish)
   - Detect and highlight Fair Value Gaps (FVGs)
   - Detect and highlight Liquidity Zones (swing highs/lows)
   - Mark Break of Structure (BOS) and Change of Character (CHoCH)

3. **AI Trading Assistant**
   - AI analyzes current chart state and provides trade suggestion
   - Shows recommended entry, TP, and SL levels
   - Explains reasoning using SMC concepts

4. **User Plan Input**
   - User enters their intended entry, TP, and SL
   - AI compares user plan against optimal levels
   - AI provides specific feedback on deviations

5. **Telegram Notification Bot**
   - Subscribe to trading pair alerts
   - Receive signal notifications via Telegram
   - Notification includes: pair, direction, key levels, brief AI reasoning

6. **Simulated Trading Mode**
   - Paper trade within the platform
   - Track simulated P&L
   - Historical data for practice

### Should have (v1.0)

- Multiple crypto pairs (ETH, SOL, etc.)
- Multiple timeframe support
- Trade history log
- AI strategy recommendation based on user risk tolerance

### Nice to have (future)

- Real exchange API integration
- Strategy library (user can pick different strategies beyond SMC)
- Social features (share trades, follow successful traders)
- Mobile app

---

## Out of Scope

- **Real money trading** — MVP uses simulated/paper trading only
- **Real-time trade execution** — Users manually enter trades on their exchange; we do not execute trades
- **Technical indicators** (MA, RSI, MACD, etc.) — SMC is price action based
- **Forex/Stocks** — MVP focuses on crypto only
- **Paid AI API integration beyond MiniMax** — Using MiniMax for all AI reasoning

---

## Assumptions

- Users have smartphones and basic crypto knowledge
- Internet connection is available for Telegram bot and chart data
- MiniMax API is accessible and provides adequate response time
- CoinGecko or similar free API provides sufficient historical data for demo
- Users have a Telegram account for notifications

---

## Risks

| Risk | Impact | Mitigation |
| ---- | ------ | --------- |
| Free crypto API rate limits or downtime | Chart data may not load | Implement caching; fallback to alternative data source |
| AI provides incorrect trading advice | Users may lose money | Prominently label as "educational tool, not financial advice" |
| Telegram bot notification delays | Users miss trade opportunities | Make notifications async; document expected delay |
| MiniMax API latency | AI response too slow for UX | Optimize prompt; show "AI analyzing..." state |

---

## Success Metrics

- **Demo completes successfully** — Judges can see full user flow (signal → notification → plan input → AI feedback)
- **AI reasoning is visible** — Each AI response shows which SMC concept was used
- **Telegram bot works** — Notification sent and received within 30 seconds of signal
- **Chart overlays are accurate** — SMC zones visually match known patterns on historical data

---

## Tech Stack (Suggested)

| Layer | Technology |
| ----- | ---------- |
| Frontend | React / Next.js (TradingView Lightweight Charts) |
| Backend | Node.js API or Next.js API routes |
| AI | MiniMax API (chat completion) |
| Data | CoinGecko (historical OHLCV) |
| Notification | Telegram Bot API |
| Storage | Local state / JSON file (MVP) |

---

## Monetization (Business Logic)

- **Freemium subscription model**
  - Free tier: 5 AI analyses/day, 1 crypto pair
  - Pro tier (future): Unlimited analyses, all pairs, advanced strategies

*Note: MVP is free demo only; subscription billing not implemented in hackathon version.*

---

## Related

- [[competition_overview]] — Hackathon X: Fintech Forward
- [[resources/]] — Hackathon resources and guides
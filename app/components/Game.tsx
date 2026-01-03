"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { base } from "wagmi/chains";
import { parseEventLogs } from "viem";
import { DIFFICULTY_CONFIG, Difficulty } from "../lib/gameConfig";
import { addUniqueWord, normalizeWord } from "../lib/wordUtils";
import { MiniAppReady } from "./MiniAppReady";
import { actionsAbi } from "../lib/actionsAbi";
import { safeLocalStorage } from "../lib/safeStorage";

type GameState = "select" | "play" | "result";

type BestScore = {
  found: number;
  timeUsed: number;
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const ACTIONS_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ACTIONS_CONTRACT_ADDRESS as
    | `0x${string}`
    | undefined;
const EXPECTED_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? base.id,
);
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_CROSSWORD === "true";
const EXPECTED_CHAIN_LABEL =
  EXPECTED_CHAIN_ID === base.id
    ? base.name
    : `chain ${EXPECTED_CHAIN_ID}`;

const DIFFICULTY_ENUM: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function debugLog(...args: unknown[]) {
  if (!DEBUG_ENABLED) return;
  console.log("[crossword]", ...args);
}

function InjectedWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
      return;
    }
    connect({ connector: injected() });
  };

  return (
    <button className="button button--wallet" onClick={handleClick}>
      {isConnected
        ? shortenAddress(address)
        : isPending
          ? "Connecting..."
          : "Connect Wallet"}
    </button>
  );
}

function getBestScore(difficulty: Difficulty): BestScore | null {
  const key = `crossword-best-${difficulty}`;
  const raw = safeLocalStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BestScore;
  } catch {
    return null;
  }
}

function setBestScore(difficulty: Difficulty, score: BestScore) {
  const key = `crossword-best-${difficulty}`;
  safeLocalStorage.setItem(key, JSON.stringify(score));
}

export function Game() {
  const { address, isConnected } = useAccount();
  const [screen, setScreen] = useState<GameState>("select");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [rootWord, setRootWord] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [requiredCount, setRequiredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [possibleWords, setPossibleWords] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [miniAppDetected, setMiniAppDetected] = useState(false);
  const [txMessage, setTxMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();

  const timeUsed = useMemo(() => {
    if (!startTime) return 0;
    const end = endTime ?? Date.now();
    return Math.min(durationSec, Math.round((end - startTime) / 1000));
  }, [startTime, endTime, durationSec]);

  const endGame = useCallback(async () => {
    if (screen === "result") return;
    setScreen("result");
    setEndTime(Date.now());
    if (!rootWord) return;
    const response = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootWord }),
    });
    if (response.ok) {
      const data = await response.json();
      setPossibleWords(data.possibleWords ?? []);
    }
  }, [screen, rootWord]);

  useEffect(() => {
    if (screen !== "play") return;
    if (timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screen, timeLeft]);

  useEffect(() => {
    if (screen === "play" && timeLeft === 0) {
      endGame();
    }
  }, [screen, timeLeft, endGame]);

  useEffect(() => {
    if (screen !== "result" || !difficulty) return;
    const best = getBestScore(difficulty);
    const score: BestScore = { found: foundWords.length, timeUsed };
    if (!best || score.found > best.found) {
      setBestScore(difficulty, score);
    }
  }, [screen, difficulty, foundWords.length, timeUsed]);

  async function startGame(
    nextDifficulty: Difficulty,
    sessionId?: string,
  ) {
    setMessage("");
    setTxMessage("");
    setPendingLabel("");
    setPossibleWords([]);
    setFoundWords([]);
    setInputValue("");
    setDifficulty(nextDifficulty);

    debugLog("startGame", {
      difficulty: nextDifficulty,
      sessionId,
      chainId,
      contract: ACTIONS_CONTRACT_ADDRESS,
    });

    let response: Response;
    try {
      response = await fetch(
        `/api/new-game?difficulty=${nextDifficulty}`,
      );
    } catch (err) {
      console.error("[crossword] new-game fetch error", err);
      setMessage(
        "Unable to start a new game. Network error occurred.",
      );
      return;
    }

    let data: {
      rootWord?: string;
      durationSec?: number;
      requiredCount?: number;
      error?: string;
      details?: string;
    } | null = null;
    try {
      data = await response.json();
    } catch (err) {
      console.error("[crossword] new-game parse error", err);
    }

    if (!response.ok) {
      debugLog("new-game failed", {
        status: response.status,
        data,
      });
      const detail =
        data?.message ?? data?.error ?? response.statusText;
      setMessage(
        detail
          ? `Unable to start a new game: ${detail}`
          : "Unable to start a new game. Try again.",
      );
      return;
    }

    if (!data?.rootWord) {
      setMessage("Unable to start a new game. Missing root word.");
      return;
    }

    setRootWord(data.rootWord);
    setDurationSec(data.durationSec ?? 0);
    setRequiredCount(data.requiredCount ?? 0);
    setTimeLeft(data.durationSec ?? 0);
    setStartTime(Date.now());
    setEndTime(null);
    setScreen("play");
  }

  async function sendAction(
    action: "startDifficulty" | "playAgain" | "retrySameDifficulty",
    actionDifficulty: Difficulty,
  ) {
    if (!ACTIONS_CONTRACT_ADDRESS) {
      const err =
        "Missing NEXT_PUBLIC_ACTIONS_CONTRACT_ADDRESS. Set it in your deployment env.";
      setMessage(err);
      setTxMessage(err);
      return null;
    }
    if (!Number.isFinite(EXPECTED_CHAIN_ID)) {
      const err =
        "Missing NEXT_PUBLIC_CHAIN_ID. Set it in your deployment env.";
      setMessage(err);
      setTxMessage(err);
      return null;
    }
    if (!isConnected || !address) {
      const err = "Connect a wallet before starting a game.";
      setMessage(err);
      setTxMessage(err);
      return null;
    }
    if (chainId !== EXPECTED_CHAIN_ID) {
      const err = `Wrong network. Switch to ${EXPECTED_CHAIN_LABEL} to continue.`;
      setMessage(err);
      setTxMessage(err);
      try {
        await switchChainAsync({ chainId: EXPECTED_CHAIN_ID });
      } catch (err) {
        console.error("[crossword] switch chain failed", err);
      }
      return null;
    }
    if (!publicClient) {
      setMessage("Blockchain client unavailable. Reload and try again.");
      return null;
    }
    setPendingAction(action);
    setPendingLabel("Confirm in wallet...");
    debugLog("sendAction", {
      action,
      difficulty: actionDifficulty,
      chainId,
      contract: ACTIONS_CONTRACT_ADDRESS,
      address,
    });
    try {
      const hash = await writeContractAsync({
        address: ACTIONS_CONTRACT_ADDRESS,
        abi: actionsAbi,
        functionName: action,
        args: [DIFFICULTY_ENUM[actionDifficulty]],
      });
      debugLog("tx submitted", { hash });
      setPendingLabel("Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
      });
      debugLog("tx receipt", {
        status: receipt.status,
        hash: receipt.transactionHash,
      });

      const decodedLogs = parseEventLogs({
        abi: actionsAbi,
        logs: receipt.logs,
        strict: false,
      });
      const actionEvents = decodedLogs.filter(
        (log) => log.eventName === "Action",
      );
      debugLog("decoded logs", actionEvents);

      const sessionId =
        actionEvents[0]?.args?.timestamp !== undefined
          ? `${hash}:${actionEvents[0].args.timestamp}`
          : hash;
      debugLog("sessionId", sessionId);

      if (receipt.status !== "success") {
        setTxMessage("Transaction reverted. Try again.");
        return null;
      }

      return {
        hash,
        receiptStatus: receipt.status,
        actionEvents,
        sessionId,
      };
    } catch (err) {
      console.error("[crossword] transaction error", err);
      setTxMessage("Transaction rejected or failed.");
      return null;
    } finally {
      setPendingAction(null);
      setPendingLabel("");
    }
  }

  async function handleStartDifficulty(nextDifficulty: Difficulty) {
    const txResult = await sendAction("startDifficulty", nextDifficulty);
    if (!txResult) return;
    await startGame(nextDifficulty, txResult.sessionId);
  }

  async function handlePlayAgain() {
    if (!difficulty) {
      restartGame();
      return;
    }
    await sendAction("playAgain", difficulty);
    restartGame();
  }

  async function handleRetrySameDifficulty() {
    if (!difficulty) return;
    const txResult = await sendAction("retrySameDifficulty", difficulty);
    if (!txResult) return;
    await startGame(difficulty, txResult.sessionId);
  }

  async function submitWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (screen !== "play") return;
    if (timeLeft <= 0) return;
    if (!rootWord) return;

    const normalized = normalizeWord(inputValue);
    if (!normalized) return;
    if (foundWords.includes(normalized)) {
      setMessage("Already found that word.");
      setInputValue("");
      return;
    }

    const response = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: normalized, rootWord }),
    });
    const data = await response.json();
    if (!response.ok || !data.valid) {
      setMessage(data.reason ?? "Invalid word.");
      return;
    }

    setFoundWords((prev) => addUniqueWord(prev, normalized));
    setInputValue("");
    setMessage("");
  }


  function restartGame() {
    setScreen("select");
    setDifficulty(null);
    setRootWord("");
    setDurationSec(0);
    setRequiredCount(0);
    setTimeLeft(0);
    setFoundWords([]);
    setInputValue("");
    setMessage("");
    setPossibleWords([]);
    setStartTime(null);
    setEndTime(null);
  }

  const missingWords = possibleWords.filter(
    (word) => !foundWords.includes(word),
  );
  const visibleMissingWords = missingWords.slice(0, 20);

  const bestScore = difficulty ? getBestScore(difficulty) : null;

  return (
    <div className="game">
      <MiniAppReady
        onDetected={() => setMiniAppDetected(true)}
        onEnvironment={(isMiniApp) => setMiniAppDetected(isMiniApp)}
      />
      <header className="game__header">
        <h1 className="game__title">Crossword</h1>
        <div className="header__actions">
          {miniAppDetected ? <Wallet /> : <InjectedWalletButton />}
        </div>
          {txMessage && <p className="muted">{txMessage}</p>}
      </header>

      {screen === "select" && (
        <section className="panel">
          <h2>Select difficulty</h2>
          <p className="muted">
            Pick a level to start the timer. You must choose before playing.
          </p>
          <div className="difficulty-grid">
            {DIFFICULTIES.map((level) => (
              <button
                key={level}
                className="button button--primary"
                onClick={() => handleStartDifficulty(level)}
                disabled={pendingAction === "startDifficulty"}
              >
                <span className="button__title">
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
                <span className="button__meta">
                  {pendingAction === "startDifficulty"
                    ? pendingLabel || "Confirm in wallet..."
                    : `${DIFFICULTY_CONFIG[level].durationSec}s - ${DIFFICULTY_CONFIG[level].requiredCount} words`}
                </span>
              </button>
            ))}
          </div>
          {message && <p className="error">{message}</p>}
        </section>
      )}

      {screen === "play" && (
        <section className="panel">
          <div className="game__meta">
            <div>
              <p className="label">Root word</p>
              <p className="root-word">{rootWord.toUpperCase()}</p>
            </div>
            <div>
              <p className="label">Time left</p>
              <p className="timer">{timeLeft}s</p>
            </div>
            <div>
              <p className="label">Progress</p>
              <p className="progress">
                Found {foundWords.length} / {requiredCount}
              </p>
            </div>
          </div>

          <form className="word-form" onSubmit={submitWord}>
            <label className="label" htmlFor="word-input">
              Enter a sub-word
            </label>
            <div className="word-form__row">
              <input
                id="word-input"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Type a word"
                disabled={timeLeft <= 0}
              />
              <button className="button button--primary" type="submit">
                Submit
              </button>
            </div>
          </form>
          {message && <p className="error">{message}</p>}

          <div className="list">
            <p className="label">Accepted words</p>
            {foundWords.length === 0 ? (
              <p className="muted">No words yet. Start typing.</p>
            ) : (
              <ul>
                {foundWords.map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="actions">
            <button className="button button--ghost" onClick={endGame}>
              End game
            </button>
            <button className="button button--ghost" onClick={restartGame}>
              Restart
            </button>
          </div>
        </section>
      )}

      {screen === "result" && difficulty && (
        <section className="panel">
          <h2>Results</h2>
          <p className="muted">
            {foundWords.length >= requiredCount
              ? "Target met. Nice run."
              : "Target missed. Try again."}
          </p>

          <div className="results-grid">
            <div>
              <p className="label">Words found</p>
              <p className="stat">{foundWords.length}</p>
            </div>
            <div>
              <p className="label">Time used</p>
              <p className="stat">{timeUsed}s</p>
            </div>
            <div>
              <p className="label">Difficulty</p>
              <p className="stat">
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </p>
            </div>
          </div>

          {bestScore && (
            <p className="muted">
              Best {difficulty}: {bestScore.found} words in{" "}
              {bestScore.timeUsed}s.
            </p>
          )}

          <div className="list">
            <p className="label">Missed words</p>
            {possibleWords.length === 0 ? (
              <p className="muted">Revealing words...</p>
            ) : missingWords.length === 0 ? (
              <p className="muted">You found them all.</p>
            ) : (
              <ul>
                {visibleMissingWords.map((word) => (
                  <li key={word}>{word}</li>
                ))}
              </ul>
            )}
            {missingWords.length > 20 && (
              <p className="muted">
                Showing 20 of {missingWords.length} missed words.
              </p>
            )}
          </div>

          <div className="actions">
            <button
              className="button button--primary"
              onClick={handlePlayAgain}
              disabled={pendingAction === "playAgain"}
            >
              {pendingAction === "playAgain"
                ? pendingLabel || "Confirm in wallet..."
                : "Play again"}
            </button>
            <button
              className="button button--ghost"
              onClick={handleRetrySameDifficulty}
              disabled={pendingAction === "retrySameDifficulty"}
            >
              {pendingAction === "retrySameDifficulty"
                ? pendingLabel || "Confirm in wallet..."
                : "Retry same difficulty"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

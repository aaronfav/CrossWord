"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useAccount, useConnect, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "wagmi/connectors";
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

const DIFFICULTY_ENUM: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  const { writeContractAsync } = useWriteContract();

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

  async function startGame(nextDifficulty: Difficulty) {
    setMessage("");
    setTxMessage("");
    setPossibleWords([]);
    setFoundWords([]);
    setInputValue("");
    setDifficulty(nextDifficulty);

    const response = await fetch(`/api/new-game?difficulty=${nextDifficulty}`);
    if (!response.ok) {
      setMessage("Unable to start a new game. Try again.");
      return;
    }
    const data = await response.json();
    setRootWord(data.rootWord);
    setDurationSec(data.durationSec);
    setRequiredCount(data.requiredCount);
    setTimeLeft(data.durationSec);
    setStartTime(Date.now());
    setEndTime(null);
    setScreen("play");
  }

  async function sendAction(
    action: "startDifficulty" | "playAgain" | "retrySameDifficulty",
    actionDifficulty: Difficulty,
  ) {
    if (!ACTIONS_CONTRACT_ADDRESS) {
      setTxMessage("Contract address missing. Gameplay will continue.");
      return;
    }
    setPendingAction(action);
    try {
      await writeContractAsync({
        address: ACTIONS_CONTRACT_ADDRESS,
        abi: actionsAbi,
        functionName: action,
        args: [DIFFICULTY_ENUM[actionDifficulty]],
      });
    } catch {
      setTxMessage("Transaction rejected or failed. Gameplay continues.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleStartDifficulty(nextDifficulty: Difficulty) {
    await sendAction("startDifficulty", nextDifficulty);
    await startGame(nextDifficulty);
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
    await sendAction("retrySameDifficulty", difficulty);
    await startGame(difficulty);
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
                    ? "Confirm in wallet..."
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
              {pendingAction === "playAgain" ? "Confirm in wallet..." : "Play again"}
            </button>
            <button
              className="button button--ghost"
              onClick={handleRetrySameDifficulty}
              disabled={pendingAction === "retrySameDifficulty"}
            >
              {pendingAction === "retrySameDifficulty"
                ? "Confirm in wallet..."
                : "Retry same difficulty"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

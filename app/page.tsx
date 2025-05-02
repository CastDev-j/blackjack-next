"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SettingsModal } from "@/components/settings-modal";
import { soundManager } from "@/utils/sound-manager";
import { t } from "@/utils/i18n";

// Tipos
type Suit = "hearts" | "diamonds" | "clubs" | "spades";
type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";
type PlayingCard = {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  hidden?: boolean;
};

type GameState = "betting" | "playerTurn" | "dealerTurn" | "gameOver";
type GameResult = "win" | "lose" | "push" | "blackjack" | null;

// Constantes
const INITIAL_BALANCE = 10_000;
const MIN_BET = 10;
const MAX_BET = 1000_000_000;

// Función para mezclar el mazo
const shuffleDeck = (deck: PlayingCard[]) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  soundManager.play("shuffle");
  return newDeck;
};

export default function BlackjackGame() {
  // Estado del juego
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState<GameState>("betting");
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [currentBet, setCurrentBet] = useState(MIN_BET);
  const [result, setResult] = useState<GameResult>(null);
  const [languageKey, setLanguageKey] = useState(0);

  // Efecto para escuchar cambios de idioma
  useEffect(() => {
    const handleLanguageChange = () => setLanguageKey((prev) => prev + 1);
    window.addEventListener("languageChanged", handleLanguageChange);
    return () =>
      window.removeEventListener("languageChanged", handleLanguageChange);
  }, []);

  // Crear y mezclar el mazo
  const createDeck = useCallback(() => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
    const ranks: Rank[] = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];

    const newDeck: PlayingCard[] = [];
    const usedIds = new Set<string>();

    for (let s = 0; s < suits.length; s++) {
      for (let r = 0; r < ranks.length; r++) {
        const id = `${suits[s]}-${ranks[r]}`;
        if (!usedIds.has(id)) {
          usedIds.add(id);
          newDeck.push({
            id,
            suit: suits[s],
            rank: ranks[r],
            value: values[r],
          });
        }
      }
    }

    return shuffleDeck(newDeck);
  }, []);

  // Inicializar el juego
  useEffect(() => {
    setDeck(createDeck());
  }, [createDeck]);

  // Calcular el valor de una mano
  const calculateHandValue = (hand: PlayingCard[]) => {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
      if (!card.hidden) {
        value += card.value;
        if (card.rank === "A") aces++;
      }
    }

    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return value;
  };

  // Repartir una carta con shuffle previo
  const dealCard = (hidden = false) => {
    if (deck.length === 0) return null;

    // Shuffle antes de repartir
    const shuffledDeck = shuffleDeck(deck);
    setDeck(shuffledDeck);

    const newDeck = [...shuffledDeck];
    const card = newDeck.pop()!;
    if (hidden) card.hidden = true;
    setDeck(newDeck);

    soundManager.play("card");
    return card;
  };

  // Iniciar el juego
  const startGame = () => {
    if (balance < currentBet) return;

    soundManager.play("bet");
    setBalance(balance - currentBet);
    const gameDeck = createDeck();

    const newPlayerHand: PlayingCard[] = [];
    const newDealerHand: PlayingCard[] = [];

    if (gameDeck.length > 0) {
      const playerCard = gameDeck.pop()!;
      newPlayerHand.push(playerCard);
    }

    if (gameDeck.length > 1) {
      const dealerCard1 = gameDeck.pop()!;
      const dealerCard2 = gameDeck.pop()!;
      dealerCard2.hidden = true;
      newDealerHand.push(dealerCard1, dealerCard2);
    }

    setDeck(gameDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameState("playerTurn");
  };

  // Pedir carta
  const hit = () => {
    if (deck.length === 0) {
      setDeck(createDeck());
      return;
    }

    const card = dealCard();
    if (!card) return;

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);

    const handValue = calculateHandValue(newHand);
    if (handValue > 21) {
      setGameState("gameOver");
      setResult("lose");
      soundManager.play("lose");
    } else if (handValue === 21) {
      dealerPlay(newHand, dealerHand);
    }
  };

  // Plantarse
  const stand = () => {
    dealerPlay(playerHand, dealerHand);
  };

  // Doblar apuesta
  const doubleDown = () => {
    if (deck.length === 0) {
      setDeck(createDeck());
      return;
    }

    if (balance < currentBet || playerHand.length > 1) return;

    soundManager.play("doubleDown");
    setBalance(balance - currentBet);
    setCurrentBet(currentBet * 2);

    const card = dealCard();
    if (!card) return;

    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    dealerPlay(newHand, dealerHand);
  };

  // Turno del crupier
  const dealerPlay = (
    playerCards: PlayingCard[],
    dealerCards: PlayingCard[]
  ) => {
    setGameState("dealerTurn");

    const newDealerHand = [...dealerCards];
    if (newDealerHand[1]?.hidden) {
      newDealerHand[1].hidden = false;
    }

    let currentDealerHand = [...newDealerHand];
    const playerValue = calculateHandValue(playerCards);

    if (playerValue > 21) {
      setDealerHand(currentDealerHand);
      endGame(playerCards, currentDealerHand);
      return;
    }

    let dealerValue = calculateHandValue(currentDealerHand);

    const dealerDrawCard = () => {
      if (deck.length === 0) {
        const newDeck = createDeck();
        setDeck(newDeck);
      }

      if (dealerValue < 17) {
        const card = dealCard();
        if (card) {
          currentDealerHand = [...currentDealerHand, card];
          setDealerHand(currentDealerHand);
          dealerValue = calculateHandValue(currentDealerHand);
          setTimeout(dealerDrawCard, 300);
        }
      } else {
        endGame(playerCards, currentDealerHand);
      }
    };

    setDealerHand(currentDealerHand);
    setTimeout(dealerDrawCard, 300);
  };

  // Finalizar el juego
  const endGame = (playerCards: PlayingCard[], dealerCards: PlayingCard[]) => {
    const playerValue = calculateHandValue(playerCards);
    const dealerValue = calculateHandValue(dealerCards);

    let gameResult: GameResult = null;
    let winnings = 0;

    if (playerValue > 21) {
      gameResult = "lose";
    } else if (dealerValue > 21) {
      gameResult = "win";
      winnings = currentBet * 2;
      soundManager.play("win");
    } else if (playerValue > dealerValue) {
      if (playerValue === 21 && playerCards.length === 2) {
        gameResult = "blackjack";
        winnings = currentBet * 2.5;
        soundManager.play("win");
      } else {
        gameResult = "win";
        winnings = currentBet * 2;
        soundManager.play("win");
      }
    } else if (playerValue < dealerValue) {
      gameResult = "lose";
      soundManager.play("lose");
    } else {
      gameResult = "push";
      winnings = currentBet;
    }

    setBalance(balance + winnings);
    setResult(gameResult);
    setGameState("gameOver");
  };

  // Nuevo juego
  const newGame = () => {
    setDeck(createDeck());
    setPlayerHand([]);
    setDealerHand([]);
    setGameState("betting");
    setResult(null);
    setCurrentBet(MIN_BET);
  };

  // Renderizar una carta
  const renderCard = (card: PlayingCard, index: number, isDealer = false) => {
    if (card.hidden) {
      return (
        <motion.div
          key={`hidden-${index}`}
          initial={{ rotateY: 180, x: -50, opacity: 0 }}
          animate={{ rotateY: 0, x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="card card-back w-24 h-36 rounded-lg shadow-md bg-blue-800 border-2 border-white flex items-center justify-center"
          style={{ marginLeft: index > 0 ? "-50px" : "0" }}
        >
          <div className="card-pattern w-20 h-32 rounded border-2 border-blue-300 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">?</div>
          </div>
        </motion.div>
      );
    }

    const color =
      card.suit === "hearts" || card.suit === "diamonds"
        ? "text-red-600"
        : "text-black";
    const suitSymbol = {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠",
    }[card.suit];

    return (
      <motion.div
        key={card.id}
        initial={{ rotateY: 180, x: -50, opacity: 0 }}
        animate={{ rotateY: 0, x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        className="card w-24 h-36 rounded-lg shadow-md bg-white border-2 border-gray-300 flex flex-col p-2"
        style={{ marginLeft: index > 0 ? "-50px" : "0" }}
      >
        <div className={`text-left ${color}`}>
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>
        <div
          className={`text-center text-2xl ${color} flex-grow flex items-center justify-center`}
        >
          {suitSymbol}
        </div>
        <div className={`text-right ${color} rotate-180`}>
          <div>{card.rank}</div>
          <div>{suitSymbol}</div>
        </div>
      </motion.div>
    );
  };

  // Renderizar resultado
  const renderResult = () => {
    if (!result) return null;

    const messages = {
      win: t("win"),
      lose: t("lose"),
      push: t("push"),
      blackjack: t("blackjack"),
    };

    const colors = {
      win: "text-green-600",
      lose: "text-red-600",
      push: "text-blue-600",
      blackjack: "text-purple-600",
    };

    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`text-center text-2xl font-bold ${colors[result]} my-4`}
      >
        {messages[result]}
      </motion.div>
    );
  };

  return (
    <div
      key={languageKey}
      className="min-h-screen bg-green-800 flex flex-col items-center justify-center p-4"
    >
      <SettingsModal />

      <h1 className="text-4xl font-bold text-white mb-8">{t("title")}</h1>

      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {gameState === "betting" ? (
            <motion.div
              key="betting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-green-700 rounded-lg p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-white mb-4">{t("bet")}</h2>
              <div className="flex items-center justify-between mb-6">
                <span className="text-white">{MIN_BET}</span>
                <Slider
                  value={[currentBet]}
                  min={MIN_BET}
                  max={Math.min(MAX_BET, balance)}
                  step={10}
                  onValueChange={(value) => setCurrentBet(value[0])}
                  className="w-3/4 mx-4"
                />
                <span className="text-white">{Math.min(MAX_BET, balance)}</span>
              </div>
              <div className="text-center text-2xl text-white mb-6">
                {currentBet}
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={startGame}
                  disabled={balance < currentBet}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-2 rounded-full"
                >
                  {t("deal")}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-green-700 rounded-lg p-6 shadow-lg"
            >
              {/* Mano del crupier */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-2">
                  {t("dealer")}: {calculateHandValue(dealerHand)}
                </h2>
                <div className="flex justify-center items-center h-40 relative">
                  {dealerHand.length > 0 ? (
                    dealerHand.map((card, index) =>
                      renderCard(card, index, true)
                    )
                  ) : (
                    <div className="text-white text-lg">
                      Esperando cartas...
                    </div>
                  )}
                </div>
              </div>

              {/* Resultado */}
              {renderResult()}

              {/* Mano del jugador */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-2">
                  {t("player")}: {calculateHandValue(playerHand)}
                </h2>
                <div className="flex justify-center items-center h-40 relative">
                  {playerHand.length > 0 ? (
                    playerHand.map((card, index) => renderCard(card, index))
                  ) : (
                    <div className="text-white text-lg">
                      Esperando cartas...
                    </div>
                  )}
                </div>
              </div>

              {/* Controles del juego */}
              <div className="flex justify-center gap-4">
                {gameState === "playerTurn" && (
                  <>
                    <Button
                      onClick={hit}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                    >
                      {t("hit")}
                    </Button>
                    <Button
                      onClick={stand}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full"
                    >
                      {t("stand")}
                    </Button>
                    <Button
                      onClick={doubleDown}
                      disabled={balance < currentBet || playerHand.length > 1}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
                    >
                      {t("double")}
                    </Button>
                  </>
                )}
                {gameState === "gameOver" && (
                  <Button
                    onClick={newGame}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-2 rounded-full"
                  >
                    {t("new-game")}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saldo */}
        <motion.div
          className="mt-6 text-center text-xl font-bold text-white"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.2, times: [0, 0.5, 1] }}
        >
          {t("balance")}: {balance}
        </motion.div>
      </div>
    </div>
  );
}

import { handleFireShot } from "./logicHandler.js";

let waitingPlayer = null;
const activeGames = {};

export const setupSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // On join room
    socket.on("join_match", () => {
      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        const player1 = waitingPlayer;
        const player2 = socket;

        const gameId = `${player1.id}_${player2.id}`;

        player1.join(gameId);
        player2.join(gameId);

        activeGames[gameId] = {
          id: gameId,
          player1: player1.id,
          player2: player2.id,
          p1_board: null,
          p2_board: null,
          turn: player1.id,
          status: "setup",
        };

        io.to(gameId).emit("match_found", {
          gameId,
          player1: player1.id,
          player2: player2.id,
          message: "Opponent found! Place your ships.",
        });

        waitingPlayer = null;
      } else {
        waitingPlayer = socket;
        socket.emit("waiting_for_opponent", {
          message: "Looking for an opponent...",
        });
      }
    });

    // Place ship handler
    socket.on("place_ships", ({ gameId, board }) => {
      const game = activeGames[gameId];
      if (!game) return socket.emit("error", "Game not found.");
      if (socket.id === game.player1) {
        game.p1_board = board;
      } else if (socket.id === game.player2) {
        game.p2_board = board;
      }

      if (game.p1_board && game.p2_board) {
        game.status = "playing";
        io.to(gameId).emit("game_start", {
          message: "Both players are ready.",
          turn: game.turn,
        });
      }
    });

    // Shot handler
    handleFireShot(socket, io, activeGames);

    // On disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
        console.log("Removed waiting player from queue.");
        return; 
      }

      for (const gameId in activeGames) {
        const game = activeGames[gameId];

        if (game.status === "finished") continue;

        if (game.player1 === socket.id || game.player2 === socket.id) {
          const winnerId = game.player1 === socket.id ? game.player2 : game.player1;

          game.status = "finished";

          console.log(
            `Player ${socket.id} forfeited. Player ${winnerId} wins game ${gameId}.`,
          );

          io.to(gameId).emit("game_over", {
            winner: winnerId,
            reason: "forfeit",
            message: "Your opponent disconnected. You win by forfeit!",
          });
          break; 
        }
      }
    });
  });
};

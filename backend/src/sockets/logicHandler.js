import { isValidShot, processShot } from '../game.js';

export const handleFireShot = (socket, io, activeGames) => {
  socket.on('fire_shot', ({ gameId, x, y }) => {
    const game = activeGames[gameId];

    if (!game || game.turn !== socket.id) {
      return socket.emit('error', 'Not your turn or game does not exist.');
    }
    const isPlayer1 = socket.id === game.player1;
    const opponentId = isPlayer1 ? game.player2 : game.player1;
    const opponentBoardKey = isPlayer1 ? 'p2_board' : 'p1_board';
    const opponentBoard = game[opponentBoardKey];

    if (!isValidShot(opponentBoard, x, y)) {
      return socket.emit('error', 'Invalid coordinates or already fired here.');
    }

    const { updatedBoard, isHit, sunkShipName, isGameOver } = processShot(opponentBoard, x, y);

    game[opponentBoardKey] = updatedBoard;
    
    if (isGameOver) {
      game.status = 'finished';
      io.to(gameId).emit('game_over', { winner: socket.id });
    } else {
      game.turn = opponentId;

      io.to(gameId).emit('shot_result', {
        x,
        y,
        isHit,
        shooter: socket.id,
        nextTurn: opponentId,
        sunkShipName 
      });
    }
  });
};
const BOARD_SIZE = 10;

export const isWithinBounds = (x, y) => {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
};

export const isValidShot = (opponentBoard, x, y) => {
  if (!isWithinBounds(x, y)) return false;

  const alreadyMissed = opponentBoard.misses.some(
    (miss) => miss.x === x && miss.y === y,
  );
  if (alreadyMissed) return false;

  const alreadyHit = opponentBoard.ships.some((ship) =>
    ship.coordinates.some(
      (coord) => coord.x === x && coord.y === y && coord.isHit,
    ),
  );
  if (alreadyHit) return false;

  return true;
};

export const processShot = (opponentBoard, x, y) => {
  let isHit = false;
  let sunkShipName = null;

  const updatedBoard = JSON.parse(JSON.stringify(opponentBoard));

  for (let ship of updatedBoard.ships) {
    const targetCoord = ship.coordinates.find(
      (coord) => coord.x === x && coord.y === y,
    );

    if (targetCoord) {
      isHit = true;
      targetCoord.isHit = true;

      const isSunk = ship.coordinates.every((coord) => coord.isHit);
      if (isSunk) {
        ship.isSunk = true;
        sunkShipName = ship.type;
      }
      break;
    }
  }

  if (!isHit) {
    updatedBoard.misses.push({ x, y });
  }

  const isGameOver = updatedBoard.ships.every((ship) => ship.isSunk);

  return {
    updatedBoard,
    isHit,
    sunkShipName,
    isGameOver,
  };
};

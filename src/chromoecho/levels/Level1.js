/**
 * Level 1 - Tutorial: Basic Time Loop
 *
 * Objective: Open a door using a pressure plate from your past self
 *
 * Layout (10x8 grid):
 * - P: Player start
 * - #: Wall
 * - .: Floor
 * - O: Pressure Plate
 * - D: Door
 * - X: Exit
 *
 * ##########
 * #P...#...#
 * #....#...#
 * #....D...#
 * #....#..X#
 * #..O.#...#
 * #....#...#
 * ##########
 *
 * Solution:
 * Loop 1: Walk to pressure plate, stand on it
 * Loop 2: Walk through now-open door to exit (exit is behind door)
 */

export const Level1 = {
  id: 1,
  name: "First Echo",
  description: "Learn to cooperate with your past self",

  // Grid dimensions
  width: 10,
  height: 8,

  // Time settings
  loopDuration: 15, // seconds per loop
  maxLoops: 2,

  // Layout: 0 = floor, 1 = wall (wall separates left and right, door is only passage)
  layout: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Door at (5,3) - only way through
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  // Player start position (tile coordinates)
  playerStart: { x: 1, y: 1 },

  // Interactive objects - plate on LEFT side, exit on RIGHT side
  pressurePlates: [
    { x: 3, y: 5, linkedDoorIds: ['door1'] }
  ],

  doors: [
    { id: 'door1', x: 5, y: 3, orientation: 'vertical' }
  ],

  exits: [
    { x: 8, y: 4 }
  ],

  // No guards in tutorial level
  guards: [],

  // Tutorial messages
  tutorial: {
    start: "Press WASD or Arrow Keys to move.\nStand on the green plate to open the door.",
    loop2: "Your past self (ghost) will repeat your actions.\nNow walk through the open door to the exit!",
    hint: "Press R to restart the loop early."
  },

  // Par time for scoring (total seconds across all loops)
  parTime: 20,

  // Minimum loops needed (for scoring)
  minLoops: 2
};

/**
 * Level 2 - Two Plates
 * Requires two pressure plates held simultaneously
 */
export const Level2 = {
  id: 2,
  name: "Double Echo",
  description: "Two plates, one door - you'll need both selves",

  width: 12,
  height: 10,

  loopDuration: 15,
  maxLoops: 3,

  layout: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  playerStart: { x: 2, y: 5 },

  pressurePlates: [
    { x: 2, y: 2, linkedDoorIds: ['door1'] },
    { x: 9, y: 7, linkedDoorIds: ['door1'] }
  ],

  doors: [
    { id: 'door1', x: 5, y: 4, orientation: 'vertical' },
    { id: 'door1', x: 6, y: 4, orientation: 'vertical' }
  ],

  exits: [
    { x: 9, y: 2 }
  ],

  guards: [],

  tutorial: {
    start: "This door needs BOTH plates pressed at once.\nYou'll need to coordinate two loops!",
  },

  parTime: 35,
  minLoops: 2
};

/**
 * Level 3 - First Guard
 * Introduces guards with vision cones
 */
export const Level3 = {
  id: 3,
  name: "Watchful Eye",
  description: "Avoid the guard's vision cone",

  width: 12,
  height: 10,

  loopDuration: 20,
  maxLoops: 3,

  layout: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

  playerStart: { x: 1, y: 8 },

  pressurePlates: [
    { x: 5, y: 5, linkedDoorIds: ['door1'] }
  ],

  doors: [
    { id: 'door1', x: 10, y: 1, orientation: 'horizontal' }
  ],

  exits: [
    { x: 10, y: 1 }
  ],

  guards: [
    {
      path: [
        { x: 3, y: 4 },
        { x: 7, y: 4 },
        { x: 7, y: 6 },
        { x: 3, y: 6 }
      ],
      speed: 1,
      waitTime: 1
    }
  ],

  tutorial: {
    start: "Avoid the red guard's vision cone!\nIf spotted, the loop fails.",
  },

  parTime: 40,
  minLoops: 2
};

// Export all levels as array
export const Levels = [Level1, Level2, Level3];

// Get level by ID
export function getLevelById(id) {
  return Levels.find(level => level.id === id) || null;
}

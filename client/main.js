
"use strict";

import {Binomial} from '../Utility/Binomial.js';
import {solver} from './Solver.js';
import {Board} from './Board.js';

console.log('At start of main.js');

let canvasLocked = false;
let analysing = false;

let BINOMIAL;

let board;

const BOMB = 9;
const HIDDEN = 10;
const FLAGGED = 11;
const FLAGGED_WRONG = 12;
const EXPLODED = 13;

const ACTION_CLEAR = 1;
const ACTION_FLAG = 2;
const ACTION_CHORD = 3;

const PLAY_STYLE_FLAGS = 1;
const PLAY_STYLE_NOFLAGS = 2;
const PLAY_STYLE_EFFICIENCY = 3;
const PLAY_STYLE_NOFLAGS_EFFICIENCY = 4;

let showHints = true;
let playStyle = 'flag';
let overlay = 'none';

let justPressedAnalyse = false;

let facingDownImgUrl = chrome.runtime.getURL("resources/images/facingDown.png");
let facingDownGreenImgUrl = chrome.runtime.getURL("resources/images/facingDownGreen.png");
let facingDownBlackImgUrl = chrome.runtime.getURL("resources/images/facingDownBlack.png");
let facingDownOrangeImgUrl = chrome.runtime.getURL("resources/images/facingDownOrange.png");
let facingDownRedImgUrl = chrome.runtime.getURL("resources/images/facingDownRed.png");

function toggleShowHints(value) {
    showHints = value;
}

function changePlayStyle(value) {
    playStyle = value;
}

function changeOverlay(value) {
    overlay = value;
}

async function startup() {

    BINOMIAL = new Binomial(50000, 200);

    // canvas.addEventListener('mousemove', (event) => followCursor(event));

    // initialise the solver
    await solver();

    console.log('Started Minesweeper Helper');
}

function resetBoard() {
    let boardData = getBoard();

    newBoardFromString(boardData);
}

function getBoard() {
    let width = -1;
    let height = -1;
    let mines = -1;

    let currentLevel = document.getElementsByClassName('level-select-link active')[0];

    if (typeof currentLevel === 'undefined') {
        let numCols = 1000;
        let numRows = 1000;
        let colsAdjusted = false;
        let breakLoop = false;
        let data = '';
        let i;
        for (i = 0; i < numRows; i++) {
            if (breakLoop) {
                break;
            }
            for (let j = 0; j < numCols; j++) {
                let cell = document.getElementById(`cell_${j}_${i}`);
                if (typeof cell === 'undefined' || cell === null) {
                    if (colsAdjusted) {
                        breakLoop = true;
                        break;
                    }
                    numCols = j;
                    colsAdjusted = true;
                    break;
                }
                let cellStatus = 'H';
                if (cell.className.includes('hd_flag')) {
                    cellStatus = 'F';
                } else if (cell.className.includes('hd_type')) {
                    cellStatus = parseInt(cell.className.slice(-1));
                }
                data = data + cellStatus;
            }
            data = data + '\n';
        }
        let hundreds = document.getElementById('top_area_mines_100');
        let tens = document.getElementById('top_area_mines_10');
        let ones = document.getElementById('top_area_mines_1');
        let minesStr = '';
        let listNums = [hundreds, tens, ones];
        for (let num of listNums) {
            if (num.classList.contains('hd_top-area-num0')) {
                minesStr += '0';
            } else if (num.classList.contains('hd_top-area-num1')) {
                minesStr += '1';
            } else if (num.classList.contains('hd_top-area-num2')) {
                minesStr += '2';
            } else if (num.classList.contains('hd_top-area-num3')) {
                minesStr += '3';
            } else if (num.classList.contains('hd_top-area-num4')) {
                minesStr += '4';
            } else if (num.classList.contains('hd_top-area-num5')) {
                minesStr += '5';
            } else if (num.classList.contains('hd_top-area-num6')) {
                minesStr += '6';
            } else if (num.classList.contains('hd_top-area-num7')) {
                minesStr += '7';
            } else if (num.classList.contains('hd_top-area-num8')) {
                minesStr += '8';
            } else if (num.classList.contains('hd_top-area-num9')) {
                minesStr += '9';
            }
        }
        mines = parseInt(minesStr, 10);
        let header = `${numCols}x${i-1}x${mines}\n`;
        return header + data;
    }

    switch (currentLevel.textContent) {
        case 'Easy':
        case 'Beginner':
            width = 9;
            height = 9;
            mines = 10;
            break;
        case 'Medium':
        case 'Intermediate':
            width = 16;
            height = 16;
            mines = 40;
            break;
        case 'Hard':
        case 'Expert':
            width = 30;
            height = 16;
            mines = 99;
            break;
        case 'Evil':
            width = 30;
            height = 20;
            mines = 130;
            break;
        default:
            break;
    }

    if (width === -1) {
        // custom mode
        width = document.getElementById('custom_width').value;
        height = document.getElementById('custom_height').value;
        mines = document.getElementById('custom_mines').value;
    }

    let data = `${width}x${height}x${mines}\n`;
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let cell = document.getElementById(`cell_${j}_${i}`);
            let cellStatus = 'H';
            if (cell.className.includes('hd_flag')) {
                cellStatus = 'F';
            } else if (cell.className.includes('hd_type')) {
                cellStatus = parseInt(cell.className.slice(-1));
            }
            data = data + cellStatus;
        }
        data = data + '\n';
    }
    return data;
}

// stuff to do when we click on the board
function on_click(event, x, y) {

    if (!analysing) {
        // only check clicks if board is being analysed
        return;
    }

    //console.log("Click event at X=" + event.offsetX + ", Y=" + event.offsetY);

    let faceElement = document.getElementById('top_area_face');
    if (faceElement.className.includes('face-lose')) {
        // game is over
        analysing = false;
        window.requestAnimationFrame(() => renderHints([], []));
        return;
    }

    if (canvasLocked) {
        console.log("The canvas is logically locked - this happens while the previous click is being processed");
        return;
    }

    const button = event.which

    const tile = board.getTileXY(x, y);

    // left mouse button
    if (button == 1 && tile.isFlagged()) { 
        // no point clicking on an tile with a flag on it
        console.log("Tile has a flag on it - no action to take");
        return;
    }

    // for all other cases we need to read new board
    resetBoard();
    // analyse new board
    doAnalysis();
    
}

// download as MBF
// create a BLOB of the data, insert a URL to it into the download link
async function downloadAsMBF(e) {

    // create a download name based on the date/time
    const now = new Date();

    const filename = "Download" + now.toISOString() + ".mbf";

    downloadHyperlink.download = filename;

}

// render an array of tiles to the canvas
function renderHints(hints, otherActions) {

    if (hints == null) {
        return;
    }

    let firstGuess = 0;  // used to identify the first (best) guess, subsequent guesses are just for info 
    for (let i = 0; i < hints.length; i++) {

        const hint = hints[i];

        let cell = document.getElementById(`cell_${hint.x}_${hint.y}`);

        if (hint.action == ACTION_CHORD) {
            cell.classList.add('hd_safe'); 
            cell.classList.remove('hd_unsafe');
            cell.classList.remove('hd_dead');
            cell.classList.remove('hd_efficient');
        } else if (hint.prob == 0) {   // mine
            cell.classList.add('hd_unsafe');
            cell.classList.remove('hd_safe');
            cell.classList.remove('hd_dead');
            cell.classList.remove('hd_efficient'); 
        } else if (hint.prob == 1) {  // safe
            cell.classList.add('hd_safe');
            cell.classList.remove('hd_unsafe');
            cell.classList.remove('hd_dead');
            cell.classList.remove('hd_efficient');
        } else if (hint.dead) {  // uncertain but dead
            cell.classList.add('hd_dead');
            cell.classList.remove('hd_safe');
            cell.classList.remove('hd_unsafe');
            cell.classList.remove('hd_efficient'); 
        } else {  //uncertain
            cell.classList.add('hd_efficient');
            cell.classList.remove('hd_safe');
            cell.classList.remove('hd_unsafe');
            cell.classList.remove('hd_dead'); 
            if (firstGuess == 0) {
                firstGuess = 1;
            }
        }
        cell.classList.remove('hd_closed');

        // cell.style.color=cellColor;
        // cell.style.opacity = '0.5';

        // if (firstGuess == 1) {
        //     ctxHints.fillStyle = "#00FF00";
        //     ctxHints.fillRect((hint.x + 0.25) * TILE_SIZE, (hint.y + 0.25) * TILE_SIZE, 0.5 * TILE_SIZE, 0.5 * TILE_SIZE);
        //     firstGuess = 2;
        // }

    }

    // TODO(danielatk): fix this!
    // put percentage over the tile 
    if (overlay != "none") {
        let font = "14px serif";

        for (let tile of board.tiles) {
            if (tile.getHasHint() && tile.isCovered() && !tile.isFlagged() && tile.probability != null) {
                if (!showHints || (tile.probability != 1 && tile.probability != 0)) {  // show the percentage unless we've already colour coded it

                    let value;
                    if (overlay == "safety") {
                        value = tile.probability * 100;
                    } else {
                        value = (1 - tile.probability) * 100;
                    }

                    let value1;
                    if (value < 9.95) {
                        value1 = value.toFixed(1);
                    } else {
                        value1 = value.toFixed(0);
                    }

                    // const offsetX = (TILE_SIZE - ctxHints.measureText(value1).width) / 2;

                    // ctxHints.fillText(value1, tile.x * TILE_SIZE + offsetX, (tile.y + 0.7) * TILE_SIZE, TILE_SIZE);

                }
            }
        }
    }


    if (otherActions == null) {
        return;
    }

    // these are from the efficiency play style and are the known moves which haven't been made
    for (let action of otherActions) {
        let cell = document.getElementById(`cell_${action.x}_${action.y}`);
        if (action.action == ACTION_CLEAR) {
            cell.classList.add('hd_safe');
            cell.classList.remove('hd_unsafe');
            cell.classList.remove('hd_dead');
            cell.classList.remove('hd_efficient');
        } else {
            cell.classList.add('hd_unsafe');
            cell.classList.remove('hd_safe');
            cell.classList.remove('hd_dead');
            cell.classList.remove('hd_efficient');
        }
        cell.classList.remove('hd_closed');
    }

}

// render an array of tiles to the canvas
function renderTiles(tiles) {

    //console.log(tiles.length + " tiles to render");

    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        let tileType = HIDDEN;

        if (tile.isBomb()) {
            if (tile.exploded) {
                tileType = EXPLODED;
            } else {
                tileType = BOMB;
            }
 
        } else if (tile.isFlagged()) {
            if (tile.isBomb() == null || tile.isBomb()) {  // isBomb() is null when the game hasn't finished
                tileType = FLAGGED;
            } else {
                tileType = FLAGGED_WRONG;
            }

        } else if (tile.isCovered()) {
            tileType = HIDDEN;

        } else {
            tileType = tile.getValue();
        }
        draw(tile.x, tile.y, tileType);
    }


}

function newBoardFromString(data) {

    const lines = data.split('\n');
    const size = lines[0].split('x');

    if (size.length != 3) {
        console.log(`Header line is invalid: ${lines[0]}`);
        return;
    }

    const width = parseInt(size[0]);
    const height = parseInt(size[1]);
    const mines = parseInt(size[2]);

    console.log(`width: ${width}, height: ${height}, mines: ${mines}`);

    if (width < 1 || height < 1 || mines < 1) {
        console.log('Invalid dimensions for game');
        return;
    }

    if (lines.length < height + 1) {
        console.log(`Insufficient lines to hold the data: ${lines.length}`);
        return;
    }

    const newBoard = new Board(1, width, height, mines);

    for (let y = 0; y < height; y++) {
        const line = lines[y + 1];
        console.log(line);
        for (let x = 0; x < width; x++) {

            const char = line.charAt(x);
            const tile = newBoard.getTileXY(x, y);

            if (char == 'F') {
                tile.toggleFlag();
                newBoard.bombs_left--;
            } else if (char == '0') {
                tile.setValue(0);
            } else if (char == '1') {
                tile.setValue(1);
            } else if (char == '2') {
                tile.setValue(2);
            } else if (char == '3') {
                tile.setValue(3);
            } else if (char == '4') {
                tile.setValue(4);
            } else if (char == '5') {
                tile.setValue(5);
            } else if (char == '6') {
                tile.setValue(6);
            } else if (char == '7') {
                tile.setValue(7);
            } else if (char == '8') {
                tile.setValue(8);
            } else {
                tile.setCovered(true);
            }
        }
    }

    if (board === null || typeof board === 'undefined') {
        // setup tile listeners only if hasn't been done yet
        for (let i = 0; i < newBoard.height; i++) {
            for (let j = 0; j < newBoard.width; j++) {
                let cell = document.getElementById(`cell_${j}_${i}`);
                cell.addEventListener('click', (event) => 
                    on_click(event, j, i)
                );
            }
        }

        // setup face listener only if hasn't been done yet
        document.getElementById('top_area_face').addEventListener('click', (event) => 
            () => {
                analysing = false;
                window.requestAnimationFrame(() => renderHints([], []));
            }
                
        );
    }


    board = newBoard;

    return newBoard;
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

async function doAnalysis() {

    analysing = true;

    if (canvasLocked) {
        console.log("Already analysing... request rejected");
        return;
    } else {
        console.log("Doing analysis");
        canvasLocked = true;
    }

    // put out a message and wait long enough for the ui to update
    console.log('Analysing...');

    // this will set all the obvious mines which makes the solution counter a lot more efficient on very large boards
    board.resetForAnalysis();
    board.findAutoMove();
 
    const solutionCounter = solver.countSolutions(board);

    if (solutionCounter.finalSolutionsCount != 0) {

         const options = {};
        if (playStyle == "flag") {
            options.playStyle = PLAY_STYLE_FLAGS;
        } else if (playStyle == "noflag") {
            options.playStyle = PLAY_STYLE_NOFLAGS;
        } else if (playStyle == "eff") {
            options.playStyle = PLAY_STYLE_EFFICIENCY;
        } else {
            options.playStyle = PLAY_STYLE_NOFLAGS_EFFICIENCY; 
        } 

        if (overlay != "none") {
            options.fullProbability = true;
        } else {
            options.fullProbability = false;
        }
 
        const solve = await solver(board, options);  // look for solutions
        const hints = solve.actions;

        justPressedAnalyse = true;

        // window.requestAnimationFrame(() => renderHints(hints, solve.other));
        renderHints(hints, solve.other);
    } else {
        console.log("The board is in an invalid state");
        // window.requestAnimationFrame(() => renderHints([], []));
        renderHints([], []);
    }

    // by delaying removing the logical lock we absorb any secondary clicking of the button / hot key
    setTimeout(function () { canvasLocked = false; }, 200);
}

// draw a tile to the canvas
function draw(x, y, tileType) {

    //console.log('Drawing image...');

    if (tileType == BOMB) {
        ctx.drawImage(images[0], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);  // before we draw the bomb depress the square
    }


    ctx.drawImage(images[tileType], x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

}

// have the tooltip follow the mouse
function followCursor(e) {

    // get the tile we're over
    const row = Math.floor(event.offsetY / TILE_SIZE);
    const col = Math.floor(event.offsetX / TILE_SIZE);
    hoverTile = board.getTileXY(col, row);

    // if not showing hints don't show tooltip
    if (!showHints && !justPressedAnalyse) {
        tooltip.innerText = "";
        return;
    }

    //console.log("Following cursor at X=" + e.offsetX + ", Y=" + e.offsetY);

    tooltip.style.left = (TILE_SIZE + e.clientX - 220) + 'px';
    tooltip.style.top = (e.clientY - TILE_SIZE * 1.5 - 70) + 'px';

    if (row >= board.height || row < 0 || col >= board.width || col < 0) {
        //console.log("outside of game boundaries!!");
        tooltip.innerText = "";
        tooltip.style.display = "none";
        return;
    } else {
        const tile = board.getTileXY(col, row);
        tooltip.innerText = tile.asText() + " " + tile.getHintText();
        tooltip.style.display = "inline-block";
    }

}

export {startup, doAnalysis, newBoardFromString, toggleShowHints, changePlayStyle, changeOverlay, resetBoard};
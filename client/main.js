
"use strict";

import {Binomial} from '../Utility/Binomial.js';
import {solver} from './Solver.js';
import {Board} from './Board.js';

console.log('At start of main.js');

let canvasLocked = false;

let BINOMIAL;

const BOMB = 9;

const PLAY_STYLE_FLAGS = 1;
const PLAY_STYLE_NOFLAGS = 2;
const PLAY_STYLE_EFFICIENCY = 3;
const PLAY_STYLE_NOFLAGS_EFFICIENCY = 4;

let showHints = true;
let acceptGuesses = false;
let playStyle = 'Flagging';
let overlay = 'None';

let justPressedAnalyse = false;

function toggleShowHints(value) {
    showHints = value;
}

function toggleAcceptGuesses(value) {
    acceptGuesses = value;
}

function changePlayStyle(value) {
    playStyle = value;
}

function changeOverlay(value) {
    overlay = value;
}

async function startup() {

    BINOMIAL = new Binomial(50000, 200);

    // window.addEventListener("beforeunload", (event) => exiting(event));

    // // add a listener for mouse clicks on the canvas
    // canvas.addEventListener("mousedown", (event) => on_click(event));
    // canvas.addEventListener("mouseup", (event) => mouseUpEvent(event));
    // canvas.addEventListener('mousemove', (event) => followCursor(event));
    // canvas.addEventListener('wheel', (event) => on_mouseWheel(event));
    // canvas.addEventListener('mouseenter', (event) => on_mouseEnter(event));
    // canvas.addEventListener('mouseleave', (event) => on_mouseLeave(event));

    // docMinesLeft.addEventListener('wheel', (event) => on_mouseWheel_minesLeft(event));

    // // add some hot key 
    // document.addEventListener('keyup', event => { keyPressedEvent(event) });

    // initialise the solver
    await solver();

    console.log('Started Minesweeper Helper');
}

// stuff to do when we click on the board
function on_click(event) {

    //console.log("Click event at X=" + event.offsetX + ", Y=" + event.offsetY);

    if (board.isGameover()) {
        console.log("The game is over - no action to take");
        return;
    }

    if (canvasLocked) {
        console.log("The canvas is logically locked - this happens while the previous click is being processed");
        return;
    } 

    const row = Math.floor(event.offsetY / TILE_SIZE);
    const col = Math.floor(event.offsetX / TILE_SIZE);

    //console.log("Resolved to Col=" + col + ", row=" + row);

    let message;

    if (row >= board.height || row < 0 || col >= board.width || col < 0) {
        console.log("Click outside of game boundaries!!");
        return;

    } else if (analysisMode) {  // analysis mode

        const button = event.which

        const tile = board.getTileXY(col, row);

        let tiles = [];

        if (button == 1) {   // left mouse button

            if (tile.isFlagged()) {  // no point clicking on an tile with a flag on it
                console.log("Tile has a flag on it - no action to take");
                return;
            }

            if (!board.isStarted()) {
                 board.setStarted();
            }

            // allow for dragging and remember the tile we just changed
            dragging = true;
            dragTile = tile;

            if (tile.isCovered()) {
                const flagCount = board.adjacentFoundMineCount(tile);
                tile.setValue(flagCount);
            } else {
                tile.setCovered(true);
            }

            tiles.push(tile);

        } else if (button == 3) {  // right mouse button

            // toggle the flag and return the tiles which need to be redisplayed
            tiles = analysis_toggle_flag(tile);

            console.log("Number of bombs " + board.num_bombs + "  bombs left to find " + board.bombs_left);

        } else {
            console.log("Mouse button " + button + " ignored");
            return;
        }

        // update the graphical board
        window.requestAnimationFrame(() => renderTiles(tiles));

    } else {  // play mode
        const button = event.which

        const tile = board.getTileXY(col, row);

        if (button == 1) {   // left mouse button

            if (tile.isFlagged()) {  // no point clicking on an tile with a flag on it
                console.log("Tile has a flag on it - no action to take");
                return;
            }

            if (!board.isStarted()) {
                //message = {"id" : "new", "index" : board.xy_to_index(col, row), "action" : 1};
                board.setStarted();
            }

            //if (!tile.isCovered()) {  // no point clicking on an already uncovered tile
            //	console.log("Tile is already revealed - no action to take");
            //	return;
            //}

            if (!tile.isCovered()) {  // clicking on a revealed tile is considered chording
                if (board.canChord(tile)) {
                    message = { "header": board.getMessageHeader(), "actions": [{ "index": board.xy_to_index(col, row), "action": 3 }] }; //chord
                } else {
                    console.log("Tile is not able to be chorded - no action to take");
                    return;
                }

            } else {
                message = { "header": board.getMessageHeader(), "actions": [{ "index": board.xy_to_index(col, row), "action": 1 }] }; // click
            }

        } else if (button == 3) {  // right mouse button

            if (!tile.isCovered()) {  // no point flagging an already uncovered tile
                return;
            }

            if (!board.isStarted()) {
                console.log("Can't flag until the game has started!");
                return;
            } else {
                message = { "header": board.getMessageHeader(), "actions": [{ "index": board.xy_to_index(col, row), "action": 2 }] };
            }

        } else {
            console.log("Mouse button " + button + " ignored");
            return;
        }
    }

    // we don't need to send a message if we are drawing a board in analysis mode
    if (!analysisMode) {
        // one last check before we send the message
        if (canvasLocked) {
            console.log("The canvas is logically locked");
            return;
        } else {
            canvasLocked = true;
        }

        justPressedAnalyse = false;

        sendActionsMessage(message);
    }

}

// launch a floating window to store/retrieve from local storage
function openLocalStorage() {

    console.log("There are " + localStorage.length + " items in local storage");

    // remove all the options from the selection
    localStorageSelection.length = 0;

    // iterate localStorage
    for (let i = 0; i < localStorage.length; i++) {

        // set iteration key name
        const key = localStorage.key(i);

        const option = document.createElement("option");
        option.text = key;
        option.value = key;
        localStorageSelection.add(option);

        // use key name to retrieve the corresponding value
        const value = localStorage.getItem(key);

        // console.log the iteration key and value
        console.log('Key: ' + key + ', Value: ' + value);

    }

    localStorageModal.style.display = "block";

}

function closeLocalStorage() {

    localStorageModal.style.display = "none";

}

function saveLocalStorage() {

    const key = localStorageSelection.value;

    console.log("Saving board position to local storage key '" + key + "'");

}

// download as MBF
// create a BLOB of the data, insert a URL to it into the download link
async function downloadAsMBF(e) {

    // if we are in analysis mode then create the url, otherwise the url was created when the game was generated
    if (analysisMode) {
        if (board == null) {
            e.preventDefault();
            console.log("No Board defined, unable to generate MBF");
            return false;
        }

        if (board.bombs_left != 0) {
            console.log("Mines left must be zero in order to download the board from Analysis mode.");
            e.preventDefault();
            return false;
        }

        const mbf = board.getFormatMBF();

        if (mbf == null) {
            console.log("Null data returned from getFormatMBF()");
            e.preventDefault();
            return false;
        }

        const blob = new Blob([mbf], { type: 'application/octet-stream' })

        const url = URL.createObjectURL(blob);

        console.log(url);

        downloadHyperlink.href = url;  // Set the url ready to be downloaded

        // give it 10 seconds then revoke the url
        setTimeout(function () { console.log("Revoked " + url); URL.revokeObjectURL(url) }, 10000, url);
    }

    // create a download name based on the date/time
    const now = new Date();

    const filename = "Download" + now.toISOString() + ".mbf";

    downloadHyperlink.download = filename;

}

function switchToAnalysis(doAnalysis) {

    if (doAnalysis) {
        gameBoard = board;
        board = analysisBoard;

        showDownloadLink(true, "")  // display the hyperlink

        title.innerHTML = "Minesweeper analyser";  // change the title
        switchButton.innerHTML = "Switch to Player";
    } else {
        analysisBoard = board;
        board = gameBoard;

        showDownloadLink(false, "")  // hide the hyperlink (we don't have the url until we play a move - this could be improved)

        title.innerHTML = "Minesweeper player"; // change the title
        switchButton.innerHTML = "Switch to Analyser";
    }

    changeTileSize();

    //resizeCanvas(board.width, board.height);

    //browserResized();

    renderHints([]);  // clear down hints

    //renderTiles(board.tiles); // draw the board

    updateMineCount(board.bombs_left);  // reset the mine count

    analysisMode = doAnalysis;
}

// render an array of tiles to the canvas
function renderHints(hints, otherActions) {

    //console.log(hints.length + " hints to render");

    ctxHints.clearRect(0, 0, canvasHints.width, canvasHints.height);

    if (hints == null) {
        return;
    }

    let firstGuess = 0;  // used to identify the first (best) guess, subsequent guesses are just for info 
    for (let i = 0; i < hints.length; i++) {

        const hint = hints[i];

        if (hint.action == ACTION_CHORD) {
            ctxHints.fillStyle = "#00FF00";
        } else if (hint.prob == 0) {   // mine
            ctxHints.fillStyle = "#FF0000";
        } else if (hint.prob == 1) {  // safe
            ctxHints.fillStyle = "#00FF00";
        } else if (hint.dead) {  // uncertain but dead
            ctxHints.fillStyle = "black";
        } else {  //uncertain
            ctxHints.fillStyle = "orange";
            if (firstGuess == 0) {
                firstGuess = 1;
            }
        }

        ctxHints.globalAlpha = 0.5;

        //console.log("Hint X=" + hint.x + " Y=" + hint.y);
        ctxHints.fillRect(hint.x * TILE_SIZE, hint.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (firstGuess == 1) {
            ctxHints.fillStyle = "#00FF00";
            ctxHints.fillRect((hint.x + 0.25) * TILE_SIZE, (hint.y + 0.25) * TILE_SIZE, 0.5 * TILE_SIZE, 0.5 * TILE_SIZE);
            firstGuess = 2;
        }

    }

     // put percentage over the tile 
    if (overlay != "none") {

        if (TILE_SIZE == 12) {
            ctxHints.font = "7px serif";
        } else if (TILE_SIZE == 16) {
            ctxHints.font = "10px serif";
        } else if (TILE_SIZE == 20) {
            ctxHints.font = "12px serif";
        } else if (TILE_SIZE == 24) {
            ctxHints.font = "14px serif";
        } else if (TILE_SIZE == 28) {
            ctxHints.font = "16px serif";
        } if (TILE_SIZE == 32) {
            ctxHints.font = "21px serif";
        } else {
            ctxHints.font = "6x serif";
        }

        ctxHints.globalAlpha = 1;
        ctxHints.fillStyle = "black";
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

                    const offsetX = (TILE_SIZE - ctxHints.measureText(value1).width) / 2;

                    ctxHints.fillText(value1, tile.x * TILE_SIZE + offsetX, (tile.y + 0.7) * TILE_SIZE, TILE_SIZE);

                }
            }
        }
    }


    if (otherActions == null) {
        return;
    }

    ctxHints.globalAlpha = 1;
    // these are from the efficiency play style and are the known moves which haven't been made
    for (let action of otherActions) {
        if (action.action == ACTION_CLEAR) {
            ctxHints.fillStyle = "#00FF00";
        } else {
            ctxHints.fillStyle = "#FF0000";
        }
        ctxHints.fillRect((action.x + 0.35) * TILE_SIZE, (action.y + 0.35) * TILE_SIZE, 0.3 * TILE_SIZE, 0.3 * TILE_SIZE);
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

function updateMineCount(minesLeft) {

    let work = minesLeft;
    const digits = getDigitCount(minesLeft);

    let position = digits - 1;

    docMinesLeft.width = DIGIT_WIDTH * digits;

    for (let i = 0; i < DIGITS; i++) {

        const digit = work % 10;
        work = (work - digit) / 10;

        ctxBombsLeft.drawImage(led_images[digit], DIGIT_WIDTH * position + 2, 2, DIGIT_WIDTH - 4, DIGIT_HEIGHT - 4);

        position--;
    }

}

function getDigitCount(mines) {

    let digits;
    if (mines < 1000) {
        digits = 3;
    } else if (mines < 10000) {
        digits = 4;
    } else {
        digits = 5;
    }

    return digits;
}

// display or hide the download link 
function showDownloadLink(show, url) {

    if (show) {
        downloadHyperlink.style.display = "block";
        if (url != null) {
            downloadHyperlink.href = url;
        }

    } else {
        downloadHyperlink.style.display = "none";
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

    const board = new Board(1, width, height, mines);

    for (let y = 0; y < height; y++) {
        const line = lines[y + 1];
        console.log(line);
        for (let x = 0; x < width; x++) {

            const char = line.charAt(x);
            const tile = board.getTileXY(x, y);

            if (char == 'F') {
                tile.toggleFlag();
                board.bombs_left--;
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

    return board;
}

async function sleep(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

async function doAnalysis(board) {

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
 
        //var hints = solver(board, options).actions;  // look for solutions

        const solve = await solver(board, options);  // look for solutions
        const hints = solve.actions;

        justPressedAnalyse = true;

        // hints format:
        // x: x coordinate
        // y: y coordinate

        // window.requestAnimationFrame(() => renderHints(hints, solve.other));
    } else {
        console.log("The board is in an invalid state");
        // window.requestAnimationFrame(() => renderHints([], []));
    }

    // by delaying removing the logical lock we absorb any secondary clicking of the button / hot key
    setTimeout(function () { canvasLocked = false; }, 200);
}

async function checkBoard() {

    if (!analysisMode) {
        return;
    }

    // this will set all the obvious mines which makes the solution counter a lot more efficient on very large boards
    board.resetForAnalysis();
 
    const currentBoardHash = board.getHashValue();

    if (currentBoardHash == previousBoardHash) {
        return;
    } 

    previousBoardHash = currentBoardHash;

    console.log("Checking board with hash " + currentBoardHash);

    board.findAutoMove();
    const solutionCounter = await solver.countSolutions(board);
    board.resetForAnalysis();

    if (solutionCounter.finalSolutionsCount != 0) {
        analysisButton.disabled = false;
        //console.log("The board has" + solutionCounter.finalSolutionsCount + " possible solutions");
        let logicText;
        if (solutionCounter.clearCount != 0) {
            logicText = "There are safe tile(s). ";
        } else {
            logicText = "There are no safe tiles. ";
        }

        console.log("The board is valid. " + board.getFlagsPlaced() + " Mines placed. " + logicText + formatSolutions(solutionCounter.finalSolutionsCount));
        
    } else {
        analysisButton.disabled = true;
        console.log("The board is in an invalid state. " + board.getFlagsPlaced() + " Mines placed. ");
    }

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
    if (!showHints && !analysisMode && !justPressedAnalyse) {
        tooltip.innerText = "";
        return;
    }

    //console.log("Following cursor at X=" + e.offsetX + ", Y=" + e.offsetY);

    tooltip.style.left = (TILE_SIZE + e.clientX - 220) + 'px';
    tooltip.style.top = (e.clientY - TILE_SIZE * 1.5 - 70) + 'px';

    if (dragging && analysisMode) {

        const tile = hoverTile;

        if (!tile.isEqual(dragTile)) {

            dragTile = tile;  // remember the latest tile

            if (tile.isCovered()) {
                const flagCount = board.adjacentFoundMineCount(tile);
                tile.setValue(flagCount);
            } else {
                tile.setCovered(true);
            }

            // update the graphical board
            window.requestAnimationFrame(() => renderTiles([tile]));
        }

    }

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

function mouseUpEvent(e) {
    if (dragging && e.which == 1) {
        console.log("Dragging stopped due to  mouse up event");
        dragging = false;
    }
}

function on_mouseEnter(e) {

    tooltip.style.display = "inline-block";
 
}

function on_mouseLeave(e) {

    hoverTile = null;

    tooltip.style.display = "none";

    if (dragging) {
        console.log("Dragging stopped due to mouse off canvas");
        dragging = false;
    }

}

/**
 * toggle the flag and update any adjacent tiles
 * Return the tiles which need to be redisplayed
 */
function analysis_toggle_flag(tile) {

    const tiles = [];

    if (!tile.isCovered()) {
        tile.setCovered(true);
    }

    let delta;
    if (tile.isFlagged()) {
        delta = -1;
        tile.foundBomb = false;  // in analysis mode we believe the flags are mines
    } else {
        delta = 1;
        tile.foundBomb = true;  // in analysis mode we believe the flags are mines
    }

    // if we have locked the mine count then adjust the bombs left 
    if (lockMineCount.checked) {
        if (delta == 1 && board.bombs_left == 0) {
            console.log("Can't reduce mines to find to below zero whilst the mine count is locked");
            return tiles;
        }
        board.bombs_left = board.bombs_left - delta;
        window.requestAnimationFrame(() => updateMineCount(board.bombs_left));

    } else {   // otherwise adjust the total number of bombs
        const tally = board.getFlagsPlaced();
        board.num_bombs = tally + board.bombs_left + delta;
    }

    // if the adjacent tiles values are in step then keep them in step
    const adjTiles = board.getAdjacent(tile);
    for (let i = 0; i < adjTiles.length; i++) {
        const adjTile = adjTiles[i];
        const adjFlagCount = board.adjacentFlagsPlaced(adjTile);
        if (adjTile.getValue() == adjFlagCount) {
            adjTile.setValueOnly(adjFlagCount + delta);
            tiles.push(adjTile);
        }
    }

    tile.toggleFlag();
    tiles.push(tile);

    return tiles;
}


function on_mouseWheel(event) {

    if (!analysisMode) {
        return;
    }

    //board.resetForAnalysis();

    //console.log("Mousewheel event at X=" + event.offsetX + ", Y=" + event.offsetY);

    const row = Math.floor(event.offsetY / TILE_SIZE);
    const col = Math.floor(event.offsetX / TILE_SIZE);

    //console.log("Resolved to Col=" + col + ", row=" + row);

    const delta = Math.sign(event.deltaY);

    const tile = board.getTileXY(col, row);

    const flagCount = board.adjacentFoundMineCount(tile);
    const covered = board.adjacentCoveredCount(tile);

    let newValue;
    if (tile.isCovered()) {
        newValue = flagCount;
    } else {
        newValue = tile.getValue() + delta;
    }
 
    if (newValue < flagCount) {
        newValue = flagCount + covered;
    } else if (newValue > flagCount + covered) {
        newValue = flagCount;
    }

    tile.setValue(newValue);

     // update the graphical board
    window.requestAnimationFrame(() => renderTiles([tile]));

}

function on_mouseWheel_minesLeft(event) {

    if (!analysisMode) {
        return;
    }

    //console.log("Mousewheel event at X=" + event.offsetX + ", Y=" + event.offsetY);

    const delta = Math.sign(event.deltaY);

    const digit = Math.floor(event.offsetX / DIGIT_WIDTH);

    //console.log("Mousewheel event at X=" + event.offsetX + ", Y=" + event.offsetY + ", digit=" + digit);

    let newCount = board.bombs_left;

    const digits = getDigitCount(newCount);

    if (digit == digits - 1) {
        newCount = newCount + delta; 
    } else if (digit == digits - 2) {
        newCount = newCount + delta * 10;
    } else {
        newCount = newCount + delta * 10;
    }

    const flagsPlaced = board.getFlagsPlaced();

    if (newCount < 0) {
        board.bombs_left = 0;
        board.num_bombs = flagsPlaced;
    } else if (newCount > 9999) {
        board.bombs_left = 9999;
        board.num_bombs = 9999 + flagsPlaced;
    } else {
        board.bombs_left = newCount;
        board.num_bombs = newCount + flagsPlaced;
    }

    window.requestAnimationFrame(() => updateMineCount(board.bombs_left));

}

// Prevent default behavior (Prevent file from being opened)
function dragOverHandler(ev) {
    //console.log('File(s) in drop zone');
    ev.preventDefault();
}

function buildMessageFromActions(actions, safeOnly) {

    const message = { "header": board.getMessageHeader(), "actions": [] };

    for (let i = 0; i < actions.length; i++) {

        const action = actions[i];

        if (action.action == ACTION_CHORD) {
            message.actions.push({ "index": board.xy_to_index(action.x, action.y), "action": 3 });

        } else if (action.prob == 0) {   // zero safe probability == mine
            message.actions.push({ "index": board.xy_to_index(action.x, action.y), "action": 2 });

        } else {   // otherwise we're trying to clear
            if (!safeOnly || safeOnly && action.prob == 1) {
                message.actions.push({ "index": board.xy_to_index(action.x, action.y), "action": 1 });
            }
        }
    }

    return message;

}


// send a JSON message to the server describing what action the user made
async function sendActionsMessage(message) {

    const outbound = JSON.stringify(message);

    console.log("==> " + outbound);

    // either play locally or send to server
    let reply;
    if (PLAY_CLIENT_SIDE) {
        reply = await handleActions(message);
    } else {
        const json_data = await fetch("/data", {
            method: "POST",
            body: outbound,
            headers: new Headers({
                "Content-Type": "application/json"
            })
        });

        reply = await json_data.json();
    }

    console.log("<== " + JSON.stringify(reply));
    //console.log(reply.header);

    if (board.id != reply.header.id) {
        console.log("Game when message sent " + reply.header.id + " game now " + board.id + " ignoring reply");
        canvasLocked = false;
        return;
    }

    if (board.seed == 0) {
        board.seed = reply.header.seed;
        console.log("Setting game seed to " + reply.header.seed);
        seedText.value = board.seed;
    }

    if (reply.header.status == "lost") { 
        document.getElementById("canvas").style.cursor = "default";
        board.setGameLost();
    } else if (reply.header.status == "won") {
        document.getElementById("canvas").style.cursor = "default";
        board.setGameWon();
    } 

    if (reply.tiles.length == 0) {
        console.log("Unable to continue");
        document.getElementById("canvas").style.cursor = "default";
        canvasLocked = false;
        return;
    }

    // add the hyperlink the hyperlink
    if (reply.header.url != null) {
        showDownloadLink(true, reply.header.url);
    }
 
    // translate the message and redraw the board
    const tiles = [];
    const prevMineCounter = board.bombs_left;

    // apply the changes to the logical board
    for (let i = 0; i < reply.tiles.length; i++) {

        const target = reply.tiles[i];

        const index = target.index;
        const action = target.action;

        const tile = board.getTile(index);

        if (action == 1) {    // reveal value on tile
            tile.setValue(target.value);
            tiles.push(tile);

        } else if (action == 2) {  // add or remove flag
            if (target.flag != tile.isFlagged()) {
                tile.toggleFlag();
                if (tile.isFlagged()) {
                    board.bombs_left--;
                } else {
                    board.bombs_left++;
                }
                tiles.push(tile);
            }

        } else if (action == 3) {  // a tile which is a mine (these get returned when the game is lost)
            board.setGameLost();
            tile.setBomb(true);
            tiles.push(tile);

        } else if (action == 4) {  // a tile which is a mine and is the cause of losing the game
            board.setGameLost();
            tile.setBombExploded();
            tiles.push(tile);

        } else if (action == 5) {  // a which is flagged but shouldn't be
            tile.setBomb(false);
            tiles.push(tile);

        } else {
            console.log("action " + action + " is not valid");
        }

    }

    // update the mine count if a flag has changed
    if (prevMineCounter != board.bombs_left) {
        window.requestAnimationFrame(() => updateMineCount(board.bombs_left));
    }

    // update the graphical board
    window.requestAnimationFrame(() => renderTiles(tiles));

    if (board.isGameover()) {
        console.log("Game is over according to the server");
        canvasLocked = false;
        window.requestAnimationFrame(() => renderHints([], []));  // clear the hints overlay

        const value3BV = reply.header.value3BV;
        const solved3BV = reply.header.solved3BV;
        const actionsMade = reply.header.actions;

        let efficiency;
        if (reply.header.status == "won") {
            efficiency = (100 * value3BV / actionsMade).toFixed(2) + "%";
        } else {
            efficiency = (100 * solved3BV / actionsMade).toFixed(2) + "%";
        }

        // if the current game is no longer in play then no need to remember the games details
        currentGameDescription = null;
        localStorage.removeItem(GAME_DESCRIPTION_KEY);

        console.log("The game has been " + reply.header.status + ". 3BV: " + solved3BV + "/" + value3BV + ",  Actions: " + actionsMade + ",  Efficiency: " + efficiency);
        return;
    }

    const solverStart = Date.now();

    let assistedPlay = docFastPlay.checked;
    let assistedPlayHints;
    if (assistedPlay) {
        assistedPlayHints = board.findAutoMove();
        if (assistedPlayHints.length == 0) {
            assistedPlay = false;
        }
    } else {
        assistedPlayHints = [];
    }

    // do we want to show hints
    if (showHints || autoPlayCheckBox.checked || assistedPlayHints.length != 0 || overlay != "none") {

        document.getElementById("canvas").style.cursor = "wait";

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

        let hints;
        let other;
        if (assistedPlay) {
            hints = assistedPlayHints;
            other = [];
        } else {
            const solve = await solver(board, options);  // look for solutions
            hints = solve.actions;
            other = solve.other;
        }

        const solverDuration = Date.now() - solverStart;

        if (board.id != reply.header.id) {
            console.log("Game when Solver started " + reply.header.id + " game now " + board.id + " ignoring solver results");
            canvasLocked = false;
            return;
        }

        //console.log("Rendering " + hints.length + " hints");
        //setTimeout(function () { window.requestAnimationFrame(() => renderHints(hints)) }, 10);  // wait 10 milliseconds to prevent a clash with the renderTiles redraw

        // only show the hints if the hint box is checked
        if (showHints) {
            window.requestAnimationFrame(() => renderHints(hints, other));
        } else {
            window.requestAnimationFrame(() => renderHints([], []));  // clear the hints overlay
            console.log("Press the 'Analyse' button to see the solver's suggested move.");
        }

        if (autoPlayCheckBox.checked || assistedPlay) {
            if (hints.length > 0 && (hints[0].prob == 1 || hints[0].prob == 0)) {
                const message = buildMessageFromActions(hints, true);  // send all safe actions

                const wait = Math.max(0, (CYCLE_DELAY - solverDuration));

                setTimeout(function () { sendActionsMessage(message) }, wait);

            } else if (hints.length > 0 && acceptGuesses) { // if we are accepting guesses

                //const hint = [];
                //hint.push(hints[0]);

                const message = buildMessageFromActions([hints[0]], false); // if we are guessing send only the first guess

                const wait = Math.max(0, (CYCLE_DELAY - solverDuration));

                setTimeout(function () { sendActionsMessage(message) }, wait);

            } else {
                document.getElementById("canvas").style.cursor = "default";
                canvasLocked = false;
                currentGameDescription = reply.header;
            }
        } else {
            document.getElementById("canvas").style.cursor = "default";
            canvasLocked = false;
            currentGameDescription = reply.header;
        }

    } else {
        canvasLocked = false;
        window.requestAnimationFrame(() => renderHints([], []));  // clear the hints overlay
        document.getElementById("canvas").style.cursor = "default";
        console.log("The solver is not running. Press the 'Analyse' button to see the solver's suggested move.");
        currentGameDescription = reply.header;
    }
 
    return reply;

}

// load an image 
function load_image(image_path) {
    const image = new Image();
    image.addEventListener('load', function () {

        console.log("An image has loaded: " + image_path);
        imagesLoaded++;
        if (imagesLoaded == images.length + led_images.length) {
            startup();
        }

    }, false);
    image.src = image_path;
    return image;
}

function load_images() {

    console.log('Loading images...');

    for (let i = 0; i <= 8; i++) {
        const file_path = "resources/images/" + i.toString() + ".png";
        images.push(load_image(file_path));
        const led_path = "resources/images/led" + i.toString() + ".svg";
        led_images.push(load_image(led_path));
    }

    led_images.push(load_image("resources/images/led9.svg"));

    images.push(load_image("resources/images/bomb.png"));
    images.push(load_image("resources/images/facingDown.png"));
    images.push(load_image("resources/images/flagged.png"));
    images.push(load_image("resources/images/flaggedWrong.png"));
    images.push(load_image("resources/images/exploded.png"));

    console.log(images.length + ' Images Loaded');

}

export {startup, doAnalysis, newBoardFromString, toggleShowHints, toggleAcceptGuesses, changePlayStyle, changeOverlay};
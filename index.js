/**
 * @Author: Daniel Atkinson
 * @email:  danatkhoo@gmail.com
 * @date:   2023-02-16
 */

/**
 * Functionalities to add:
 * - export in mbf format
 * - export to chosen location
 * - add analysis support
 */

let canvasLocked = false;

let BINOMIAL;

const BOMB = 9;

const showHintsCheckBox = document.getElementById("showhints");
const acceptGuessesCheckBox = document.getElementById("acceptguesses");
const analysisButton = document.getElementById("AnalysisButton");
const docPlayStyle = document.getElementById("playstyle");
const docOverlay = document.getElementById("overlay");

chrome.runtime.onStartup.addListener(function () {
    startup();
});

function startup() {

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

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'export') {
        let board = getBoard();
        console.log(board);
        sendResponse(board);
    }
});

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
    if (analysisMode) {
        board.resetForAnalysis();
        board.findAutoMove();
    }
 
    const solutionCounter = solver.countSolutions(board);

    if (solutionCounter.finalSolutionsCount != 0) {

         const options = {};
        if (docPlayStyle.value == "flag") {
            options.playStyle = PLAY_STYLE_FLAGS;
        } else if (docPlayStyle.value == "noflag") {
            options.playStyle = PLAY_STYLE_NOFLAGS;
        } else if (docPlayStyle.value == "eff") {
            options.playStyle = PLAY_STYLE_EFFICIENCY;
        } else {
            options.playStyle = PLAY_STYLE_NOFLAGS_EFFICIENCY; 
        } 

        if (docOverlay.value != "none") {
            options.fullProbability = true;
        } else {
            options.fullProbability = false;
        }
 
        //var hints = solver(board, options).actions;  // look for solutions

        const solve = await solver(board, options);  // look for solutions
        const hints = solve.actions;

        justPressedAnalyse = true;

        window.requestAnimationFrame(() => renderHints(hints, solve.other));
    } else {
        showMessage("The board is in an invalid state");
        window.requestAnimationFrame(() => renderHints([], []));
    }

    // by delaying removing the logical lock we absorb any secondary clicking of the button / hot key
    setTimeout(function () { canvasLocked = false; }, 200);
    //canvasLocked = false;

}

function getBoard() {
    let width = -1;
    let height = -1;
    let mines = -1;

    let currentLevel = document.getElementsByClassName('level-select-link active')[0];

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
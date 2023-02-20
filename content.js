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

 let contentMain;

(async () => {
    const src = chrome.runtime.getURL('client/main.js');
    contentMain = await import(src);
    contentMain.startup();
})();

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    let board;
    switch(msg.text) {
        case 'export':
            board = getBoard();
            console.log(board);
            sendResponse(board);
            break;
        case 'analyse':
            let boardData = getBoard();
            board = contentMain.newBoardFromString(boardData);
            contentMain.doAnalysis(board);
            break;
        case 'change-overlay':
            contentMain.changeOverlay(msg.value.toLowerCase());
            break;
        case 'change-playstyle':
            contentMain.changePlayStyle(msg.value.toLowerCase());
            break;
        case 'change-showhints':
            contentMain.toggleShowHints(msg.marked);
            break;
        case 'change-acceptguesses':
            contentMain.toggleAcceptGuesses(msg.marked);
            break;
        default:
            break;
    }
});

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
/**
 * @Author: Daniel Atkinson
 * @email:  danatkhoo@gmail.com
 * @date:   2023-02-16
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
            contentMain.resetBoard();
            contentMain.doAnalysis();
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
        default:
            break;
    }
});

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
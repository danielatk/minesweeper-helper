/**
 * @Author: Daniel Atkinson
 * @email:  danatkhoo@gmail.com
 * @date:   2023-02-16
 */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.text === 'export') {
        console.log(getBoard());
        sendResponse(getBoard());
    }
});

function getBoard() {
    var numCols = 1000;
    var numRows = 1000;
    var colsAdjusted = false;
    var breakLoop = false;
    var board = [];
    for (var i = 0; i < numRows; i++) {
        if (breakLoop) {
            break;
        }
        var row = [];
        for (var j = 0; j < numCols; j++) {
            var cell = document.getElementById(`cell_${j}_${i}`);
            if (typeof cell === 'undefined' || cell === null) {
                if (colsAdjusted) {
                    breakLoop = true;
                    break;
                }
                numCols = j;
                colsAdjusted = true;
                break;
            }
            var cellStatus = 'H';
            if (cell.className.includes('hd_flag')) {
                cellStatus = 'F';
            } else if (cell.className.includes('hd_type')) {
                cellStatus = parseInt(cell.className.slice(-1));
            }
            row.push(cellStatus)
        }
        board.push(row);
    }
    return board;
}
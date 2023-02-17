// board is an array of arrays, to be converted to csv
function showData(board) {
  if (board.length > 0) {
      const currentDate = new Date();
      const timestamp = currentDate. getTime();
      let boardDescription = board.split('\n')[0];

      let tempElem = document.createElement('a');
      tempElem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(board));
      tempElem.setAttribute('download', `${boardDescription}_${timestamp}`);
      tempElem.click();
  }
};


document.getElementById('export').addEventListener('click',
function() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    let activeTab;
    let urlRegex = /^https?:\/\/(?:[^./?#]+\.)?minesweeper\.online\/game\/*/;
      for (let tab of tabs) {
        if (urlRegex.test(tab.url)) {
          activeTab = tab;
          break;
        }
      }
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'export'}, showData);
    });
  }
);
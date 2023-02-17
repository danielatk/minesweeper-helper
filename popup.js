// board is an array of arrays, to be converted to csv
function showData(board) {

  if (board.length > 0) {
      
      let csvContent = "data:text/csv;charset=utf-8,";
      
      board.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
      });
      
      var encodedUri = encodeURI(csvContent);
      window.open(encodedUri);
  }
};

var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?minesweeper\.online\/game\/*/;

document.getElementById('export').addEventListener('click',
  function() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      var activeTab;
      for (var tab of tabs) {
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
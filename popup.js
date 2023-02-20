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
      let activeTab = getCurrentTab(tabs);
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'export'}, showData);
    });
  }
);

document.getElementById('AnalysisButton').addEventListener('click',
  function() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      let activeTab = getCurrentTab(tabs);
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'analyse'});
    });
  }
);

let overlay = document.getElementById('overlay');

overlay.addEventListener('change',
  function() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      let activeTab = getCurrentTab(tabs);
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'change-overlay', value: overlay.value});
    });
  }
);

let playStyle = document.getElementById('playstyle');

playStyle.addEventListener('change',
  function() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      let activeTab = getCurrentTab(tabs);
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'change-playstyle', value: playStyle.value});
    });
  }
);

let showHints = document.getElementById('showhints');

showHints.addEventListener('change',
  function() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      let activeTab = getCurrentTab(tabs);
      if (typeof activeTab === 'undefined') {
        alert('No valid minesweeper game found');
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, {text: 'change-showhints', marked: showHints.marked});
    });
  }
);

// TODO(danielatk): add listener to each of the dropdowns and checkboxes so that value is always kept track of

function getCurrentTab(tabs) {
  let activeTab;
  let urlRegex = /^https?:\/\/(?:[^./?#]+\.)?minesweeper\.online\/game\/*/;
  for (let tab of tabs) {
    if (urlRegex.test(tab.url)) {
      activeTab = tab;
      break;
    }
  }
  return activeTab;
}
function isGameOver() {
  const target = parseInt(document.getElementById('targetPoints').value);
  const rule = document.getElementById('rule').value;
  return players.some(p => rule === 'max' ? p.points >= target : p.points <= target);
}
const playerColors = ['#f87171', '#facc15', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#f472b6'];
let players = [];
let round = 1;

window.onload = function() {
  const saved = localStorage.getItem('smarties_game');
  if (saved) {
    const data = JSON.parse(saved);
    players = data.players;
    round = data.round;
    document.getElementById('targetPoints').value = data.targetPoints;
    document.getElementById('rule').value = data.rule;
    updateScoreboard();
    document.getElementById('roundNumber').textContent = round;
    document.getElementById('roundControls').style.display = 'block';
  }
};

function saveGame() {
  const targetPoints = parseInt(document.getElementById('targetPoints').value);
  const rule = document.getElementById('rule').value;
  const data = { players, round, targetPoints, rule };
  localStorage.setItem('smarties_game', JSON.stringify(data));
}

function addPlayer() {
  const name = document.getElementById('newPlayerName').value.trim();
  if (name && !players.some(p => p.name === name)) {
    const color = playerColors[players.length % playerColors.length];
    players.push({ name, points: 0, color });
    updateScoreboard();
    saveGame();
    document.getElementById('newPlayerName').value = '';
    document.getElementById('roundControls').style.display = 'block';
  }
}

function addPredefinedPlayer() {
  const name = document.getElementById('predefinedPlayers').value;
  if (name && !players.some(p => p.name === name)) {
    const color = playerColors[players.length % playerColors.length];
    players.push({ name, points: 0, color });
    updateScoreboard();
    saveGame();
    document.getElementById('roundControls').style.display = 'block';
  }
}

function updateScoreboard() {
  const board = document.getElementById('scoreboard');
  board.innerHTML = '<h2>Score actuel</h2>';
  players.forEach(p => {
    board.innerHTML += `<div class="player" style="color: ${p.color}">${p.name} - ${p.points} pts</div>`;
  });
  renderPointsInputs();
}

function renderPointsInputs() {
  const inputs = document.getElementById('pointsInputs');
  inputs.innerHTML = '';
  players.forEach((p, i) => {
    inputs.innerHTML += `<div>${p.name} : <input type="number" id="pointInput${i}" value="0"></div>`;
  });
}

function submitRound() {
  players.forEach((p, i) => {
    const input = document.getElementById(`pointInput${i}`);
    p.points += parseInt(input.value || '0');
  });
  round++;
  saveGame();
  updateScoreboard();
  document.getElementById('roundNumber').textContent = round;
  checkForWinner();
}

function checkForWinner() {
  const target = parseInt(document.getElementById('targetPoints').value);
  const rule = document.getElementById('rule').value;

  const gameOver = players.some(p => rule === 'max' ? p.points >= target : p.points <= target);

  if (gameOver) {
    players.sort((a, b) => rule === 'max' ? b.points - a.points : a.points - b.points);

    const resultDiv = document.getElementById('finalRanking');
    resultDiv.innerHTML = '<h3>Classement final :</h3>';
    let maxTextWidth = 0;
    const tempSpan = document.createElement('span');
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.position = 'absolute';
    tempSpan.style.font = window.getComputedStyle(resultDiv).font;
    document.body.appendChild(tempSpan);

    // Stocke chaque ligne pour mesurer la largeur max
    const lines = [];
    players.forEach((p, i) => {
      const text = `${i + 1}. ${p.name} - ${p.points} pts`;
      lines.push({ text, color: p.color, winnerClass: i === 0 ? 'winner pulse' : '' });
      tempSpan.textContent = text;
      maxTextWidth = Math.max(maxTextWidth, tempSpan.offsetWidth);
    });

    lines.forEach(line => {
      resultDiv.innerHTML += `<div class="player ${line.winnerClass}" style="color: ${line.color}">${line.text}</div>`;
    });

    document.body.removeChild(tempSpan);
    resultDiv.style.width = maxTextWidth + 20 + 'px'; // +20 for padding

    // Stocke la largeur pour shareAsImage
    resultDiv.dataset.maxTextWidth = maxTextWidth + 20;

    document.getElementById('result').style.display = 'block';
    document.getElementById('roundControls').style.display = 'none';
    localStorage.removeItem('smarties_game');
  }
}

function shareAsImage() {
  const container = document.getElementById('shareContainer');
  const finalRanking = document.getElementById('finalRanking');
  const width = finalRanking.dataset.maxTextWidth ? parseInt(finalRanking.dataset.maxTextWidth) : container.getBoundingClientRect().width;
  const rect = container.getBoundingClientRect();

  // Récupère le fond de la page
  const pageBg = window.getComputedStyle(document.body).backgroundColor || '#ffffff';

  // Force le container à afficher tous les joueurs avant capture
  container.style.width = width + 'px';

  html2canvas(container, {
    backgroundColor: pageBg,
    width: width,
    height: container.scrollHeight,
    windowWidth: width,
    windowHeight: container.scrollHeight,
    scrollX: -window.scrollX + rect.left,
    scrollY: -window.scrollY + rect.top
  }).then(canvas => {
    const dataUrl = canvas.toDataURL('image/png');
    document.getElementById('previewImage').src = dataUrl;
    document.getElementById('imagePreviewContainer').style.display = 'block';

    // Copie l'image dans le presse-papiers
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          alert('Image copiée dans le presse-papiers !');
        });
      });

    // Restaure la largeur du container
    container.style.width = '';
  });
}

function resetGame() {
  if (confirm('Voulez-vous vraiment recommencer une nouvelle partie ?')) {
    players = [];
    round = 1;
    localStorage.removeItem('smarties_game');
    location.reload();
  }
}

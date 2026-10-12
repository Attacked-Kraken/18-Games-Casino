/* rules.js: one shared "How to Play" guide for every game on the 18 Games Casino floor.
   Used by the floor (info button on station prompts) and by every game page (floating "How to Play" button).
   FUN CHIPS ONLY: no real money. window.HowTo.open(id), window.HowTo.RULES[id]. */
(function () {
  if (window.HowTo) return;
  var FUN = 'Fun chips only · no real money · chips can’t be bought or cashed out. 18+.';
  var MP = function (game, how) { return ['Live tables (room codes)', '<p>' + how + '</p><p>Codes connect phone to phone. Each player’s chips stay on their own phone. If the host leaves, the table closes.</p>']; };
  var KIT_MP = function (n) { return MP(n, 'Tap <b>Table</b> at the top, enter a name, then <b>Open a table</b> and share the 6-letter code. Friends tap <b>Table</b>, type the code and <b>Join</b>.'); };
  var tbl = function (rows) { return '<table>' + rows.map(function (r, i) { return '<tr>' + r.map(function (c) { return (i ? '<td>' : '<th>') + c + (i ? '</td>' : '</th>'); }).join('') + '</tr>'; }).join('') + '</table>'; };
  var R = {
    gildedreels: { title: 'Gilded Reels', kind: 'Five-reel slot', s: [
      ['Goal', '<p>Line up 3, 4 or 5 matching symbols from the left reel on any of the 5 paylines.</p>'],
      ['How to bet', '<p>Use <b>−</b> / <b>+</b> to pick a bet (5 to 500). Every spin plays all 5 lines; a bigger bet means bigger wins.</p>'],
      ['Controls', '<p>Tap <b>SPIN</b> or pull the lever. <b>AUTO</b> spins repeatedly until you tap it again. <b>Paytable</b> shows the lines and prizes.</p>'],
      ['Payouts (× line bet)', tbl([['Symbol', '3', '4', '5'], ['Diamond', '150', '500', '2500'], ['Gold 7', '80', '250', '800'], ['Gold BAR', '40', '100', '300'], ['Crown', '25', '60', '200'], ['Sapphire', '15', '40', '100'], ['Emerald', '12', '30', '80'], ['Ruby', '10 (2 for two)', '25', '60']]) + '<p>Returns about 97% over time.</p>'],
      MP('Gilded Reels', 'Tap <b>Slot bank</b> to <b>Create a bank</b> and share its code, or type a friend’s code to join. Everyone sees each other’s big wins live.')] },
    candyrush: { title: 'Candy Rush', kind: 'Cluster-pays slot', s: [
      ['Goal', '<p>8 or more of the same symbol <b>anywhere</b> on the 6×5 grid wins.</p>'],
      ['How it plays', '<p>Winning symbols pop, new ones tumble down, and new wins keep paying in the same spin until none form.</p>'],
      ['Controls', '<p>Pick a chip to set your bet, then <b>SPIN</b>.</p>'],
      ['Payouts (× bet)', tbl([['Symbol', '8–9', '10–11', '12+'], ['Heart', '10', '25', '100'], ['Star', '2.5', '10', '25'], ['Gumdrop', '2', '5', '15'], ['Swirl', '1.5', '2', '12'], ['Drop', '1', '1.5', '10'], ['Bean', '0.8', '1.2', '8'], ['Mint', '0.5', '1', '5'], ['Drop II', '0.4', '0.9', '4']])]] },
    velvet21: { title: 'Velvet 21', kind: 'Blackjack', s: [
      ['Goal', '<p>Beat the dealer by getting closer to 21 without going over. Number cards count face value, J/Q/K count 10, aces count 1 or 11.</p>'],
      ['How to bet', '<p>Tap chips to build a bet, then <b>DEAL</b>. <b>CLEAR</b> takes the bet back.</p>'],
      ['Your turn', '<p><b>Hit</b> takes a card, <b>Stand</b> keeps your total, <b>Double</b> doubles the bet for exactly one more card (any first two cards), <b>Split</b> splits a pair into two hands (once; split aces get one card each).</p>'],
      ['House rules', '<p>6 decks. Dealer stands on all 17s and peeks for blackjack.</p>'],
      ['Payouts', tbl([['Result', 'Pays'], ['Blackjack (first two cards)', '3 to 2'], ['Win', '1 to 1'], ['Tie (push)', 'bet returned']])],
      MP('Velvet 21', 'On the start screen choose <b>Create Table</b> and share the code; friends type it and tap <b>Join</b>. Up to 6 players; the host’s phone deals.')] },
    holdemroyale: { title: 'Hold’em Royale', kind: 'No-Limit Texas Hold’em', s: [
      ['Goal', '<p>Win the pot with the best five-card hand from your two hole cards and the five community cards, or make everyone else fold.</p>'],
      ['How to play', '<p>Sit down with 1,000 fun chips (blinds 10/20). Each round: hole cards, betting, the flop (3 cards), betting, the turn, betting, the river, final betting, showdown. <b>CASH OUT</b> returns your stack to the wallet.</p>'],
      ['Controls', '<p><b>FOLD</b> gives up the hand. <b>CHECK</b> / <b>CALL</b> matches the current bet. <b>POT</b> raises by the size of the pot; <b>ALL IN</b> bets your whole stack.</p>'],
      ['Hand ranking (high → low)', '<p>Royal flush › straight flush › four of a kind › full house › flush › straight › three of a kind › two pair › pair › high card.</p>'],
      null] },
    diamondpoker: { title: 'Diamond Poker', kind: 'Video poker · Jacks or Better', s: [
      ['Goal', '<p>Make the best five-card poker hand. A pair of jacks or better pays.</p>'],
      ['How to play', '<p>Pick a coin value, then <b>BET ONE</b> (1–5 coins). <b>DEAL</b> five cards, tap cards to <b>HOLD</b>, then <b>DRAW</b> to replace the rest. <b>HINT</b> shows the best hold.</p>'],
      ['Payouts (× coins bet)', tbl([['Hand', 'Pays'], ['Royal flush', '250 (800 at 5 coins)'], ['Straight flush', '50'], ['Four of a kind', '25'], ['Full house', '8'], ['Flush', '5'], ['Straight', '4'], ['Three of a kind', '3'], ['Two pair', '2'], ['Jacks or better', '1']]) + '<p>Double up: after a win, pick a card higher than the dealer’s to double it. Returns 97.3% with the hint strategy.</p>']] },
    baccaratnoir: { title: 'Baccarat Noir', kind: 'Punto banco', s: [
      ['Goal', '<p>Bet on the hand that ends closest to 9: <b>Player</b>, <b>Banker</b>, or a <b>Tie</b>. Tens and faces count 0; totals use the last digit (7+8 = 5).</p>'],
      ['How to play', '<p>Pick a chip, tap a betting spot, then <b>DEAL</b>. Third cards follow the standard tableau automatically. The bead road shows recent results.</p>'],
      ['Payouts', tbl([['Bet', 'Pays'], ['Player', '1 to 1'], ['Banker', '0.95 to 1'], ['Tie', '9 to 1 (Player/Banker bets push)']])], KIT_MP()] },
    rubyroulette: { title: 'Ruby Roulette', kind: 'European roulette', s: [
      ['Goal', '<p>Guess where the ball lands on a single-zero wheel (0–36).</p>'],
      ['How to bet', '<p>Pick a chip value, tap numbers or outside boxes to place chips, then <b>SPIN</b>. <b>Numbers</b> opens the full number grid; <b>Rebet</b> repeats your last bets.</p>'],
      ['Payouts', tbl([['Bet', 'Pays'], ['Straight number', '35 to 1'], ['Dozen / Column', '2 to 1'], ['Red, Black, Odd, Even, 1–18, 19–36', '1 to 1']]) + '<p>Every bet returns 97.3% over time.</p>'],
      MP('', 'Tap <b>Table</b>, <b>Open a table</b> and share the code. Everyone bets during the countdown; one spin for the whole table (up to 6).')] },
    dicepalace: { title: 'Dice Palace', kind: 'Craps', s: [
      ['Goal', '<p>Bet on the outcome of two dice.</p>'],
      ['Main bets', '<p><b>Pass</b>: the come-out roll wins on 7 or 11, loses on 2, 3 or 12; any other number becomes the <b>point</b>. Roll the point again before a 7 to win 1 to 1. <b>Don’t Pass</b> is the opposite (12 pushes on the come-out).</p>'],
      ['Other bets', '<p><b>Field</b> (one roll): 3, 4, 9, 10, 11 pay 1 to 1; 2 pays 2 to 1; 12 pays 3 to 1. <b>Place 6 / 8</b> (while a point is on): pays 7 to 6 each time it rolls, lost on a 7.</p>'],
      ['Controls', '<p>Pick a chip, tap a bet area, then <b>ROLL</b>. The puck shows ON with the current point.</p>'],
      MP('', 'Tap <b>Table</b>, <b>Open a table</b> and share the code. The host is the shooter and throws for everyone.')] },
    bigwheel: { title: 'Big Wheel', kind: 'Money wheel', s: [
      ['Goal', '<p>Bet on the symbol the pointer stops on.</p>'],
      ['How to play', '<p>Pick a chip, tap one or more symbols, then <b>SPIN</b>.</p>'],
      ['Payouts', tbl([['Symbol', 'Segments (of 54)', 'Pays'], ['1', '24', '1 to 1'], ['3', '12', '3 to 1'], ['5', '8', '5 to 1'], ['11', '4', '11 to 1'], ['Joker', '1', '47 to 1'], ['Star', '1', '47 to 1']])], KIT_MP()] },
    luckykeno: { title: 'Lucky Keno', kind: 'Keno lounge', s: [
      ['Goal', '<p>Pick 1 to 10 numbers from 1–80. 20 balls are drawn; the more of your numbers hit, the more you win.</p>'],
      ['Controls', '<p>Tap numbers on the board or <b>Quick pick</b>, choose a bet, then <b>PLAY</b>. <b>CLEAR</b> resets your picks.</p>'],
      ['Sample payouts (× bet)', tbl([['Picks', 'Hits → pays'], ['1', '1 → 3.85'], ['3', '2 → 2.2 · 3 → 47'], ['5', '3 → 3.2 · 4 → 16 · 5 → 315'], ['8', '5 → 15 · 6 → 100 · 7 → 835 · 8 → 8350'], ['10', '5 → 4.6 · 6 → 18 · 7 → 140 · 8 → 925 · 9 → 4600 · 10 → 23100']]) + '<p>The full table is under <b>Rules</b> in the game.</p>']] },
    plinkodrop: { title: 'Plinko Drop', kind: 'Plinko', s: [
      ['Goal', '<p>Drop a ball through the pegs. It bounces left or right at every peg (50/50) and lands in a slot that multiplies your bet.</p>'],
      ['Controls', '<p>Choose a bet and a risk level, then <b>DROP</b>. You can drop several balls at once.</p>'],
      ['Multipliers (edge → centre)', tbl([['Risk', 'Slots'], ['Low', '10 · 3 · 1.6 · 1.4 · 1.1 · 0.95 · 0.5'], ['Mid', '24 · 9 · 4 · 2 · 1.2 · 0.6 · 0.2'], ['High', '140 · 24 · 7.4 · 2 · 0.7 · 0.2 · 0.2']]) + '<p>Every risk level returns about 97–99% over time.</p>']] },
    rocketcrash: { title: 'Rocket Crash', kind: 'Crash game', s: [
      ['Goal', '<p>Cash out before the rocket explodes. The multiplier climbs from 1.00× after launch.</p>'],
      ['Controls', '<p>Pick a bet and <b>LAUNCH</b>. Tap <b>CASH OUT</b> any time to win bet × the current multiplier. If the rocket busts first, the bet is lost. <b>AUTO CASH-OUT</b> cashes out automatically at a target.</p>'],
      ['Odds', '<p>About 1 in 33 rounds busts instantly at 1.00×. Every target returns 97% over time.</p>']] },
    steelfront: { title: 'Steelfront', kind: 'Tactical shooter (13+)', s: [
      ['Goal', '<p>Win team battles and operations against training-sim soldiers. No chips are used.</p>'],
      ['Controls (phone)', '<p>Move with the stick on the left; drag on the right to look. Hold the big fire button and slide to aim while firing. Reload, crouch and jump are bottom right; snipers have a scope button.</p>'],
      ['Controls (keyboard)', '<p>WASD to move, mouse to aim, click or F to fire, R reload, C crouch, Space jump.</p>'],
      ['Items', '<p>Med kit heals; Frag blasts an area; Frost slows everyone hit for 4 seconds. Coins from hits, wins and stars buy weapons and finishes in the Armory.</p>'],
      ['Friends Showdown', '<p>2–6 players on their own phones: tap <b>Friends Showdown</b>, host or join with a code, and play the same map for 3 minutes. Highest score wins.</p>']] }
  };
  R.holdemroyale.s[4] = MP('', 'Tap <b>Table</b>, <b>Open a table</b> and share the code; up to 6 friends, bots fill empty seats. The table opener deals.');
  R.baccaratnoir.s[3] = MP('', 'Tap <b>Table</b>, <b>Open a table</b> and share the code. Everyone bets during the countdown; one coup for the whole table.');
  R.bigwheel.s[3] = MP('', 'Tap <b>Table</b>, <b>Open a table</b> and share the code. Everyone bets during the countdown; one spin for the whole table.');

  var css = '#htS{position:fixed;inset:0;z-index:100000;background:rgba(5,3,3,.72);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:14px}#htS.on{display:flex}' +
    '#htB{width:min(560px,100%);max-height:88vh;overflow:auto;background:linear-gradient(#17110e,#0c0908);border:1px solid #b08d57;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 0 0 4px rgba(176,141,87,.12);padding:20px 20px 16px;color:#e9dfcc;font:400 14px/1.5 -apple-system,Helvetica,Arial,sans-serif}' +
    '#htB h2{margin:0;font:400 28px Didot,"Bodoni 72","Playfair Display",Georgia,serif;color:#f0dca8}#htB .k{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a8946e;margin:2px 0 12px}' +
    '#htB h3{font:400 17px Georgia,serif;color:#d9bf85;margin:14px 0 4px;border-bottom:1px solid rgba(176,141,87,.3);padding-bottom:3px}#htB p{margin:4px 0}#htB b{color:#f3e2b8}' +
    '#htB table{width:100%;border-collapse:collapse;margin:6px 0;font-size:13px}#htB th{text-align:left;color:#a8946e;font-weight:500;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(176,141,87,.4);padding:4px}#htB td{padding:4px;border-bottom:1px solid rgba(255,255,255,.06)}' +
    '#htB .f{margin-top:14px;font-size:11px;color:#8a7d68;text-align:center}#htX{display:block;margin:14px auto 0;background:linear-gradient(#e6c47e,#a8823e);color:#1a1208;border:0;border-radius:22px;padding:10px 34px;font:600 13px Georgia,serif;letter-spacing:.12em;cursor:pointer}' +
    '.htBtn{position:fixed;z-index:99999;right:10px;top:calc(env(safe-area-inset-top) + 62px);background:rgba(12,9,8,.86);color:#e8d3a0;border:1px solid #b08d57;border-radius:18px;padding:6px 12px;font:500 11px Georgia,serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}';
  function ensure() {
    if (document.getElementById('htS')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var d = document.createElement('div'); d.id = 'htS'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = '<div id="htB"></div>'; document.body.appendChild(d);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  function close() { var d = document.getElementById('htS'); if (d) d.classList.remove('on'); }
  function open(id) {
    var r = R[id]; if (!r) return false; ensure();
    var h = '<h2>' + r.title + '</h2><div class="k">How to play · ' + r.kind + '</div>';
    r.s.forEach(function (s) { h += '<h3>' + s[0] + '</h3>' + s[1]; });
    h += '<div class="f">' + FUN + '</div><button id="htX" type="button">Got it</button>';
    var b = document.getElementById('htB'); b.innerHTML = h; b.scrollTop = 0;
    document.getElementById('htX').onclick = close; document.getElementById('htS').classList.add('on'); return true;
  }
  window.HowTo = { RULES: R, open: open, close: close };
  /* on a game page: add the floating button */
  var id = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (R[id]) {
    var add = function () { if (document.getElementById('htOpen')) return; var b = document.createElement('button'); b.id = 'htOpen'; b.className = 'htBtn'; b.type = 'button'; b.textContent = 'How to Play';
      if (id === 'steelfront') { b.style.top = 'calc(env(safe-area-inset-top) + 8px)'; b.style.right = '50%'; b.style.transform = 'translateX(50%)'; }
      b.onclick = function () { open(id); }; ensure(); document.body.appendChild(b); };
    if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  }
})();

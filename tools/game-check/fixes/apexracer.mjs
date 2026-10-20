// Play tests for Exotic Racer Club (JOB G-10, 2026-10-19). See README.md in this folder.
// Owner's list: race starts, cars drive forward, lap counter goes up, race finishes with
// results, garage buy works, play-friend-code. Tests drive the game through window.__erc;
// each h.eval function is self-contained.
export default [
  {
    id: 'play-race-starts',
    ask: 'Race starts: starting a race creates the race, the player car and a full grid',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('startRace did not create a race');
            if (!E.R.P) return res('no player car in the race');
            if (E.R.cars.length < 8) return res('only ' + E.R.cars.length + ' cars on the grid (expected 8)');
            const lap = document.getElementById('lapT');
            if (!lap || !/LAP/.test(lap.textContent || '')) return res('lap/HUD readout not shown');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-cars-drive-forward',
    ask: 'Cars drive forward once the race runs',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const ai = E.R.cars.find((c) => c.ai);
            if (!ai) return res('no AI car found');
            const s0 = ai.s, p0 = E.R.P.prog;
            E.K.gas = 1;
            E.step(900, 1 / 60); // 15 sim-seconds: past the 4.2s countdown
            E.K.gas = 0;
            if (ai.s <= s0) return res('AI car did not drive forward');
            if (E.R.P.prog <= p0 && E.R.P.spd <= 0) return res('player car never moved');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-lap-goes-up',
    ask: 'Lap counter goes up as cars complete laps',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const ai = E.R.cars.find((c) => c.ai);
            if (!ai) return res('no AI car found');
            // let the AI drive (up to 3 sim-minutes) until it finishes a lap
            let n = 0;
            while ((ai.lap || 0) < 1 && n < 180) { E.step(60, 1 / 60); n++; }
            if ((ai.lap || 0) < 1) return res('AI car lap never went up in 3 sim-minutes');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-race-finishes',
    ask: 'Race finishes with a results screen',
    async test(page, h) {
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('no race');
            const T = E.R.T, total = E.R.laps * T.N;
            // teleport the player to just before the line and drive over it
            const P = E.R.P;
            P.prog = total - 30; P.s = P.prog;
            E.K.gas = 1;
            let n = 0;
            while (!P.fin && n < 1200) { E.step(30, 1 / 60); n++; }
            E.K.gas = 0;
            if (!P.fin) return res('player never crossed the finish');
            E.showResults();
            const scr = document.getElementById('result');
            if (!scr) return res('no results screen element');
            const title = (document.getElementById('rTitle') || {}).textContent || '';
            const tab = (document.getElementById('rTab') || {}).textContent || '';
            if (!title.trim()) return res('results screen has no title');
            if (!tab.trim()) return res('results screen has no standings');
            res(true);
          }, 400);
        });
      });
    },
  },
  {
    id: 'play-garage-buy',
    ask: 'Garage buy works: buying a car adds it to the garage and selects it',
    async test(page, h) {
      // open the garage the way a player does: back to the menu, then the Garage button
      // (h.press takes a selector and really clicks it - h.tap takes screen x/y)
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      const opened = await h.press('#mGarage');
      if (!opened) return 'Garage button on the menu could not be pressed';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        const gar = document.getElementById('garage');
        if (!gar || getComputedStyle(gar).display === 'none') return 'garage screen did not open';
        E.S.cash = 1000000;
        const ids = ['kestrel', 'brute', 'nova', 'zenith', 'phantom', 'vortex'];
        const id = ids.find((x) => !E.S.cars[x]);
        if (!id) return 'player already owns every buyable car';
        window.confirm = () => true; // the game asks before buying
        const card = document.querySelector('[data-car="' + id + '"]');
        if (!card) return 'no garage card for ' + id;
        card.click(); // select (preview) - the garage re-renders after this
        const again = document.querySelector('[data-car="' + id + '"]');
        (again || card).click(); // buy
        if (!E.S.cars[id]) return 'car ' + id + ' not in the garage after buying';
        if (E.S.cur !== id) return 'bought car was not selected';
        return true;
      });
    },
  },
  {
    id: 'play-friend-code',
    ask: "Friend code: entering a friend's RACE- code puts their car in your race",
    async test(page, h) {
      // a player saves a racer name first (Race Friends asks for one), then taps Race Friends
      await h.eval(() => { if (window.__erc) window.__erc.toMenu(); return true; });
      await h.wait(300);
      await h.eval(() => {
        const nm = document.getElementById('nm');
        if (nm) { nm.value = 'Racer One'; document.getElementById('nmB').click(); }
        return true;
      });
      await h.wait(300);
      const opened = await h.press('#mFriends');
      if (!opened) return 'Race Friends button on the menu could not be pressed';
      return h.eval(() => {
        const E = window.__erc;
        if (!E) return 'no window.__erc hook';
        const mine = ((document.getElementById('fCode') || {}).textContent || '').trim();
        if (!/^RACE-/.test(mine)) return 'no friend code shown on the friends screen';
        // build a code for a different racer, same format the game makes
        const j = JSON.stringify({ n: 'Test Friend', r: 5, car: 'kestrel', p: '#1e8bff', f: 'metal', ri: 0, g: '' });
        const b = btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '~').replace(/\//g, '_').replace(/=+$/, '');
        const code = 'RACE-' + (b.match(/.{1,4}/g) || [b]).join('-');
        const inp = document.getElementById('fIn');
        inp.value = code;
        document.getElementById('fGo').click();
        const err = (document.getElementById('fErr') || {}).textContent || '';
        if (/did not scan|your own code/i.test(err)) return 'friend code was rejected: ' + err;
        if (!E.G || !E.G.friend) return 'friend was not stored after entering the code';
        return new Promise((res) => {
          E.startRace(E.PLACES[0], 8);
          setTimeout(() => {
            if (!E.R) return res('race did not start with the friend');
            const fr = E.R.cars.find((c) => c.friendR);
            if (!fr) return res('friend car is not in the race');
            res(true);
          }, 500);
        });
      });
    },
  },
];

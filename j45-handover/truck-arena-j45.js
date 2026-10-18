/* Monster truck arena at real sizes from venues/truck-arena.md:
   110x50m dirt floor with jumps, car crush lines, barriers + catch fence,
   a full stadium bowl (3 tiers, 4 sides) CLOSE around the floor with
   45,000 fans who stand and bounce on big air, night floodlights, giant
   screens at both ends, pyro posts, start gate. NO open land.
     import { buildTruckArena } from './venues/kit/truck-arena.js';
     const arena = buildTruckArena(THREE);
     scene.add(arena.group);
     arena.report() -> { fans, jumps, cars, floorL, floorW, screens, fence, bowlGap, night }
   The game owns gameplay objects (cars, physics) - the kit exports the
   layout (jump geometry, car spots) so physics matches the pictures.
   JOB J45 (owner note): fans 40-60k, the stadium close, night, pyro. */

export const TRUCK_ARENA = {
  floorL: 110, floorW: 50,
  fans: 45000, tiers: 3,
  bowlGap: 9.5,          // metres from floor edge to the first row - the stadium is CLOSE
  megaRampH: 6,
};

/* ramps: { x, z } = centre; dir +1 = slope rises toward +x (approach from -x),
   dir -1 = rises toward -x. len = slope run, h = lip height, wid = width. */
export const TRUCK_JUMPS = [
  { x: -46.5, z: 0,    dir: 1,  len: 11, h: 6,   wid: 15 },  // mega ramp
  { x: -16,   z: -11,  dir: 1,  len: 8,  h: 3,   wid: 11 },  // double A1
  { x: 0,     z: -11,  dir: 1,  len: 8,  h: 3,   wid: 11 },  // double A2
  { x: 10,    z: 11,   dir: -1, len: 8,  h: 3.5, wid: 11 },  // double B1
  { x: -6,    z: 11,   dir: -1, len: 8,  h: 3.5, wid: 11 },  // double B2
  { x: 30,    z: -13,  dir: -1, len: 9,  h: 2.5, wid: 10 },  // single C
  { x: -32,   z: 14,   dir: 1,  len: 9,  h: 2.5, wid: 10 },  // single D
];

/* crush-car lines: two rows of 5 at real car size (the game builds the cars) */
export const TRUCK_CAR_SPOTS = [];
for (const zz of [19, -20.5]) {
  for (const xx of [-12, -6, 0, 6, 12]) TRUCK_CAR_SPOTS.push({ x: xx, z: zz, ry: zz > 0 ? 0 : Math.PI });
}

function dirtTexture(THREE) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#6d4a2c'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = `rgba(${40 + Math.random() * 60 | 0},${26 + Math.random() * 40 | 0},${12 + Math.random() * 22 | 0},${0.12 + Math.random() * 0.2})`;
    const r = 2 + Math.random() * 9;
    g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, r, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(38,24,12,0.35)'; g.lineWidth = 5;
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    const y = Math.random() * 512;
    g.moveTo(0, y);
    g.bezierCurveTo(170, y + (Math.random() * 30 - 15), 340, y + (Math.random() * 30 - 15), 512, y);
    g.stroke();
  }
  g.strokeStyle = 'rgba(30,18,8,0.5)'; g.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    g.beginPath();
    const x = Math.random() * 512, y = Math.random() * 512;
    g.moveTo(x, y); g.lineTo(x + 20 + Math.random() * 40, y + (Math.random() * 8 - 4)); g.stroke();
  }
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(6, 3);
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  return tx;
}

function wedgeGeometry(THREE, len, h, wid) {
  // triangular prism: slope from (0,0) up to (len,h), width across z
  const w = wid / 2;
  const A = [0, 0, -w], B = [len, 0, -w], C = [len, h, -w], D = [0, 0, w], E = [len, 0, w], F = [len, h, w];
  const tris = [
    A, C, F, A, F, D,   // slope
    B, E, F, B, F, C,   // back wall
    A, D, E, A, E, B,   // bottom
    A, B, C,            // side -z
    D, F, E,            // side +z
  ];
  const pos = [];
  for (const v of tris) pos.push(v[0], v[1], v[2]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

export function buildTruckArena(THREE, o = {}) {
  const K = TRUCK_ARENA;
  const group = new THREE.Group();
  group.name = 'truck-arena';
  const L = K.floorL, W = K.floorW;

  /* ---- dirt floor + apron ring ---- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W),
    new THREE.MeshStandardMaterial({ map: o.dirtTexture || dirtTexture(THREE), roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(L + 30, W + 30),
    new THREE.MeshStandardMaterial({ color: 0x503722, roughness: 1 })
  );
  apron.rotation.x = -Math.PI / 2; apron.position.y = -0.03;
  group.add(apron);

  /* ---- jumps (dirt wedge ramps with painted lips) ---- */
  const lipCols = [0xc02020, 0x2040c0, 0x181818];
  TRUCK_JUMPS.forEach((j, i) => {
    const m = new THREE.Mesh(wedgeGeometry(THREE, j.len, j.h, j.wid),
      new THREE.MeshStandardMaterial({ color: 0x7d5732, roughness: 1 }));
    m.position.set(j.x - j.dir * j.len / 2, 0, j.z);
    if (j.dir < 0) m.rotation.y = Math.PI;
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, j.wid),
      new THREE.MeshStandardMaterial({ color: lipCols[i % 3], roughness: 0.85 }));
    lip.position.set(j.x + j.dir * j.len / 2, j.h + 0.1, j.z);
    group.add(lip);
    j.slope = Math.atan2(j.h, j.len);
  });

  /* ---- concrete barriers + catch fence ---- */
  const barMat = new THREE.MeshStandardMaterial({ color: 0x9aa0aa, roughness: 0.85 });
  const barGeo = new THREE.BoxGeometry(6, 1.2, 0.6);
  const perX = Math.floor(L / 6), perZ = Math.floor(W / 6);
  const bars = new THREE.InstancedMesh(barGeo, barMat, (perX + perZ) * 2);
  {
    const d = new THREE.Object3D(); let bi = 0;
    for (let i = 0; i < perX; i++) for (const s of [-1, 1]) {
      d.position.set(-L / 2 + 3 + i * 6, 0.6, s * (W / 2 + 0.8)); d.rotation.set(0, 0, 0); d.updateMatrix();
      bars.setMatrixAt(bi++, d.matrix);
    }
    for (let i = 0; i < perZ; i++) for (const s of [-1, 1]) {
      d.position.set(s * (L / 2 + 0.8), 0.6, -W / 2 + 3 + i * 6); d.rotation.set(0, Math.PI / 2, 0); d.updateMatrix();
      bars.setMatrixAt(bi++, d.matrix);
    }
    bars.count = bi;
    bars.instanceMatrix.needsUpdate = true;
  }
  group.add(bars);

  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.6, metalness: 0.6 });
  const posts = new THREE.InstancedMesh(postGeo, postMat, (Math.floor(L / 8) + Math.floor(W / 8)) * 2 + 4);
  {
    const d = new THREE.Object3D(); let pi = 0;
    for (let i = 0; i <= Math.floor(L / 8); i++) for (const s of [-1, 1]) {
      d.position.set(-L / 2 + i * 8, 3.2, s * (W / 2 + 1.4)); d.rotation.set(0, 0, 0); d.updateMatrix();
      posts.setMatrixAt(pi++, d.matrix);
    }
    for (let i = 1; i < Math.floor(W / 8); i++) for (const s of [-1, 1]) {
      d.position.set(s * (L / 2 + 1.4), 3.2, -W / 2 + i * 8); d.rotation.set(0, 0, 0); d.updateMatrix();
      posts.setMatrixAt(pi++, d.matrix);
    }
    posts.count = pi;
    posts.instanceMatrix.needsUpdate = true;
  }
  group.add(posts);

  const fenceCv = document.createElement('canvas'); fenceCv.width = fenceCv.height = 64;
  {
    const g = fenceCv.getContext('2d');
    g.clearRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(190,200,215,0.9)'; g.lineWidth = 2;
    for (let i = 0; i <= 64; i += 8) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke();
    }
  }
  const mkFence = (len, x, z, ry) => {
    const t = new THREE.CanvasTexture(fenceCv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len / 2, 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 4),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(x, 3.2, z); m.rotation.y = ry;
    group.add(m);
  };
  mkFence(L + 2, 0, W / 2 + 1.4, 0); mkFence(L + 2, 0, -W / 2 - 1.4, 0);
  mkFence(W + 2, L / 2 + 1.4, 0, Math.PI / 2); mkFence(W + 2, -L / 2 - 1.4, 0, Math.PI / 2);

  /* ---- stadium bowl: 3 tiers on all 4 sides, CLOSE around the floor ---- */
  const standMats = [
    new THREE.MeshStandardMaterial({ color: 0x39415a, roughness: 0.95 }),
    new THREE.MeshStandardMaterial({ color: 0x2b3140, roughness: 0.95 }),
  ];
  const decks = []; // seating decks for the crowd
  const tierDepth = 9, tierRise = 7.5;
  for (let side = 0; side < 4; side++) {
    const alongX = side < 2;
    const sgn = side % 2 === 0 ? 1 : -1;
    for (let tier = 0; tier < K.tiers; tier++) {
      const inset = K.bowlGap + tier * tierDepth;
      const topY = 4.5 + (tier + 1) * tierRise;
      const len = (alongX ? L : W) + 2 * (inset + tierDepth);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(len, topY, tierDepth + 1.5), standMats[tier % 2]);
      const off = (alongX ? W : L) / 2 + inset + tierDepth / 2;
      if (alongX) stand.position.set(0, topY / 2, sgn * off);
      else { stand.position.set(sgn * off, topY / 2, 0); stand.rotation.y = Math.PI / 2; }
      group.add(stand);
      decks.push({
        alongX, sgn, off, len: len - 4, y: topY, rows: 6, depth: tierDepth - 2,
      });
    }
    const insetB = K.bowlGap + K.tiers * tierDepth + 2;
    const wallLen = (alongX ? L : W) + 2 * insetB;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 42, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x232936, roughness: 1 }));
    const offB = (alongX ? W : L) / 2 + insetB;
    if (alongX) wall.position.set(0, 21, sgn * offB);
    else { wall.position.set(sgn * offB, 21, 0); wall.rotation.y = Math.PI / 2; }
    group.add(wall);
  }

  /* ---- crowd: 45,000 instanced fans who stand + bounce on big air ---- */
  const fanGeo = new THREE.BoxGeometry(0.44, 1.06, 0.32);
  const fans = new THREE.InstancedMesh(fanGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), K.fans);
  const sitM = [], standM = [], phase = new Float32Array(K.fans);
  let fanCount = 0;
  {
    const d = new THREE.Object3D(), col = new THREE.Color();
    const palette = [0xd94f2e, 0x2e7fd9, 0x37c26a, 0xe8c832, 0x9a4fd9, 0xd9d9d9, 0xf2f2f2, 0x30455e];
    let fi = 0;
    const totalLen = decks.reduce((s, dk) => s + dk.len * dk.rows, 0);
    for (const dk of decks) {
      const share = Math.floor(K.fans * (dk.len * dk.rows) / totalLen);
      const per = Math.max(1, Math.floor(share / dk.rows));
      for (let r = 0; r < dk.rows && fi < K.fans; r++) {
        for (let i = 0; i < per && fi < K.fans; i++, fi++) {
          const t = (per === 1 ? 0 : (i / (per - 1) - 0.5)) * dk.len + (Math.random() - 0.5) * 0.3;
          const back = (dk.rows === 1 ? 0 : (r / (dk.rows - 1) - 0.5)) * dk.depth;
          let px, pz;
          if (dk.alongX) { px = t; pz = dk.sgn * (dk.off + back); }
          else { px = dk.sgn * (dk.off + back); pz = t; }
          const y = dk.y + r * 0.8;
          const ry = Math.atan2(-px, -pz); // face the floor
          d.rotation.set(0, ry, 0);
          d.position.set(px, y + 0.3, pz); d.scale.set(1, 0.72, 1); d.updateMatrix();
          sitM.push(d.matrix.clone());
          d.position.set(px, y + 0.55, pz); d.scale.set(1, 1, 1); d.updateMatrix();
          standM.push(d.matrix.clone());
          fans.setMatrixAt(fi, sitM[fi]);
          fans.setColorAt(fi, col.setHex(palette[(Math.random() * palette.length) | 0]));
          phase[fi] = Math.random() * Math.PI * 2;
        }
      }
    }
    fans.count = fi;
    fans.instanceMatrix.needsUpdate = true;
    if (fans.instanceColor) fans.instanceColor.needsUpdate = true;
    fanCount = fi;
  }
  group.add(fans);
  let crowdSlice = 0;
  const _m1 = new THREE.Matrix4(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3(),
        _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  function stepCrowd(t, excite) {
    const SLICE = 2200, n = fanCount;
    if (!n) return;
    for (let k = 0; k < SLICE; k++) {
      const i = (crowdSlice + k) % n;
      const w = excite <= 0.01 ? 0 : Math.min(1, excite * (0.55 + 0.45 * Math.sin(t * 7 + phase[i])));
      _p1.setFromMatrixPosition(sitM[i]); _p2.setFromMatrixPosition(standM[i]);
      _p1.lerp(_p2, w);
      if (w > 0) _p1.y += w * 0.09 * Math.abs(Math.sin(t * 9 + phase[i]));
      _q.setFromRotationMatrix(sitM[i]);
      _s.set(1, 0.72 + 0.28 * w, 1);
      _m1.compose(_p1, _q, _s);
      fans.setMatrixAt(i, _m1);
    }
    crowdSlice = (crowdSlice + SLICE) % n;
    fans.instanceMatrix.needsUpdate = true;
  }

  /* ---- giant screens at both ends (live canvas texture) ---- */
  const scrCv = document.createElement('canvas'); scrCv.width = 512; scrCv.height = 288;
  const scrTex = new THREE.CanvasTexture(scrCv); scrTex.colorSpace = THREE.SRGBColorSpace;
  function setScreen(title, l1, l2) {
    const g = scrCv.getContext('2d');
    g.fillStyle = '#0a0f1a'; g.fillRect(0, 0, 512, 288);
    g.strokeStyle = '#ffb200'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 272);
    g.textAlign = 'center';
    g.fillStyle = '#ffb200'; g.font = '900 52px system-ui, sans-serif';
    g.fillText(title || '', 256, 92);
    g.fillStyle = '#eef2f7'; g.font = '800 62px system-ui, sans-serif';
    g.fillText(l1 || '', 256, 176);
    g.fillStyle = '#9fb4cc'; g.font = '700 34px system-ui, sans-serif';
    g.fillText(l2 || '', 256, 238);
    scrTex.needsUpdate = true;
  }
  setScreen('APEX ARCADE', 'MONSTER TRUCK', '');
  for (const s of [-1, 1]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 16, 28),
      new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.8 }));
    housing.position.set(s * (L / 2 + K.bowlGap + 14), 27, 0);
    group.add(housing);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshBasicMaterial({ map: scrTex }));
    scr.position.set(s * (L / 2 + K.bowlGap + 13.3), 27, 0);
    scr.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(scr);
  }

  /* ---- floodlight towers (night) ---- */
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfff6d8 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.7, metalness: 0.5 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const tx = sx * (L / 2 + K.bowlGap + 8), tz = sz * (W / 2 + K.bowlGap + 8);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 34, 8), poleMat);
    pole.position.set(tx, 17, tz);
    group.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.5), poleMat);
    head.position.set(tx, 34.5, tz);
    head.lookAt(0, 0, 0);
    group.add(head);
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.4), lampMat);
    lamp.position.copy(head.position);
    lamp.lookAt(0, 2, 0);
    lamp.translateZ(0.35);
    group.add(lamp);
  }

  /* ---- start gate ---- */
  {
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.6, metalness: 0.4 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5.6, 0.7), gateMat);
      post.position.set(-38, 2.8, s * 5.2);
      group.add(post);
    }
    const bannerCv = document.createElement('canvas'); bannerCv.width = 512; bannerCv.height = 64;
    const bg2 = bannerCv.getContext('2d');
    bg2.fillStyle = '#14181f'; bg2.fillRect(0, 0, 512, 64);
    bg2.fillStyle = '#ffb200'; bg2.font = '900 40px system-ui, sans-serif'; bg2.textAlign = 'center';
    bg2.fillText('APEX ARCADE', 256, 45);
    const bTex = new THREE.CanvasTexture(bannerCv); bTex.colorSpace = THREE.SRGBColorSpace;
    const backer = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.9, 11.6), gateMat);
    backer.position.set(-38, 5.4, 0);
    group.add(backer);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 1.7),
      new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide }));
    banner.position.set(-38.2, 5.4, 0);
    banner.rotation.y = -Math.PI / 2;
    group.add(banner);
    const dotGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x37c871 });
    for (let i = 0; i < 7; i++) {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(-38, 4.3, -4.5 + i * 1.5);
      group.add(dot);
    }
  }

  /* ---- pit trailers in the east corridor ---- */
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0xb9c0ca, roughness: 0.5, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const tr = new THREE.Group();
    const boxM = new THREE.Mesh(new THREE.BoxGeometry(9, 2.9, 2.6), trailerMat);
    boxM.position.y = 1.75; tr.add(boxM);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(9.04, 0.5, 2.64),
      new THREE.MeshStandardMaterial({ color: 0xffb200, roughness: 0.6 }));
    stripe.position.y = 2.2; tr.add(stripe);
    tr.position.set(L / 2 + 4.6, 0, s * 16);
    group.add(tr);
  }

  /* ---- pyro posts + particles (one draw call) ---- */
  const PYRO_POSTS = [[-30, 23], [30, 23], [-30, -23], [30, -23], [0, 23], [0, -23]];
  const pyroPostMat = new THREE.MeshStandardMaterial({ color: 0x8a2f1d, roughness: 0.7 });
  for (const [px, pz] of PYRO_POSTS) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 8), pyroPostMat);
    p.position.set(px, 0.8, pz);
    group.add(p);
  }
  const PMAX = 6 * 30;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX);
  for (let i = 0; i < PMAX; i++) pPos[i * 3 + 1] = -60;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xffb648, size: 0.55, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  points.frustumCulled = false;
  group.add(points);
  let pyroBursts = 0, pCursor = 0;
  function firePyro() {
    pyroBursts++;
    for (const [px, pz] of PYRO_POSTS) {
      for (let k = 0; k < 30; k++) {
        const i = pCursor; pCursor = (pCursor + 1) % PMAX;
        pPos[i * 3] = px; pPos[i * 3 + 1] = 1.6; pPos[i * 3 + 2] = pz;
        const a = Math.random() * Math.PI * 2, r = Math.random() * 2.2;
        pVel[i * 3] = Math.cos(a) * r; pVel[i * 3 + 1] = 11 + Math.random() * 7; pVel[i * 3 + 2] = Math.sin(a) * r;
        pLife[i] = 0.9 + Math.random() * 0.5;
      }
    }
    pGeo.attributes.position.needsUpdate = true;
  }
  function stepFx(dt) {
    let any = false;
    for (let i = 0; i < PMAX; i++) {
      if (pLife[i] <= 0) continue;
      any = true;
      pLife[i] -= dt;
      pVel[i * 3 + 1] -= 9.8 * dt;
      pPos[i * 3] += pVel[i * 3] * dt;
      pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
      pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      if (pLife[i] <= 0) pPos[i * 3 + 1] = -60;
    }
    if (any) pGeo.attributes.position.needsUpdate = true;
  }

  const layout = {
    jumps: TRUCK_JUMPS.map(j => ({ ...j, slope: Math.atan2(j.h, j.len) })),
    carSpots: TRUCK_CAR_SPOTS.map(c => ({ ...c })),
    floorL: L, floorW: W,
  };
  const report = () => ({
    fans: fanCount, jumps: TRUCK_JUMPS.length, cars: TRUCK_CAR_SPOTS.length,
    floorL: L, floorW: W, screens: 2, fence: true, bowlGap: K.bowlGap, night: true, tiers: K.tiers,
  });

  return {
    group, report, layout,
    setScreen, stepCrowd, firePyro, stepFx,
    pyroCount: () => pyroBursts,
    fansMesh: fans,
  };
}

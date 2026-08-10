
(function(){
  "use strict";
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('theme');
  const isDark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) root.setAttribute('data-theme','dark');
  if (themeBtn) themeBtn.textContent = isDark ? '⭐' : '☀️';
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    root.setAttribute('data-theme', dark ? 'light' : 'dark');
    themeBtn.textContent = dark ? '☀️' : '⭐';
    localStorage.setItem('theme', dark ? 'light' : 'dark');
  });
  addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      const dark = e.newValue === 'dark';
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  });

  const bar = document.getElementById('readingBar');
  if (bar) {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const burger = document.getElementById('burgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
  }

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  const counts = document.querySelectorAll('.count');
  if (counts.length) {
    const cIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.count;
        const t0 = performance.now();
        const dur = 900;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cIO.unobserve(el);
      });
    }, { threshold: .6 });
    counts.forEach(el => cIO.observe(el));
  }

  const typed = document.getElementById('typed');
  const text = typed ? typed.dataset.text : '';
  if (typed && text) {
    let i = 0;
    const t = setInterval(() => {
      typed.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(t);
    }, 90);
  }

  if (window.self === window.top && !document.getElementById('gplayer')) {
    const d = document.createElement('div');
    d.className = 'gplayer';
    d.id = 'gplayer';
    d.innerHTML = '<button class="gp-prev" id="gpPrev" aria-label="上一首">⏮</button><div class="reel"></div><button class="gp-play" id="gpPlay" aria-label="播放我的声音"><span class="played">▶</span><span class="paused">⏸</span></button><button class="gp-next" id="gpNext" aria-label="下一首">⏭</button><span class="gp-tip">🎙️ 我的声音</span>';
    document.body.appendChild(d);
  }
  const gpPlay = document.getElementById('gpPlay');
  const gpPrev = document.getElementById('gpPrev');
  const gpNext = document.getElementById('gpNext');
  const gplayer = document.getElementById('gplayer');
  const gpTip = document.querySelector('.gp-tip');
  const TRACKS = [{"title": "出现又离开", "file": "assets/media/出现又离开.mp4"}, {"title": "达尔文", "file": "assets/media/voice-2.mp4"}];
  let idx = 0;
  let playing = false;
  let audio = null;
  let savedPlayer = null;
  try { savedPlayer = JSON.parse(sessionStorage.getItem('voicePlayer') || 'null'); } catch (e) {}
  if (savedPlayer && savedPlayer.idx !== undefined) idx = savedPlayer.idx % TRACKS.length;
  function makeAudio(i) {
    if (audio) { audio.pause(); audio = null; }
    audio = new Audio(TRACKS[i].file);
    audio.addEventListener('timeupdate', () => {
      try { sessionStorage.setItem('voicePlayer', JSON.stringify({ playing, idx, t: audio.currentTime })); } catch (e) {}
    });
    audio.addEventListener('ended', () => switchTo(idx + 1, true));
  }
  function updateTip() {
    if (gpTip) gpTip.textContent = '🎙️ ' + TRACKS[idx].title;
    if (gplayer) gplayer.title = TRACKS[idx].title;
  }
  const setPlay = (v) => {
    playing = v;
    document.body.classList.toggle('playing', v);
    if (!audio) {
      makeAudio(idx);
      if (v && savedPlayer && savedPlayer.idx === idx && savedPlayer.t) {
        audio.currentTime = savedPlayer.t;
      }
    }
    if (v) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {});
    } else audio.pause();
    try { sessionStorage.setItem('voicePlayer', JSON.stringify({ playing, idx, t: audio.currentTime })); } catch (e) {}
  };
  const switchTo = (i, auto) => {
    idx = (i + TRACKS.length) % TRACKS.length;
    if (audio) audio.pause();
    makeAudio(idx);
    updateTip();
    if (auto || playing) setPlay(true);
    else try { sessionStorage.setItem('voicePlayer', JSON.stringify({ playing, idx, t: 0 })); } catch (e) {}
  };
  if (gpPlay) gpPlay.addEventListener('click', () => setPlay(!playing));
  if (gpPrev) gpPrev.addEventListener('click', () => switchTo(idx - 1, true));
  if (gpNext) gpNext.addEventListener('click', () => switchTo(idx + 1, true));
  updateTip();
  window.__music = { get time() { return audio ? audio.currentTime : 0; }, get playing() { return playing; } };

  // 灯箱
  const lb = document.getElementById('lightbox');
  if (lb) {
    const items = Array.from(document.querySelectorAll('.g-item'));
    const stage = lb.querySelector('.lb-stage');
    const lbBox = stage.querySelector('img');
    const lbCap = lb.querySelector('.lb-cap');
    const zval = lb.querySelector('.lb-zval');
    let idx = 0;
    let z = 1, tx = 0, ty = 0;
    const apply = () => {
      stage.style.setProperty('--z', z);
      stage.style.setProperty('--tx', tx + 'px');
      stage.style.setProperty('--ty', ty + 'px');
      stage.classList.toggle('zoomed', z > 1);
      zval.textContent = Math.round(z * 100) + '%';
    };
    const reset = () => { z = 1; tx = 0; ty = 0; apply(); };
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx];
      lbBox.src = it.dataset.src || '';
      lbCap.textContent = it.dataset.cap || '';
      reset();
      lb.classList.add('open');
    };
    items.forEach((it, i) => it.addEventListener('click', () => show(i)));
    lb.querySelector('.lb-close').addEventListener('click', () => lb.classList.remove('open'));
    lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
    lb.querySelector('.lb-zin').addEventListener('click', (e) => { e.stopPropagation(); z = Math.min(3, +(z + .5).toFixed(1)); apply(); });
    lb.querySelector('.lb-zout').addEventListener('click', (e) => { e.stopPropagation(); z = Math.max(1, +(z - .5).toFixed(1)); if (z === 1) { tx = 0; ty = 0; } apply(); });
    let drag = null;
    stage.addEventListener('pointerdown', (e) => { if (z > 1) { drag = { x: e.clientX, y: e.clientY, tx, ty }; stage.setPointerCapture(e.pointerId); } });
    stage.addEventListener('pointermove', (e) => { if (drag) { tx = drag.tx + (e.clientX - drag.x); ty = drag.ty + (e.clientY - drag.y); apply(); } });
    stage.addEventListener('pointerup', () => { drag = null; });
    stage.addEventListener('dblclick', () => { if (z > 1) reset(); else { z = 2; apply(); } });
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
    addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // 回到顶部悬浮按钮
  const toTop = document.getElementById('toTop');
  if (toTop) {
    addEventListener('scroll', () => {
      toTop.classList.toggle('show', scrollY > 420);
    }, { passive: true });
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // 留言板（支持多个实例，共享同一份留言）
  document.querySelectorAll('.guestbook').forEach((gb) => {
    const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const list = gb.querySelector('.gb-list');
    const nameEl = gb.querySelector('.gb-name');
    const msgEl = gb.querySelector('.gb-msg');
    const send = gb.querySelector('.gb-send');
    let msgs = [];
    try { msgs = JSON.parse(localStorage.getItem('guestbook') || '[]'); } catch (e) {}
    const render = () => {
      list.innerHTML = msgs.length ? msgs.map((m, i) =>
        '<li><div class="gb-head"><b>' + escHtml(m.name) + '</b><time>' + escHtml(m.time) + '</time></div><p>' + escHtml(m.msg) + '</p><button type="button" class="gb-del" data-i="' + i + '">删除</button></li>'
      ).join('') : '<li class="gb-empty">还没有留言，来坐坐吧~</li>';
    };
    send.addEventListener('click', () => {
      const name = nameEl.value.trim() || '匿名访客';
      const msg = msgEl.value.trim();
      if (!msg) return;
      msgs.unshift({ name, msg, time: new Date().toLocaleString('zh-CN') });
      try { localStorage.setItem('guestbook', JSON.stringify(msgs)); } catch (e) {}
      msgEl.value = '';
      render();
    });
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.gb-del');
      if (!btn) return;
      msgs.splice(+btn.dataset.i, 1);
      try { localStorage.setItem('guestbook', JSON.stringify(msgs)); } catch (e) {}
      render();
    });
    render();
  });

  // 音乐盲盒：点击开盒显示推荐曲目
  document.querySelectorAll('.rec-reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const box = btn.closest('.rec-box');
      btn.classList.add('shake');
      setTimeout(() => {
        const song = box.querySelector('.rec-song');
        song.style.display = 'inline-block';
        btn.style.display = 'none';
      }, 460);
    });
  });

  // 卡片 3D 倾斜（桌面端）
  const fine = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', (ev) => {
        const r = card.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width - .5;
        const y = (ev.clientY - r.top) / r.height - .5;
        card.style.transform = 'perspective(900px) translateY(-5px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg)';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // 音乐联动：视频真正开始播放时暂停音乐，暂停/结束恢复
  let videoPausedMusic = false;
  document.querySelectorAll('video').forEach(v => {
    v.addEventListener('play', () => {
      if (playing) { videoPausedMusic = true; setPlay(false); }
    });
    v.addEventListener('pause', () => {
      if (videoPausedMusic) { videoPausedMusic = false; setPlay(true); }
    });
    v.addEventListener('ended', () => {
      if (videoPausedMusic) { videoPausedMusic = false; setPlay(true); }
    });
  });

  // 单页应用路由
  const spaSecs = document.querySelectorAll('.spa-sec');
  if (spaSecs.length) {
    const rm = { home: 'sec-home', music: 'sec-music', games: 'sec-games', travel: 'sec-travel', sports: 'sec-sports', about: 'sec-about' };
    const go = () => {
      const key = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
      const id = rm[key];
      if (id) {
        spaSecs.forEach(s => s.classList.toggle('active', s.id === id));
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + key));
        scrollTo(0, 0);
        // 每次进入当前板块都重新触发进入动效
        const sec = document.getElementById(id);
        sec.querySelectorAll('.reveal').forEach(el => {
          el.classList.remove('in');
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) {
            setTimeout(() => el.classList.add('in'), 60);
          } else {
            revealIO.observe(el);
          }
        });
        sec.querySelectorAll('.anim').forEach(el => {
          el.classList.remove('anim');
          void el.offsetWidth;
          el.classList.add('anim');
        });
      }
    };
    addEventListener('hashchange', go);
    go();
  }
})();

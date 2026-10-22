import { localizedExercise, term } from './localization.js'
import { EXERCISES, CATEGORIES, filterExercises } from './exercises.js'
import './exerciseLibrary.css'

export function renderExerciseLibrary(locale='zh') {
  const catalogue=EXERCISES.map(e=>({...localizedExercise(e,locale),keywords:[...e.keywords,e.title,...e.muscles,...e.equipment]}))
  const categories=CATEGORIES.map(c=>({...c,label:term(c.label,locale)}))
  document.body.className = 'library-page'
  document.body.innerHTML = `<div class="library-shell">
    <header class="library-header"><a class="library-logo" href="./" aria-label="Movement Lab 动作库首页"><span class="library-logo-mark">M<span>↗</span></span><span>MOVEMENT <b>LAB</b><small>看懂动作，理解发力</small></span></a><nav aria-label="网站导航"><a href="./" aria-current="page">动作库</a><a href="./anatomy/">人体图谱 <span>↗</span></a></nav></header>
    <main><section class="library-hero"><div class="library-eyebrow"><i></i> 3D MOVEMENT LIBRARY</div><h1 aria-label="健身动作库：3D动作演示与发力肌群">每一个动作，<br>都看得更清楚<span>。</span></h1><p>从动作演示到肌群发力，在三维空间里理解训练。<br>选择一个动作，旋转观察，逐步拆解。</p><div class="library-stats"><b>${EXERCISES.length.toString().padStart(2, '0')}</b><span>已上线动作</span><i></i><span>3D 演示</span><i></i><span>肌群标色</span><i></i><span>分步说明</span></div><div class="hero-orbit" aria-hidden="true"><span></span><span></span><b>MOVE<br><em>WITH</em><br>CLARITY.</b></div></section>
    <section class="library-browser" aria-labelledby="library-title"><div class="library-section-top"><div><span class="library-eyebrow">EXPLORE THE MOVEMENTS</span><h2 id="library-title">动作库</h2></div><label class="library-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" aria-label="搜索动作" placeholder="搜索动作、肌肉或器械…" autocomplete="off"/><button type="button" aria-label="清除搜索" hidden>×</button></label></div>
    <div class="library-filters" role="group" aria-label="按主要训练部位筛选">${categories.map(category => `<button data-category="${category.id}" aria-pressed="${category.id === 'all'}">${category.label}<span>${category.id === 'all' ? EXERCISES.length : EXERCISES.filter(e => e.category === category.id).length}</span></button>`).join('')}</div>
    <div class="library-results-meta"><p id="library-result-count" role="status" aria-live="polite"></p><span>按主要训练部位分类</span></div>
    <div class="library-content"><div id="library-results"></div><aside class="library-guide"><span class="library-eyebrow">HOW TO EXPLORE</span><h3>从看懂，到掌握。</h3><ol><li><b>01</b><div><strong>观察完整动作</strong><p>旋转视角，查看关节与器械的运动。</p></div></li><li><b>02</b><div><strong>找到目标肌群</strong><p>深红看主要发力，浅红看辅助肌群。</p></div></li><li><b>03</b><div><strong>拆解每个阶段</strong><p>暂停、慢放，结合说明逐步观察。</p></div></li></ol><a href="./anatomy/">想先认识人体？<span>打开人体图谱 ↗</span></a></aside></div>
    </section></main><footer class="library-footer"><span>MOVEMENT LAB</span><p>当前已上线 ${EXERCISES.length} 个动作，后续新增动作将在这里统一展示。</p><span>观察 · 理解 · 练习</span></footer></div>`
  let category = 'all'
  const input = document.querySelector('.library-search input')
  const clear = document.querySelector('.library-search button')
  function render() {
    const matches = filterExercises(input.value, category,catalogue)
    const count = document.querySelector('#library-result-count')
    count.textContent = input.value.trim() || category !== 'all' ? `找到 ${matches.length} 个动作 · 共 ${EXERCISES.length} 个已上线` : `全部 ${EXERCISES.length} 个动作`
    clear.hidden = !input.value
    const results = document.querySelector('#library-results')
    results.replaceChildren()
    if (!matches.length) {
      const empty = document.createElement('div'); empty.className = 'library-empty'
      empty.innerHTML = '<span>⌕</span><h3>暂时没有匹配的动作</h3><p>试试其他关键词或训练部位。</p><button type="button">查看全部动作</button>'
      empty.querySelector('button').onclick = () => { category = 'all'; input.value = ''; updateFilterButtons(); render() }
      results.append(empty); return
    }
    for (const exercise of matches) {
      const card = document.createElement('a'); card.className = 'exercise-card'; card.href = exercise.href
      card.setAttribute('aria-label', `${exercise.title}，进入3D演示`)
      card.innerHTML = `<div class="exercise-art"><img class="exercise-preview" loading="lazy" decoding="async" width="640" height="340" src="${exercise.thumbnail}" alt="${exercise.title}三维演示" /><span class="exercise-available"><i></i> 可进入演示</span><span class="exercise-play" aria-hidden="true">↗</span></div><div class="exercise-card-body"><span class="exercise-category">${categories.find(c => c.id === exercise.category)?.label} <span>／</span> ${exercise.equipment.join(' · ')}</span><h3>${exercise.title}</h3><p class="exercise-english">${exercise.english}</p><p class="exercise-description">${exercise.description}</p><div class="exercise-tags"><span>${exercise.muscles[0]}</span><span>3D 动作</span><span>肌群标色</span><span>动作说明</span></div><div class="exercise-card-bottom"><span>进入动作演示</span><b>→</b></div></div>`
      results.append(card)
    }
  }
  function updateFilterButtons() { document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(category === button.dataset.category))) }
  document.querySelectorAll('[data-category]').forEach(button => { button.onclick = () => { category = button.dataset.category; updateFilterButtons(); render() } })
  input.oninput = render
  clear.onclick = () => { input.value = ''; input.focus(); render() }
  render()
}

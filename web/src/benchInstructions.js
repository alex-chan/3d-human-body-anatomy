import { browserLocale, guideFor, localizedExercise, term } from './localization.js'
const CUES = {
  '下放': '缓慢屈肘，将杠铃降到胸部上方，保持肩胛稳定。',
  '底部停顿': '在胸部上方短暂停稳，保持张力，不要弹胸。',
  '推起': '平稳向上推起，伸展双肘，避免耸肩和抬臀。',
  '顶部停顿': '稳定杠铃，避免猛然锁死肘关节，再控制下放。',
}

export function addBenchInstructions(panel) {
  const toggle = document.createElement('button')
  toggle.className = 'press-instructions-toggle'
  toggle.textContent = '动作说明'
  toggle.setAttribute('aria-expanded', 'false')
  toggle.setAttribute('aria-controls', 'press-instructions')
  const drawer = document.createElement('aside')
  drawer.id = 'press-instructions'
  drawer.className = 'press-instructions'
  drawer.hidden = true
  drawer.setAttribute('aria-label', '杠铃卧推动作说明')
  drawer.innerHTML = `
    <div class="press-instructions-head"><div><span>HOW TO / 动作要领</span><h2>仰卧杠铃胸推</h2></div><button type="button" aria-label="关闭动作说明">×</button></div>
    <p class="press-instructions-lead">先稳定身体，再控制杠铃。当前动作阶段会在下方同步高亮。</p>
    <ol class="press-steps">
      <li data-press-step="准备"><span class="press-step-number">01</span><div><h3>准备姿势</h3><p>双脚踩实地面，头部、上背和臀部保持接触凳面。肩胛向后收紧，腹部绷紧，保留自然腰部弧度；双手握距略宽于肩。</p></div></li>
      <li data-press-step="下放"><span class="press-step-number">02</span><div><h3>控制下放</h3><p>缓慢屈肘，将杠铃降到胸部上方。保持手腕稳定、肩胛收紧，避免双肘过度外展。</p></div></li>
      <li data-press-step="底部停顿"><span class="press-step-number">03</span><div><h3>底部停稳</h3><p>在胸部上方短暂停顿，保持胸部张力，不要借助反弹推起杠铃。</p></div></li>
      <li data-press-step="推起"><span class="press-step-number">04</span><div><h3>平稳推起</h3><p>双手平稳推起杠铃，伸展双肘；肩胛保持稳定，臀部留在凳面上。</p></div></li>
      <li data-press-step="顶部停顿"><span class="press-step-number">05</span><div><h3>顶部控制</h3><p>在顶部稳定杠铃，避免猛然锁死肘关节；保持身体支撑，进入下一次下放。</p></div></li>
    </ol>
    <section class="press-errors"><h3>常见错误</h3><p>下放过快或弹胸；耸肩、双肘过度外展；抬臀或过度拱腰；重量超过控制能力。</p></section>
    <p class="press-instructions-note">演示中的停顿用于观察动作。可暂停或拖动进度，对照各阶段姿态。</p>
    <a class="press-instructions-source" href="https://www.nasm.org/resource-center/exercise-library/barbell-bench-press" target="_blank" rel="noopener noreferrer">动作要领参考：NASM ↗</a>`
  const locale=browserLocale(),guide=locale==='zh'?null:guideFor('bench',locale)
  if(guide){
    drawer.querySelector('h2').textContent=localizedExercise({id:'bench',equipment:[],muscles:[]},locale).title
    drawer.querySelector('.press-instructions-lead').textContent=term('演示中的停顿用于观察动作，可拖动进度逐步查看。',locale)
    const items=drawer.querySelectorAll('.press-steps li')
    items[0].querySelector('p').textContent=guide.setup
    guide.phases.forEach((phase,i)=>{items[i+1].querySelector('h3').textContent=phase;items[i+1].querySelector('p').textContent=guide.cues[i]})
    drawer.querySelector('.press-errors p').textContent=guide.errors
    drawer.querySelector('.press-instructions-note').textContent=term('演示中的停顿用于观察动作，可拖动进度逐步查看。',locale)
  }
  panel.append(toggle, drawer)
  const setOpen = open => {
    drawer.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    toggle.classList.toggle('active', open)
  }
  toggle.onclick = () => setOpen(drawer.hidden)
  drawer.querySelector('button').onclick = () => { setOpen(false); toggle.focus() }
  panel.addEventListener('keydown', event => { if (event.key === 'Escape' && !drawer.hidden) { setOpen(false); toggle.focus() } })
  const cue = panel.querySelector('#press-phase-cue')
  const steps = [...drawer.querySelectorAll('[data-press-step]')]
  let previous
  return { update(phase) {
    if (previous === phase) return
    previous = phase
    cue.textContent = guide?guide.cues[['下放','底部停顿','推起','顶部停顿'].indexOf(phase)]:CUES[phase] || ''
    for (const step of steps) {
      const active = step.dataset.pressStep === phase
      step.classList.toggle('current', active)
      if (active) step.setAttribute('aria-current', 'step')
      else step.removeAttribute('aria-current')
    }
  } }
}

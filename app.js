const STORAGE_KEY = 'yosakoi-practice-planner-v1';
const SCHEDULES_KEY = 'yosakoi-saved-timelines-v1';
const defaults = [
  { title: '集合・出欠確認', detail: '荷物を置いて、参加者を確認', minutes: 10, category: 'meeting', subItems: ['出欠・遅刻者を記録', '初参加者・見学者を案内'] },
  { title: 'ストレッチ・基礎体力', detail: '体幹・アイソレーション・鳴子の持ち方', minutes: 20, category: 'warmup', subItems: ['首・肩・股関節のストレッチ', 'アイソレーションを各8カウント'] },
  { title: '振り入れ（前半）', detail: '1〜32カウントを重点的に', minutes: 40, category: 'dance', subItems: ['1〜16カウントをゆっくり確認', '17〜32カウントを隊形つきで練習'] },
  { title: '休憩・給水', detail: '各自で水分補給', minutes: 10, category: 'break' },
  { title: '隊列・移動練習', detail: '立ち位置と移動のタイミングを確認', minutes: 30, category: 'formation' },
  { title: '通し練習・振り返り', detail: '本番を意識して1回通す', minutes: 20, category: 'dance' },
];
const baseState = { id: null, title: '新しい練習スケジュール', date: new Date().toISOString().slice(0, 10), start: '18:00', finish: '20:00', place: '', leader: '', memo: '', items: defaults, members: [] };
const state = { ...baseState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}) };
state.members = (state.members || []).map(member => ({ ...member, status: member.status === 'late' ? 'partial' : member.status || (member.present ? 'present' : 'absent') }));
const $ = (selector) => document.querySelector(selector);
const list = $('#schedule-list');

function timeAfter(start, minutes) { const [h, m] = start.split(':').map(Number); const total = h * 60 + m + minutes; return `${String(Math.floor((total / 60) % 24)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function save() { state.title = $('#schedule-title').value || '名称未設定のスケジュール'; state.date = $('#practice-date').value; state.start = $('#start-time').value; state.finish = $('#finish-time').value; state.place = $('#place').value; state.leader = $('#leader').value; state.memo = $('#memo').value; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#save-status').textContent = '下書きを自動保存しました'; clearTimeout(save.timer); save.timer = setTimeout(() => $('#save-status').textContent = '変更内容はこの端末に自動保存されます', 1400); }
function minutesSinceMidnight(time) { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes; }
function finishMinutes() { let finish = minutesSinceMidnight(state.finish); if (finish < minutesSinceMidnight(state.start)) finish += 24 * 60; return finish; }
function updateSummary() { const total = state.items.reduce((sum, item) => sum + Number(item.minutes || 0), 0); const scheduledEnd = minutesSinceMidnight(state.start) + total; const alert = $('#schedule-alert'); $('#item-count').textContent = `${state.items.length}件`; if (scheduledEnd > finishMinutes()) { const excess = scheduledEnd - finishMinutes(); alert.textContent = `⚠ 練習メニューが終了時刻を${excess}分超えています。メニュー時間または終了時刻を調整してください。`; alert.hidden = false; } else { alert.hidden = true; } }
function renderMembers() {
  const list = $('#member-list'); list.innerHTML = '';
  const labels = { present: '○ 出席', partial: '△ 遅刻・早退', absent: '✕ 欠席' };
  state.members.forEach((member, index) => { const node = $('#member-template').content.firstElementChild.cloneNode(true); const name = node.querySelector('.member-name'), status = node.querySelector('.status-toggle'); name.value = member.name; status.classList.add(member.status); status.textContent = labels[member.status]; name.addEventListener('input', () => { member.name = name.value; save(); }); name.addEventListener('change', render); status.addEventListener('click', () => { member.status = member.status === 'present' ? 'partial' : member.status === 'partial' ? 'absent' : 'present'; save(); render(); }); node.querySelector('.remove-small').addEventListener('click', () => { state.members.splice(index, 1); save(); render(); }); list.appendChild(node); });
  $('#present-count').textContent = `参加 ${state.members.filter(member => member.status !== 'absent' && member.name.trim()).length}名`;
}
function render() {
  list.innerHTML = ''; let elapsed = 0;
  state.items.forEach((item, index) => {
    const node = $('#schedule-template').content.firstElementChild.cloneNode(true);
    node.dataset.index = index; node.dataset.category = item.category; node.draggable = true;
    node.querySelector('.start-label').textContent = timeAfter(state.start, elapsed); elapsed += Number(item.minutes || 0); node.querySelector('.end-label').textContent = `〜 ${timeAfter(state.start, elapsed)}`; if (minutesSinceMidnight(state.start) + elapsed > finishMinutes()) node.classList.add('overrun');
    const title = node.querySelector('.title-input'), detail = node.querySelector('.detail-input'), assignee = node.querySelector('.assignee-input'), duration = node.querySelector('.duration-input'), category = node.querySelector('.category-select');
    item.subItems ||= []; item.assignee ||= ''; item.minutes = Math.max(5, Math.min(60, Math.round(Number(item.minutes || 5) / 5) * 5)); title.value = item.title; detail.value = item.detail; category.value = item.category;
    for (let minutes = 5; minutes <= 60; minutes += 5) { const option = document.createElement('option'); option.value = minutes; option.textContent = minutes; duration.appendChild(option); } duration.value = item.minutes;
    state.members.filter(member => member.status !== 'absent' && member.name.trim()).forEach(member => { const option = document.createElement('option'); option.value = member.name; option.textContent = `${member.status === 'present' ? '○' : '△'} ${member.name}`; assignee.appendChild(option); }); assignee.value = item.assignee;
    [[title, 'title'], [detail, 'detail'], [assignee, 'assignee']].forEach(([el, key]) => el.addEventListener('input', () => { state.items[index][key] = el.value; save(); }));
    category.addEventListener('input', () => { state.items[index].category = category.value; save(); render(); });
    duration.addEventListener('change', () => { state.items[index].minutes = Number(duration.value); save(); render(); });
    node.querySelector('.delete-button').addEventListener('click', () => { state.items.splice(index, 1); save(); render(); });
    const panel = node.querySelector('.subitem-panel'); const toggle = node.querySelector('.subitem-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => { const open = panel.hidden; panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); });
    const renderSubItems = () => { const subList = node.querySelector('.subitem-list'); subList.innerHTML = ''; item.subItems.forEach((subItem, subIndex) => { const row = $('#subitem-template').content.firstElementChild.cloneNode(true); const input = row.querySelector('.subitem-input'); input.value = subItem; input.addEventListener('input', () => { item.subItems[subIndex] = input.value; save(); }); row.querySelector('.remove-subitem').addEventListener('click', () => { item.subItems.splice(subIndex, 1); save(); renderSubItems(); }); subList.appendChild(row); }); };
    renderSubItems();
    node.querySelector('.add-subitem-button').addEventListener('click', () => { item.subItems.push(''); save(); renderSubItems(); node.querySelector('.subitem-list').lastElementChild.querySelector('input').focus(); });
    node.querySelector('.move-up').addEventListener('click', () => move(index, -1)); node.querySelector('.move-down').addEventListener('click', () => move(index, 1));
    node.addEventListener('dragstart', () => node.classList.add('dragging')); node.addEventListener('dragend', () => { node.classList.remove('dragging'); const from = Number(node.dataset.index), target = [...list.children].indexOf(node); if (from !== target) { const [moved] = state.items.splice(from, 1); state.items.splice(target, 0, moved); save(); render(); } });
    list.appendChild(node);
  });
  list.ondragover = (event) => { event.preventDefault(); const dragging = $('.dragging'); const after = [...list.children].filter(n => n !== dragging).find(n => event.clientY < n.getBoundingClientRect().top + n.offsetHeight / 2); list.insertBefore(dragging, after || null); };
  updateSummary();
  renderMembers();
}
function move(index, direction) { const to = index + direction; if (to < 0 || to >= state.items.length) return; [state.items[index], state.items[to]] = [state.items[to], state.items[index]]; save(); render(); }
function populateTimeSelect(select, selected) { select.innerHTML = ''; for (let hour = 0; hour < 24; hour += 1) { for (let minute = 0; minute < 60; minute += 15) { const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; const option = document.createElement('option'); option.value = value; option.textContent = value; select.appendChild(option); } } select.value = selected; }
function fillEditor() { $('#schedule-title').value = state.title; $('#practice-date').value = state.date; populateTimeSelect($('#start-time'), state.start); populateTimeSelect($('#finish-time'), state.finish || '20:00'); $('#place').value = state.place; $('#leader').value = state.leader; $('#memo').value = state.memo; render(); }
function savedTimelines() { return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || '[]'); }
function renderHome() { const records = savedTimelines(); const list = $('#timeline-list'); list.innerHTML = ''; $('#empty-timelines').hidden = records.length > 0; records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).forEach(record => { const entry = document.createElement('article'); entry.className = 'timeline-entry'; const card = document.createElement('button'); card.className = 'timeline-card'; card.innerHTML = `<h3>${record.title}</h3><p>${record.date || '日付未設定'}　${record.start || '--:--'}〜${record.finish || '--:--'}</p><p>${record.items.length}件の練習メニュー</p><span class="card-arrow">開いて編集する →</span>`; card.addEventListener('click', () => { Object.assign(state, structuredClone(record)); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); showEditor(); }); const remove = document.createElement('button'); remove.className = 'delete-timeline-button'; remove.type = 'button'; remove.title = 'このスケジュールを削除'; remove.textContent = '×'; remove.addEventListener('click', () => { if (!confirm(`「${record.title}」を削除しますか？`)) return; localStorage.setItem(SCHEDULES_KEY, JSON.stringify(savedTimelines().filter(item => item.id !== record.id))); if (state.id === record.id) state.id = null; renderHome(); }); entry.append(card, remove); list.appendChild(entry); }); }
function showHome() { $('#save-modal').hidden = true; $('#editor-screen').hidden = true; $('#home-screen').hidden = false; $('#save-timeline-button').hidden = true; renderHome(); }
function showEditor() { $('#home-screen').hidden = true; $('#editor-screen').hidden = false; $('#save-timeline-button').hidden = false; fillEditor(); }
function saveTimeline() { save(); if (!state.id) state.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`; const records = savedTimelines(); const record = { ...structuredClone(state), updatedAt: new Date().toISOString() }; const existing = records.findIndex(item => item.id === state.id); if (existing >= 0) records[existing] = record; else records.push(record); localStorage.setItem(SCHEDULES_KEY, JSON.stringify(records)); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#save-status').textContent = 'タイムスケジュールを保存しました'; $('#save-modal').hidden = false; }
fillEditor();
['#schedule-title','#practice-date','#place','#leader','#memo'].forEach(selector => $(selector).addEventListener('input', save));
['#start-time','#finish-time'].forEach(selector => $(selector).addEventListener('change', () => { const input = $(selector); if (selector === '#start-time') state.start = input.value; else state.finish = input.value; save(); render(); }));
$('#add-button').addEventListener('click', () => { state.items.push({ title: '新しいメニュー', detail: '', assignee: '', minutes: 20, category: 'dance', subItems: [] }); save(); render(); });
$('#add-member-button').addEventListener('click', () => { state.members.push({ name: '', status: 'absent' }); save(); render(); });
$('#print-button').addEventListener('click', () => window.print());
$('#reset-button').addEventListener('click', () => { if (confirm('練習メニューを初期状態に戻しますか？\n運営メンバー名簿は残ります。')) { const members = structuredClone(state.members); Object.assign(state, structuredClone(baseState), { members }); save(); render(); } });
$('#home-button').addEventListener('click', showHome);
$('#new-timeline-button').addEventListener('click', () => { const members = state.members.map(member => ({ name: member.name, status: 'absent' })); Object.assign(state, structuredClone(baseState), { members }); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); showEditor(); });
$('#save-timeline-button').addEventListener('click', saveTimeline);
$('#modal-home-button').addEventListener('click', showHome);
$('#modal-close-button').addEventListener('click', () => { $('#save-modal').hidden = true; });

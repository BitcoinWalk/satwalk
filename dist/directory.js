(() => {
  const origin = 'https://bitcoinwalk.org';
  const byId = id => document.getElementById(id);
  const search = byId('walk-search');
  const list = byId('walk-list');
  const canvas = byId('walk-map');
  const count = byId('walk-count');
  const retry = byId('walk-retry');
  const buttons = [byId('walk-list-button'), byId('walk-map-button')];
  let directory = [];
  let view = 'list';
  let map, markers;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function publicUrl(value) {
    try {
      const url = new URL(value);
      return url.origin === origin && !url.username && !url.password ? url : null;
    } catch { return null; }
  }
  function link(label, url) {
    const a = element('a', label);
    a.href = url.href;
    return a;
  }
  function localTime(walk) {
    const options = {weekday:'long', day:'numeric', month:'long', year:'numeric',
      hour:'2-digit', minute:'2-digit', timeZoneName:'short', timeZone:walk.timeZone || 'UTC'};
    try { return new Intl.DateTimeFormat('en-GB', options).format(walk.start); }
    catch { return walk.start.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'; }
  }
  function eventDetails(walk) {
    const block = element('div', '', 'walk-event');
    const date = element('time', localTime(walk), 'walk-date');
    date.dateTime = walk.start.toISOString();
    const p = element('p', '');
    p.append(date);
    block.append(p);
    if (walk.address) block.append(element('p', walk.address));
    block.append(link('Walk details', walk.url));
    return block;
  }
  function rowsFrom(cities, events) {
    const rows = new Map();
    for (const city of cities) {
      const url = publicUrl(city.canonicalUrl);
      if (url && city.name) rows.set(url.pathname.replace(/\/$/, ''), {
        name:city.name, url, aliases:city.aliases || [], walks:[]
      });
    }
    for (const event of events) {
      const url = publicUrl(event.link);
      if (!url) continue;
      const city = rows.get(url.pathname.substring(0, url.pathname.lastIndexOf('/')));
      const start = new Date(event.startDate);
      if (city && start.getTime() >= Date.now()) city.walks.push({...event, url, start});
    }
    return [...rows.values()].sort((a,b) => {
      const first = city => city.walks[0]?.start.getTime() ?? Infinity;
      return first(a) - first(b) || a.name.localeCompare(b.name);
    });
  }
  function drawMap(groups) {
    if (!map) {
      map = L.map(canvas, {scrollWheelZoom:false}).setView([20,0], 2);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      markers = L.layerGroup().addTo(map);
    }
    map.invalidateSize();
    markers.clearLayers();
    for (const {point, walks} of groups.values()) {
      const popup = element('div', '');
      for (const [city,walk] of walks) popup.append(element('strong', city.name), eventDetails(walk));
      L.marker(point, {title:walks[0][0].name}).bindPopup(popup).addTo(markers);
    }
    map.fitBounds([...groups.values()].map(group => group.point), {padding:[24,24], maxZoom:14});
  }
  function render() {
    if (directory === null) return;
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = directory.flatMap(city => {
      if ([city.name,...city.aliases].some(name => name.toLocaleLowerCase().includes(query))) return [city];
      const walks = city.walks.filter(w => (w.address || '').toLocaleLowerCase().includes(query));
      return walks.length ? [{...city,walks}] : [];
    });
    buttons.forEach((button,i) => button.setAttribute('aria-pressed', String(view === ['list','map'][i])));
    list.hidden = view !== 'list';
    list.replaceChildren();
    const groups = new Map();
    for (const city of filtered) {
      if (view === 'list') {
        const card = element('article', '', 'walk-card');
        card.append(element('h3', city.name));
        for (const walk of city.walks) card.append(eventDetails(walk));
        if (!city.walks.length) card.append(element('p','No upcoming walk scheduled.'), link('City details', city.url));
        list.append(card);
      } else {
        for (const walk of city.walks) {
          const {latitude:lat,longitude:lng} = walk;
          if (!Number.isFinite(lat) || Math.abs(lat)>90 || !Number.isFinite(lng) || Math.abs(lng)>180) continue;
          const key = [lat,lng].join(',');
          if (!groups.has(key)) groups.set(key,{point:[lat,lng], walks:[]});
          groups.get(key).walks.push([city,walk]);
        }
      }
    }
    canvas.hidden = view !== 'map' || !groups.size;
    if (!canvas.hidden) drawMap(groups);
    if (!filtered.length) count.textContent = query ? 'No matching cities or meeting points.' : 'No cities listed yet.';
    else if (view === 'map') count.textContent = groups.size ? groups.size + (groups.size === 1 ? ' meeting point' : ' meeting points') + ' for upcoming walks.' : 'No upcoming walks with a mapped meeting point.';
    else count.textContent = filtered.length + (filtered.length === 1 ? ' city' : ' cities');
  }
  async function feed(key) {
    const response = await fetch(origin + '/api/' + key, {signal:AbortSignal.timeout(25000)});
    if (!response.ok) throw new Error('Directory unavailable');
    const data = await response.json();
    if (!Array.isArray(data[key])) throw new Error('Invalid directory');
    return data[key];
  }
  async function load() {
    directory = null;
    retry.hidden = true;
    count.textContent = 'Loading walks…';
    try {
      const [cities, events] = await Promise.all([feed('cities'), feed('events')]);
      events.sort((a,b) => Date.parse(a.startDate) - Date.parse(b.startDate));
      directory = rowsFrom(cities, events);
      render();
    } catch {
      count.textContent = 'The walk directory is temporarily unavailable.';
      retry.hidden = false;
    }
  }
  buttons.forEach((button,i) => button.onclick = () => {view = ['list','map'][i]; render();});
  search.oninput = render;
  retry.onclick = load;
  load();
})();

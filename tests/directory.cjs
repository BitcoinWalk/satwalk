const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Node {
  children = [];
  value = '';
  append(...nodes) {this.children.push(...nodes);}
  replaceChildren() {this.children = [];}
  setAttribute(key,value) {this[key] = value;}
  text() {return [this.textContent,...this.children.map(n=>n.text())].join(' ');}
}
async function check() {
  const nodes = new Map();
  const pins = [];
  const id = key => {
    if (!nodes.has(key)) nodes.set(key,new Node());
    return nodes.get(key);
  };
  const document = {getElementById:id,createElement:()=>new Node()};
  const host = 'https://bitcoinwalk.org/';
  const cities = ['Funchal','London'].map(name=>({name,canonicalUrl:host+name,aliases:[]}));
  const event = {link:host+'Funchal/abc',startDate:'2099-01-01T23:30:00Z',timeZone:'Europe/Warsaw',latitude:32,longitude:-17,address:'Park'};
  let fail = true;
  const fetch = async url=>({ok:!fail,json:async()=>url.endsWith('cities')?{cities}:{events:[event,{...event,link:host+'Funchal/def'}]}});
  const layer = {addTo(){return this;},clearLayers(){},bindPopup(popup){pins.push(popup);return this;}};
  const map = {setView(){return this;},invalidateSize(){},fitBounds(){}};
  const L = {map:()=>map,tileLayer:()=>layer,layerGroup:()=>layer,marker:()=>layer};
  vm.runInNewContext(fs.readFileSync('dist/directory.js','utf8'),{document,fetch,URL,AbortSignal,Intl,Date,L});
  await new Promise(setImmediate);
  assert.equal(id('walk-retry').hidden,false);
  fail = false;
  await id('walk-retry').onclick();
  assert.match(id('walk-list').text(),/2 January 2099/);
  assert.match(id('walk-list').text(),/London.*No upcoming walk scheduled/);
  id('walk-search').value='park';
  id('walk-search').oninput();
  assert.equal(id('walk-list').children.length,1);
  id('walk-map-button').onclick();
  assert.equal(pins.length,1);
  assert.equal(pins[0].text().match(/Walk details/g).length,2);
  id('walk-search').value='London';
  id('walk-search').oninput();
  assert.equal(id('walk-map').hidden,true);
  assert.match(id('walk-count').text(),/No upcoming walks/);
}
check().catch(error=>{console.error(error);process.exitCode=1;});

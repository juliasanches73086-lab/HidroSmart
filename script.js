
const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out'];
let data=[];
let alerts=[];
let tarifa=0;
let daily={};
let loaded=false;
const statusNode=document.createElement('div');
statusNode.className='notice';
statusNode.textContent='Conectando ao banco MySQL...';
document.querySelector('#app').appendChild(statusNode);
async function carregarBanco(){
  try {
    const res=await fetch('api/dashboard.php',{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const payload=await res.json();
    const mapa=new Map();
    for(const s of payload.sectors){mapa.set(s.codigo,{codigo:s.codigo,nome:s.setor,consumos:Array(10).fill(0),meta:Number(s.meta_outubro||0),tipo:s.tipo_medicao});}
    for(const r of payload.readings){
      const item=mapa.get(r.codigo),indice=Number(String(r.mes).slice(5,7))-1;
      if(item && indice>=0 && indice<10)item.consumos[indice]=Number(r.consumo_m3);
    }
    data=[...mapa.values()].filter(x=>x.tipo==='SETORIAL').map(x=>[x.codigo,x.nome,x.consumos,x.meta]);
    alerts=payload.alerts.map(a=>[a.codigo,a.setor,a.observacao||a.tipo,a.status,a.data]);
    daily={};
    for(const row of payload.daily){
      if(!daily[row.codigo])daily[row.codigo]={};
      daily[row.codigo][row.dia]=Number(row.consumo_m3);
    }
    tarifa=Number(payload.tarifa||0);
    loaded=true;render();
  }catch(e){
    loaded=false;
    document.querySelector('#app').innerHTML='<div class="notice"><strong>Não foi possível carregar os dados do MySQL.</strong><p>Verifique se o Apache do XAMPP está iniciado, se o MySQL está ativo e se a senha no arquivo config.php está correta.</p><small>'+String(e.message).replace(/[<>]/g,'')+'</small><p><button class="action" onclick="carregarBanco()">Tentar novamente</button></p></div>';
  }
}
let page='dashboard',period=12;
const fmt=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(n);
const sum=a=>a.reduce((x,y)=>x+y,0);
function values(d,code){
 if(period===7||period===30){
   const n=period;
   return Array.from({length:n},(_,i)=>Number(daily[code]?.[`2026-10-${String(31-n+i+1).padStart(2,'0')}`]||0));
 }
 return d.slice(-period);
}
function total(){return sum(data.map(d=>sum(values(d[2],d[0]))))}
function pill(){return '<div class="pill-group">'+[[7,'7 dias'],[30,'30 dias'],[3,'3 meses'],[6,'6 meses'],[12,'12 meses']].map(([v,t])=>`<button class="${period===v?'active':''}" onclick="setPeriod(${v})">${t}</button>`).join('')+'</div>'}
function toolbar(t,filter=true){return `<div class="toolbar"><h2>${t}</h2><div class="right"><span class="tag">● Dados simulados</span>${filter?pill():''}</div></div>`}
function kpi(t,v,d,i){return `<div class="kpi"><span class="klabel">${t}</span><span class="symbol">${i}</span><strong>${v}</strong><small>${d}</small></div>`}
function graph(vals,labels){let w=760,h=250,p=38,max=Math.max(...vals)*1.15;let x=i=>p+i*(w-p*2)/Math.max(vals.length-1,1),y=v=>h-p-v/max*(h-p*2);let path=vals.map((v,i)=>`${i?'L':'M'}${x(i)},${y(v)}`).join(' ');return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${[0,.25,.5,.75,1].map(q=>`<line x1="${p}" x2="${w-p}" y1="${y(max*q)}" y2="${y(max*q)}" stroke="#e6edf5"/><text x="0" y="${y(max*q)+4}" fill="#9aa9b9" font-size="11">${Math.round(max*q)}</text>`).join('')}<path d="${path} L${x(vals.length-1)},${h-p} L${p},${h-p} Z" fill="#21b6ca" opacity=".12"/><path d="${path}" stroke="#188bda" stroke-width="3" fill="none"/>${vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="white" stroke="#188bda" stroke-width="2"><title>${labels[i]}: ${fmt(v)} m³</title></circle><text x="${x(i)}" y="${h-8}" font-size="11" fill="#889aaf" text-anchor="middle">${labels[i]}</text>`).join('')}</svg>`}
function graphMain(){
 if(period===7||period===30){
   const n=period;
   const vals=Array.from({length:n},(_,i)=>{
     const day=`2026-10-${String(31-n+i+1).padStart(2,'0')}`;
     return sum(data.map(d=>Number(daily[d[0]]?.[day]||0)));
   });
   if(n===7)return graph(vals,['25','26','27','28','29','30','31']);
   return graph(vals,Array.from({length:30},(_,i)=>[0,4,9,14,19,24,29].includes(i)?String(i+2):''));
 }
 let a=months.map((m,i)=>sum(data.map(d=>d[2][i])));
 return graph(a.slice(-period),months.slice(-period));
}
function table(){return `<div class="table-wrap"><table><thead><tr><th>Setor</th><th>Hidrômetro</th><th>Consumo</th><th>Participação</th><th>Status</th></tr></thead><tbody>${data.map(d=>{let n=sum(values(d[2],d[0])),bad=['H012','H021','H022'].includes(d[0]);return `<tr><td><strong>${d[1]}</strong></td><td>${d[0]}</td><td>${fmt(n)} m³</td><td><div class="meter"><span class="${bad?'red':''}" style="width:${n/total()*100}%"></span></div></td><td><span class="badge ${bad?'danger':''}">${bad?'Atenção':'Normal'}</span></td></tr>`}).join('')}</tbody></table></div>`}
function alertCards(full=false){return alerts.slice(0,full?5:3).map(a=>`<div class="alert ${a[3]==='RESOLVIDO'?'resolved':''}" onclick="detail('${a[0]}')"><span class="aicon">${a[3]==='ATIVO'?'!':'✓'}</span><div><strong>${a[1]} · ${a[0]}</strong><p>${a[2]}</p><span class="badge ${a[3]==='ATIVO'?'danger':''}">${a[3]}</span></div><span class="date">${a[4]}</span></div>`).join('')}
function dashboard(){return toolbar('Indicadores de consumo')+`<div class="kpis">${kpi('Consumo do período',fmt(total())+' m³','Total dos setores','◈')}${kpi('Custo estimado',money(total()*tarifa),'Tarifa do banco de dados','R$')}${kpi('Alertas ativos',String(alerts.filter(a=>a[3]==='ATIVO').length),'Pontos de atenção','⚑')}${kpi('Setores monitorados',String(data.length),'+ medidor geral H001','▦')}</div><div class="two"><div class="panel"><div class="panel-head"><h2>Evolução do consumo</h2><small>m³ · simulado</small></div>${graphMain()}</div><div class="panel"><div class="panel-head"><h2>Alertas recentes</h2></div>${alertCards()}</div></div><div class="panel"><div class="panel-head"><h2>Consumo por setor</h2></div>${table()}</div>`}
function consumo(){return toolbar('Consumo e custos')+`<div class="kpis">${kpi('Consumo',fmt(total())+' m³','Setores monitorados','◈')}${kpi('Custo estimado',money(total()*tarifa),'Tarifa do banco de dados','R$')}${kpi('Lavanderia em janeiro','1.350 m³','Antes do reparo','⌁')}${kpi('Lavanderia em outubro','1.110 m³','Redução de 17,8%','✓')}</div><div class="two"><div class="panel"><h2>Evolução geral</h2>${graphMain()}</div><div class="panel"><h2>Lavanderia · antes e depois</h2>${graph(data[1][2],months)}<p class="note">Cenário fictício: queda de consumo após manutenção em junho.</p></div></div><div class="panel">${table()}</div>`}
function rede(){return toolbar('Rede hídrica',false)+`<div class="notice">Mapa esquemático para demonstração, não é uma planta hidráulica real. Clique no ponto vermelho.</div><div class="panel"><div class="panel-head"><h2>Fábrica Principal · Rede monitorada</h2><small>Entrada geral H001</small></div><div class="network"><div class="rooms">${data.map(d=>`<button class="room ${d[0]==='H012'?'problem':''}" onclick="detail('${d[0]}')"><span>${d[1]}</span><small>${d[0]} ${d[0]==='H012'?'· ⚠ Anomalia':''}</small></button>`).join('')}</div><div class="network-note">━━ Rede monitorada (azul) &nbsp; <span style="color:#e85261">━━ Trecho em atenção (vermelho)</span></div></div></div>`}
function alertas(){return toolbar('Alertas e ocorrências',false)+`<div class="kpis">${kpi('Alertas registrados',String(alerts.length),'Histórico fictício','⚑')}${kpi('Ativos',String(alerts.filter(a=>a[3]==='ATIVO').length),'Necessitam análise','!')}${kpi('Resolvidos',String(alerts.filter(a=>a[3]==='RESOLVIDO').length),'Ocorrências anteriores','✓')}${kpi('Hidrômetros','7','6 setoriais e 1 geral','◈')}</div><div class="panel"><h2>Histórico de ocorrências</h2><div style="margin-top:20px">${alertCards(true)}</div></div>`}
function setores(){return toolbar('Setores monitorados')+`<div class="panel">${table()}</div><div class="panel" style="margin-top:18px"><h2>Estrutura do banco</h2><p class="note">Empresa → Unidade → Setor → Hidrômetro → Leitura. Cada registro de leitura possui data, hora e consumo em metros cúbicos.</p></div>`}
function historico(){return toolbar('Histórico de consumo',false)+`<div class="panel"><div class="panel-head"><h2>Consumo mensal · janeiro a outubro de 2026</h2></div><div class="table-wrap"><table><thead><tr><th>Hidrômetro / setor</th>${months.map(m=>`<th>${m}</th>`).join('')}</tr></thead><tbody>${data.map(d=>`<tr><td><strong>${d[0]}</strong><br>${d[1]}</td>${d[2].map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div><div class="panel" style="margin-top:18px"><p class="note">Os números exibidos são os valores mensais fictícios usados no cenário da HidroSmart. Estes valores são consultados no banco MySQL pelo backend PHP.</p></div>`}
const titles={dashboard:['Visão geral','VISÃO GERAL','Acompanhe consumo, custos e pontos de atenção.'],consumo:['Consumo e custos','CONSUMO E CUSTOS','Compare períodos e acompanhe custos estimados.'],rede:['Rede hídrica','REDE HÍDRICA','Localize visualmente os pontos de atenção.'],alertas:['Alertas','ALERTAS','Consulte ocorrências e anomalias.'],setores:['Setores','SETORES','Acompanhe áreas e hidrômetros.'],historico:['Histórico','HISTÓRICO','Consulte os registros fictícios de 2026.']};
function render(){if(!loaded)return;document.querySelector('#heading').textContent=titles[page][0];document.querySelector('#crumb').textContent=titles[page][1];document.querySelector('#subtitle').textContent=titles[page][2];document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.querySelector('#app').innerHTML=({dashboard,consumo,rede,alertas,setores,historico})[page]()}
function setPeriod(n){period=n;render()}
function detail(code){let a=alerts.find(a=>a[0]===code),d=data.find(d=>d[0]===code);let el=document.createElement('div');el.className='modal-back';el.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><button class="close">✕</button><span class="tag">HIDROSMART · ${code}</span><h2>${a?a[1]:d?.[1]||'Entrada geral'}</h2><p>${a?a[2]+' · '+a[3]:'Nenhuma anomalia registrada neste setor.'}</p><p>Dados fictícios para demonstração acadêmica.</p><button class="action">Entendi</button></div>`;document.body.append(el);el.querySelectorAll('button').forEach(b=>b.onclick=()=>el.remove());el.onclick=e=>{if(e.target===el)el.remove()}}
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});carregarBanco();

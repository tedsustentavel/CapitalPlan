import { useState, useEffect, useCallback } from "react";

// ── DADOS BASE ──
const FINANCIAL_DATA_BASE = {
  jan: { receita: 702366.32,  gastos: 808226.07  },
  fev: { receita: 777089.35,  gastos: 825475.29  },
  mar: { receita: 797250.49,  gastos: 817875.14  },
  abr: { receita: 711538.88,  gastos: 808648.51  },
  mai: { receita: 662814.82,  gastos: 788766.37  },
  jun: { receita: 662843.81,  gastos: 768921.72  },
  jul: { receita: 661430.75,  gastos: 799598.32  },
  ago: { receita: 656625.31,  gastos: 757795.35  },
  set: { receita: 670393.65,  gastos: 756908.41  },
  out: { receita: 659455.72,  gastos: 767506.10  },
  nov: { receita: 675156.48,  gastos: 815229.71  },
  dez: { receita: 663507.40,  gastos: 829490.34  },
};

const buildFin = (raw) => {
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    out[k] = { ...v, resultado: v.receita - v.gastos };
  });
  return out;
};

const MONTHS = [
  { id:"jan", label:"Janeiro",   short:"Jan", semanas:["01–07 Jan","08–14 Jan","15–21 Jan","22–31 Jan"] },
  { id:"fev", label:"Fevereiro", short:"Fev", semanas:["01–07 Fev","08–14 Fev","15–21 Fev","22–28 Fev"] },
  { id:"mar", label:"Março",     short:"Mar", semanas:["01–07 Mar","08–14 Mar","15–21 Mar","22–31 Mar"] },
  { id:"abr", label:"Abril",     short:"Abr", semanas:["01–07 Abr","08–14 Abr","15–21 Abr","22–30 Abr"] },
  { id:"mai", label:"Maio",      short:"Mai", semanas:["01–07 Mai","08–14 Mai","15–21 Mai","22–31 Mai"] },
  { id:"jun", label:"Junho",     short:"Jun", semanas:["01–07 Jun","08–14 Jun","15–21 Jun","22–30 Jun"] },
  { id:"jul", label:"Julho",     short:"Jul", semanas:["01–07 Jul","08–14 Jul","15–21 Jul","22–31 Jul"] },
  { id:"ago", label:"Agosto",    short:"Ago", semanas:["01–07 Ago","08–14 Ago","15–21 Ago","22–31 Ago"] },
  { id:"set", label:"Setembro",  short:"Set", semanas:["01–07 Set","08–14 Set","15–21 Set","22–30 Set"] },
  { id:"out", label:"Outubro",   short:"Out", semanas:["01–07 Out","08–14 Out","15–21 Out","22–31 Out"] },
  { id:"nov", label:"Novembro",  short:"Nov", semanas:["01–07 Nov","08–14 Nov","15–21 Nov","22–30 Nov"] },
  { id:"dez", label:"Dezembro",  short:"Dez", semanas:["01–07 Dez","08–14 Dez","15–21 Dez","22–31 Dez"] },
];

const STATUS_OPTIONS = ["Planejado","Em andamento","Realizado","Cancelado"];
const STATUS_STYLE = {
  Planejado:      { color:"#8A9BBE", bg:"#1A2540", dot:"#4A5A7A" },
  "Em andamento": { color:"#FFB74D", bg:"#251A08", dot:"#FFB74D" },
  Realizado:      { color:"#00D4A1", bg:"#081A10", dot:"#00D4A1" },
  Cancelado:      { color:"#3A4A6A", bg:"#111827", dot:"#2A3A5C" },
};

const SALDO_INICIAL   = 541974.50;
const EMPTY_FORM      = { descricao:"", responsavel:"", valor:"", sinal:"+", prazo:"", status:"Planejado", resultado:"" };
const STORAGE_KEY     = "td_anual_v4";
const STORAGE_KEY_FIN = "td_fin_v4";

// ── FORMATTERS ──
const fmtR = (v) => {
  const n = Number(v); if (isNaN(n)) return "—";
  return `${n<0?"-":""}R$ ${Math.abs(n).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
};
const fmtD = (v) => {
  const n = Number(v); if (isNaN(n)||n===0) return null;
  return `${n>0?"+":"-"} R$ ${Math.abs(n).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
};
const fmtK = (v) => {
  const n = Number(v); if (isNaN(n)) return "—";
  const s = n<0?"-":""; const a = Math.abs(n);
  if (a>=1000000) return `${s}R$ ${(a/1000000).toFixed(1)}M`;
  if (a>=1000)    return `${s}R$ ${(a/1000).toFixed(0)}k`;
  return `${s}R$ ${a.toFixed(0)}`;
};
const parse    = (v, s) => { const n=Number(String(v).replace(/[^\d.]/g,""))||0; return s==="-"?-n:n; };
const parseNum = (v)    => Number(String(v).replace(/[^\d.-]/g,""))||0;

// ── SHARED STYLES ──
const labelSt = { display:"block", fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", marginBottom:5 };
const inputSt = { width:"100%", background:"#0D1527", border:"1px solid #1E2D48", borderRadius:8, padding:"9px 12px", color:"#E0E4F0", fontSize:12, fontFamily:"Georgia,serif", boxSizing:"border-box", outline:"none" };

// ── ACTION FORM ──
function ActionForm({ form, setForm, onSave, onCancel, saveLabel="Salvar" }) {
  return (
    <div style={{ padding:"14px 20px 16px", background:"#060B16", borderTop:"1px solid #111827" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9, marginBottom:11 }}>
        <div style={{ gridColumn:"1 / -1" }}>
          <label style={labelSt}>Descrição *</label>
          <input placeholder="Ex: Renegociar contrato fornecedor X" value={form.descricao}
            onChange={e => setForm({...form,descricao:e.target.value})} style={inputSt} autoFocus />
        </div>
        <div>
          <label style={labelSt}>Responsável</label>
          <input placeholder="Nome" value={form.responsavel}
            onChange={e => setForm({...form,responsavel:e.target.value})} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Valor (R$)</label>
          <div style={{ display:"flex", gap:7 }}>
            <select value={form.sinal} onChange={e => setForm({...form,sinal:e.target.value})}
              style={{...inputSt,width:48,flexShrink:0,padding:"9px 4px",textAlign:"center",color:form.sinal==="+"?"#00D4A1":"#EF9A9A",fontWeight:"bold"}}>
              <option value="+">+</option><option value="-">−</option>
            </select>
            <input type="number" placeholder="0" value={form.valor}
              onChange={e => setForm({...form,valor:e.target.value})}
              style={{...inputSt,flex:1,color:form.sinal==="+"?"#00D4A1":"#EF9A9A"}} />
          </div>
        </div>
        <div>
          <label style={labelSt}>Prazo</label>
          <input placeholder="Ex: 10/jan" value={form.prazo}
            onChange={e => setForm({...form,prazo:e.target.value})} style={inputSt} />
        </div>
        <div>
          <label style={labelSt}>Status</label>
          <select value={form.status} onChange={e => setForm({...form,status:e.target.value})}
            style={{...inputSt,color:STATUS_STYLE[form.status]?.color||"#E0E4F0"}}>
            {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:"2 / -1" }}>
          <label style={labelSt}>Resultado / Observação</label>
          <input placeholder="Ex: Negociação concluída" value={form.resultado}
            onChange={e => setForm({...form,resultado:e.target.value})} style={inputSt} />
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onSave} style={{ background:"#4FC3F7", color:"#060B16", border:"none", borderRadius:8, padding:"8px 20px", cursor:"pointer", fontWeight:"bold", fontSize:12, fontFamily:"Georgia,serif" }}>{saveLabel}</button>
        <button onClick={onCancel} style={{ background:"#1A2540", color:"#8A9BBE", border:"none", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:12, fontFamily:"Georgia,serif" }}>Cancelar</button>
      </div>
    </div>
  );
}

// ── ABA FINANCEIRO ──
function FinanceiroScreen({ financialData, onSave }) {
  const [draft, setDraft] = useState(() => {
    const d = {};
    MONTHS.forEach(m => {
      d[m.id] = { receita: String(financialData[m.id].receita), gastos: String(financialData[m.id].gastos) };
    });
    return d;
  });
  const [saved, setSaved] = useState(false);

  const setField = (monthId, field, val) => {
    setDraft(prev => ({ ...prev, [monthId]: { ...prev[monthId], [field]: val } }));
    setSaved(false);
  };

  const handleSave = () => {
    const raw = {};
    MONTHS.forEach(m => {
      raw[m.id] = { receita: parseNum(draft[m.id].receita), gastos: parseNum(draft[m.id].gastos) };
    });
    onSave(raw);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const totalReceita  = MONTHS.reduce((s,m) => s+parseNum(draft[m.id].receita), 0);
  const totalGastos   = MONTHS.reduce((s,m) => s+parseNum(draft[m.id].gastos),  0);
  const totalResultado = totalReceita - totalGastos;

  // Reset to base
  const handleReset = () => {
    const d = {};
    MONTHS.forEach(m => {
      d[m.id] = { receita: String(FINANCIAL_DATA_BASE[m.id].receita), gastos: String(FINANCIAL_DATA_BASE[m.id].gastos) };
    });
    setDraft(d);
    setSaved(false);
  };

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>

      {/* Header da aba */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Previsões · Editável pelo Financeiro</div>
          <div style={{ fontSize:18, fontWeight:"bold", color:"#fff" }}>Inputs Financeiros 2026</div>
          <div style={{ fontSize:11, color:"#4A5A7A", marginTop:4 }}>Atualize receita e gastos previstos. O resultado é calculado automaticamente.</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={handleReset}
            style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #1E2D48", background:"transparent", color:"#4A5A7A", cursor:"pointer", fontSize:11, fontFamily:"Georgia,serif" }}>
            ↺ Restaurar base
          </button>
          <button onClick={handleSave}
            style={{ padding:"8px 20px", borderRadius:8, border:"none",
              background: saved ? "#00D4A1" : "#4FC3F7",
              color:"#060B16", cursor:"pointer", fontWeight:"bold", fontSize:12, fontFamily:"Georgia,serif",
              transition:"background 0.3s" }}>
            {saved ? "✓ Salvo!" : "Salvar previsões"}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background:"#0D1527", borderRadius:14, border:"1px solid #16213A", overflow:"hidden" }}>

        {/* Header da tabela */}
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 1fr 120px", gap:0, borderBottom:"1px solid #16213A", padding:"10px 20px", background:"#08101E" }}>
          {["Mês","Receita prevista","Gastos previstos","Resultado"].map((h,i) => (
            <div key={h} style={{ fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", textAlign: i>=2?"right":"left", paddingRight: i===2?12:0 }}>{h}</div>
          ))}
        </div>

        {/* Linhas */}
        {MONTHS.map((m, idx) => {
          const receita   = parseNum(draft[m.id].receita);
          const gastos    = parseNum(draft[m.id].gastos);
          const resultado = receita - gastos;
          const isNeg     = resultado < 0;
          const isLast    = idx === MONTHS.length - 1;

          return (
            <div key={m.id} style={{
              display:"grid", gridTemplateColumns:"110px 1fr 1fr 120px",
              gap:0, padding:"10px 20px", alignItems:"center",
              borderBottom: isLast ? "none" : "1px solid #111827",
              background: idx%2===0 ? "transparent" : "rgba(255,255,255,0.01)",
            }}>
              {/* Mês */}
              <div>
                <div style={{ fontSize:12, fontWeight:"bold", color:"#E0E4F0" }}>{m.label}</div>
                <div style={{ fontSize:9, color:"#4A5A7A" }}>2026</div>
              </div>

              {/* Receita */}
              <div style={{ paddingRight:12 }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#4A5A7A", pointerEvents:"none" }}>R$</span>
                  <input type="number" value={draft[m.id].receita}
                    onChange={e => setField(m.id,"receita",e.target.value)}
                    style={{ ...inputSt, paddingLeft:28, color:"#00D4A1" }} />
                </div>
              </div>

              {/* Gastos */}
              <div style={{ paddingRight:12 }}>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:10, color:"#4A5A7A", pointerEvents:"none" }}>R$</span>
                  <input type="number" value={draft[m.id].gastos}
                    onChange={e => setField(m.id,"gastos",e.target.value)}
                    style={{ ...inputSt, paddingLeft:28, color:"#EF9A9A" }} />
                </div>
              </div>

              {/* Resultado calculado */}
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:"bold", color: isNeg?"#EF9A9A":"#00D4A1" }}>
                  {fmtR(resultado)}
                </div>
                {isNeg && <div style={{ fontSize:9, color:"#EF9A9A88", marginTop:2 }}>déficit</div>}
                {!isNeg && <div style={{ fontSize:9, color:"#00D4A188", marginTop:2 }}>superávit</div>}
              </div>
            </div>
          );
        })}

        {/* Totais */}
        <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 1fr 120px", gap:0, padding:"14px 20px", background:"#08101E", borderTop:"2px solid #16213A" }}>
          <div style={{ fontSize:11, fontWeight:"bold", color:"#8A9BBE" }}>TOTAL ANUAL</div>
          <div style={{ paddingRight:12 }}>
            <div style={{ fontSize:13, fontWeight:"bold", color:"#00D4A1" }}>{fmtR(totalReceita)}</div>
          </div>
          <div style={{ paddingRight:12 }}>
            <div style={{ fontSize:13, fontWeight:"bold", color:"#EF9A9A" }}>{fmtR(totalGastos)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:15, fontWeight:"bold", color:totalResultado>=0?"#00D4A1":"#EF9A9A" }}>{fmtR(totalResultado)}</div>
          </div>
        </div>
      </div>

      {/* Nota de rodapé */}
      <div style={{ marginTop:14, fontSize:10, color:"#2A3A5C", textAlign:"center" }}>
        Os valores salvos aqui alimentam automaticamente o resumo anual e todas as telas de mês.
      </div>
    </div>
  );
}

// ── SUMMARY SCREEN ──
function SummaryScreen({ actions, financialData, onSelectMonth }) {
  const totalBaseAnual  = Object.values(financialData).reduce((s,m) => s+m.resultado, 0);
  const totalPlanoAnual = actions.reduce((s,a) => s+parse(a.valor,a.sinal), 0);
  const totalRealAnual  = actions.filter(a=>a.status==="Realizado").reduce((s,a) => s+parse(a.valor,a.sinal), 0);
  const resultadoAnual  = totalBaseAnual + totalPlanoAnual;

  let runwayAcum = SALDO_INICIAL;
  const runways = MONTHS.map(m => {
    const plano = actions.filter(a=>a.mes===m.id).reduce((s,a) => s+parse(a.valor,a.sinal), 0);
    runwayAcum += financialData[m.id].resultado + plano;
    return runwayAcum;
  });

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
        {[
          { label:"Resultado base 2026",  value:fmtK(totalBaseAnual),  sub:"sem ações",                color:"#EF9A9A" },
          { label:"Plano total mapeado",  value:fmtK(totalPlanoAnual), sub:`${actions.length} ações`,  color:"#FFB74D" },
          { label:"Já realizado",         value:fmtK(totalRealAnual),  sub:`${actions.filter(a=>a.status==="Realizado").length} ações`, color:"#00D4A1" },
          { label:"Resultado projetado",  value:fmtK(resultadoAnual),  sub:"base + plano", bold:true,
            color:resultadoAnual>=0?"#00D4A1":resultadoAnual>-200000?"#FFB74D":"#EF9A9A" },
        ].map((k,i) => (
          <div key={i} style={{ background:"#0D1527", border:`1px solid ${k.bold?"#4FC3F733":"#16213A"}`, borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{k.label}</div>
            <div style={{ fontSize:k.bold?22:18, fontWeight:"bold", color:k.color, marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:10, color:"#4A5A7A" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>Visão mensal · clique para abrir</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {MONTHS.map((m, idx) => {
          const fin        = financialData[m.id];
          const mActions   = actions.filter(a=>a.mes===m.id);
          const mPlano     = mActions.reduce((s,a) => s+parse(a.valor,a.sinal), 0);
          const runway     = runways[idx];
          const runwayNeg  = runway < 0;
          const runwayCrit = runway >= 0 && runway < 100000;
          const realizadas = mActions.filter(a=>a.status==="Realizado").length;
          const pct        = mActions.length>0 ? Math.round(realizadas/mActions.length*100) : 0;
          return (
            <div key={m.id} onClick={() => onSelectMonth(m.id)}
              style={{ background:"#0D1527", borderRadius:12, padding:"16px 18px", cursor:"pointer",
                border:`1px solid ${runwayNeg?"#EF9A9A33":runwayCrit?"#FFB74D33":"#16213A"}`, transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#4FC3F766"}
              onMouseLeave={e => e.currentTarget.style.borderColor=runwayNeg?"#EF9A9A33":runwayCrit?"#FFB74D33":"#16213A"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:9, color:"#4A5A7A", marginBottom:2 }}>2026</div>
                  <div style={{ fontSize:15, fontWeight:"bold", color:runwayNeg?"#EF9A9A":runwayCrit?"#FFB74D":"#E0E4F0" }}>{m.label}</div>
                </div>
                {mActions.length>0 && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:9, color:"#4A5A7A" }}>{realizadas}/{mActions.length}</div>
                    <div style={{ fontSize:9, color:pct===100?"#00D4A1":"#4A5A7A" }}>{pct}%</div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:9, color:"#4A5A7A", marginBottom:2 }}>Resultado base</div>
                <div style={{ fontSize:13, fontWeight:"bold", color:fin.resultado<0?"#EF9A9A":"#00D4A1" }}>{fmtK(fin.resultado)}</div>
              </div>
              {mPlano!==0 && <>
                <div style={{ marginBottom:6 }}>
                  <div style={{ fontSize:9, color:"#4A5A7A", marginBottom:2 }}>Plano</div>
                  <div style={{ fontSize:12, color:mPlano>0?"#00D4A1":"#EF9A9A" }}>{fmtD(mPlano)}</div>
                </div>
                <div style={{ height:1, background:"#16213A", margin:"8px 0" }} />
              </>}
              <div>
                <div style={{ fontSize:9, color:"#4A5A7A", marginBottom:2 }}>Runway após mês</div>
                <div style={{ fontSize:12, fontWeight:"bold", color:runwayNeg?"#EF9A9A":runwayCrit?"#FFB74D":"#8A9BBE" }}>{fmtK(runway)}</div>
              </div>
              {mActions.length>0 && (
                <div style={{ marginTop:10 }}>
                  <div style={{ background:"#111827", borderRadius:3, height:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"linear-gradient(90deg,#00D4A1,#4FC3F7)", borderRadius:3 }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(() => {
        const firstNeg = MONTHS.findIndex((_,i) => runways[i]<0);
        if (firstNeg===-1) return null;
        return (
          <div style={{ marginTop:20, padding:"14px 20px", background:"rgba(239,154,154,0.06)", border:"1px solid #EF9A9A33", borderRadius:12, display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <div>
              <div style={{ fontSize:12, fontWeight:"bold", color:"#EF9A9A", marginBottom:3 }}>Runway negativo projetado a partir de {MONTHS[firstNeg].label}</div>
              <div style={{ fontSize:11, color:"#4A5A7A" }}>O plano precisa gerar {fmtK(Math.abs(totalBaseAnual))} para cobrir o déficit anual.</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── MONTH SCREEN ──
function MonthScreen({ monthId, actions, setActions, saveActions, financialData }) {
  const month = MONTHS.find(m=>m.id===monthId);
  const fin   = financialData[monthId];

  const [collapsedWeeks,  setCollapsedWeeks]  = useState({});
  const [expandedActions, setExpandedActions] = useState({});
  const [adding,   setAdding]   = useState(null);
  const [editId,   setEditId]   = useState(null);
  const [addForm,  setAddForm]  = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const mutate = (fn) => { const next=fn(actions); setActions(next); saveActions(next); };
  const addAction = (semana) => {
    if (!addForm.descricao.trim()) return;
    mutate(prev => [...prev, {...addForm,mes:monthId,semana,id:Date.now().toString()}]);
    setAddForm(EMPTY_FORM); setAdding(null);
  };
  const startEdit = (a) => { setEditId(a.id); setEditForm({...a}); setExpandedActions(p=>({...p,[a.id]:true})); };
  const saveEdit  = () => { mutate(prev=>prev.map(a=>a.id===editId?{...editForm,id:editId}:a)); setEditId(null); };
  const remove    = (id) => { mutate(prev=>prev.filter(a=>a.id!==id)); if(editId===id) setEditId(null); };
  const toggleWeek   = (id) => setCollapsedWeeks(p=>({...p,[id]:!p[id]}));
  const toggleAction = (id) => { setExpandedActions(p=>({...p,[id]:!p[id]})); if(editId===id) setEditId(null); };

  const getAnte       = (sem) => actions.filter(a=>a.mes===monthId&&a.semana<sem).reduce((s,a)=>s+parse(a.valor,a.sinal),0);
  const getSemActions = (sem) => actions.filter(a=>a.mes===monthId&&a.semana===sem);
  const totalPlan     = actions.filter(a=>a.mes===monthId).reduce((s,a)=>s+parse(a.valor,a.sinal),0);
  const totalReal     = actions.filter(a=>a.mes===monthId&&a.status==="Realizado").reduce((s,a)=>s+parse(a.valor,a.sinal),0);
  const resultadoFinal = fin.resultado + totalPlan;

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      {/* Sidebar */}
      <div style={{ width:220, flexShrink:0, background:"#0A1020", borderRight:"1px solid #16213A", padding:"22px 18px", overflowY:"auto" }}>
        <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>2026</div>
        <div style={{ fontSize:22, fontWeight:"bold", color:"#fff", marginBottom:16 }}>{month.label}</div>
        {[
          { label:"Receita prevista", value:fin.receita,   color:"#00D4A1" },
          { label:"Gastos previstos", value:fin.gastos,    color:"#EF9A9A" },
          { label:"Resultado base",   value:fin.resultado, color:fin.resultado>=0?"#00D4A1":"#EF9A9A", bold:true },
        ].map(k => (
          <div key={k.label} style={{ marginBottom:8, background:"#111827", borderRadius:9, padding:"10px 13px", borderLeft:`3px solid ${k.color}44` }}>
            <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{k.label}</div>
            <div style={{ fontSize:12, fontWeight:k.bold?"bold":"normal", color:k.color }}>{fmtR(Math.abs(k.value))}</div>
          </div>
        ))}
        <div style={{ height:1, background:"#16213A", margin:"12px 0" }} />
        <div style={{ background:"rgba(79,195,247,0.06)", border:"1px solid #4FC3F733", borderRadius:9, padding:"11px", marginBottom:8 }}>
          <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Plano deste mês</div>
          <div style={{ fontSize:13, fontWeight:"bold", color:totalPlan>=0?"#00D4A1":"#EF9A9A" }}>{fmtD(totalPlan)||"—"}</div>
          <div style={{ fontSize:10, color:"#4A5A7A", marginTop:3 }}>Realizado: {fmtD(totalReal)||"R$ 0"}</div>
        </div>
        <div style={{ background:resultadoFinal>=0?"rgba(0,212,161,0.06)":"rgba(239,154,154,0.06)", border:`1px solid ${resultadoFinal>=0?"#00D4A133":"#EF9A9A33"}`, borderRadius:9, padding:"11px" }}>
          <div style={{ fontSize:9, color:"#4A5A7A", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Resultado projetado</div>
          <div style={{ fontSize:16, fontWeight:"bold", color:resultadoFinal>=0?"#00D4A1":resultadoFinal>-30000?"#FFB74D":"#EF9A9A" }}>{fmtR(resultadoFinal)}</div>
        </div>
      </div>

      {/* Semanas */}
      <div style={{ flex:1, overflowY:"auto", padding:"22px 22px" }}>
        <div style={{ maxWidth:740 }}>
          {[1,2,3,4].map((semNum, idx) => {
            const semActions  = getSemActions(semNum);
            const resInicio   = fin.resultado + getAnte(semNum);
            const impactoSem  = semActions.reduce((s,a)=>s+parse(a.valor,a.sinal),0);
            const isNeg       = resInicio < 0;
            const isCollapsed = !!collapsedWeeks[semNum];
            const isAdding    = adding===semNum;
            const realizadas  = semActions.filter(a=>a.status==="Realizado").length;

            return (
              <div key={semNum}>
                {idx>0 && <div style={{ paddingLeft:36 }}><div style={{ width:1, height:17, background:"#16213A" }} /></div>}
                <div style={{ background:"#0D1527", border:`1px solid ${isNeg?"#EF9A9A22":"#16213A"}`, borderRadius:13, overflow:"hidden" }}>
                  <div onClick={()=>toggleWeek(semNum)}
                    style={{ padding:"13px 18px", cursor:"pointer", display:"flex", alignItems:"center", gap:12,
                      background:isNeg?"rgba(239,154,154,0.03)":"transparent",
                      borderBottom:!isCollapsed&&(semActions.length>0||isAdding)?"1px solid #111827":"none", userSelect:"none" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
                      background:isNeg?"rgba(239,154,154,0.1)":"rgba(79,195,247,0.08)",
                      border:`1px solid ${isNeg?"#EF9A9A44":"#4FC3F744"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:12, fontWeight:"bold", color:isNeg?"#EF9A9A":"#4FC3F7" }}>
                      {semNum}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                        <span style={{ fontSize:12, fontWeight:"bold", color:"#E0E4F0" }}>Semana {semNum}</span>
                        <span style={{ fontSize:10, color:"#4A5A7A" }}>{month.semanas[semNum-1]}</span>
                      </div>
                      <div style={{ marginTop:3, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:11, fontWeight:"bold", color:isNeg?"#EF9A9A":"#00D4A1" }}>{fmtR(resInicio)}</span>
                        {impactoSem!==0 && <span style={{ fontSize:10, color:"#4A5A7A" }}>· plano: <span style={{ color:impactoSem>0?"#00D4A1":"#EF9A9A" }}>{fmtD(impactoSem)}</span></span>}
                        {semActions.length>0 && <span style={{ fontSize:10, color:"#4A5A7A" }}>· {realizadas}/{semActions.length} realizadas</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>{e.stopPropagation();setAdding(isAdding?null:semNum);setAddForm(EMPTY_FORM);setEditId(null);if(isCollapsed)toggleWeek(semNum);}}
                        style={{ padding:"5px 11px", borderRadius:20, cursor:"pointer", fontFamily:"Georgia,serif", fontSize:11,
                          border:`1px solid ${isAdding?"#4FC3F766":"#1E2D48"}`,
                          background:isAdding?"rgba(79,195,247,0.08)":"transparent",
                          color:isAdding?"#4FC3F7":"#4A5A7A" }}>
                        {isAdding?"Cancelar":"+ Ação"}
                      </button>
                      <span style={{ fontSize:13, color:"#4A5A7A", transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>▾</span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div>
                      {semActions.map((acao, ai) => {
                        const valor      = parse(acao.valor,acao.sinal);
                        const isPos      = valor>=0;
                        const sc         = STATUS_STYLE[acao.status]||STATUS_STYLE.Planejado;
                        const isCanceled = acao.status==="Cancelado";
                        const isExpanded = !!expandedActions[acao.id];
                        const isEditing  = editId===acao.id;
                        const isLast     = ai===semActions.length-1;
                        return (
                          <div key={acao.id} style={{ borderBottom:(!isLast||isAdding)&&!isEditing?"1px solid #111827":"none" }}>
                            <div onClick={()=>!isEditing&&toggleAction(acao.id)}
                              style={{ padding:"10px 18px", display:"flex", alignItems:"center", gap:11,
                                opacity:isCanceled?0.4:1, cursor:"pointer",
                                background:isExpanded&&!isEditing?"rgba(79,195,247,0.02)":"transparent" }}>
                              <div style={{ width:2, height:18, borderRadius:2, flexShrink:0, background:isCanceled?"#2A3A5C":isPos?"#00D4A1":"#EF9A9A" }} />
                              <div style={{ flex:1, fontSize:12, color:isCanceled?"#3A4A6A":"#E0E4F0", textDecoration:isCanceled?"line-through":"none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                {acao.descricao||<span style={{ color:"#4A5A7A" }}>sem descrição</span>}
                              </div>
                              {acao.prazo&&<span style={{ fontSize:10, color:"#4A5A7A", flexShrink:0 }}>🗓 {acao.prazo}</span>}
                              {acao.responsavel&&<span style={{ fontSize:10, color:"#4A5A7A", flexShrink:0 }}>👤 {acao.responsavel}</span>}
                              <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background:sc.bg, color:sc.color, border:`1px solid ${sc.dot}44`, flexShrink:0, whiteSpace:"nowrap" }}>
                                <span style={{ marginRight:3, fontSize:7 }}>●</span>{acao.status}
                              </span>
                              <div style={{ fontSize:12, fontWeight:"bold", flexShrink:0, color:isCanceled?"#3A4A6A":isPos?"#00D4A1":"#EF9A9A", minWidth:80, textAlign:"right" }}>
                                {fmtD(valor)||"—"}
                              </div>
                              <span style={{ fontSize:10, color:"#2A3A5C", transform:isExpanded?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block", flexShrink:0 }}>▾</span>
                            </div>
                            {isExpanded&&!isEditing&&(
                              <div style={{ padding:"9px 18px 12px 31px", background:"rgba(79,195,247,0.02)", borderTop:"1px solid #111827" }}>
                                {acao.resultado&&<div style={{ fontSize:11, color:"#4A5A7A", marginBottom:9 }}>📋 <span style={{ color:"#8A9BBE" }}>{acao.resultado}</span></div>}
                                <div style={{ display:"flex", gap:8 }}>
                                  <button onClick={()=>startEdit(acao)} style={{ padding:"5px 13px", borderRadius:7, border:"1px solid #1E2D48", background:"transparent", color:"#4FC3F7", cursor:"pointer", fontSize:11, fontFamily:"Georgia,serif" }}>✎ Editar</button>
                                  <button onClick={()=>remove(acao.id)} style={{ padding:"5px 11px", borderRadius:7, border:"1px solid #1E2D48", background:"transparent", color:"#4A5A7A", cursor:"pointer", fontSize:11, fontFamily:"Georgia,serif" }}>Remover</button>
                                </div>
                              </div>
                            )}
                            {isEditing&&<ActionForm form={editForm} setForm={setEditForm} onSave={saveEdit} onCancel={()=>{setEditId(null);setExpandedActions(p=>({...p,[acao.id]:false}));}} saveLabel="Salvar alterações" />}
                          </div>
                        );
                      })}
                      {isAdding&&<ActionForm form={addForm} setForm={setAddForm} onSave={()=>addAction(semNum)} onCancel={()=>{setAdding(null);setAddForm(EMPTY_FORM);}} saveLabel="+ Adicionar ação" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop:20, padding:"16px 22px", background:"#0D1527", borderRadius:13,
            border:`1px solid ${resultadoFinal>=0?"#00D4A133":"#EF9A9A22"}`,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:2, color:"#4A5A7A", textTransform:"uppercase", marginBottom:3 }}>Resultado final · {month.label}</div>
              <div style={{ fontSize:10, color:"#4A5A7A" }}>Base {fmtR(Math.abs(fin.resultado))} · Plano {fmtD(totalPlan)||"R$ 0"} · Realizado {fmtD(totalReal)||"R$ 0"}</div>
            </div>
            <div style={{ fontSize:22, fontWeight:"bold", color:resultadoFinal>=0?"#00D4A1":resultadoFinal>-30000?"#FFB74D":"#EF9A9A" }}>
              {fmtR(resultadoFinal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ──
export default function App() {
  const [actions,       setActions]       = useState([]);
  const [financialData, setFinancialData] = useState(buildFin(FINANCIAL_DATA_BASE));
  const [activeTab,     setActiveTab]     = useState("resumo");
  const [loaded,        setLoaded]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rAct = await window.storage.get(STORAGE_KEY);
        if (rAct) setActions(JSON.parse(rAct.value));
        const rFin = await window.storage.get(STORAGE_KEY_FIN);
        if (rFin) setFinancialData(buildFin(JSON.parse(rFin.value)));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const saveActions = useCallback(async (next) => {
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const handleSaveFinancial = useCallback(async (raw) => {
    const next = buildFin(raw);
    setFinancialData(next);
    try { await window.storage.set(STORAGE_KEY_FIN, JSON.stringify(raw)); } catch {}
  }, []);

  if (!loaded) return (
    <div style={{ background:"#060B16", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#4FC3F7", fontFamily:"Georgia,serif" }}>
      Carregando...
    </div>
  );

  const TABS = [
    { id:"resumo",     label:"Resumo Anual",  special:true },
    { id:"financeiro", label:"Financeiro",     special:true },
  ];

  return (
    <div style={{ background:"#060B16", minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"Georgia,serif", color:"#E0E4F0" }}>

      {/* HEADER */}
      <div style={{ background:"#0A1020", borderBottom:"1px solid #16213A", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:4, color:"#4FC3F7", textTransform:"uppercase", marginBottom:2 }}>T&D Sustentável</div>
          <div style={{ fontSize:17, fontWeight:"bold", color:"#fff" }}>Plano de Caixa 2026</div>
        </div>
        <div style={{ fontSize:10, color:"#4A5A7A" }}>Saldo atual: <span style={{ color:"#FFB74D", fontWeight:"bold" }}>{fmtR(SALDO_INICIAL)}</span></div>
      </div>

      {/* TABS */}
      <div style={{ background:"#08101E", borderBottom:"1px solid #16213A", padding:"0 24px", overflowX:"auto", display:"flex", flexShrink:0 }}>
        {/* Tabs especiais */}
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding:"11px 18px", border:"none", borderBottom:activeTab===t.id?"2px solid #4FC3F7":"2px solid transparent",
              background:"transparent", cursor:"pointer", fontFamily:"Georgia,serif", fontSize:12, fontWeight:"bold",
              color:activeTab===t.id?"#4FC3F7":"#4A5A7A", flexShrink:0 }}>
            {t.label}
          </button>
        ))}

        <div style={{ width:1, background:"#16213A", margin:"8px 10px" }} />

        {/* Meses */}
        {MONTHS.map(m => {
          const fin        = financialData[m.id];
          const hasActions = actions.some(a=>a.mes===m.id);
          const isActive   = activeTab===m.id;
          return (
            <button key={m.id} onClick={() => setActiveTab(m.id)}
              style={{ padding:"10px 14px", border:"none", position:"relative",
                borderBottom:isActive?"2px solid #4FC3F7":"2px solid transparent",
                background:"transparent", cursor:"pointer", fontFamily:"Georgia,serif", flexShrink:0 }}>
              <div style={{ fontSize:11, fontWeight:isActive?"bold":"normal",
                color:isActive?"#4FC3F7":fin.resultado<-100000?"#EF9A9A88":"#4A5A7A" }}>
                {m.short}
              </div>
              {hasActions&&<div style={{ position:"absolute", top:6, right:6, width:4, height:4, borderRadius:"50%", background:"#4FC3F7" }} />}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {activeTab==="resumo" && (
          <div style={{ flex:1, overflowY:"auto" }}>
            <SummaryScreen actions={actions} financialData={financialData} onSelectMonth={id=>setActiveTab(id)} />
          </div>
        )}
        {activeTab==="financeiro" && (
          <div style={{ flex:1, overflowY:"auto" }}>
            <FinanceiroScreen financialData={financialData} onSave={handleSaveFinancial} />
          </div>
        )}
        {MONTHS.some(m=>m.id===activeTab) && (
          <MonthScreen key={activeTab} monthId={activeTab}
            actions={actions} setActions={setActions} saveActions={saveActions}
            financialData={financialData} />
        )}
      </div>
    </div>
  );
}

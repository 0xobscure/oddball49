import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart, Area, Line } from "recharts";
import DRAWS from "./draws.json";

var TOT = 49;

var DARK = {
  bg:"#06080f", card:"#0d1117", border:"#1b2332", acc:"#e8a838", acc2:"#38bdf8",
  acc3:"#a78bfa", acc4:"#f87171", txt:"#e0e6ed", dim:"#5a6a80", grn:"#34d399", srf:"#131b28"
};
var LIGHT = {
  bg:"#f5f6fa", card:"#ffffff", border:"#e0e3ea", acc:"#b47a1a", acc2:"#0c7abf",
  acc3:"#7c5cbf", acc4:"#d94444", txt:"#1a1d26", dim:"#6b7280", grn:"#1a9a6a", srf:"#eef0f4"
};

function NumberBall(props) {
  var num = props.num; var C = props.C;
  var col = num<=10?C.acc2:num<=20?C.acc3:num<=30?C.grn:num<=40?C.acc:C.acc4;
  return (
    <span style={{display:"inline-flex",width:24,height:24,borderRadius:"50%",alignItems:"center",justifyContent:"center",background:col+"20",color:col,fontSize:10,fontWeight:700}}>{num}</span>
  );
}

export default function App() {
  var _th = useState("dark"), theme = _th[0], setTheme = _th[1];
  var C = theme === "dark" ? DARK : LIGHT;
  var ttStyle = {background:C.card,border:"1px solid "+C.border,borderRadius:8,fontSize:11};
  var _s = useState("overview"), tab = _s[0], setTab = _s[1];
  var _st = useState(null), strats = _st[0], setStrats = _st[1];
  var _jk = useState("moderate"), jackpot = _jk[0], setJackpot = _jk[1];

  var filtered = DRAWS;

  var expFreq = (filtered.length * 6) / TOT;

  var freq = useMemo(function() {
    var f = {};
    for (var i = 1; i <= TOT; i++) f[i] = 0;
    filtered.forEach(function(dr) { dr.n.forEach(function(x) { f[x]++; }); });
    return Object.entries(f).map(function(e) { return { number: +e[0], count: e[1] }; });
  }, [filtered]);

  var pairFreq = useMemo(function() {
    var pf = {};
    filtered.forEach(function(dr) {
      for (var i = 0; i < dr.n.length; i++)
        for (var j = i + 1; j < dr.n.length; j++) {
          var k = dr.n[i] + "-" + dr.n[j];
          pf[k] = (pf[k] || 0) + 1;
        }
    });
    return Object.entries(pf).filter(function(e) { return e[1] >= 3; }).map(function(e) { return { pair: e[0], count: e[1] }; }).sort(function(a, b) { return b.count - a.count; }).slice(0, 25);
  }, [filtered]);

  var gapData = useMemo(function() {
    var last = {};
    for (var i = 1; i <= TOT; i++) last[i] = -1;
    filtered.forEach(function(dr, idx) { dr.n.forEach(function(x) { last[x] = idx; }); });
    var len = filtered.length;
    return Object.entries(last).map(function(e) {
      return { number: +e[0], gap: e[1] === -1 ? len : len - 1 - e[1] };
    }).sort(function(a, b) { return b.gap - a.gap; });
  }, [filtered]);

  var oddEvenData = useMemo(function() {
    return filtered.map(function(dr) {
      var odd = dr.n.filter(function(x) { return x % 2 !== 0; }).length;
      return { date: dr.d.slice(5), odd: odd, even: 6 - odd };
    });
  }, [filtered]);

  var sumData = useMemo(function() {
    return filtered.map(function(dr) {
      return { date: dr.d.slice(5), sum: dr.n.reduce(function(a, b) { return a + b; }, 0) };
    });
  }, [filtered]);

  var movAvg = useMemo(function() {
    var w = 10;
    return sumData.map(function(s, i) {
      if (i < w - 1) return { date: s.date, sum: s.sum, ma: null };
      var sl = sumData.slice(i - w + 1, i + 1);
      var avg = Math.round(sl.reduce(function(a, b) { return a + b.sum; }, 0) / w);
      return { date: s.date, sum: s.sum, ma: avg };
    });
  }, [sumData]);

  var rangeData = useMemo(function() {
    var tot = filtered.length * 6;
    var b = [0, 0, 0, 0, 0];
    filtered.forEach(function(dr) {
      dr.n.forEach(function(x) {
        if (x <= 10) b[0]++; else if (x <= 20) b[1]++; else if (x <= 30) b[2]++; else if (x <= 40) b[3]++; else b[4]++;
      });
    });
    return [
      { range: "1-10", count: b[0], expected: Math.round(tot * 10 / 49) },
      { range: "11-20", count: b[1], expected: Math.round(tot * 10 / 49) },
      { range: "21-30", count: b[2], expected: Math.round(tot * 10 / 49) },
      { range: "31-40", count: b[3], expected: Math.round(tot * 10 / 49) },
      { range: "41-49", count: b[4], expected: Math.round(tot * 9 / 49) },
    ];
  }, [filtered]);

  var consData = useMemo(function() {
    return filtered.map(function(dr) {
      var c = 0;
      var s = dr.n.slice().sort(function(a, b) { return a - b; });
      for (var i = 1; i < s.length; i++) if (s[i] - s[i - 1] === 1) c++;
      return { date: dr.d.slice(5), consecutive: c };
    });
  }, [filtered]);

  var chi2 = useMemo(function() {
    var e = expFreq;
    var v = freq.reduce(function(s, f) { return s + Math.pow(f.count - e, 2) / e; }, 0);
    var n = filtered.length * 6;
    var cramersV = Math.sqrt(v / (n * 48)); // df = k-1 = 48
    var passes = v < 65.17;
    // Practical significance: Cramér's V < 0.05 = negligible effect even if p-value fails
    var negligible = cramersV < 0.05;
    return { value: v, critical: 65.17, passes: passes, cramersV: cramersV, negligible: negligible };
  }, [freq, expFreq, filtered]);

  var serial = useMemo(function() {
    var tot = 0;
    for (var i = 1; i < filtered.length; i++) {
      var prev = {};
      filtered[i - 1].n.forEach(function(x) { prev[x] = true; });
      filtered[i].n.forEach(function(x) { if (prev[x]) tot++; });
    }
    var mean = tot / (filtered.length - 1);
    var exp = 6 * 6 / 49;
    var variance = 6 * 6 * 43 * 43 / (49 * 49 * 48);
    var se = Math.sqrt(variance / (filtered.length - 1));
    var z = Math.abs(mean - exp) / se;
    return { avg: mean, expected: exp, z: z, passes: z < 1.96 };
  }, [filtered]);

  var bday = useMemo(function() {
    var inZ = 0, outZ = 0;
    filtered.forEach(function(dr) {
      dr.n.forEach(function(x) { if (x <= 31) inZ++; else outZ++; });
    });
    var t = filtered.length * 6;
    return { inP: (inZ / t * 100).toFixed(1), outP: (outZ / t * 100).toFixed(1), expIn: (31 / 49 * 100).toFixed(1), expOut: (18 / 49 * 100).toFixed(1) };
  }, [filtered]);

  var sumStats = useMemo(function() {
    var sums = filtered.map(function(dr) { return dr.n.reduce(function(a,b){return a+b;},0); }).sort(function(a,b){return a-b;});
    return {
      mean: Math.round(sums.reduce(function(a,b){return a+b;},0)/sums.length),
      p25: sums[Math.floor(sums.length*0.25)],
      p75: sums[Math.floor(sums.length*0.75)]
    };
  }, [filtered]);

  var hotPairSet = useMemo(function() {
    var s = {};
    pairFreq.forEach(function(p) { s[p.pair] = p.count; });
    return s;
  }, [pairFreq]);

  var recentOddAvg = useMemo(function() {
    var recent = filtered.slice(-20);
    if (!recent.length) return 3;
    return recent.reduce(function(s,dr){return s+dr.n.filter(function(x){return x%2!==0;}).length;},0)/recent.length;
  }, [filtered]);

  var pickNums = function(mode) {
    var pool = [];
    var sortedFreq = freq.slice().sort(function(a, b) { return a.count - b.count; });
    var cold = sortedFreq.slice(0, 20).map(function(f) { return f.number; });
    var overdue = gapData.slice(0, 20).map(function(g) { return g.number; });
    if (mode === "contrarian") {
      var hi = cold.filter(function(x) { return x > 31; });
      var lo = cold.filter(function(x) { return x <= 31; });
      var all = hi.concat(lo);
      var att0 = 0;
      while (pool.length < 6 && att0 < 500) {
        att0++;
        var p = all[Math.floor(Math.random() * all.length)];
        if (pool.indexOf(p) !== -1) continue;
        var bad = false;
        for (var qi = 0; qi < pool.length; qi++) {
          var qk = pool[qi] < p ? pool[qi]+"-"+p : p+"-"+pool[qi];
          if (hotPairSet[qk]) { bad = true; break; }
        }
        if (!bad) pool.push(p);
      }
      // fallback if pair avoidance is too tight
      while (pool.length < 6) { var fp = all[Math.floor(Math.random() * all.length)]; if (pool.indexOf(fp) === -1) pool.push(fp); }
    } else if (mode === "balanced") {
      var buckets = [[1,10],[11,20],[21,30],[31,40],[41,49]]; var picks = [1,1,1,1,2]; var t = 0;
      buckets.forEach(function(b, i) { var nd = picks[i]; while (nd > 0 && t < 6) { var x = Math.floor(Math.random() * (b[1] - b[0] + 1)) + b[0]; if (pool.indexOf(x) === -1) { pool.push(x); nd--; t++; } } });
      while (pool.length < 6) { var x2 = Math.floor(Math.random() * 49) + 1; if (pool.indexOf(x2) === -1) pool.push(x2); }
    } else if (mode === "overdue") {
      while (pool.length < 6) { var p2 = overdue[Math.floor(Math.random() * Math.min(15, overdue.length))]; if (pool.indexOf(p2) === -1) pool.push(p2); }
    } else if (mode === "hot") {
      var hotNums = freq.slice().sort(function(a, b) { return b.count - a.count; }).slice(0, 20).map(function(f) { return f.number; });
      while (pool.length < 6) { var p3 = hotNums[Math.floor(Math.random() * hotNums.length)]; if (pool.indexOf(p3) === -1) pool.push(p3); }
    } else if (mode === "highzone") {
      var hiPool = []; for (var h = 32; h <= 49; h++) hiPool.push(h);
      while (pool.length < 4) { var p4 = hiPool[Math.floor(Math.random() * hiPool.length)]; if (pool.indexOf(p4) === -1) pool.push(p4); }
      while (pool.length < 6) { var x4 = Math.floor(Math.random() * 49) + 1; if (pool.indexOf(x4) === -1) pool.push(x4); }
    } else if (mode === "composite") {
      // Composite Contrarian: stack all game theory edges
      // 1. Build candidate pool: non-round, non-hot, weighted high zone + live odd/even bias
      var roundNums = {10:1,20:1,30:1,40:1,5:1,15:1,25:1,35:1,45:1};
      var hotSet = {};
      freq.slice().sort(function(a,b){return b.count-a.count;}).slice(0,10).forEach(function(f){hotSet[f.number]=1;});
      var candidates = [];
      for (var ci = 1; ci <= 49; ci++) {
        if (roundNums[ci] || hotSet[ci]) continue;
        candidates.push(ci);
        // High zone 3x weight (birthday bias edge)
        if (ci > 31) { candidates.push(ci); candidates.push(ci); }
        // Odd/even bias: if recent draws lean odd (avg>3.2), double-weight even numbers
        // if recent draws lean even (avg<2.8), double-weight odd numbers
        if (recentOddAvg > 3.2 && ci % 2 === 0) candidates.push(ci);
        if (recentOddAvg < 2.8 && ci % 2 !== 0) candidates.push(ci);
      }
      // 2. Pick with min gap + hot-pair avoidance
      var attempts = 0;
      while (pool.length < 6 && attempts < 800) {
        attempts++;
        var c = candidates[Math.floor(Math.random() * candidates.length)];
        if (pool.indexOf(c) !== -1) continue;
        var tooClose = false;
        for (var gi = 0; gi < pool.length; gi++) {
          if (Math.abs(pool[gi] - c) < 5) { tooClose = true; break; }
          var ck = pool[gi] < c ? pool[gi]+"-"+c : c+"-"+pool[gi];
          if (hotPairSet[ck]) { tooClose = true; break; }
        }
        if (!tooClose) pool.push(c);
      }
      // Fallback if constraints are too tight
      while (pool.length < 6) { var cf = Math.floor(Math.random() * 49) + 1; if (pool.indexOf(cf) === -1 && !roundNums[cf]) pool.push(cf); }
    } else {
      while (pool.length < 6) { var x3 = Math.floor(Math.random() * 49) + 1; if (pool.indexOf(x3) === -1) pool.push(x3); }
    }
    pool.sort(function(a, b) { return a - b; });
    var pSum = pool.reduce(function(a,b){return a+b;},0);
    var pOdd = pool.filter(function(x){return x%2!==0;}).length;
    var pHigh = pool.filter(function(x){return x>31;}).length;
    // Count how many picked pairs appear in hotPairSet
    var pairRisk = 0;
    for (var ri = 0; ri < pool.length; ri++)
      for (var rj = ri+1; rj < pool.length; rj++) {
        var rk = pool[ri]+"-"+pool[rj];
        if (hotPairSet[rk]) pairRisk++;
      }
    // Sum rating vs historical quartiles
    var sumRating = pSum < sumStats.p25 ? "rare-low" : pSum > sumStats.p75 ? "rare-high" : "typical";
    // Co-winner risk based on high zone count + pair risk
    var coRisk = pHigh >= 3 && pairRisk === 0 ? "low" : pHigh >= 2 && pairRisk <= 1 ? "medium" : "high";
    return { nums: pool, sum: pSum, odd: pOdd, high: pHigh, mode: mode, pairRisk: pairRisk, sumRating: sumRating, coRisk: coRisk };
  };

  var generateAll = function() {
    setStrats([
      pickNums("contrarian"),
      pickNums("balanced"),
      pickNums("overdue"),
      pickNums("hot"),
      pickNums("highzone"),
      pickNums("composite"),
    ]);
  };

  var tabs = [
    { id: "overview", label: "Overview" }, { id: "frequency", label: "Frequency" },
    { id: "patterns", label: "Patterns" }, { id: "stats", label: "Stats" },
    { id: "gametheory", label: "Game Theory" }, { id: "gen", label: "Generator" },
  ];

  var dateRange = DRAWS.length > 0 ? DRAWS[0].d.slice(0,7) + " - " + DRAWS[DRAWS.length-1].d.slice(0,7) : "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, fontFamily: "'SF Mono','Cascadia Code','Fira Code',Menlo,monospace", padding: 0 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');@keyframes popIn{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{opacity:1}50%{opacity:.5}}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:" + C.bg + "}::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}"}</style>

      {/* HEADER */}
      <div style={{ padding: "26px 20px 18px", borderBottom: "1px solid " + C.border, background: "linear-gradient(180deg," + C.card + " 0%," + C.bg + " 100%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: 22 }}>🎱</span>
            <span style={{ fontSize: 10, color: C.acc, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, flex: 1 }}>The Numbers Nobody Picks</span>
            <button onClick={function(){setTheme(theme==="dark"?"light":"dark");}} style={{background:C.srf,border:"1px solid "+C.border,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:16,lineHeight:1,color:C.txt}}>{theme==="dark"?"☀️":"🌙"}</button>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk',sans-serif", background: "linear-gradient(135deg," + C.txt + "," + C.acc + ")", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Oddball49
          </h1>
          <p style={{ color: C.dim, fontSize: 11, margin: "4px 0 0" }}>{DRAWS.length} draws · {dateRange} · {DRAWS.length * 6} numbers · Game theory engine</p>
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: "0 20px", borderBottom: "1px solid " + C.border, background: C.card + "90", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", overflowX: "auto" }}>
            {tabs.map(function(t) {
              return <button key={t.id} onClick={function() { setTab(t.id); }} style={{ padding: "11px 14px", background: "none", border: "none", color: tab === t.id ? C.acc : C.dim, fontWeight: tab === t.id ? 700 : 400, fontSize: 11, cursor: "pointer", borderBottom: tab === t.id ? "2px solid " + C.acc : "2px solid transparent", fontFamily: "inherit", whiteSpace: "nowrap" }}>{t.label}</button>;
            })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 20px 60px" }}>

        {tab === "overview" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
              {[
                { l: "Total Draws", v: filtered.length, s: "All draws" },
                { l: "Numbers Drawn", v: filtered.length * 6, s: "6 per draw" },
                { l: "Unique", v: freq.filter(function(f) { return f.count > 0; }).length, s: "of 49" },
                { l: "Expected Freq", v: expFreq.toFixed(1), s: "per number" },
                { l: "Chi-sq", v: chi2.passes ? "PASS" : (chi2.negligible ? "PASS*" : "FAIL"), s: "V=" + chi2.cramersV.toFixed(3) + (chi2.negligible ? " negligible" : ""), c: chi2.passes ? C.grn : (chi2.negligible ? C.acc : C.acc4) },
                { l: "Avg Overlap", v: serial.avg.toFixed(2), s: "exp: " + serial.expected.toFixed(2) },
              ].map(function(s, i) {
                return (<div key={i} style={{ background: C.card, borderRadius: 10, border: "1px solid " + C.border, padding: "13px 12px" }}>
                  <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.c || C.acc, fontFamily: "'Space Grotesk',sans-serif" }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{s.s}</div>
                </div>);
              })}
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid " + C.border }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>All {filtered.length} Draws</h3>
              </div>
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead><tr style={{ background: C.srf, position: "sticky", top: 0, zIndex: 1 }}>
                    {["Date", "Numbers", "+", "Sum", "O/E"].map(function(h) { return <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: C.dim, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>; })}
                  </tr></thead>
                  <tbody>{filtered.slice().reverse().map(function(dr, i) { return (
                    <tr key={i} style={{ borderTop: "1px solid " + C.border + "22" }}>
                      <td style={{ padding: "6px 10px", color: C.dim, fontSize: 10 }}>{dr.d}</td>
                      <td style={{ padding: "6px 10px" }}><div style={{ display: "flex", gap: 3 }}>{dr.n.map(function(x) { return <NumberBall key={x} num={x} C={C} />; })}</div></td>
                      <td style={{ padding: "6px 10px", color: C.dim, fontSize: 10 }}>{dr.a}</td>
                      <td style={{ padding: "6px 10px", fontWeight: 600, fontSize: 10 }}>{dr.n.reduce(function(a, b) { return a + b; }, 0)}</td>
                      <td style={{ padding: "6px 10px", color: C.dim, fontSize: 10 }}>{dr.n.filter(function(x) { return x % 2 !== 0; }).length}/{dr.n.filter(function(x) { return x % 2 === 0; }).length}</td>
                    </tr>); })}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "frequency" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Number Frequency (1-49)</h3>
              <p style={{ margin: "0 0 12px", fontSize: 10, color: C.dim }}>Expected: {expFreq.toFixed(1)} | Orange = hot | Red = cold</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={freq.slice().sort(function(a, b) { return a.number - b.number; })} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="number" tick={{ fontSize: 8, fill: C.dim }} interval={1} />
                  <YAxis tick={{ fontSize: 9, fill: C.dim }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {freq.slice().sort(function(a, b) { return a.number - b.number; }).map(function(e, i) { return <Cell key={i} fill={e.count >= expFreq * 1.3 ? C.acc : e.count <= expFreq * 0.5 ? C.acc4 : C.acc2 + "77"} />; })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{title:"Hot Numbers",color:C.acc,data:freq.slice().sort(function(a,b){return b.count-a.count;}).slice(0,10)},
                {title:"Cold Numbers",color:C.acc2,data:freq.slice().sort(function(a,b){return a.count-b.count;}).slice(0,10)}].map(function(sec) {
                return <div key={sec.title} style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 12, color: sec.color }}>{sec.title}</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sec.data.map(function(f) { return <div key={f.number} style={{ padding: "5px 11px", borderRadius: 6, background: sec.color + "15", border: "1px solid " + sec.color + "33", fontSize: 12 }}>
                      <span style={{ fontWeight: 800, color: sec.color }}>{f.number}</span>
                      <span style={{ color: C.dim, fontSize: 9, marginLeft: 5 }}>x{f.count}</span>
                    </div>; })}
                  </div>
                </div>;
              })}
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Range Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={rangeData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: C.dim }} />
                  <YAxis tick={{ fontSize: 9, fill: C.dim }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="count" fill={C.acc} radius={[3, 3, 0, 0]} name="Actual" />
                  <Bar dataKey="expected" fill={C.acc2 + "55"} radius={[3, 3, 0, 0]} name="Expected" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Overdue Numbers</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {gapData.slice(0, 15).map(function(g) { return <div key={g.number} style={{ padding: "5px 11px", borderRadius: 6, background: g.gap > 15 ? C.acc4 + "18" : C.srf, border: "1px solid " + (g.gap > 15 ? C.acc4 + "44" : C.border), fontSize: 11 }}>
                  <span style={{ fontWeight: 800, color: g.gap > 15 ? C.acc4 : C.txt }}>{g.number}</span>
                  <span style={{ color: C.dim, fontSize: 9, marginLeft: 6 }}>{g.gap} draws ago</span>
                </div>; })}
              </div>
            </div>
          </div>
        )}

        {tab === "patterns" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Odd/Even Split (last 40)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={oddEvenData.slice(-40)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: C.dim }} interval={2} />
                  <YAxis domain={[0, 6]} tick={{ fontSize: 9, fill: C.dim }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="odd" stackId="a" fill={C.acc3} name="Odd" />
                  <Bar dataKey="even" stackId="a" fill={C.acc2} name="Even" radius={[3, 3, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Sum Trend + 10-Draw MA</h3>
              <p style={{ margin: "0 0 10px", fontSize: 9, color: C.dim }}>Smoothing visualization only. Draws are independent — apparent trends are noise.</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={movAvg} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 7, fill: C.dim }} interval={Math.floor(filtered.length / 12)} />
                  <YAxis domain={[60, 240]} tick={{ fontSize: 9, fill: C.dim }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="sum" fill={C.acc + "15"} stroke={C.acc + "55"} strokeWidth={1} dot={false} name="Sum" />
                  <Line type="monotone" dataKey="ma" stroke={C.acc2} strokeWidth={2} dot={false} name="10-draw MA" connectNulls={false} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Consecutive Pairs</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={consData.slice(-40)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: C.dim }} interval={2} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 9, fill: C.dim }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="consecutive" fill={C.grn} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>Recurring Pairs (3+)</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {pairFreq.length === 0 ? <span style={{ color: C.dim, fontSize: 11 }}>None in this window</span> :
                  pairFreq.map(function(p) { return <div key={p.pair} style={{ padding: "5px 11px", borderRadius: 6, background: p.count >= 4 ? C.acc + "18" : C.srf, border: "1px solid " + (p.count >= 4 ? C.acc + "44" : C.border), fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: p.count >= 4 ? C.acc : C.txt }}>{p.pair}</span>
                    <span style={{ color: C.dim, fontSize: 9, marginLeft: 6 }}>x{p.count}</span>
                  </div>; })}
              </div>
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            {[
              { title: "Chi-Square Goodness-of-Fit", color: C.acc, content: (
                <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.border, fontSize: 12 }}>
                  <div>H0: All numbers equally likely</div>
                  <div style={{ margin: "8px 0", borderTop: "1px solid " + C.border, paddingTop: 8 }}>chi-sq = <span style={{ color: C.acc, fontWeight: 700 }}>{chi2.value.toFixed(2)}</span></div>
                  <div>Critical (a=0.05, df=48) = <span style={{ color: C.acc2 }}>{chi2.critical}</span></div>
                  <div style={{ marginTop: 8, color: chi2.passes ? C.grn : C.acc4, fontWeight: 700 }}>{chi2.passes ? "PASS -- consistent with fair randomness" : "FAIL -- statistically significant deviation"}</div>
                  <div style={{ marginTop: 8, borderTop: "1px solid " + C.border, paddingTop: 8 }}>
                    <div>Cramér's V = <span style={{ color: chi2.negligible ? C.grn : C.acc4, fontWeight: 700 }}>{chi2.cramersV.toFixed(4)}</span> <span style={{ color: C.dim, fontSize: 10 }}>(effect size · &lt;0.05 = negligible)</span></div>
                    <div style={{ marginTop: 4, color: chi2.negligible ? C.grn : C.acc4, fontWeight: 700 }}>{chi2.negligible ? "Effect negligible — draws consistent with fair randomness in practice" : "Non-trivial effect — some numbers genuinely favoured"}</div>
                    {!chi2.passes && chi2.negligible && <div style={{ marginTop: 6, color: C.dim, fontSize: 10 }}>Large sample ({(filtered.length*6).toLocaleString()} numbers) makes chi-sq hypersensitive. Statistical significance ≠ practical significance.</div>}
                  </div>
                </div>
              )},
              { title: "Serial Independence", color: C.acc3, content: (
                <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.border, fontSize: 12 }}>
                  <div>Avg repeat between draws: <b style={{ color: C.acc }}>{serial.avg.toFixed(3)}</b></div>
                  <div>Expected if independent: <b style={{ color: C.acc2 }}>{serial.expected.toFixed(3)}</b></div>
                  <div style={{ margin: "8px 0", borderTop: "1px solid " + C.border, paddingTop: 8 }}>z-score = <span style={{ color: C.acc, fontWeight: 700 }}>{serial.z.toFixed(2)}</span> <span style={{ color: C.dim, fontSize: 10 }}>(critical: 1.96 at a=0.05)</span></div>
                  <div style={{ marginTop: 4, color: serial.passes ? C.grn : C.acc4, fontWeight: 700 }}>{serial.passes ? "PASS -- draws appear independent" : "FAIL -- deviation detected"}</div>
                </div>
              )},
              { title: "Birthday Zone Bias", color: C.acc2, content: (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.border, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase" }}>Birthday Zone (1-31)</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: C.acc3, fontFamily: "'Space Grotesk',sans-serif" }}>{bday.inP}%</div>
                      <div style={{ fontSize: 10, color: C.dim }}>Expected: {bday.expIn}%</div>
                    </div>
                    <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.border, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase" }}>High Zone (32-49)</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: C.grn, fontFamily: "'Space Grotesk',sans-serif" }}>{bday.outP}%</div>
                      <div style={{ fontSize: 10, color: C.dim }}>Expected: {bday.expOut}%</div>
                    </div>
                  </div>
                  <p style={{ margin: "10px 0 0", color: C.dim, fontSize: 11 }}>RNG is unbiased. But lottery research (UK 6/49, Dutch Lotto) shows player selections disproportionately cluster in 1-31 due to birthday anchoring, so 32-49 gives better conditional payouts.</p>
                </div>
              )},
            ].map(function(sec) { return (
              <div key={sec.title} style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: sec.color }}>{sec.title}</h3>
                {sec.content}
              </div>
            ); })}
          </div>
        )}

        {tab === "gametheory" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: C.acc }}>Expected Value</h3>
              <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.border, fontSize: 12, lineHeight: 1.8 }}>
                <div>Win probability: <span style={{ color: C.acc, fontWeight: 700 }}>1 in 13,983,816</span></div>
                <div>EV(jackpot @ $1M): <span style={{ color: C.acc, fontWeight: 700 }}>~$0.07 per $1</span></div>
                <div>EV(all tiers): <span style={{ color: C.acc, fontWeight: 700 }}>~$0.42-0.50 per $1</span></div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>Singapore Pools allocates 54% to prize pool; rollovers reduce per-draw payout</div>
                <div style={{ color: C.acc4, fontWeight: 700, marginTop: 6 }}>House edge: ~50-58%</div>
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: C.acc3 }}>Nash Equilibrium</h3>
              <p style={{ fontSize: 12, color: C.txt, margin: "6px 0 14px", lineHeight: 1.7 }}>All combos equally probable but not equally profitable. Jackpot splits among co-winners.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.acc4 + "33" }}>
                  <div style={{ fontSize: 10, color: C.acc4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Popular = Lower EV</div>
                  <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>Birthdays (1-31), patterns, hot numbers. More co-winners.</div>
                </div>
                <div style={{ padding: 14, background: C.srf, borderRadius: 8, border: "1px solid " + C.grn + "33" }}>
                  <div style={{ fontSize: 10, color: C.grn, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Contrarian = Higher EV</div>
                  <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>High zone (32-49), non-patterns. Fewer co-winners.</div>
                </div>
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: C.acc2 }}>Snowball Timing</h3>
              <p style={{ margin: "0 0 10px", fontSize: 9, color: C.dim }}>Qualitative reasoning — exact thresholds depend on ticket sales data which is not public.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[{l:"Base",v:"$1M",d:"Low jackpot, low EV",c:C.dim,b:C.border},{l:"Moderate",v:"$3-6M",d:"Higher EV, fewer players",c:C.grn,b:C.grn+"33"},{l:"Hype",v:"$10M+",d:"Media drives ticket surge, more co-winners",c:C.acc4,b:C.acc4+"33"}].map(function(x,i) { return (
                  <div key={i} style={{ padding: 12, background: C.srf, borderRadius: 8, border: "1px solid " + x.b, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: x.c, textTransform: "uppercase" }}>{x.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: x.c, fontFamily: "'Space Grotesk',sans-serif" }}>{x.v}</div>
                    <div style={{ fontSize: 9, color: C.dim }}>{x.d}</div>
                  </div>); })}
              </div>
            </div>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: C.acc4 }}>Cognitive Biases</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { b: "Gambler's Fallacy", d: "Cold numbers aren't 'due'. Each draw independent.", c: C.acc4 },
                  { b: "Hot Hand", d: "Hot streaks aren't predictive. Normal variance.", c: C.acc },
                  { b: "Birthday Anchoring", d: "Studies show player selections cluster in 1-31. High zone is underplayed.", c: C.acc3 },
                  { b: "Pattern Illusion", d: "Recurring pairs are statistically expected, not signals.", c: C.acc2 },
                ].map(function(x, i) { return <div key={i} style={{ padding: 13, background: C.srf, borderRadius: 8, border: "1px solid " + x.c + "22" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: x.c, marginBottom: 4 }}>{x.b}</div>
                  <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.6 }}>{x.d}</div>
                </div>; })}
              </div>
            </div>
          </div>
        )}

        {tab === "gen" && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <div style={{ background: C.card, borderRadius: 12, border: "1px solid " + C.border, padding: 20, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color: C.acc }}>Number Generator</h3>
              <p style={{ fontSize: 11, color: C.dim, margin: "0 0 14px" }}>Six strategies, same win probability — different conditional payout. Powered by {DRAWS.length} draws of live data.</p>

              {/* Jackpot selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Current jackpot tier — affects EV rating</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{id:"low",l:"Base <$2M",d:"Low EV",c:C.dim},{id:"moderate",l:"Moderate $2-6M",d:"Best EV window",c:C.grn},{id:"hype",l:"Hype $6M+",d:"Surge = more co-winners",c:C.acc4}].map(function(jk) {
                    return <button key={jk.id} onClick={function(){setJackpot(jk.id);}} style={{ padding:"7px 13px", borderRadius:8, border:"1px solid "+(jackpot===jk.id?jk.c:C.border), background:jackpot===jk.id?jk.c+"18":C.srf, color:jackpot===jk.id?jk.c:C.dim, fontSize:10, fontWeight:jackpot===jk.id?700:400, cursor:"pointer", fontFamily:"inherit" }}>
                      <div style={{ fontWeight:700 }}>{jk.l}</div>
                      <div style={{ fontSize:8, marginTop:1 }}>{jk.d}</div>
                    </button>;
                  })}
                </div>
              </div>

              {/* Stats warnings — only surface if effect is practically significant */}
              {((!chi2.passes && !chi2.negligible) || !serial.passes) && (
                <div style={{ marginBottom: 14, padding:"8px 12px", borderRadius:8, background:C.acc4+"12", border:"1px solid "+C.acc4+"33", fontSize:10, color:C.acc4 }}>
                  {!chi2.passes && !chi2.negligible && <span>Chi-sq FAIL (V={chi2.cramersV.toFixed(3)}) — non-trivial frequency bias detected. </span>}
                  {!serial.passes && <span>Serial independence FAIL (z={serial.z.toFixed(2)}) — draws may not be fully independent.</span>}
                </div>
              )}

              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <button onClick={generateAll} style={{ padding: "12px 28px", background: "linear-gradient(135deg," + C.acc + ",#b45309)", color: "#000", fontWeight: 800, fontSize: 14, border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>Generate All</button>
                <div style={{ fontSize:9, color:C.dim, lineHeight:1.6 }}>
                  <div>Odd/even trend (last 20): <b style={{color:C.txt}}>{recentOddAvg.toFixed(1)}</b> avg odd {recentOddAvg > 3.2 ? "→ weighting even" : recentOddAvg < 2.8 ? "→ weighting odd" : "→ balanced"}</div>
                  <div>Sum range (p25–p75): <b style={{color:C.txt}}>{sumStats.p25}–{sumStats.p75}</b> · mean <b style={{color:C.txt}}>{sumStats.mean}</b></div>
                  <div>Hot pairs tracked: <b style={{color:C.txt}}>{pairFreq.length}</b> · avoided in Contrarian &amp; Composite</div>
                </div>
              </div>

              {strats && (
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
                  {[
                    {id:"contrarian",l:"Contrarian",d:"Cold + high zone · avoids hot pairs",c:C.acc,feeds:["freq","pairs"]},
                    {id:"balanced",l:"Balanced",d:"Even spread across zones",c:C.acc2,feeds:["zones"]},
                    {id:"overdue",l:"Overdue",d:"Longest gaps since drawn",c:C.acc3,feeds:["gaps"]},
                    {id:"hot",l:"Popular",d:"Most picked — highest co-winner risk",c:C.acc4,feeds:["freq"]},
                    {id:"highzone",l:"High Zone",d:"Anti-birthday bias (32-49)",c:C.grn,feeds:["bday"]},
                    {id:"composite",l:"Composite Contrarian",d:"High zone + anti-hot + odd/even trend + pair avoidance + min spacing",c:C.grn,feeds:["freq","pairs","bday","odd/even","gaps"]}
                  ].map(function(meta, idx) {
                    var s = strats[idx];
                    var evColor = s.coRisk === "low" ? (jackpot === "hype" ? C.acc : C.grn) : s.coRisk === "medium" ? C.acc : C.acc4;
                    var evLabel = jackpot === "low" ? "Low EV" : s.coRisk === "low" ? (jackpot === "hype" ? "Med EV" : "Best EV") : s.coRisk === "medium" ? (jackpot === "hype" ? "Low EV" : "Med EV") : "Worst EV";
                    var sumColor = s.sumRating === "typical" ? C.dim : C.acc3;
                    return <div key={meta.id} style={{ padding: 16, background: C.srf, borderRadius: 12, border: "1px solid " + meta.c + "33" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: meta.c }}>{meta.l}</div>
                          <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{meta.d}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:9, fontWeight:700, color:evColor, background:evColor+"18", padding:"2px 7px", borderRadius:4 }}>{evLabel}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {s.nums.map(function(x, i) { return <div key={i} style={{ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: meta.c + "20", color: meta.c, fontWeight: 900, fontSize: 14, border: "1px solid " + meta.c + "44", animation: "popIn .3s ease " + (i * 0.05 + idx * 0.05) + "s both" }}>{x}</div>; })}
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 9, color: C.dim, flexWrap:"wrap" }}>
                        <span>Sum: <b style={{ color: sumColor }}>{s.sum}</b> <span style={{color:sumColor}}>({s.sumRating})</span></span>
                        <span>O/E: <b style={{ color: C.txt }}>{s.odd}/{6-s.odd}</b></span>
                        <span>Hi: <b style={{ color: C.txt }}>{s.high}/6</b></span>
                        <span>Co-risk: <b style={{ color: s.coRisk==="low"?C.grn:s.coRisk==="medium"?C.acc:C.acc4 }}>{s.coRisk}</b></span>
                        {s.pairRisk > 0 && <span style={{color:s.pairRisk>=2?C.acc4:C.acc}}>pairs: {s.pairRisk} hot</span>}
                      </div>
                      <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }}>
                        {meta.feeds.map(function(f){ return <span key={f} style={{fontSize:8, padding:"1px 5px", borderRadius:3, background:C.border, color:C.dim}}>{f}</span>; })}
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: 12, background: C.srf, borderRadius: 8, border: "1px solid " + C.acc4 + "33", fontSize: 10, color: C.dim, lineHeight: 1.7 }}>
              <span style={{ color: C.acc4, fontWeight: 700 }}>Disclaimer:</span> Educational only. Lottery is random. No strategy improves win probability. Please gamble responsibly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";

// ── 고정 상수 ──────────────────────────────────────────
const TOTAL_COUNT   = 78000;
const MEMORY_COUNT  = 27000;
const COMMON_COUNT  = 28000;
const FOUNDRY_COUNT = 23000;
const AVG_SALARY만  = 8000;   // 평균연봉 8,000만원
const OPI_RESERVE   = 0.10;   // OPI 재원: OP × 10%
const SP_RESERVE    = 0.105;  // 특별성과급 재원: OP × 10.5%
const DEPT_RATIO    = 0.40;   // 부문 배분: 전체의 40%
const BIZ_RATIO     = 0.60;   // 사업부 배분: 전체의 60%
const TAX_RATE      = 0.40;
const STOCK_PRICE만 = 30;     // 자사주 기준가 30만원

// 가중인원
// 부문: 메모리×1 + 공통×1 + 파운드리×0.6 = 68,800명
const DEPT_WEIGHTED = MEMORY_COUNT*1.0 + COMMON_COUNT*1.0 + FOUNDRY_COUNT*0.6;
// 사업부: 메모리×1 + 공통×0.7 + 파운드리×0 = 46,600명
const BIZ_WEIGHTED  = MEMORY_COUNT*1.0 + COMMON_COUNT*0.7 + FOUNDRY_COUNT*0.0;

// ── 동적 지급률 계산 ────────────────────────────────────
function calcRates(op조) {
  // OPI
  const opiPool만 = op조 * 100_000_000 * OPI_RESERVE;
  const opiPer만  = opiPool만 / TOTAL_COUNT;
  const opiRate   = Math.min(opiPer만 / AVG_SALARY만, 0.50);

  // 특별경영성과급
  const spPool만   = op조 * 100_000_000 * SP_RESERVE;
  const deptPool만 = spPool만 * DEPT_RATIO; // 40% → 12.6조 (300조 기준)
  const bizPool만  = spPool만 * BIZ_RATIO;  // 60% → 18.9조 (300조 기준)

  const deptRate = deptPool만 / (DEPT_WEIGHTED * AVG_SALARY만); // 부문 지급률
  const bizBase  = bizPool만  / (BIZ_WEIGHTED  * AVG_SALARY만); // 사업부 기초 지급률

  // 조직별 최종 지급률
  // 메모리: 부문 + 사업부×1.0
  // 공통:   부문 + 사업부×0.7
  // 파운드리: 부문×0.6 + 사업부×0  (부문에도 0.6 패널티)
  const memRate     = deptRate + bizBase * 1.0;
  const commonRate  = deptRate + bizBase * 0.7;
  const foundryRate = deptRate * 0.6;

  return {
    opiPool만, opiPer만, opiRate,
    spPool만, deptPool만, bizPool만,
    deptRate, bizBase,
    memRate, commonRate, foundryRate,
  };
}

// ── 유틸 ───────────────────────────────────────────────
function fmt(만원) {
  if (만원 === null || 만원 === undefined || isNaN(만원)) return "—";
  const abs = Math.abs(만원);
  if (abs >= 100000) return `${(만원/10000).toFixed(1)}억원`;
  if (abs >= 10000)  return `${(만원/10000).toFixed(2)}억원`;
  return `${Math.round(만원).toLocaleString()}만원`;
}
function pct(r) { return `${(r*100).toFixed(1)}%`; }
function 조(만원) { return `${(만원/100_000_000).toFixed(2)}조원`; }

// ── 서브 컴포넌트 ──────────────────────────────────────
function Card({ label, value, sub, sub2, blue, accent }) {
  return (
    <div style={{
      background: blue ? "#0056A0" : accent ? "#F0F7FF" : "#F8FAFC",
      border: blue ? "none" : accent ? "1.5px solid #BFDBFE" : "1px solid #E5E7EB",
      borderRadius: 14, padding: "16px 18px",
      boxShadow: blue ? "0 4px 20px rgba(0,86,160,0.2)" : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: blue ? "rgba(255,255,255,0.7)" : "#6B7280", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: blue ? 28 : 24, fontWeight: 900, color: blue ? "#fff" : "#111827", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{value}</div>
      {sub  && <div style={{ fontSize: 11, color: blue ? "rgba(255,255,255,0.55)" : "#9CA3AF", marginTop: 4 }}>{sub}</div>}
      {sub2 && <div style={{ fontSize: 13, fontWeight: 700, color: blue ? "rgba(255,255,255,0.88)" : "#374151", marginTop: 4 }}>{sub2}</div>}
    </div>
  );
}

function Row({ n, label, formula, result, bold }) {
  return (
    <div style={{ padding: "11px 0", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {n && (
          <div style={{
            minWidth: 22, height: 22, borderRadius: "50%", flexShrink: 0,
            background: "#0056A0", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, marginTop: 1,
          }}>{n}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#6B7280", background: "#F1F5F9", borderRadius: 6, padding: "4px 9px", fontFamily: "monospace", lineHeight: 1.6 }}>
            {formula}
          </div>
          {result && (
            <div style={{ fontSize: 14, fontWeight: 800, color: bold ? "#B91C1C" : "#0056A0", marginTop: 4 }}>
              → {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────
export default function App() {
  const [salary, setSalary] = useState("");
  const [dsOp,   setDsOp]   = useState("300");
  const [org,    setOrg]    = useState("memory");
  const [months, setMonths] = useState("12");

  const result = useMemo(() => {
    const sal  = parseFloat(salary);
    const op조  = parseFloat(dsOp);
    const mo   = Math.min(Math.max(parseInt(months) || 1, 1), 12);
    if (!sal || sal <= 0 || !op조 || op조 <= 0) return null;

    const rates   = calcRates(op조);
    const moRatio = mo / 12;

    const spRate = org === "memory" ? rates.memRate
                 : org === "common" ? rates.commonRate
                 : rates.foundryRate;

    // 특별성과급: 자사주로 지급
    const spGross만  = sal * spRate  * moRatio;
    const spNet만    = spGross만 * (1 - TAX_RATE);
    const stockCount = Math.floor(spNet만 / STOCK_PRICE만); // 자사주 수량

    // OPI: 현금으로 지급
    const opiGross만 = sal * rates.opiRate * moRatio;
    const opiNet만   = opiGross만 * (1 - TAX_RATE);

    const totalNet만 = spNet만 + opiNet만;

    return {
      sal, op조, mo, moRatio, spRate,
      rates,
      spGross만, spNet만, stockCount,
      opiGross만, opiNet만,
      totalNet만,
    };
  }, [salary, dsOp, org, months]);

  const previewRates = useMemo(() => calcRates(parseFloat(dsOp) || 300), [dsOp]);

  const orgInfo = {
    memory:    { label: "메모리",   emoji: "💾", getRt: r => r.memRate    },
    common:    { label: "공통",     emoji: "🏢", getRt: r => r.commonRate },
    nonmemory: { label: "비메모리", emoji: "🏭", getRt: r => r.foundryRate},
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* 헤더 */}
      <div style={{ background: "#0056A0", padding: "26px 0 20px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.18)", borderRadius: 5, padding: "2px 12px", fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: "0.12em", marginBottom: 10 }}>
          SAMSUNG DS
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.025em" }}>Incentive Simulator</h1>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 6, marginBottom: 0 }}>
          특별경영성과급(자사주) + OPI(현금) · 세전/세후 · 영업이익 직접 입력
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>

        {/* 안내 */}
        <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 10, padding: "9px 13px", fontSize: 11, color: "#6D4C41", lineHeight: 1.7, marginTop: 12 }}>
          ⚠️ 참고용 · OPI 재원 10% · 특별성과급 재원 10.5% (부문 40% : 사업부 60%) · 평균연봉 8,000만 · 실효세율 40% · 비메모리 적자 페널티 적용<br/>
          특별경영성과급은 자사주(기준가 30만원)로, OPI는 현금으로 지급
        </div>

        {/* 입력 */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 16, padding: "18px 16px", marginTop: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 14px" }}>내 정보 입력</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / 3" }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>계약 연봉 (만원)</label>
              <input type="number" placeholder="예: 8000" value={salary}
                onChange={e => setSalary(e.target.value)}
                style={{ width: "100%", fontSize: 20, fontWeight: 800, color: "#0056A0", border: "2px solid #DBEAFE", borderRadius: 10, padding: "9px 11px", outline: "none", background: "#fff", fontFamily: "inherit", boxSizing: "border-box" }}
              />
              {salary && parseFloat(salary) > 0 && (
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>= {(parseFloat(salary)/10000).toFixed(2)}억원</div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>근무 개월</label>
              <input type="number" min={1} max={12} value={months}
                onChange={e => setMonths(e.target.value)}
                style={{ width: "100%", fontSize: 20, fontWeight: 800, color: "#0056A0", border: "2px solid #DBEAFE", borderRadius: 10, padding: "9px 8px", outline: "none", background: "#fff", fontFamily: "inherit", textAlign: "center", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>1~12개월</div>
            </div>
          </div>

          {/* DS 영업이익 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>
              DS 영업이익 (조원) <span style={{ fontWeight: 400, color: "#9CA3AF" }}>— 기본값 300조</span>
            </label>
            <input type="number" placeholder="예: 300" value={dsOp}
              onChange={e => setDsOp(e.target.value)}
              style={{ width: "100%", fontSize: 20, fontWeight: 800, color: "#0056A0", border: "2px solid #DBEAFE", borderRadius: 10, padding: "9px 11px", outline: "none", background: "#fff", fontFamily: "inherit", boxSizing: "border-box" }}
            />

          </div>

          {/* 소속 조직 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>소속 조직</label>
              <span style={{ fontSize: 10, color: "#9CA3AF" }}>메모리 27,000명 · 공통 28,000명 · 비메모리 23,000명</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(orgInfo).map(([key, val]) => {
                const active = org === key;
                const spR = val.getRt(previewRates);
                return (
                  <button key={key} onClick={() => setOrg(key)} style={{
                    flex: 1, padding: "9px 4px", borderRadius: 10,
                    border: `2px solid ${active ? "#0056A0" : "#E5E7EB"}`,
                    background: active ? "#EBF4FF" : "#fff",
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  }}>
                    <span style={{ fontSize: 16 }}>{val.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: active ? "#0056A0" : "#374151" }}>{val.label}</span>

                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 결과 */}
        {result ? (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14, marginBottom: 10 }}>
              {[
                { label: `${orgInfo[org].emoji} ${orgInfo[org].label}`, bg: "#EBF4FF", color: "#1D6FA4" },
                { label: `연봉 ${fmt(result.sal)}`, bg: "#F3F4F6", color: "#374151" },
                { label: `DS OP ${result.op조}조`, bg: "#F3F4F6", color: "#374151" },
                { label: `${result.mo}개월`, bg: "#F3F4F6", color: "#374151" },
              ].map((t, i) => (
                <span key={i} style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color }}>{t.label}</span>
              ))}
            </div>

            {/* 결과 카드 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <Card
                label="특별경영성과급 (세전, 자사주)"
                value={fmt(result.spGross만)}
                sub={`지급률 ${pct(result.spRate)}`}
                sub2={`세후 ${fmt(result.spNet만)}`}
              />
              <Card
                label="OPI (세전, 현금)"
                value={fmt(result.opiGross만)}
                sub={`지급률 ${pct(result.rates.opiRate)} (상한 50%)`}
                sub2={`세후 ${fmt(result.opiNet만)}`}
              />
            </div>

            {/* 자사주 수량 강조 카드 */}
            <div style={{ marginBottom: 8 }}>
              <div style={{
                background: "#1A3A5C", borderRadius: 14, padding: "16px 18px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>📈 자사주 수량 (특별성과급 세후 ÷ 30만)</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                    {result.stockCount.toLocaleString()}주
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>기준가 30만원</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                    세후 {fmt(result.spNet만)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Card label="합산 세후 실수령 (특별+OPI)" value={fmt(result.totalNet만)}
                sub={`특별 세후 ${fmt(result.spNet만)} + OPI 세후 ${fmt(result.opiNet만)}`}
                blue />
            </div>

            {/* 조직별 비교표 */}
            <div style={{ background: "#EBF4FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1D6FA4", marginBottom: 8 }}>
                📊 조직별 비교 (DS OP {result.op조}조 · 연봉 {fmt(result.sal)} 기준)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, fontSize: 10, fontWeight: 700, color: "#6B7280", paddingBottom: 5, borderBottom: "1px solid #BFDBFE", marginBottom: 5 }}>
                <span>조직</span><span style={{textAlign:"right"}}>지급률</span><span style={{textAlign:"right"}}>세후금액</span><span style={{textAlign:"right"}}>자사주</span>
              </div>
              {[
                { key:"memory",    label:"💾 메모리",   rate: result.rates.memRate    },
                { key:"common",    label:"🏢 공통",     rate: result.rates.commonRate },
                { key:"nonmemory", label:"🏭 비메모리", rate: result.rates.foundryRate},
              ].map(row => {
                const spN = result.sal * row.rate * result.moRatio * (1-TAX_RATE);
                const opiN = result.opiNet만;
                const totalN = spN + opiN;
                const stocks = Math.floor(spN / STOCK_PRICE만);
                const isMe = org === row.key;
                return (
                  <div key={row.key} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4,
                    padding: "5px 0", borderBottom: "1px solid rgba(29,111,164,0.08)",
                    fontWeight: isMe ? 800 : 400, opacity: isMe ? 1 : 0.6,
                  }}>
                    <span style={{ fontSize: 11, color: "#1D6FA4" }}>{row.label}</span>
                    <span style={{ fontSize: 11, color: "#0056A0", textAlign: "right" }}>{pct(row.rate)}</span>
                    <span style={{ fontSize: 11, color: "#374151", textAlign: "right" }}>{fmt(totalN)}</span>
                    <span style={{ fontSize: 11, color: "#374151", textAlign: "right" }}>{stocks.toLocaleString()}주</span>
                  </div>
                );
              })}
            </div>

          </>
        ) : (
          <div style={{ textAlign: "center", padding: "36px 24px", color: "#9CA3AF", fontSize: 13, marginTop: 8 }}>
            연봉을 입력하면 자동 계산됩니다.
          </div>
        )}

        <div style={{ textAlign: "center", padding: "0 0 28px", fontSize: 10, color: "#C4C4C4", lineHeight: 1.8 }}>
          단순 참고용 · OPI 재원 10% · 특별성과급 재원 10.5% (부문 40% : 사업부 60%) · 평균연봉 8,000만 기준<br />
          실제 지급액은 확정 사업성과 및 회사 공식 기준에 따라 다를 수 있습니다.
        </div>
      </div>
    </div>
  );
}

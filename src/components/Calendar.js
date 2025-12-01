// Calendar.js (updated)
import React, { useState, useEffect } from "react";
import { Moon } from "lunarphase-js";
import "../styles/calendar.css";
import "../App.css"; // mantém suas fontes

const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const meses = ["Jan","Fev","Mar","Abr","Maio","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const traducaoFases = {
  New: "Lua Nova",
  "First Quarter": "Crescente",
  Full: "Lua Cheia",
  "Waxing Crescent": "Crescente",
  "Waxing Gibbous": "Gibosa Crescente",
  "Waning Gibbous": "Gibosa Minguante",
  "Last Quarter": "Minguante",
  "Waning Crescent": "Minguante"
};
const fasesPrincipais = ["Lua Nova","Crescente","Lua Cheia","Minguante"];


const Calendar = () => {
  const [date, setDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [time, setTime] = useState(new Date());
  const [temperature, setTemperature] = useState(null);

  const [printAll, setPrintAll] = useState(false);  // 12 páginas
  const [printGrid, setPrintGrid] = useState(false); // grade 4x3

  // relógio
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // feriados
  useEffect(() => {
    const year = date.getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
      .then(r => r.json())
      .then(data => setHolidays(data))
      .catch(() => setHolidays([]));
  }, [date]);

  // clima
  useEffect(() => {
    const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;
    if (!API_KEY) return;
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Pelotas,BR&appid=${API_KEY}&units=metric&lang=pt`)
      .then(r => r.json())
      .then(d => d.main && setTemperature(Math.round(d.main.temp)))
      .catch(() => {});
  }, []);

  const changeMonth = (offset) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + offset);
    setDate(newDate);
  };

  const buildMonthArray = (y, m) => {
    const primeiroDia = new Date(y, m, 1).getDay();
    const diasMes = new Date(y, m+1, 0).getDate();
    const arr = Array(primeiroDia).fill(null);
    for (let d=1; d<=diasMes; d++) arr.push(d);
    return arr;
  };

  const year = date.getFullYear();
  const month = date.getMonth();

  const dias = buildMonthArray(year, month);
  const prev = buildMonthArray(year, month-1);
  const next = buildMonthArray(year, month+1);

  // fases lunares
  const calcLunarPhasesForMonth = (y, m) => {
    const diasMes = new Date(y, m+1, 0).getDate();
    const fases = {};
    for (let d=1; d<=diasMes; d++) {
      const F = Moon.lunarPhase(new Date(Date.UTC(y,m,d)));
      fases[`${y}-${m+1}-${d}`] = traducaoFases[F] || F;
    }
    return fases;
  };

  // mês compacto (grade 4×3)
  const renderCompactMonth = (y, m) => {
    const diasMes = buildMonthArray(y, m);

    // feriados rápidos
    const feriadosSet = new Set(
      holidays
        .filter(h => {
          const dt = new Date(h.date+"T00:00:00");
          return dt.getFullYear()===y && dt.getMonth()===m;
        })
        .map(h => new Date(h.date+"T00:00:00").getDate())
    );

    // lista de feriados com nome para aparecer abaixo do mês compacto
    const feriadosLista = holidays
      .filter(h => {
        const dt = new Date(h.date+"T00:00:00");
        return dt.getFullYear()===y && dt.getMonth()===m;
      })
      .map(h => {
        const dt = new Date(h.date+"T00:00:00");
        return `${dt.getDate()}. ${h.name}`;
      });

    // luas compactas (apenas principais) para o card compacto
    const fases = calcLunarPhasesForMonth(y,m);
    const luas = [];
    let p = null;
    Object.entries(fases)
      .filter(([dt]) => Number(dt.split("-")[1]) - 1 === m)
      .forEach(([dt,fase]) => {
        if (fase !== p && fasesPrincipais.includes(fase)) {
          luas.push(`${dt.split("-")[2]}. ${fase}`);
          p = fase;
        }
      });

    return (
      <div key={`compact-${y}-${m}`} className="compact-month">
        <div className="compact-month-title">{meses[m]}</div>

        <div className="compact-weekdays">
          {diasSemana.map(d => <div key={d} className="compact-weekday">{d[0]}</div>)}
        </div>

        <div className="compact-days-grid">
          {diasMes.map((d,i) => (
            <div key={i} className={`compact-day ${d && feriadosSet.has(d) ? "compact-holiday":""}`}>
              {d || ""}
            </div>
          ))}
        </div>

        {luas.length>0 && <div className="month-info moon-line">{luas.join(" | ")}</div>}
        {feriadosLista.length>0 && <div className="month-info holiday-line">{feriadosLista.join(" | ")}</div>}
      </div>
    );
  };


  // página completa (para 12 páginas)
  const renderFullCalendarPage = (y, m) => {
    const diasMes = buildMonthArray(y, m);
    const lunarPhases = calcLunarPhasesForMonth(y, m);

    const luasDoMes = [];
    let prevF = null;
    Object.entries(lunarPhases)
      .filter(([dt]) => Number(dt.split("-")[1]) - 1 === m)
      .forEach(([dt,fase]) => {
        if (fase !== prevF && fasesPrincipais.includes(fase)) {
          luasDoMes.push(`${dt.split("-")[2]}. ${fase}`);
          prevF = fase;
        }
      });

    const feriadosDoMes = holidays
      .filter(h => {
        const d = new Date(h.date+"T00:00:00");
        return d.getFullYear()===y && d.getMonth()===m;
      })
      .map(h => {
        const d = new Date(h.date+"T00:00:00");
        return `${d.getDate()}. ${h.name}`;
      });

    const miniPrev = buildMonthArray(y,m-1);
    const miniNext = buildMonthArray(y,m+1);

    return (
      <div key={`print-${y}-${m}`} className="calendar-page print-page">
        <div className="calendar-container" id={`month-${m+1}`}> 

          <div className="month-nav">
            <button className="nav-btn" aria-hidden>❮</button>
            <div className="month-year">
              <h2 className="month-title">{meses[m]}</h2>
              <span className="year-title">{y}</span>
            </div>
            <button className="nav-btn" aria-hidden>❯</button>
          </div>

          <div className="weekdays transparent">
            {diasSemana.map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="days-grid">
            {diasMes.map((dia,i) => {
              if (!dia) return <div key={i}></div>;
              const fer = holidays.find(h => {
                const dt = new Date(h.date+"T00:00:00");
                return dt.getDate()===dia && dt.getMonth()===m && dt.getFullYear()===y;
              });
              return (
                <div key={i} className={`day ${fer?"holiday-day":""}`}>
                  {dia}
                </div>
              );
            })}
          </div>

          {luasDoMes.length>0 &&
            <div className="month-info moon-line">{luasDoMes.join(" | ")}</div>
          }
          {feriadosDoMes.length>0 &&
            <div className="month-info holiday-line">{feriadosDoMes.join(" | ")}</div>
          }
        </div>

        {/* Mostrar mini-calendários também na impressão: removi classe que os escondia */}
        <div className="right-side">
          <div className="current-info">
            <div className="current-time">{time.toLocaleTimeString()}</div>
            {temperature!==null && <div className="current-temp">{temperature}°C</div>}
          </div>

          <button className="today-btn" onClick={() => setDate(new Date())}>Hoje</button>

          <div className="side-mini-months">
            <div className="mini-month">
              <h4>{meses[(m-1+12)%12]}</h4>
              <div className="mini-grid">{miniPrev.map((d,i)=>
                <div key={i} className="mini-day">{d || ""}</div>
              )}</div>
            </div>

            <div className="mini-month">
              <h4>{meses[(m+1)%12]}</h4>
              <div className="mini-grid">{miniNext.map((d,i)=>
                <div key={i} className="mini-day">{d || ""}</div>
              )}</div>
            </div>

            <button className="print-btn" onClick={()=>window.print()}>Imprimir mês</button>
            <button className="print-btn" onClick={printWholeYear}>Imprimir ano inteiro</button>
            <button className="print-btn" onClick={handlePrintGrid}>Imprimir Ano em Grade</button>
          </div>
        </div>
      </div>
    );
  };


  // ---- MÉTODO FINAL PARA IMPRIMIR -----

  const printWholeYear = () => {
    setPrintAll(true);
    // allow React to render the pages
    setTimeout(() => {
      window.print();
      setPrintAll(false);
    }, 500);
  };

  const handlePrintGrid = () => {
    setPrintGrid(true);
    setTimeout(() => {
      window.print();
      setPrintGrid(false);
    }, 500);
  };


  return (
    <>
      {/* MODO INTERATIVO */}
      {!printAll && !printGrid && (
        <div className="calendar-page">
          <div className="calendar-container">

            <div className="month-nav">
              <button className="nav-btn" onClick={() => changeMonth(-1)}>❮</button>
              <div className="month-year">
                <h2 className="month-title">{meses[month]}</h2>
                <span className="year-title">{year}</span>
              </div>
              <button className="nav-btn" onClick={() => changeMonth(1)}>❯</button>
            </div>

            <div className="weekdays transparent">
              {diasSemana.map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="days-grid">
              {dias.map((dia,i) => {
                if (!dia) return <div key={i}></div>;
                const fer = holidays.find(h => {
                  const dt = new Date(h.date+"T00:00:00");
                  return dt.getDate()===dia && dt.getMonth()===month && dt.getFullYear()===year;
                });
                return <div key={i} className={`day ${fer?"holiday-day":""}`}>{dia}</div>;
              })}
            </div>

            {/* fases lunares */}
            {(() => {
              const F = calcLunarPhasesForMonth(year, month);
              const L = [];
              let P = null;
              Object.entries(F)
                .filter(([dt]) => Number(dt.split("-")[1])-1===month)
                .forEach(([dt,fase])=>{
                  if (fase!==P && fasesPrincipais.includes(fase)) {
                    L.push(`${dt.split("-")[2]}. ${fase}`);
                    P = fase;
                  }
                });
              return L.length? <div className="month-info moon-line">{L.join(" | ")}</div> : null;
            })()}

            {/* Linha de feriados no modo interativo */}
            {(() => {
              const feriadosMes = holidays
                .filter(h => {
                  const d = new Date(h.date + "T00:00:00");
                  return d.getFullYear() === year && d.getMonth() === month;
                })
                .map(h => {
                  const d = new Date(h.date + "T00:00:00");
                  return `${d.getDate()}. ${h.name}`;
                });

              return feriadosMes.length ? (
                <div className="month-info holiday-line">
                  {feriadosMes.join(" | ")}
                </div>
              ) : null;
            })()}

          </div>

          <div className="right-side">
            <div className="current-info">
              <div className="current-time">{time.toLocaleTimeString()}</div>
              {temperature!==null && <div className="current-temp">{temperature}°C</div>}
            </div>

            <button className="today-btn" onClick={() => setDate(new Date())}>Hoje</button>

            <div className="side-mini-months">
              <div className="mini-month">
                <h4>{meses[(month-1+12)%12]}</h4>
                <div className="mini-grid">{prev.map((d,i)=> <div key={i} className="mini-day">{d||""}</div>)}</div>
              </div>

              <div className="mini-month">
                <h4>{meses[(month+1)%12]}</h4>
                <div className="mini-grid">{next.map((d,i)=> <div key={i} className="mini-day">{d||""}</div>)}</div>
              </div>

              <button className="print-btn" onClick={()=>window.print()}>Imprimir mês</button>
              <button className="print-btn" onClick={printWholeYear}>Imprimir ano inteiro</button>
              <button className="print-btn" onClick={handlePrintGrid}>Imprimir Ano em Grade</button>
            </div>
          </div>
        </div>
      )}

      {/* 12 páginas */}
      {printAll && (
        <div className="all-year-print">
          {Array.from({length:12}).map((_,i) => renderFullCalendarPage(year,i))}
        </div>
      )}

      {/* grade compacta */}
      {printGrid && (
        <div className="print-year-grid-root">
          <h1 className="year-grid-title">{year}</h1>
          <div className="print-year-grid">
            {Array.from({length:12}).map((_,i)=> renderCompactMonth(year,i))}
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;

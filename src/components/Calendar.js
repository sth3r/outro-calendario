import React, { useState, useEffect } from "react"; 
import { Moon } from "lunarphase-js";
import "../App.css";

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
  const [date,setDate] = useState(new Date());
  const [lunarPhases,setLunarPhases] = useState({});
  const [holidays,setHolidays] = useState([]);
  const [time,setTime] = useState(new Date());
  const [temperature,setTemperature] = useState(null);

  const changeMonth = (offset) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + offset);
    setDate(newDate);
  };

  // Atualiza hora
  useEffect(()=>{
    const timer = setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(timer);
  },[]);

  // Feriados
  useEffect(()=>{
    const year = date.getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
      .then(r=>r.json())
      .then(data=>setHolidays(data))
      .catch(()=>setHolidays([]));
  },[date]);

  // Fases da Lua
  useEffect(()=>{
    const year = date.getFullYear();
    const month = date.getMonth();
    const diasNoMes = new Date(year, month+1, 0).getDate();
    const fases = {};
    for(let dia=1; dia<=diasNoMes; dia++){
      const d = new Date(Date.UTC(year, month, dia)); // Corrige fuso horário
      const fase = Moon.lunarPhase(d);
      fases[`${year}-${month+1}-${dia}`] = traducaoFases[fase] || fase;
    }
    setLunarPhases(fases);
  },[date]);

  // Temperatura
  useEffect(()=>{
    const API_KEY = process.env.REACT_APP_OPENWEATHER_KEY;

const cidade = "Pelotas,BR";

if (API_KEY) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${API_KEY}&units=metric&lang=pt`)
    .then(res => res.json())
    .then(data => { if (data.main) setTemperature(Math.round(data.main.temp)); })
    .catch(() => setTemperature(null));
}
console.log("Chave da API:", API_KEY);


  },[]);

  // Monta array do mês para o grid
  const buildMonthArray = (year,month)=>{
    const primeiroDia = new Date(year,month,1).getDay();
    const diasNoMes = new Date(year,month+1,0).getDate();
    const dias = Array(primeiroDia).fill(null);
    for(let d=1; d<=diasNoMes; d++) dias.push(d);
    return dias;
  };

  const year = date.getFullYear();
  const month = date.getMonth();
  const dias = buildMonthArray(year,month);
  const prev = buildMonthArray(year,month-1);
  const next = buildMonthArray(year,month+1);

  // Lua
  const luasDoMes = [];
  let faseAnterior = null;
  Object.entries(lunarPhases)
    .filter(([data])=>{
      const partes = data.split("-");
      return Number(partes[1])-1 === month;
    })
    .forEach(([data,fase])=>{
      if(fase!==faseAnterior && fasesPrincipais.includes(fase)){
        const day = Number(data.split("-")[2]);
        luasDoMes.push(`${day}. ${fase}`);
        faseAnterior = fase;
      }
    });

  // Feriados
  const feriadosDoMes = holidays
    .filter(h=>{
      const data = new Date(h.date);
      return data.getMonth() === month;
    })
    .map(h=>{
      const data = new Date(h.date);
      return `${data.getDate()}. ${h.name}`;
    });

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <div className="month-nav">
          <button className="nav-btn" onClick={()=>changeMonth(-1)}>❮</button>
          <div className="month-year">
            <h2 className="month-title">{meses[month]}</h2>
            <span className="year-title">{year}</span>
          </div>
          <button className="nav-btn" onClick={()=>changeMonth(1)}>❯</button>
        </div>

        <div className="weekdays transparent">{diasSemana.map(d=><div key={d}>{d}</div>)}</div>

        <div className="days-grid">
          {dias.map((dia,index)=>{
            if(!dia) return <div key={index}></div>;
            const feriado = holidays.find(h=>{
              const data = new Date(h.date);
              return data.getDate() === dia && data.getMonth() === month;
            });
            return <div key={index} className={`day ${feriado?"holiday-day":""}`}>{dia}</div>;
          })}
        </div>

        {luasDoMes.length>0 && <div className="month-info moon-line">{luasDoMes.join(" | ")}</div>}
        {feriadosDoMes.length>0 && <div className="month-info holiday-line">{feriadosDoMes.join(" | ")}</div>}
      </div>

      <div className="right-side">
        <div className="current-info no-print">
          <div className="current-time">{time.toLocaleTimeString()}</div>
          {temperature !== null && <div className="current-temp">{temperature}°C</div>}
        </div>

        <div className="actions no-print">
          <button className="today-btn" onClick={() => setDate(new Date())}>Hoje</button>
        </div>

        <div className="side-mini-months no-print">
          <div className="mini-month">
            <h4>{meses[(month-1+12)%12]}</h4>
            <div className="mini-grid">{prev.map((d,i)=><div key={i} className="mini-day">{d||""}</div>)}</div>
          </div>

          <div className="mini-month">
            <h4>{meses[(month+1)%12]}</h4>
            <div className="mini-grid">{next.map((d,i)=><div key={i} className="mini-day">{d||""}</div>)}</div>
          </div>

          <button className="print-btn" onClick={() => window.print()}>Imprimir</button>
          
        </div>
      </div>


    </div>
  );
};

export default Calendar;

import React, { useEffect, useContext, useReducer, useState } from 'react';
import Header from './Components/Header';
import './dashboard.css';
import people from './assets/people.png';
import waiting from './assets/waitingpeople.png';
import CustomSelect from './Components/CustomSelect';
// eslint-disable-next-line no-unused-vars
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { SocketContext } from './socketContext';
import axios from 'axios';

const msToMinutes = (time, getFloating) => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(0);
  if (getFloating) {
    return parseFloat(`${minutes}.${(seconds < 10 ? '0' : '') + seconds}`);
  }
  return `${minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
};

const getTotal = (obj, isNumber) => {
  if (!obj) return 'NA';
  let total = 0;
  obj.forEach((e) => {
    total += e;
  });
  if (isNumber) return total;
  return msToMinutes(total);
};

const convertObjectToArray = (obj) => {
  if (!obj) return 'NA';
  const arr = obj.map((e) => msToMinutes(e, true));
  return arr;
};

const getIncrement = (state) => {
  if (!state) return null;
  const newState = state;
  const currentHour = new Date().getHours() + 1;
  if (state.isActive) {
    // increment active and cycle time
    newState.activeData[currentHour] += 1;
    newState.cycleTime[currentHour] += 1;
  } else {
    // increment idle time
    newState.idleData[currentHour] += 1;
  }
  return newState;
};

const getIncrementCycle = (state) => {
  if (!state) return null;
  const currentHour = new Date().getHours() + 1;
  console.log(state, currentHour);
  state.totalCycleTime[currentHour] += 1;
  return state;
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'initiate-first':
      return {
        ...state,
        first: action.data,
      };
    case 'initiate-second':
      return {
        ...state,
        second: action.data,
      };
    case 'increment-first':
      return {
        ...state,
        first: getIncrement(state.first),
      };
    case 'increment-second':
      return {
        ...state,
        second: getIncrement(state.second),
      };
    case 'increment-cycle-first':
      console.log(2, action.data);
      return {
        ...state,
        first: getIncrementCycle(state.first),
      };
    case 'increment-cycle-second':
      return {
        ...state,
        second: getIncrementCycle(state.second),
      };
    case 'change-state-first':
      console.log(1, action.data);
      return {
        ...state,
        first: { ...state.first, isActive: action.data },
      };
    case 'change-state-second':
      return {
        ...state,
        second: { ...state.second, isActive: action.data },
      };
    default:
      return state;
  }
};

const toSeconds = (minutes, seconds) => {
  return minutes * 60 + seconds;
};

const formatData = (data) => {
  const initialData = {
    activeData: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    idleData: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cycleTime: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    totalCycles: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    machineName: data.machineName,
    isActive: true,
  };
  let startHour;
  let endHour;
  data.cycleTime.forEach((e) => {
    startHour = new Date(e?.start)?.getHours() + 1;
    endHour = new Date(e?.end)?.getHours() + 1;
    if (startHour > 0 || startHour < 8) {
      if (startHour === endHour) {
        initialData.cycleTime[startHour] +=
          new Date(e.end).getSeconds() - new Date(e.start).getSeconds();
        initialData.totalCycles[startHour]++;
      } else if (endHour) {
        initialData.cycleTime[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
        initialData.cycleTime[endHour] += e.end.getSeconds();
        initialData.totalCycles[endHour]++;
      } else {
        initialData.cycleTime[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
      }
    }
  });
  data.idleTime.forEach((e) => {
    startHour = new Date(e?.start)?.getHours() + 1;
    endHour = new Date(e?.end)?.getHours() + 1;
    if (startHour > 0 || startHour < 8) {
      if (startHour === endHour) {
        initialData.idleData[startHour] +=
          new Date(e.end).getSeconds() - new Date(e.start).getSeconds();
      } else if (endHour) {
        initialData.idleData[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
        initialData.idleData[endHour] += e.end.getSeconds();
      } else {
        initialData.idleData[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
        initialData.isActive = false;
      }
    }
  });
  const currentDate = new Date();
  const currentHour = currentDate.getHours() + 1;
  for (let i = 0; i < currentHour; i++) {
    initialData.activeData[i] += 3600 - initialData.idleData[i];
  }
  initialData.activeData[currentHour] =
    currentDate.getMinutes() * 60 +
    currentDate.getSeconds() -
    initialData.idleData[currentHour];
  return initialData;
};

export default function Dashboard() {
  const [socketConnectedOne, setSocketConnectedOne] = useState(false);
  const [socketConnectedTwo, setSocketConnectedTwo] = useState(false);
  const [state, dispatch] = useReducer(reducer, {
    first: null,
    second: null,
  });
  const socket = useContext(SocketContext);

  const countryList = [
    { id: 0, category_name: 'Mechanical' },
    { id: 1, category_name: 'Electrical' },
  ];
  const countryList2 = [
    { id: 1, category_name: '12/10/21' },
    { id: 2, category_name: '13/10/21' },
    { id: 3, category_name: '14/10/21' },
    { id: 4, category_name: '15/10/21' },
    { id: 5, category_name: '16/10/21' },
  ];
  const options = {
    maintainAspectRatio: false,
  };

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      const data = await axios.get('http://localhost:9000/api/data');
      if (mounted) {
        // set data here
        data.data.data.forEach((ele) => {
          if (ele.machineCode === 'ws01') {
            dispatch({
              type: 'initiate-first',
              data: formatData({ ...ele, machineName: 'Mechanical' }),
            });
            setSocketConnectedOne(true);
          } else {
            dispatch({
              type: 'initiate-second',
              data: formatData({ ...ele, machineName: 'Electrical' }),
            });
            setSocketConnectedTwo(true);
          }
        });
      }
    };
    if (state.first === null && state.second === null) fetch();
    return () => {
      mounted = false;
    };
  }, [state]);

  useEffect(() => {
    socket.on('cs01', (data) => {
      console.log(data);
      if (typeof data.working !== 'undefined') {
        if (data.working) {
          dispatch({
            type: 'change-state-first',
            data: data.working,
          });
        } else {
          dispatch({
            type: 'change-state-second',
            data: data.working,
          });
        }
      } else if (typeof data.cycle !== 'undefined') {
        if (!data.cycle) {
          dispatch({
            type: 'increment-cycle-first',
          });
        }
      }
    });

    socket.on('cs02', (data) => {
      console.log(data);
      if (typeof data.working !== 'undefined') {
        if (data.working) {
          dispatch({
            type: 'change-state-second',
            data: data.working,
          });
        } else {
          dispatch({
            type: 'change-state-second',
            data: data.working,
          });
        }
      } else if (typeof data.cycle !== 'undefined') {
        if (!data.cycle) {
          dispatch({
            type: 'increment-cycle-second',
            data: data.working,
          });
        }
      }
    });

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('disconnect');
    };
  }, [socket, state.isFirstIdle, state.isSecondIdle]);

  useEffect(() => {
    if (!socketConnectedOne) {
      return;
    }
    const intervalOne = setInterval(() => {
      // increment 1s in state
      const index = new Date().getHours() + 1;
      if (index < 0 || index > 7) return;
      if (state.first !== null) {
        dispatch({
          type: 'increment-first',
        });
      }
    }, 1000);
    return () => clearInterval(intervalOne);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnectedOne]);

  useEffect(() => {
    if (!socketConnectedTwo) {
      return;
    }
    const intervalTwo = setInterval(() => {
      // increment 1000ms in state
      const index = new Date().getHours() + 1;
      if (index < 0 || index > 7) return;
      if (state.second !== null) {
        dispatch({
          type: 'increment-second',
        });
      }
    }, 1000);
    return () => clearInterval(intervalTwo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnectedTwo]);

  if (!state.first && !state.second) {
    return null;
  }

  return (
    <>
      <Header />
      {/* <button className="start-button">Start Analysis</button> */}
      <div className="d-flex justify-content-between">
        <div
          className="d-flex"
          style={{
            textAlign: 'center',
            marginLeft: '8%',
            width: '36%',
            marginTop: '30px',
            boxShadow: 'rgb(32 33 10 / 8%) 0px 1px 6px',
            padding: '30px 0px',
            borderRadius: '10px',
            height: '121px',
            paddingLeft: '3%',
          }}
        >
          <img
            src={people}
            alt="people"
            style={{ width: '40px', height: '40px', marginTop: '5px' }}
          />
          <div
            className="d-flex flex-column align-items-start"
            style={{ marginLeft: '2%' }}
          >
            <span style={{ fontSize: 'larger', fontWeight: '500' }}>
              Overall Manpower Utilization
            </span>
            <span style={{ color: '#336CFB' }}>
              W1: {getTotal(state?.first?.activeData)}mins W2:{' '}
              {getTotal(state?.second?.activeData)}mins
            </span>
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            width: '36%',
            marginRight: '8%',
            marginTop: '30px',
            boxShadow: 'rgb(32 33 10 / 8%) 0px 1px 6px',
            padding: '30px 0px',
            borderRadius: '10px',
            height: '121px',
            paddingLeft: '3%',
          }}
          className="d-flex"
        >
          <img
            src={waiting}
            alt="people"
            style={{ width: '40px', height: '40px', marginTop: '5px' }}
          />
          <div
            className="d-flex flex-column align-items-start"
            style={{ marginLeft: '2%' }}
          >
            <span style={{ fontSize: 'larger', fontWeight: '500' }}>
              Overall Idle Time
            </span>
            <span style={{ color: '#336CFB' }}>
              W1: {getTotal(state?.first?.idleData)}mins W2:{' '}
              {getTotal(state?.second?.idleData)}mins
            </span>
          </div>
        </div>
      </div>

      <div className="graph-div2">
        <span className="logboook">Working time analysis - Mechanical</span>
        <div className="graph-div">
          <Bar
            data={{
              labels: [
                '10-11',
                '11-12',
                '12-13',
                '13-14',
                '14-15',
                '15-16',
                '16-17',
              ],
              datasets: [
                {
                  backgroundColor: '#037CFC',
                  label: 'Active Time Duration(mins)',
                  borderColor: '#8BB3F5',
                  borderWidth: 1,
                  hoverBackgroundColor: '#CFE0FB',
                  hoverBorderColor: '#B4CEF8',
                  data: convertObjectToArray(state?.first?.activeData),
                },
              ],
            }}
            options={options}
            height={400}
          />
        </div>
      </div>
      <div className="graph-div2">
        <span className="logboook">Working time analysis - Electrical</span>
        <div className="graph-div">
          <Bar
            data={{
              labels: [
                '10-11',
                '11-12',
                '12-13',
                '13-14',
                '14-15',
                '15-16',
                '16-17',
              ],
              datasets: [
                {
                  backgroundColor: '#037CFC',
                  label: 'Active Time Duration(mins)',
                  borderColor: '#8BB3F5',
                  borderWidth: 1,
                  hoverBackgroundColor: '#CFE0FB',
                  hoverBorderColor: '#B4CEF8',
                  data: convertObjectToArray(state?.second?.activeData),
                },
              ],
            }}
            options={options}
            height={400}
          />
        </div>
      </div>

      <div className="tableData">
        <div className="d-flex justify-content-between align-items-center">
          <span className="logboook">Workstation Overview</span>

          <div className="d-flex">
            <div className="d-flex align-items-center">
              <span
                style={{
                  color: '#52575C',
                  marginRight: '15px',
                  fontSize: '14px',
                }}
              >
                Select Date :{' '}
              </span>
              <CustomSelect
                defaultText={'12/10/21'}
                imageColor="true"
                optionsList={countryList2}
                selectedItem={'12/10/21'}
              />
            </div>
          </div>
        </div>
        <div className="table-cont" style={{ marginTop: '20px' }}>
          <div style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}>
            Workstation ID
          </div>
          <div style={{ color: '#52575C' }}>IDLE Time</div>
          <div style={{ color: '#52575C' }}>Active Time</div>
          <div style={{ color: '#52575C' }}>No of task</div>
          <div style={{ color: '#52575C' }}>Cycle time</div>
        </div>
        {[state.first, state.second].map((item, i) => (
          <div className="table-cont" key={i}>
            <div style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}>
              {item?.machineName}
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {getTotal(item?.idleData)} mins
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {getTotal(item?.activeData)} mins
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {getTotal(item?.totalCycles, true)}
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {msToMinutes(
                getTotal(state?.first?.totalCycles, true) === 0
                  ? 0
                  : (
                      getTotal(item?.cycleTime, true) /
                      getTotal(item?.totalCycles, true)
                    ).toFixed(2)
              )}{' '}
              mins
            </div>
          </div>
        ))}
      </div>

      <div className="tableData" style={{ marginTop: '80px' }}>
        <div className="d-flex justify-content-between align-items-center">
          <span className="logboook">Workstation Analysis</span>
          <div className="d-flex">
            <div
              className="d-flex align-items-center"
              style={{ marginRight: '20px' }}
            >
              <span
                style={{
                  color: '#52575C',
                  marginRight: '15px',
                  fontSize: '14px',
                }}
              >
                Select Workstation :{' '}
              </span>
              <CustomSelect
                defaultText="Mechanical"
                imageColor="true"
                optionsList={countryList}
                selectedItem="Mechanical"
              />
            </div>
            <div className="d-flex align-items-center">
              <span
                style={{
                  color: '#52575C',
                  marginRight: '15px',
                  fontSize: '14px',
                }}
              >
                Select Date :{' '}
              </span>
              <CustomSelect
                defaultText={'12/10/21'}
                imageColor="true"
                optionsList={countryList2}
                selectedItem={'12/10/21'}
              />
            </div>
          </div>
        </div>

        <div className="table-cont" style={{ marginTop: '20px' }}>
          <div style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}>
            Time
          </div>
          <div style={{ color: '#52575C' }}>IDLE Time</div>
          <div style={{ color: '#52575C' }}>Active Time</div>
          <div style={{ color: '#52575C' }}>No of task</div>
          <div style={{ color: '#52575C' }}>Cycle time</div>
        </div>
        {state.first &&
          state.first.activeData.map((item, index) => (
            <div className="table-cont" key={index}>
              <div
                style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}
              >
                {index + 1}
              </div>
              <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
                {msToMinutes(state?.first?.idleData[index])} mins
              </div>
              <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
                {msToMinutes(item)} mins
              </div>
              <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
                {state?.first?.totalCycles[index]}
              </div>
              <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
                {state?.first?.totalCycles[index] === 0
                  ? '0:00'
                  : msToMinutes(
                      state?.first?.cycleTime[index] /
                        state?.first?.totalCycles[index]
                    )}
                mins
              </div>
            </div>
          ))}
      </div>

      <div
        className="table-cont8"
        style={{ marginTop: '20px', margin: '0px 8%' }}
      >
        <div style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}>
          Summary
        </div>
        <div style={{ color: '#52575C' }}>
          {getTotal(state?.first?.idleData)} mins
        </div>
        <div style={{ color: '#52575C' }}>
          {getTotal(state?.first?.activeData)} mins
        </div>
        <div style={{ color: '#52575C' }}>
          {getTotal(state?.first?.totalCycles, true)}
        </div>
        <div style={{ color: '#52575C' }}>
          {getTotal(state?.first?.totalCycles, true) === 0
            ? '0:00'
            : msToMinutes(
                getTotal(state?.first?.cycleTime, true) /
                  getTotal(state?.first?.totalCycles, true)
              ).toFixed(2)}{' '}
          mins
        </div>
      </div>
    </>
  );
}

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
import DataTable from './Components/DataTable';

const timeMapper = 1;

const msToMinutes = (time, getFloating) => {
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(0);
  if (getFloating) {
    return parseFloat(
      `${minutes}.${(seconds < 10 ? '0' : '') + seconds}`
    ).toFixed(2);
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

const getIncrement = (state, isActive) => {
  if (!state) return null;
  const newState = state;
  const currentHour = new Date().getHours() - timeMapper;
  if (isActive) {
    // increment active and cycle time
    newState.activeData[currentHour]++;
    newState.cycleTime[currentHour]++;
  } else {
    // increment idle time
    newState.idleData[currentHour]++;
  }
  return newState;
};

const getIncrementCycle = (state) => {
  if (!state) return null;
  const currentHour = new Date().getHours() - timeMapper;
  state.cycleTime[currentHour]++;
  return state;
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'initiate-first':
      return action.data;
    case 'initiate-second':
      return action.data;
    case 'increment-first':
      return {
        ...state,
        first: action.data,
      };
    case 'increment-second':
      return {
        ...state,
        second: action.data,
      };
    case 'increment-cycle-first':
      return {
        ...state,
        first: action.data,
      };
    case 'increment-cycle-second':
      return {
        ...state,
        second: action.data,
      };
    case 'change-state-first':
      return {
        ...state,
        isFirstActive: action.data,
      };
    case 'change-state-second':
      return {
        ...state,
        isSecondActive: action.data,
      };
    default:
      return state;
  }
};

const toSeconds = (minutes, seconds) => {
  return minutes * 60 + seconds;
};

const formatData = (data, isFirst, state) => {
  const initialData = state;
  const setData = {
    activeData: [0, 0, 0, 0, 0, 0, 0],
    idleData: [0, 0, 0, 0, 0, 0, 0],
    cycleTime: [0, 0, 0, 0, 0, 0, 0],
    totalCycles: [0, 0, 0, 0, 0, 0, 0],
    machineName: data.machineName,
  };
  let startHour;
  let endHour;
  data.cycleTime.forEach((e) => {
    startHour = new Date(e?.start)?.getHours() - timeMapper;
    endHour = new Date(e?.end)?.getHours() - timeMapper;
    if (startHour > 0 || startHour < 8) {
      if (startHour === endHour) {
        setData.cycleTime[startHour] +=
          new Date(e.end).getSeconds() - new Date(e.start).getSeconds();
        setData.totalCycles[startHour]++;
      } else if (endHour) {
        setData.cycleTime[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
        setData.cycleTime[endHour] += new Date(e.end).getSeconds();
        setData.totalCycles[endHour]++;
      } else {
        setData.cycleTime[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
      }
    }
  });
  data.idleTime.forEach((e) => {
    startHour = new Date(e?.start)?.getHours() - timeMapper;
    endHour = new Date(e?.end)?.getHours() - timeMapper;
    if (startHour > 0 || startHour < 8) {
      if (startHour === endHour) {
        setData.idleData[startHour] +=
          (new Date(e.end).getTime() - new Date(e.start).getTime()) / 1000;
      } else if (endHour) {
        setData.idleData[startHour] +=
          3600 -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
        setData.idleData[endHour] += toSeconds(
          new Date(e.end).getMinutes(),
          new Date(e.end).getSeconds()
        );
      } else {
        setData.idleData[startHour] +=
          toSeconds(new Date().getMinutes(), new Date().getSeconds()) -
          toSeconds(
            new Date(e.start).getMinutes(),
            new Date(e.start).getSeconds()
          );
      }
    }
  });
  let isActive = false;
  if (
    (data.idleTime.length > 0 && data.idleTime.slice(-1)[0].end) ||
    (data.cycleTime.length > 0 &&
      typeof data.cycleTime.slice(-1)[0].end !== 'undefined')
  ) {
    isActive = true;
  }
  const currentDate = new Date();
  const currentHour = currentDate.getHours() - timeMapper;
  for (let i = 0; i < currentHour; i++) {
    setData.activeData[i] += 3600 - setData.idleData[i];
  }
  setData.activeData[currentHour] =
    currentDate.getMinutes() * 60 +
    currentDate.getSeconds() -
    setData.idleData[currentHour];
  if (isFirst) {
    initialData.first = setData;
    initialData.isFirstActive = isActive;
  } else {
    initialData.second = setData;
    initialData.isSecondActive = isActive;
  }
  return initialData;
};

export default function Dashboard() {
  const [socketConnectedOne, setSocketConnectedOne] = useState(false);
  const [socketConnectedTwo, setSocketConnectedTwo] = useState(false);
  const [firstInterval, setFirstInterval] = useState(null);
  const [secondInterval, setSecondInterval] = useState(null);
  const [visibleId, setVisibleId] = useState(0);
  const [state, dispatch] = useReducer(reducer, {
    first: null,
    second: null,
    isFirstActive: false,
    isSecondActive: false,
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
              data: formatData(
                { ...ele, machineName: 'Mechanical' },
                true,
                state
              ),
            });
            setSocketConnectedOne(true);
          } else {
            dispatch({
              type: 'initiate-second',
              data: formatData(
                { ...ele, machineName: 'Electrical' },
                false,
                state
              ),
            });
            setSocketConnectedTwo(true);
          }
        });
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on('cs01', (data) => {
      if (typeof data.working !== 'undefined') {
        if (data.working === 1) {
          console.log('yes');
          dispatch({
            type: 'change-state-first',
            data: true,
          });
        } else {
          console.log('no');
          dispatch({
            type: 'change-state-first',
            data: false,
          });
        }
      } else if (typeof data.cycle !== 'undefined') {
        if (!data.cycle) {
          dispatch({
            type: 'increment-cycle-first',
            data: getIncrementCycle(state.first),
          });
        }
      } else {
        clearInterval(firstInterval);
      }
    });

    socket.on('cs02', (data) => {
      if (typeof data.working !== 'undefined') {
        if (data.working === 1) {
          dispatch({
            type: 'change-state-second',
            data: true,
          });
        } else {
          dispatch({
            type: 'change-state-second',
            data: false,
          });
        }
      } else if (typeof data.cycle !== 'undefined') {
        if (!data.cycle) {
          dispatch({
            type: 'increment-cycle-second',
            data: getIncrementCycle(state.second),
          });
        }
      } else {
        clearInterval(secondInterval);
      }
    });

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off('disconnect');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    if (!socketConnectedOne) {
      return;
    }
    const intervalOne = setInterval(() => {
      // increment 1s in state
      const index = new Date().getHours() - timeMapper;
      if (index < 0 || index > 7) return;
      if (state.first !== null) {
        dispatch({
          type: 'increment-first',
          data: getIncrement(state.first, state.isFirstActive),
        });
      }
    }, 1000);
    setFirstInterval(intervalOne);
    return () => clearInterval(intervalOne);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnectedOne, state.isFirstActive]);

  useEffect(() => {
    if (!socketConnectedTwo) {
      return;
    }
    const intervalTwo = setInterval(() => {
      // increment 1000ms in state
      const index = new Date().getHours() - timeMapper;
      if (index < 0 || index > 7) return;
      if (state.second !== null) {
        dispatch({
          type: 'increment-second',
          data: getIncrement(state.second, state.isSecondActive),
        });
      }
    }, 1000);
    setSecondInterval(intervalTwo);
    return () => clearInterval(intervalTwo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketConnectedTwo, state.isSecondActive]);

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
              {item?.cycleTime ? (
                <>
                  {getTotal(item?.totalCycles, true) === 0
                    ? '--'
                    : `${msToMinutes(
                        getTotal(item?.cycleTime, true) /
                          getTotal(item?.totalCycles, true)
                      )} mins`}
                </>
              ) : (
                'NA'
              )}
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
                selectedName={visibleId === 0 ? 'Mechanical' : 'Electrical'}
                imageColor="true"
                optionsList={countryList}
                selectedItem={visibleId === 0 ? 'Mechanical' : 'Electrical'}
                changeSelect={(e) => setVisibleId(e)}
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
        <DataTable data={visibleId === 0 ? state.first : state.second} />
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
            ? '--'
            : `${msToMinutes(
                getTotal(state?.first?.cycleTime, true) /
                  getTotal(state?.first?.totalCycles, true)
              )} mins`}
        </div>
      </div>
    </>
  );
}

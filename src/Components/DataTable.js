import React from 'react';

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

const timeIndex = [
  '10-11',
  '11-12',
  '12-13',
  '13-14',
  '14-15',
  '15-16',
  '16-17',
];

const DataTable = ({ data }) => {
  return (
    <>
      {data &&
        data.activeData.map((item, index) => (
          <div className="table-cont" key={index}>
            <div style={{ width: '35%', paddingLeft: '4%', color: '#52575C' }}>
              {timeIndex[index]}
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {msToMinutes(data?.idleData[index])} mins
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {msToMinutes(item)} mins
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {data?.totalCycles[index]}
            </div>
            <div style={{ color: '#1BBC1B', fontSize: '14px' }}>
              {data?.cycleTime ? (
                <>
                  {data?.totalCycles[index] === 0
                    ? '--'
                    : `${
                        data?.cycleTime[index] / data?.totalCycles[index]
                      } mins`}
                </>
              ) : (
                'NA'
              )}
            </div>
          </div>
        ))}
    </>
  );
};

export default DataTable;

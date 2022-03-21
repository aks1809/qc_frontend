import React from 'react';
import profile from '../assets/circle.png';
import { ReactComponent as Frinks } from '../assets/frinks.svg';
export default function Header() {
  return (
    <div
      className="Top-bar"
      id="some"
      style={{
        width: '100%',
        margin: '0 auto',
        marginTop: '0px',
        // height: "60px",
        padding: '15px 0',
        display: 'flex',
        justifyContent: 'space-between',
        backgrounColor: 'rgb(232, 239, 249)',
        background: '#F6F8FB',
        marginBottom: '20px',
      }}
    >
      <div style={{ float: 'left', marginLeft: '50px' }}>
        <Frinks style={{ width: '80px', height: '80px' }} />
      </div>
      <div style={{ marginRight: '40px' }} className="span-data">
        <span style={{ color: '#336CFB' }}>Home page</span>
        <img src={profile} alt="profile" />
      </div>
    </div>
  );
}

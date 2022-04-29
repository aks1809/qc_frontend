import React from 'react';
import { Spinner } from 'react-bootstrap';
import Logo from '../assets/frinks.svg';

const Loader = () => {
  return (
    <div
      style={{
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999',
        height: '100%',
        width: '100%',
        display: 'flex',
        background: '#ffffff82',
        flexDirection: 'column',
      }}
    >
      <img
        src={Logo}
        alt="Frinks"
        style={{ marginBottom: '10px', height: '80px', width: '80px' }}
      />
      <Spinner animation="border" style={{ color: 'purple' }} />
    </div>
  );
};

export default Loader;

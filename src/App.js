import { SocketContext, socket } from './socketContext';
import Dashboard from './dashboard';
import './App.css';

const App = () => {
  return (
    <SocketContext.Provider value={socket}>
      <Dashboard />
    </SocketContext.Provider>
  );
};

export default App;

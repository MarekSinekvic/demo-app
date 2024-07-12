import PageRouter from './PageRouter.js';
import "./App.css";
import { ChakraProvider } from '@chakra-ui/react';

function App() {
  return (
    <div className='App'>
      <ChakraProvider>
        <PageRouter/>
      </ChakraProvider>
    </div>
  )
}

export default App;

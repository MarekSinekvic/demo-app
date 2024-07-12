import React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';

import {HomePage} from './components/HomePage';
import Login from './components/LoginPage';

const PageRouter = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path='/' element={<Login/>}></Route>
                <Route path='/Home' element={<HomePage/>}></Route>
            </Routes>
        </HashRouter>
    );
}

export default PageRouter;
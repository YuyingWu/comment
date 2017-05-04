import {createStore, combineReducers, applyMiddleware} from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import promise from "redux-promise-middleware";

import comment from "./reducers/commentReducer";

export default createStore(
    combineReducers({
        comment
    }),
    {},
    applyMiddleware(logger(), thunk, promise())
);